import { NextRequest } from 'next/server';
import { getAuth, handleAuthError } from '@/lib/auth/middleware';
import { getSettings, saveSettings } from '@/lib/settings';

export async function GET(request: NextRequest) {
  try {
    getAuth(request);
    const settings = await getSettings();
    return Response.json({ settings });
  } catch (error) {
    if ((error as Error).name === 'AuthError') return handleAuthError(error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    getAuth(request);
    const body = await request.json();
    const settings = await saveSettings(body);
    return Response.json({ settings });
  } catch (error) {
    if ((error as Error).name === 'AuthError') return handleAuthError(error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
