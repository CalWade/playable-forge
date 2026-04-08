import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/auth/middleware';

export const GET = withAuth(async (_request, { auth }) => {
  const projects = await prisma.project.findMany({
    where: { userId: auth.userId },
    orderBy: { updatedAt: 'desc' },
    include: { _count: { select: { variants: true } } },
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
});

export const POST = withAuth(async (request, { auth }) => {
  let name = '新项目';
  let templateId: string | undefined;
  try {
    const body = await request.json();
    if (body.name) name = body.name;
    if (body.templateId) templateId = body.templateId;
  } catch { /* empty body ok */ }

  const project = await prisma.project.create({
    data: { name, userId: auth.userId },
  });

  await prisma.projectStats.create({ data: { projectId: project.id } });

  // If creating from template, inject skeleton as v1
  if (templateId) {
    const template = await prisma.projectTemplate.findFirst({
      where: { id: templateId, userId: auth.userId },
    });
    if (template) {
      await prisma.htmlVersion.create({
        data: {
          projectId: project.id,
          version: 1,
          skeletonHtml: template.skeletonHtml,
          aiModel: 'template',
        },
      });

      await prisma.conversationMessage.create({
        data: {
          projectId: project.id,
          role: 'system',
          content: `项目基于模板「${template.name}」创建，已导入骨架 HTML (v1)`,
        },
      });

      await prisma.project.update({
        where: { id: project.id },
        data: { status: 'in_progress' },
      });
    }
  }

  return Response.json({ project }, { status: 201 });
});
