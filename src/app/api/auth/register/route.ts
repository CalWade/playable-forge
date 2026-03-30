import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { hashPassword } from '@/lib/auth/password';
import { signJwt } from '@/lib/auth/jwt';
import { z } from 'zod';

const registerSchema = z.object({
  username: z.string().min(3).max(20),
  password: z.string().min(6),
  displayName: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);
    
    if (!parsed.success) {
      return Response.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { username, password, displayName } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) {
      return Response.json({ error: 'Username already taken' }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        username,
        passwordHash,
        displayName: displayName || username,
      },
    });

    const token = signJwt({ sub: user.id, role: user.role });

    return Response.json({
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
      },
      token,
    });
  } catch (error) {
    console.error('Register error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
