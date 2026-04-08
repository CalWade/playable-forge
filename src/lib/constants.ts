import path from 'path';

export const DATA_DIR = process.env.DATA_DIR || './data';

export const PATHS = {
  uploads: (projectId: string) => path.join(DATA_DIR, 'uploads', projectId),
  base64: (projectId: string) => path.join(DATA_DIR, 'base64', projectId),
  html: (projectId: string) => path.join(DATA_DIR, 'html', projectId),
  library: (userId: string) => path.join(DATA_DIR, 'library', userId),
  settings: path.join(DATA_DIR, 'settings.json'),
} as const;
