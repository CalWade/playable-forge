import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuth, handleAuthError } from '@/lib/auth/middleware';

// GET /api/projects/[id]/versions
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = getAuth(request);

    const project = await prisma.project.findFirst({
      where: { id: params.id, userId: auth.userId },
    });
    if (!project) {
      return Response.json({ error: 'Project not found' }, { status: 404 });
    }

    const versions = await prisma.htmlVersion.findMany({
      where: { projectId: params.id },
      orderBy: { version: 'desc' },
      select: {
        id: true,
        version: true,
        isLocked: true,
        validationGrade: true,
        fullHtmlSize: true,
        aiModel: true,
        createdAt: true,
      },
    });

    return Response.json({ versions });
  } catch (error) {
    if ((error as Error).name === 'AuthError') return handleAuthError(error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
