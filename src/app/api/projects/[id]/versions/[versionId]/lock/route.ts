import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuth, handleAuthError } from '@/lib/auth/middleware';

// POST /api/projects/[id]/versions/[versionId]/lock
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; versionId: string } }
) {
  try {
    const auth = getAuth(request);

    const project = await prisma.project.findFirst({
      where: { id: params.id, userId: auth.userId },
    });
    if (!project) {
      return Response.json({ error: 'Project not found' }, { status: 404 });
    }

    // Unlock all other versions first
    await prisma.htmlVersion.updateMany({
      where: { projectId: params.id },
      data: { isLocked: false },
    });

    // Lock this version
    const version = await prisma.htmlVersion.update({
      where: { id: params.versionId },
      data: { isLocked: true },
    });

    return Response.json({ version });
  } catch (error) {
    if ((error as Error).name === 'AuthError') return handleAuthError(error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
