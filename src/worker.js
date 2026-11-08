// Cloudflare Worker: serves the app (static assets) and stores the shared data in a Durable Object (SQLite).
// Every record is its own document ("expenses/<id>", "ideas/<id>", "meta/settings" ...) so two people editing
// different records never overwrite each other.
//   GET  /api/db[?since=REV]   -> {rev} if nothing changed, else {rev, docs:{path:data}}
//   POST /api/db {ops:[{op:'set',path,data}|{op:'delete',path}]} -> {rev}
// Optional access key: `wrangler secret put ACCESS_KEY` - then every API call must send it in x-access-key.
import { DurableObject } from 'cloudflare:workers';

const COLS = ['expenses', 'settlements', 'phases', 'items', 'leads', 'activity', 'plans', 'ideas'];
const MAX_BODY = 4_000_000;

export class Store extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.sql = ctx.storage.sql;
    this.sql.exec('CREATE TABLE IF NOT EXISTS docs (path TEXT PRIMARY KEY, data TEXT NOT NULL)');
    this.sql.exec('CREATE TABLE IF NOT EXISTS meta (k TEXT PRIMARY KEY, v INTEGER NOT NULL)');
    this.sql.exec('CREATE TABLE IF NOT EXISTS chunks (i INTEGER PRIMARY KEY, data TEXT NOT NULL)'); // legacy single-blob storage
    this.migrate();
  }
  getMeta(k) { const r = this.sql.exec('SELECT v FROM meta WHERE k=?', k).toArray()[0]; return r ? r.v : 0; }
  setMeta(k, v) { this.sql.exec('INSERT INTO meta (k, v) VALUES (?, ?) ON CONFLICT(k) DO UPDATE SET v = excluded.v', k, v); }

  // One-time: turn the old whole-state blob (if any) into per-record documents. The old rows are kept as a backup.
  migrate() {
    if (this.getMeta('docs_v2')) return;
    this.ctx.storage.transactionSync(() => {
      const raw = this.sql.exec('SELECT data FROM chunks ORDER BY i').toArray().map(r => r.data).join('');
      if (raw) {
        const s = JSON.parse(raw);
        const put = (path, data) => this.sql.exec('INSERT OR REPLACE INTO docs (path, data) VALUES (?, ?)', path, JSON.stringify(data));
        if (s.settings) put('meta/settings', s.settings);
        for (const c of COLS) for (const d of s[c] || []) if (d && d.id) put(c + '/' + d.id, d);
        this.setMeta('rev', this.getMeta('rev') + 1);
      }
      this.setMeta('docs_v2', 1);
    });
  }

  read(since) {
    const rev = this.getMeta('rev');
    if (since !== null && since === rev) return `{"rev":${rev}}`;
    const parts = this.sql.exec('SELECT path, data FROM docs').toArray().map(r => `${JSON.stringify(r.path)}:${r.data}`);
    return `{"rev":${rev},"docs":{${parts.join(',')}}}`;
  }
  write(ops) {
    return this.ctx.storage.transactionSync(() => {
      for (const o of ops) {
        if (o.op === 'set') this.sql.exec('INSERT OR REPLACE INTO docs (path, data) VALUES (?, ?)', o.path, JSON.stringify(o.data));
        else this.sql.exec('DELETE FROM docs WHERE path = ?', o.path);
      }
      const rev = this.getMeta('rev') + 1; this.setMeta('rev', rev); return rev;
    });
  }
}

const json = (body, status = 200) => new Response(typeof body === 'string' ? body : JSON.stringify(body), {
  status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
});
const validPath = p => typeof p === 'string' && /^(meta\/settings|(expenses|settlements|phases|items|leads|activity|plans|ideas)\/[A-Za-z0-9_-]{1,64})$/.test(p);

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (url.pathname !== '/api/db') return env.ASSETS.fetch(req);
    if (env.ACCESS_KEY && req.headers.get('x-access-key') !== env.ACCESS_KEY) return json({ error: 'unauthorized' }, 401);

    const store = env.STORE.get(env.STORE.idFromName('main'));
    if (req.method === 'GET') {
      const s = url.searchParams.get('since');
      return json(await store.read(s === null ? null : +s));
    }
    if (req.method === 'POST') {
      const raw = await req.text();
      if (raw.length > MAX_BODY) return json({ error: 'too large' }, 413);
      let ops; try { ops = JSON.parse(raw).ops; } catch { return json({ error: 'bad json' }, 400); }
      if (!Array.isArray(ops) || ops.length > 500 || ops.some(o => !o || !validPath(o.path) || (o.op === 'set' ? !o.data || typeof o.data !== 'object' : o.op !== 'delete')))
        return json({ error: 'bad ops' }, 400);
      return json({ rev: await store.write(ops) });
    }
    return json({ error: 'method' }, 405);
  },
};
