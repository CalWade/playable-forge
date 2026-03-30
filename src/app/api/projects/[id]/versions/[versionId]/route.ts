import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuth, handleAuthError } from '@/lib/auth/middleware';

// GET /api/projects/[id]/versions/[versionId]
export async function GET(
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

    const version = await prisma.htmlVersion.findUnique({
      where: { id: params.versionId },
    });
    if (!version) {
      return Response.json({ error: 'Version not found' }, { status: 404 });
    }

    return Response.json({ version });
  } catch (error) {
    if ((error as Error).name === 'AuthError') return handleAuthError(error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
