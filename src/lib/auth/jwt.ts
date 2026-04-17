import jwt from 'jsonwebtoken';

/**
 * Resolve JWT secret with fail-fast in production.
 * - In production: throw if missing or using the legacy dev fallback.
 * - In dev/test: allow a clearly-marked dev secret with a loud warning.
 */
function resolveSecret(): string {
  const fromEnv = process.env.JWT_SECRET;
  const isProd = process.env.NODE_ENV === 'production';

  if (!fromEnv) {
    if (isProd) {
      throw new Error(
        'JWT_SECRET is not set. Refusing to start in production with an insecure default.'
      );
    }
    console.warn(
      '[auth/jwt] WARNING: JWT_SECRET is not set. Using an insecure dev-only secret. ' +
        'Set JWT_SECRET in your environment for any non-local use.'
    );
    return 'dev-secret-DO-NOT-USE-in-prod';
  }

  if (isProd && fromEnv === 'dev-secret-change-me') {
    throw new Error(
      'JWT_SECRET is set to the legacy default "dev-secret-change-me". Refusing to start.'
    );
  }
  if (isProd && fromEnv.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 chars in production.');
  }

  return fromEnv;
}

const JWT_SECRET = resolveSecret();
const JWT_EXPIRES_IN = '7d';

interface JwtPayload {
  sub: string;
  role: string;
}

export function signJwt(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyJwt(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}
