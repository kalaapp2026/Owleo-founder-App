// Tiny dependency-free server: serves the app and keeps one shared data.json so all founders see the same data.
// Run:  node server.js        (local only)
//       set HOST=0.0.0.0 && node server.js   (reachable by others on your network)
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = +process.env.PORT || 3000;
const HOST = process.env.HOST || '127.0.0.1';
const DATA = path.join(__dirname, 'data.json');
const PUBLIC = {
  'index.html': 'text/html; charset=utf-8',
  'styles.css': 'text/css; charset=utf-8',
  'app.js': 'text/javascript; charset=utf-8',
  'vendor/chart.umd.min.js': 'text/javascript; charset=utf-8',
};

let db = { rev: 0, state: null };
try { db = JSON.parse(fs.readFileSync(DATA, 'utf8')); } catch {}

function persist() {
  fs.writeFileSync(DATA + '.tmp', JSON.stringify(db));
  fs.renameSync(DATA + '.tmp', DATA);
}

function send(res, code, body, type = 'application/json') {
  res.writeHead(code, { 'Content-Type': type, 'Cache-Control': 'no-store' });
  res.end(typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body));
}

http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');

  if (url.pathname === '/api/state') {
    if (req.method === 'GET') {
      const since = url.searchParams.get('since');
      return send(res, 200, since !== null && +since === db.rev ? { rev: db.rev } : db);
    }
    if (req.method === 'PUT') {
      let raw = '';
      req.on('data', c => {
        raw += c;
        if (raw.length > 8e6) { send(res, 413, { error: 'too large' }); req.destroy(); }
      });
      req.on('end', () => {
        try {
          const { state } = JSON.parse(raw);
          if (!state || typeof state !== 'object') throw new Error('bad state');
          db = { rev: db.rev + 1, state };
          persist();
          send(res, 200, { rev: db.rev });
        } catch (e) { send(res, 400, { error: e.message }); }
      });
      return;
    }
    return send(res, 405, { error: 'method' });
  }

  const file = url.pathname === '/' ? 'index.html' : url.pathname.slice(1);
  if (!Object.hasOwn(PUBLIC, file)) return send(res, 404, 'Not found', 'text/plain');
  fs.readFile(path.join(__dirname, file), (err, buf) => {
    if (err) return send(res, 404, 'Not found', 'text/plain');
    send(res, 200, buf, PUBLIC[file]);
  });
}).listen(PORT, HOST, () => {
  console.log(`Founders Hub running at http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`);
  console.log(`Data file: ${DATA}`);
});
