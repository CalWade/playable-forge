import { NextRequest } from 'next/server';
import { verifyJwt } from './jwt';

export interface AuthResult {
  userId: string;
  role: string;
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

export function getAuth(request: NextRequest): AuthResult {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) throw new AuthError('Missing Authorization header');

  const token = authHeader.replace('Bearer ', '');
  if (!token) throw new AuthError('Missing token');

  try {
    const payload = verifyJwt(token);
    return { userId: payload.sub, role: payload.role };
  } catch {
    throw new AuthError('Invalid or expired token');
  }
}

export function handleAuthError(error: unknown) {
  if (error instanceof AuthError) {
    return Response.json({ error: error.message }, { status: 401 });
  }
  throw error;
}
