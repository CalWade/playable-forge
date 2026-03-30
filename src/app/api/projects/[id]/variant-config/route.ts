import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuth, handleAuthError } from '@/lib/auth/middleware';

// GET /api/projects/[id]/variant-config
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = getAuth(request);
    const project = await prisma.project.findFirst({
      where: { id: params.id, userId: auth.userId },
    });
    if (!project) return Response.json({ error: 'Not found' }, { status: 404 });

    const assets = await prisma.asset.findMany({
      where: { projectId: params.id },
    });

    // Group variant assets by variantGroup
    const variantAssets = assets.filter((a) => a.variantRole === 'variant');
    const groups = new Map<string, typeof variantAssets>();

    for (const a of variantAssets) {
      const group = a.variantGroup || a.category;
      if (!groups.has(group)) groups.set(group, []);
      groups.get(group)!.push(a);
    }

    const dimensions: Array<{
      name: string;
      label: string;
      assets: Array<{ id: string; fileName: string; thumbnailUrl: string | null }>;
      enabled: boolean;
    }> = [];

    const LABEL_MAP: Record<string, string> = {
      background: '背景图',
      popup: '弹窗样式',
      button: '按钮',
      icon: '图标',
    };

    groups.forEach((groupAssets, groupName) => {
      dimensions.push({
        name: groupName,
        label: LABEL_MAP[groupName] || groupName,
        assets: groupAssets.map((a) => ({
          id: a.id,
          fileName: a.originalName,
          thumbnailUrl: a.thumbnailPath
            ? `/api/projects/${params.id}/assets/${a.id}/thumbnail`
            : null,
        })),
        enabled: true,
      });
    });

    // Calculate combinations
    let totalCombinations = 1;
    for (const d of dimensions) {
      if (d.enabled && d.assets.length > 0) {
        totalCombinations *= d.assets.length;
      }
    }

    // Estimate size
    const fixedAssets = assets.filter((a) => a.variantRole === 'fixed');
    const fixedSize = fixedAssets.reduce((s, a) => s + (a.compressedSize || 0), 0);
    const avgVariantSize =
      dimensions.length > 0
        ? dimensions.reduce((s, d) => {
            const avg = d.assets.length > 0 ? d.assets.reduce((ss) => ss + 50000, 0) / d.assets.length : 0;
            return s + avg;
          }, 0)
        : 0;
    const estimatedPerVariant = Math.ceil((fixedSize + avgVariantSize) * 1.37);
    const estimatedTotalSize = estimatedPerVariant * totalCombinations;

    return Response.json({
      dimensions,
      totalCombinations,
      estimatedTotalSize,
      estimatedPerVariant,
    });
  } catch (error) {
    if ((error as Error).name === 'AuthError') return handleAuthError(error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
