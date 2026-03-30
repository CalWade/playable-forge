import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuth, handleAuthError } from '@/lib/auth/middleware';

export async function GET(request: NextRequest) {
  try {
    const auth = getAuth(request);

    const projects = await prisma.project.findMany({
      where: { userId: auth.userId },
      include: { stats: true, _count: { select: { variants: true } } },
    });

    const totalProjects = projects.length;

    // Monthly variants
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyVariants = await prisma.variant.count({
      where: {
        project: { userId: auth.userId },
        createdAt: { gte: monthStart },
      },
    });

    // First pass rate
    const statsWithFirstPass = projects
      .filter((p) => p.stats)
      .map((p) => p.stats!.firstPassValidation);
    const firstPassRate =
      statsWithFirstPass.length > 0
        ? statsWithFirstPass.filter(Boolean).length / statsWithFirstPass.length
        : 0;

    // Average iterations
    const iterCounts = projects
      .filter((p) => p.stats && p.stats.iterationCount > 0)
      .map((p) => p.stats!.iterationCount);
    const avgIterations =
      iterCounts.length > 0
        ? iterCounts.reduce((a, b) => a + b, 0) / iterCounts.length
        : 0;

    return Response.json({
      totalProjects,
      monthlyVariants,
      firstPassRate: Math.round(firstPassRate * 100),
      avgIterations: Math.round(avgIterations * 10) / 10,
      recentProjects: projects
        .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
        .slice(0, 10)
        .map((p) => ({
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
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
