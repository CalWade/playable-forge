import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/auth/middleware';
import { getSettings } from '@/lib/settings';

// GET /api/templates — list templates for current user
export const GET = withAuth(async (_request, { auth }) => {
  const templates = await prisma.projectTemplate.findMany({
    where: { userId: auth.userId },
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      name: true,
      description: true,
      sourceProjectId: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return Response.json({ templates });
});

// POST /api/templates — create template from project
export const POST = withAuth(async (request, { auth }) => {
  const body = await request.json();
  const { projectId, name, description } = body as {
    projectId: string;
    name?: string;
    description?: string;
  };

  if (!projectId) {
    return Response.json({ error: 'projectId is required' }, { status: 400 });
  }

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: auth.userId },
  });
  if (!project) {
    return Response.json({ error: 'Project not found' }, { status: 404 });
  }

  // Get skeleton: prefer latest locked version, fallback to latest version
  const lockedVersion = await prisma.htmlVersion.findFirst({
    where: { projectId, isLocked: true },
    orderBy: { version: 'desc' },
  });
  const latestVersion = lockedVersion || await prisma.htmlVersion.findFirst({
    where: { projectId },
    orderBy: { version: 'desc' },
  });

  if (!latestVersion) {
    return Response.json({ error: 'Project has no versions to save as template' }, { status: 400 });
  }

  // Read system prompt from settings
  let systemPrompt: string | null = null;
  try {
    const settings = await getSettings();
    systemPrompt = settings.ai.systemPromptOverride || null;
  } catch { /* no settings */ }

  const template = await prisma.projectTemplate.create({
    data: {
      name: name || `${project.name}-模板`,
      description: description || null,
      userId: auth.userId,
      skeletonHtml: latestVersion.skeletonHtml,
      systemPrompt,
      sourceProjectId: projectId,
    },
  });

  return Response.json({ template }, { status: 201 });
});
