import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuth, handleAuthError } from '@/lib/auth/middleware';

// POST /api/projects/[id]/versions/[versionId]/rollback
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

    const sourceVersion = await prisma.htmlVersion.findUnique({
      where: { id: params.versionId },
    });
    if (!sourceVersion) {
      return Response.json({ error: 'Version not found' }, { status: 404 });
    }

    // Create new version from the rollback source
    const maxVersion = await prisma.htmlVersion.findFirst({
      where: { projectId: params.id },
      orderBy: { version: 'desc' },
      select: { version: true },
    });

    const newVersion = await prisma.htmlVersion.create({
      data: {
        projectId: params.id,
        version: (maxVersion?.version || 0) + 1,
        skeletonHtml: sourceVersion.skeletonHtml,
        validationGrade: sourceVersion.validationGrade,
        validationJson: sourceVersion.validationJson,
        aiModel: sourceVersion.aiModel,
      },
    });

    return Response.json({ version: newVersion });
  } catch (error) {
    if ((error as Error).name === 'AuthError') return handleAuthError(error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
