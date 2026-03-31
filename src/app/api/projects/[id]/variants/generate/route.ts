import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/auth/middleware';
import { generateCombinations, batchGenerate } from '@/lib/variants/generator';

// POST /api/projects/[id]/variants/generate
export const POST = withAuth(async (_request, { params, auth }) => {
  const projectId = params.id;

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: auth.userId },
  });
  if (!project) return Response.json({ error: 'Not found' }, { status: 404 });

  const lockedVersion = await prisma.htmlVersion.findFirst({
    where: { projectId, isLocked: true },
  });
  if (!lockedVersion) {
    return Response.json({ error: 'No locked skeleton version' }, { status: 400 });
  }

  // Get variant assets (separate table)
  const variantAssets = await prisma.variantAsset.findMany({ where: { projectId } });

  // Get initial assets for fixed slots
  const initialAssets = await prisma.asset.findMany({ where: { projectId } });

  // Build dimensions from VariantAsset
  const groups = new Map<string, typeof variantAssets>();
  for (const a of variantAssets) {
    if (!groups.has(a.dimensionGroup)) groups.set(a.dimensionGroup, []);
    groups.get(a.dimensionGroup)!.push(a);
  }

  const dimensions = Array.from(groups.entries()).map(([name, assets]) => ({
    name,
    label: name,
    assets: assets.map((a) => ({
      id: a.id,
      slotName: a.slotName,
      base64CachePath: a.base64CachePath || '',
      mimeType: a.mimeType,
      originalName: a.originalName,
    })),
    enabled: true,
  }));

  // Fixed assets from initial asset pool
  const fixedAssets = initialAssets
    .filter((a) => a.base64CachePath && a.slotName)
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
      id: v.id, name: v.name, status: v.status, size: v.fullHtmlSize, grade: v.validationGrade,
    })),
  });
});
