import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/auth/middleware';

export const GET = withAuth(async (_request, { auth }) => {
  const projects = await prisma.project.findMany({
    where: { userId: auth.userId },
    include: { stats: true, _count: { select: { variants: true } } },
  });

  const totalProjects = projects.length;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthlyVariants = await prisma.variant.count({
    where: { project: { userId: auth.userId }, createdAt: { gte: monthStart } },
  });

  const statsWithFirstPass = projects.filter((p) => p.stats).map((p) => p.stats!.firstPassValidation);
  const firstPassRate = statsWithFirstPass.length > 0
    ? statsWithFirstPass.filter(Boolean).length / statsWithFirstPass.length : 0;

  const iterCounts = projects.filter((p) => p.stats && p.stats.iterationCount > 0).map((p) => p.stats!.iterationCount);
  const avgIterations = iterCounts.length > 0
    ? iterCounts.reduce((a, b) => a + b, 0) / iterCounts.length : 0;

  const totalVariantsEver = projects.reduce((sum, p) => sum + p._count.variants, 0);
  const estimatedHoursSaved = Math.round((totalVariantsEver * 14) / 60 * 10) / 10;

  const recentMessages = await prisma.conversationMessage.findMany({
    where: { project: { userId: auth.userId } },
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: {
      id: true, role: true, content: true, createdAt: true,
      project: { select: { id: true, name: true } },
    },
  });

  return Response.json({
    totalProjects,
    monthlyVariants,
    firstPassRate: Math.round(firstPassRate * 100),
    avgIterations: Math.round(avgIterations * 10) / 10,
    estimatedHoursSaved,
    recentActivity: recentMessages.map((m) => ({
      id: m.id, projectId: m.project.id, projectName: m.project.name,
      role: m.role,
      content: m.content.length > 50 ? m.content.slice(0, 50) + '...' : m.content,
      createdAt: m.createdAt.toISOString(),
    })),
    recentProjects: projects
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .slice(0, 10)
      .map((p) => ({
        id: p.id, name: p.name, status: p.status,
        variantCount: p._count.variants,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      })),
  });
});
