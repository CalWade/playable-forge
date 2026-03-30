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
  // Try Authorization header first
  let token = request.headers.get('Authorization')?.replace('Bearer ', '') || '';

  // Fallback: query param ?token=xxx (for img src, iframe src, downloads)
  if (!token) {
    token = request.nextUrl.searchParams.get('token') || '';
  }

  if (!token) throw new AuthError('Missing Authorization');

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
