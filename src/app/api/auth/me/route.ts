import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuth, handleAuthError } from '@/lib/auth/middleware';

export async function GET(request: NextRequest) {
  try {
    const auth = getAuth(request);

    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: { id: true, username: true, displayName: true, role: true },
    });

    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    return Response.json({ user });
  } catch (error) {
    return handleAuthError(error);
  }
}
