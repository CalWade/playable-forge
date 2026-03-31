import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/auth/middleware';

// GET /api/projects/[id]/variant-config
export const GET = withAuth(async (_request, { params, auth }) => {
  const project = await prisma.project.findFirst({
    where: { id: params.id, userId: auth.userId },
  });
  if (!project) return Response.json({ error: 'Not found' }, { status: 404 });

  // Use VariantAsset table (separated from initial assets)
  const variantAssets = await prisma.variantAsset.findMany({
    where: { projectId: params.id },
  });

  // Group by dimensionGroup
  const groups = new Map<string, typeof variantAssets>();
  for (const a of variantAssets) {
    const group = a.dimensionGroup;
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group)!.push(a);
  }

  const LABEL_MAP: Record<string, string> = {
    background: '背景图',
    popup: '弹窗样式',
    button: '按钮',
    icon: '图标',
    bgm: '音频',
  };

  const dimensions: Array<{
    name: string;
    label: string;
    assets: Array<{ id: string; fileName: string; thumbnailUrl: string | null }>;
    enabled: boolean;
  }> = [];

  groups.forEach((groupAssets, groupName) => {
    dimensions.push({
      name: groupName,
      label: LABEL_MAP[groupName] || groupName,
      assets: groupAssets.map((a) => ({
        id: a.id,
        fileName: a.originalName,
        thumbnailUrl: a.thumbnailPath
          ? `/api/projects/${params.id}/variant-assets/${a.id}/thumbnail`
          : null,
      })),
      enabled: true,
    });
  });

  let totalCombinations = 1;
  for (const d of dimensions) {
    if (d.assets.length > 0) totalCombinations *= d.assets.length;
  }

  // Estimate size: use initial assets (fixed) + one variant per group
  const initialAssets = await prisma.asset.findMany({
    where: { projectId: params.id },
    select: { compressedSize: true },
  });
  const fixedSize = initialAssets.reduce((s, a) => s + (a.compressedSize || 0), 0);

  const groupMaxSizes = new Map<string, number>();
  for (const a of variantAssets) {
    const size = a.compressedSize || 0;
    groupMaxSizes.set(a.dimensionGroup, Math.max(groupMaxSizes.get(a.dimensionGroup) || 0, size));
  }
  let variantSize = 0;
  groupMaxSizes.forEach((size) => { variantSize += size; });
  const estimatedPerVariant = Math.ceil((fixedSize + variantSize) * 1.37);
  const estimatedTotalSize = estimatedPerVariant * totalCombinations;

  return Response.json({
    dimensions,
    totalCombinations,
    estimatedTotalSize,
    estimatedPerVariant,
  });
});
