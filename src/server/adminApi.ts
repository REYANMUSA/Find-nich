import type { VercelRequest, VercelResponse } from './supabaseRest.js';
import { getAdminToken, verifyAdminToken } from './adminAuth.js';

export function requireAdmin(req: VercelRequest, res: VercelResponse): boolean {
  if (!verifyAdminToken(getAdminToken(req))) {
    res.status(401).json({ error: { message: 'Please sign in again.' } });
    return false;
  }
  return true;
}

export function methodNotAllowed(res: VercelResponse, allowed: string[]) {
  res.setHeader('Allow', allowed.join(', '));
  return res.status(405).json({ error: { message: 'Method not allowed.' } });
}

export async function writeAudit(action: string, details: string, targetId?: string) {
  try {
    const { supabaseAdminRest } = await import('./supabaseRest.js');
    await supabaseAdminRest('audit_logs', {
      method: 'POST',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({ id: crypto.randomUUID(), action, details, target_id: targetId || null, actor: 'owner' }),
    });
  } catch {
    // Audit logging must never turn a successful product operation into a failure.
  }
}

export function slugify(value: string): string {
  return value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 90) || 'product';
}

export function isObject(value: unknown): value is Record<string, any> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
