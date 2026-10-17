import { createHmac, timingSafeEqual } from 'node:crypto';
import type { VercelRequest } from './supabaseRest';

const COOKIE_NAME = 'fn_admin_session';
const SESSION_SECONDS = 4 * 60 * 60;

function signingKey(): string {
  // Derive the session signing key from the server-only passcode.
  return process.env.ADMIN_PASSCODE || '';
}

function sign(value: string): string {
  return createHmac('sha256', signingKey()).update(value).digest('base64url');
}

function constantTimeEqual(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function adminConfigured(): boolean {
  return Boolean(signingKey());
}

export function verifyPasscode(input: unknown): boolean {
  const expected = signingKey();
  if (!expected || typeof input !== 'string') return false;
  return constantTimeEqual(input, expected);
}

export function createAdminToken(now = Date.now()): string {
  const payload = Buffer.from(JSON.stringify({
    role: 'owner',
    exp: Math.floor(now / 1000) + SESSION_SECONDS,
  })).toString('base64url');
  return payload + '.' + sign(payload);
}

export function verifyAdminToken(token: string | undefined, now = Date.now()): boolean {
  if (!token || !adminConfigured()) return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [payload, signature] = parts;
  if (!constantTimeEqual(signature, sign(payload))) return false;

  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return data?.role === 'owner' && Number.isFinite(data.exp) && data.exp > Math.floor(now / 1000);
  } catch {
    return false;
  }
}

export function getAdminToken(req: VercelRequest): string | undefined {
  const auth = req.headers?.authorization;
  const authorization = Array.isArray(auth) ? auth[0] : auth;
  if (typeof authorization === 'string' && authorization.startsWith('Bearer ')) {
    return authorization.slice(7).trim();
  }

  const rawCookie = req.headers?.cookie;
  const cookieHeader = Array.isArray(rawCookie) ? rawCookie[0] : rawCookie;
  if (typeof cookieHeader !== 'string') return undefined;

  for (const part of cookieHeader.split(';')) {
    const [name, ...rest] = part.trim().split('=');
    if (name === COOKIE_NAME) return rest.join('=');
  }
  return undefined;
}

export function adminCookie(token: string, maxAge = SESSION_SECONDS): string {
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}

export function clearAdminCookie(): string {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}
