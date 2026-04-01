import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/auth/middleware';
import { runGeneratePipeline } from '@/lib/generation/pipeline';
import { createSSEResponse } from '@/lib/sse/stream';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const POST = withAuth(async (request, { params, auth }) => {
  const projectId = params.id;

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: auth.userId },
  });
  if (!project) return Response.json({ error: 'Project not found' }, { status: 404 });

  let description: string | undefined;
  let safetyClarification = false;
  try {
    const body = await request.json();
    description = body.description;
    safetyClarification = body.safetyClarification === true;
  } catch { /* empty body ok */ }

  return createSSEResponse((sse) =>
    runGeneratePipeline({ projectId, description, safetyClarification, sse })
  );
});
