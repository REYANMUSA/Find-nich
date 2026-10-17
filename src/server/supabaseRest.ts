export type VercelRequest = {
  method?: string;
  query: Record<string, any>;
  body: any;
  headers?: Record<string, string | string[] | undefined>;
};
export type VercelResponse = {
  status(code: number): VercelResponse;
  json(body: any): any;
  setHeader(name: string, value: string): void;
};

const SUPABASE_URL = (process.env.SUPABASE_URL || '').replace(/\/+$/, '');
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

export function supabaseReady(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

export async function supabaseRest(
  resource: string,
  init: RequestInit = {},
): Promise<Response> {
  if (!supabaseReady()) {
    throw new Error('Supabase is not configured for this deployment.');
  }

  const headers = new Headers(init.headers);
  headers.set('apikey', SUPABASE_ANON_KEY);
  headers.set('Authorization', `Bearer ${SUPABASE_ANON_KEY}`);
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  return fetch(`${SUPABASE_URL}/rest/v1/${resource}`, {
    ...init,
    headers,
    cache: 'no-store',
  });
}

export function sendError(res: any, status: number, message: string) {
  return res.status(status).json({ error: { message } });
}
