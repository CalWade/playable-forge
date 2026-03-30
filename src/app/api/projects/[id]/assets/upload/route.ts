import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuth, handleAuthError } from '@/lib/auth/middleware';
import { processImage, processAudio, isImage, isAudio } from '@/lib/assets/processor';
import { generateBase64 } from '@/lib/assets/base64';
import path from 'path';
import fs from 'fs/promises';

const DATA_DIR = process.env.DATA_DIR || './data';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = getAuth(request);
    const projectId = params.id;

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId: auth.userId },
    });
    if (!project) {
      return Response.json({ error: 'Project not found' }, { status: 404 });
    }

    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (files.length === 0) {
      return Response.json({ error: 'No files provided' }, { status: 400 });
    }

    const uploadDir = path.join(DATA_DIR, 'uploads', projectId);
    await fs.mkdir(uploadDir, { recursive: true });

    const assets = [];

    for (const file of files) {
      const assetId = crypto.randomUUID().replace(/-/g, '').slice(0, 20);
      const ext = path.extname(file.name).toLowerCase() || '.bin';
      const fileName = `${assetId}-original${ext}`;
      const filePath = path.join(uploadDir, fileName);

      // Write file to disk
      const buffer = Buffer.from(await file.arrayBuffer());
      await fs.writeFile(filePath, buffer);

      const fileSize = buffer.length;
      const mimeType = file.type || 'application/octet-stream';

      let compressedSize = fileSize;
      let compressedPath = filePath;
      let thumbnailPath: string | null = null;
      let width: number | null = null;
      let height: number | null = null;
      let duration: number | null = null;
      let base64CachePath: string | null = null;

      if (isImage(mimeType)) {
        const result = await processImage(filePath, projectId, assetId);
        compressedPath = result.compressedPath;
        compressedSize = result.compressedSize;
        thumbnailPath = result.thumbnailPath;
        width = result.width;
        height = result.height;

        // Generate base64 from compressed file
        base64CachePath = await generateBase64(compressedPath, mimeType, projectId, assetId);
      } else if (isAudio(mimeType)) {
        const result = await processAudio(filePath, projectId, assetId);
        compressedPath = result.compressedPath;
        compressedSize = result.compressedSize;
        duration = result.duration;

        base64CachePath = await generateBase64(compressedPath, mimeType, projectId, assetId);
      }

      const asset = await prisma.asset.create({
        data: {
          projectId,
          fileName,
          originalName: file.name,
          mimeType,
          fileSize,
          compressedSize,
          width,
          height,
          duration,
          filePath: compressedPath,
          thumbnailPath,
          base64CachePath,
        },
      });

      assets.push({
        id: asset.id,
        fileName: asset.fileName,
        originalName: asset.originalName,
        mimeType: asset.mimeType,
        fileSize: asset.fileSize,
        compressedSize: asset.compressedSize,
        width: asset.width,
        height: asset.height,
        category: asset.category,
        thumbnailUrl: thumbnailPath ? `/api/projects/${projectId}/assets/${asset.id}/thumbnail` : null,
      });
    }

    // Estimate total HTML size
    const allAssets = await prisma.asset.findMany({
      where: { projectId, variantRole: { not: 'excluded' } },
      select: { compressedSize: true },
    });
    const estimatedHtmlSize = allAssets.reduce(
      (sum, a) => sum + Math.ceil((a.compressedSize || 0) * 1.37), // base64 overhead ~37%
      0
    );

    return Response.json({
      assets,
      totalSize: assets.reduce((sum, a) => sum + (a.compressedSize || 0), 0),
      estimatedHtmlSize,
    });
  } catch (error) {
    if ((error as Error).name === 'AuthError') {
      return handleAuthError(error);
    }
    console.error('Upload error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
