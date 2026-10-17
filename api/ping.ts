export default function handler(_req: { method?: string }, res: { status(code: number): any; json(body: unknown): any }) {
  return res.status(200).json({ ok: true, runtime: 'node', route: 'ping' });
}
