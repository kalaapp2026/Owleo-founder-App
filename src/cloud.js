// Adapter: gives the app the small "db / user / downloads" interface it was written against, backed by the Worker's /api/db.
// Writes are batched, and the page polls for other people's changes.
(function () {
  const AK = 'founders-hub-key', POLL_MS = 4000;
  let docs = {}, rev = null, loaded = false, wseq = 0, keyAsked = false, timer = null;
  const subs = [], queue = []; let flushT = null;

  async function call(url, o = {}) {
    let k = ''; try { k = localStorage.getItem(AK) || ''; } catch { }
    const r = await fetch(url, { ...o, headers: { ...(o.headers || {}), 'x-access-key': k }, cache: 'no-store' });
    if (r.status === 401 && !keyAsked) {
      keyAsked = true; const v = prompt('Enter the team access key');
      if (v) { try { localStorage.setItem(AK, v); } catch { } keyAsked = false; return call(url, o); }
    }
    if (!r.ok) throw new Error('http ' + r.status);
    return r.json();
  }

  const colOf = c => Object.entries(docs).filter(([p]) => p.startsWith(c + '/') && p.indexOf('/', c.length + 1) < 0).map(([, d]) => d);
  const snapOf = s => s.kind === 'doc'
    ? { exists: s.key in docs, data: () => docs[s.key] }
    : { docs: colOf(s.key).map(d => ({ data: () => d })) };
  const notify = () => subs.forEach(s => s.ok(snapOf(s)));

  async function poll() {
    const seq = wseq;
    try {
      const j = await call('/api/db' + (rev === null ? '' : '?since=' + rev));
      if (seq !== wseq) return;                    // one of our own writes landed meanwhile: this reply may be stale
      if (j.docs) { docs = j.docs; rev = j.rev; loaded = true; notify(); }
      else if (!loaded) { loaded = true; notify(); }
    } catch { if (!loaded) subs.forEach(s => s.err()); }
  }
  function start() {
    if (timer) return;
    poll(); timer = setInterval(poll, POLL_MS);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) poll(); });
  }

  function flush() {
    flushT = null; const batch = queue.splice(0);
    call('/api/db', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ops: batch.map(b => b.op) }) })
      .then(() => batch.forEach(b => b.res()), e => batch.forEach(b => b.rej({ code: 'write_failed', message: String(e) })));
  }
  function write(op) {
    wseq++;
    if (op.op === 'set') docs[op.path] = JSON.parse(JSON.stringify(op.data)); else delete docs[op.path];
    return new Promise((res, rej) => { queue.push({ op, res, rej }); if (!flushT) flushT = setTimeout(flush, 40); });
  }

  const db = {
    doc: path => ({
      set: data => write({ op: 'set', path, data }),
      delete: () => write({ op: 'delete', path }),
      get: async () => ({ exists: path in docs, data: () => docs[path] }),
      onSnapshot(ok, err) {
        const s = { kind: 'doc', key: path, ok, err: err || (() => { }) }; subs.push(s); start(); if (loaded) ok(snapOf(s));
      },
    }),
    collection: c => ({
      onSnapshot(ok, err) {
        const s = { kind: 'col', key: c, ok, err: err || (() => { }) }; subs.push(s); start(); if (loaded) ok(snapOf(s));
      },
    }),
  };
  const downloads = {
    save: async ({ filename, data }) => {
      const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([data], { type: 'text/plain' })); a.download = filename; a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1500);
    },
  };
  window.claude = { use: async n => (n === 'db' ? db : n === 'downloads' ? downloads : null) };
})();
