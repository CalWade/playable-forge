import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/auth/middleware';
import { synthesize } from '@/lib/html/synthesizer';
import { validate } from '@/lib/validation/engine';
import { readBase64 } from '@/lib/assets/base64';
import { saveHtml } from '@/lib/html/synthesizer';

// POST /api/variants/[variantId]/retry — regenerate a single failed variant
export const POST = withAuth(async (_request, { params, auth }) => {
  const variant = await prisma.variant.findUnique({
    where: { id: params.variantId },
    include: { project: true, version: true },
  });

  if (!variant || variant.project.userId !== auth.userId) {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }

  // Parse slot mapping
  const slotMapping: Record<string, string> = JSON.parse(variant.slotMapping || '{}');

  // Get variant assets for the slots
  const variantAssets = await prisma.variantAsset.findMany({
    where: { projectId: variant.projectId },
  });

  // Get initial assets for fixed slots
  const initialAssets = await prisma.asset.findMany({
    where: { projectId: variant.projectId },
  });

  // Build slot map: start with fixed initial assets
  const slotAssetMap = new Map<string, { slotName: string; base64DataUri: string; mimeType: string }>();

  for (const asset of initialAssets) {
    if (asset.slotName && asset.base64CachePath) {
      try {
        const b64 = await readBase64(asset.base64CachePath);
        slotAssetMap.set(asset.slotName, { slotName: asset.slotName, base64DataUri: b64, mimeType: asset.mimeType });
      } catch (e) { console.warn("Skipped:", e instanceof Error ? e.message : e); }
    }
  }

  // Override with variant assets from slot mapping
  for (const [dimName, assetId] of Object.entries(slotMapping)) {
    const vAsset = variantAssets.find((a) => a.id === assetId);
    if (vAsset && vAsset.base64CachePath) {
      try {
        const b64 = await readBase64(vAsset.base64CachePath);
        slotAssetMap.set(vAsset.slotName, { slotName: vAsset.slotName, base64DataUri: b64, mimeType: vAsset.mimeType });
      } catch (e) { console.warn("Skipped:", e instanceof Error ? e.message : e); }
    }
  }

  // Synthesize
  const result = synthesize(variant.version.skeletonHtml, slotAssetMap);
  const validation = validate(result.html);
  const saved = await saveHtml(result.html, variant.projectId, `variants/${variant.name}.html`);

  // Update variant
  const updated = await prisma.variant.update({
    where: { id: variant.id },
    data: {
      fullHtmlPath: saved.filePath,
      fullHtmlSize: saved.size,
      validationGrade: validation.grade,
      validationJson: JSON.stringify(validation.results),
      status: 'generated',
      errorMessage: null,
    },
  });

  return Response.json({
    variant: {
      id: updated.id,
      name: updated.name,
      status: updated.status,
      size: updated.fullHtmlSize,
      grade: updated.validationGrade,
    },
  });
});
