import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuth, handleAuthError } from '@/lib/auth/middleware';

// GET /api/projects/[id]/assets — list all assets
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = getAuth(request);
    const projectId = params.id;

    const project = await prisma.project.findFirst({
      where: { id: projectId, userId: auth.userId },
    });
    if (!project) {
      return Response.json({ error: 'Project not found' }, { status: 404 });
    }

    const assets = await prisma.asset.findMany({
      where: { projectId },
      orderBy: { createdAt: 'asc' },
    });

    return Response.json({
      assets: assets.map((a) => ({
        id: a.id,
        fileName: a.fileName,
        originalName: a.originalName,
        mimeType: a.mimeType,
        fileSize: a.fileSize,
        compressedSize: a.compressedSize,
        width: a.width,
        height: a.height,
        category: a.category,
        categoryConfirmed: a.categoryConfirmed,
        variantRole: a.variantRole,
        variantGroup: a.variantGroup,
        slotName: a.slotName,
        thumbnailUrl: a.thumbnailPath
          ? `/api/projects/${projectId}/assets/${a.id}/thumbnail`
          : null,
      })),
    });
  } catch (error) {
    if ((error as Error).name === 'AuthError') return handleAuthError(error);
    console.error('List assets error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
