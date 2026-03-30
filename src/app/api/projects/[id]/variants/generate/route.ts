import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuth, handleAuthError } from '@/lib/auth/middleware';
import { generateCombinations, batchGenerate } from '@/lib/variants/generator';

// POST /api/projects/[id]/variants/generate
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = getAuth(request);
    const projectId = params.id;

    const project = await prisma.project.findFirst({
      where: { id: projectId, userId: auth.userId },
    });
    if (!project) return Response.json({ error: 'Not found' }, { status: 404 });

    // Get locked version
    const lockedVersion = await prisma.htmlVersion.findFirst({
      where: { projectId, isLocked: true },
    });
    if (!lockedVersion) {
      return Response.json({ error: 'No locked skeleton version' }, { status: 400 });
    }

    // Get all assets
    const assets = await prisma.asset.findMany({ where: { projectId } });

    // Build dimensions
    const variantAssets = assets.filter((a) => a.variantRole === 'variant');
    const groups = new Map<string, typeof variantAssets>();
    for (const a of variantAssets) {
      const group = a.variantGroup || a.category;
      if (!groups.has(group)) groups.set(group, []);
      groups.get(group)!.push(a);
    }

    const dimensions = Array.from(groups.entries()).map(([name, groupAssets]) => ({
      name,
      label: name,
      assets: groupAssets.map((a) => ({
        id: a.id,
        slotName: a.slotName || a.category,
        base64CachePath: a.base64CachePath || '',
        mimeType: a.mimeType,
        originalName: a.originalName,
      })),
      enabled: true,
    }));

    const fixedAssets = assets
      .filter((a) => a.variantRole === 'fixed' && a.base64CachePath)
      .map((a) => ({
        slotName: a.slotName || a.category,
        base64CachePath: a.base64CachePath!,
        mimeType: a.mimeType,
      }));

    const combinations = generateCombinations(dimensions);

    // Delete old variants
    await prisma.variant.deleteMany({ where: { projectId } });

    const results = await batchGenerate({
      skeleton: lockedVersion.skeletonHtml,
      combinations,
      dimensions,
      fixedAssets,
      projectId,
    });

    // Save to DB
    const variants = [];
    for (const r of results) {
      const variant = await prisma.variant.create({
        data: {
          projectId,
          versionId: lockedVersion.id,
          name: r.name,
          slotMapping: r.slotMapping,
          fullHtmlPath: r.filePath,
          fullHtmlSize: r.size,
          validationGrade: r.grade,
          validationJson: r.validationJson,
          status: 'generated',
        },
      });
      variants.push(variant);
    }

    // Update project stats
    await prisma.projectStats.upsert({
      where: { projectId },
      update: {
        totalVariants: variants.length,
        passedVariants: variants.filter((v) => v.validationGrade === 'A' || v.validationGrade === 'B').length,
      },
      create: {
        projectId,
        totalVariants: variants.length,
        passedVariants: variants.filter((v) => v.validationGrade === 'A' || v.validationGrade === 'B').length,
      },
    });

    return Response.json({
      total: variants.length,
      variants: variants.map((v) => ({
        id: v.id,
        name: v.name,
        status: v.status,
        size: v.fullHtmlSize,
        grade: v.validationGrade,
      })),
    });
  } catch (error) {
    if ((error as Error).name === 'AuthError') return handleAuthError(error);
    console.error('Batch generate error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
