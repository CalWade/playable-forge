import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/auth/middleware';
import fs from 'fs/promises';
import path from 'path';
import archiver from 'archiver';
import { createWriteStream } from 'fs';

const DATA_DIR = process.env.DATA_DIR || './data';

export const GET = withAuth(async (_request, { params, auth }) => {
  const project = await prisma.project.findFirst({
    where: { id: params.id, userId: auth.userId },
  });
  if (!project) return new Response('Not found', { status: 404 });

  const variants = await prisma.variant.findMany({
    where: { projectId: params.id, status: 'generated' },
  });
  if (variants.length === 0) return new Response('No variants to download', { status: 404 });

  const zipDir = path.join(DATA_DIR, 'html', params.id);
  await fs.mkdir(zipDir, { recursive: true });
  const zipPath = path.join(zipDir, 'all-variants.zip');

  await new Promise<void>((resolve, reject) => {
    const output = createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 6 } });
    output.on('close', resolve);
    archive.on('error', reject);
    archive.pipe(output);

    for (const v of variants) {
      if (v.fullHtmlPath) archive.file(v.fullHtmlPath, { name: `${v.name}.html` });
    }
    archive.finalize();
  });

  const zipBuffer = await fs.readFile(zipPath);

  return new Response(zipBuffer, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${encodeURIComponent(project.name)}-variants.zip"`,
      'Content-Length': String(zipBuffer.length),
    },
  });
});
