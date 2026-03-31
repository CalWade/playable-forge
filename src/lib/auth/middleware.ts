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
  let token = request.headers.get('Authorization')?.replace('Bearer ', '') || '';

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

type RouteHandler = (
  request: NextRequest,
  context: { params: Record<string, string>; auth: AuthResult }
) => Promise<Response>;

/**
 * Higher-order function that wraps route handlers with auth + error handling.
 * Eliminates boilerplate try/catch + getAuth in every route.
 */
export function withAuth(handler: RouteHandler) {
  return async (request: NextRequest, { params }: { params: Record<string, string> }) => {
    try {
      const auth = getAuth(request);
      return await handler(request, { params, auth });
    } catch (error) {
      if (error instanceof AuthError) {
        return Response.json({ error: error.message }, { status: 401 });
      }
      console.error('Route error:', error);
      return Response.json({ error: 'Internal server error' }, { status: 500 });
    }
  };
}
