import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuth, handleAuthError } from '@/lib/auth/middleware';

// GET /api/projects — list projects
export async function GET(request: NextRequest) {
  try {
    const auth = getAuth(request);

    const projects = await prisma.project.findMany({
      where: { userId: auth.userId },
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: { select: { variants: true } },
      },
    });

    return Response.json({
      projects: projects.map((p) => ({
        id: p.id,
        name: p.name,
        status: p.status,
        variantCount: p._count.variants,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      })),
    });
  } catch (error) {
    if ((error as Error).name === 'AuthError') return handleAuthError(error);
    console.error('List projects error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/projects — create project
export async function POST(request: NextRequest) {
  try {
    const auth = getAuth(request);

    let name = '新项目';
    try {
      const body = await request.json();
      if (body.name) name = body.name;
    } catch {
      // empty body is ok
    }

    const project = await prisma.project.create({
      data: {
        name,
        userId: auth.userId,
      },
    });

    // Create project stats
    await prisma.projectStats.create({
      data: { projectId: project.id },
    });

    return Response.json({ project }, { status: 201 });
  } catch (error) {
    if ((error as Error).name === 'AuthError') return handleAuthError(error);
    console.error('Create project error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
