import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuth, handleAuthError } from '@/lib/auth/middleware';

// GET /api/projects/[id]/variants
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = getAuth(request);
    const project = await prisma.project.findFirst({
      where: { id: params.id, userId: auth.userId },
    });
    if (!project) return Response.json({ error: 'Not found' }, { status: 404 });

    const variants = await prisma.variant.findMany({
      where: { projectId: params.id },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        status: true,
        fullHtmlSize: true,
        validationGrade: true,
        createdAt: true,
      },
    });

    return Response.json({ variants });
  } catch (error) {
    if ((error as Error).name === 'AuthError') return handleAuthError(error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
