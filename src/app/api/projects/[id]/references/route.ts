import { DATA_DIR } from '@/lib/constants';
import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/auth/middleware';
import { processImage } from '@/lib/assets/processor';
import { generateBase64 } from '@/lib/assets/base64';
import fs from 'fs/promises';
import path from 'path';

// GET /api/projects/[id]/references — list reference images
export const GET = withAuth(async (_request, { params, auth }) => {
  const project = await prisma.project.findFirst({ where: { id: params.id, userId: auth.userId } });
  if (!project) return Response.json({ error: 'Not found' }, { status: 404 });

  const images = await prisma.referenceImage.findMany({
    where: { projectId: params.id },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, originalName: true, mimeType: true, fileSize: true,
      width: true, height: true, createdAt: true,
    },
  });

  return Response.json({
    references: images.map((img) => ({
      ...img,
      thumbnailUrl: `/api/projects/${params.id}/references/${img.id}/thumbnail`,
    })),
  });
});

// POST /api/projects/[id]/references — upload reference images
export const POST = withAuth(async (request, { params, auth }) => {
  const project = await prisma.project.findFirst({ where: { id: params.id, userId: auth.userId } });
  if (!project) return Response.json({ error: 'Not found' }, { status: 404 });

  const formData = await request.formData();
  const files = formData.getAll('files') as File[];
  if (files.length === 0) return Response.json({ error: 'No files' }, { status: 400 });

  const uploadDir = path.join(DATA_DIR, 'uploads', params.id, 'references');
  await fs.mkdir(uploadDir, { recursive: true });

  const results = [];

  for (const file of files) {
    const refId = crypto.randomUUID().replace(/-/g, '').slice(0, 20);
    const ext = path.extname(file.name).toLowerCase() || '.png';
    const fileName = `ref-${refId}${ext}`;
    const filePath = path.join(uploadDir, fileName);

    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(filePath, buffer);

    let thumbnailPath: string | null = null;
    let width: number | null = null;
    let height: number | null = null;
    let base64CachePath: string | null = null;

    try {
      const imgResult = await processImage(filePath, params.id, refId);
      thumbnailPath = imgResult.thumbnailPath;
      width = imgResult.width;
      height = imgResult.height;
      base64CachePath = await generateBase64(filePath, file.type, params.id, `ref-${refId}`);
    } catch { /* not critical */ }

    const ref = await prisma.referenceImage.create({
      data: {
        projectId: params.id,
        fileName, originalName: file.name,
        mimeType: file.type || 'image/png',
        fileSize: buffer.length,
        width, height,
        filePath, thumbnailPath, base64CachePath,
      },
    });

    results.push({ id: ref.id, originalName: ref.originalName });
  }

  return Response.json({ references: results }, { status: 201 });
});

// DELETE /api/projects/[id]/references — delete a reference image (via query param ?refId=)
export const DELETE = withAuth(async (request, { params, auth }) => {
  const project = await prisma.project.findFirst({ where: { id: params.id, userId: auth.userId } });
  if (!project) return Response.json({ error: 'Not found' }, { status: 404 });

  const url = new URL(request.url);
  const refId = url.searchParams.get('refId');
  if (!refId) return Response.json({ error: 'refId required' }, { status: 400 });

  const ref = await prisma.referenceImage.findFirst({ where: { id: refId, projectId: params.id } });
  if (!ref) return Response.json({ error: 'Reference not found' }, { status: 404 });

  for (const p of [ref.filePath, ref.thumbnailPath, ref.base64CachePath]) {
    if (p) try { await fs.unlink(p); } catch { /* ignore */ }
  }

  await prisma.referenceImage.delete({ where: { id: refId } });
  return Response.json({ success: true });
});
