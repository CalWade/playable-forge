import { prisma } from '@/lib/db';

export async function logActivity(params: {
  projectId: string;
  userId: string;
  action: string;
  description: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    await prisma.activityLog.create({
      data: {
        projectId: params.projectId,
        userId: params.userId,
        action: params.action,
        description: params.description,
        metadata: params.metadata ? JSON.stringify(params.metadata) : null,
      },
    });
  } catch (e) {
    // Activity logging should never break the main flow
    console.warn('Failed to log activity:', e);
  }
}
