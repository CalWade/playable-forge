import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuth, handleAuthError } from '@/lib/auth/middleware';
import archiver from 'archiver';
import { Readable } from 'stream';

// GET /api/projects/[id]/variants/download
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = getAuth(request);
    const project = await prisma.project.findFirst({
      where: { id: params.id, userId: auth.userId },
    });
    if (!project) return new Response('Not found', { status: 404 });

    const variants = await prisma.variant.findMany({
      where: { projectId: params.id, status: 'generated' },
    });

    if (variants.length === 0) {
      return new Response('No variants to download', { status: 404 });
    }

    // Create ZIP archive
    const archive = archiver('zip', { zlib: { level: 9 } });

    for (const v of variants) {
      if (v.fullHtmlPath) {
        archive.file(v.fullHtmlPath, { name: `${v.name}.html` });
      }
    }

    archive.finalize();

    // Convert Node stream to Web ReadableStream
    const nodeStream = Readable.from(archive);
    const webStream = new ReadableStream({
      start(controller) {
        nodeStream.on('data', (chunk) => controller.enqueue(chunk));
        nodeStream.on('end', () => controller.close());
        nodeStream.on('error', (err) => controller.error(err));
      },
    });

    return new Response(webStream, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${project.name}-variants.zip"`,
      },
    });
  } catch (error) {
    if ((error as Error).name === 'AuthError') return handleAuthError(error);
    return new Response('Internal server error', { status: 500 });
  }
}
