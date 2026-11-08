// Builds ./public (what Cloudflare serves) from the current app: hosted/app.js + styles.css + src/cloud.js.
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..'), out = path.join(root, 'public');
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(path.join(out, 'vendor'), { recursive: true });

let css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
const m = css.match(/\[data-theme=dark\]\{([\s\S]*?)\n\}/);
if (!m) throw new Error('dark token block not found');
css = css.replace(m[0], `@media (prefers-color-scheme:dark){:root:not([data-theme=light]){${m[1]}\n}}\n:root[data-theme=dark]{${m[1]}\n}`);
css += `
body{background:var(--bg);color:var(--ink)}
#login{position:fixed;inset:0;z-index:50;display:grid;place-items:center;background:var(--bg);overflow:auto;
  padding:max(16px,env(safe-area-inset-top,0px)) max(16px,env(safe-area-inset-right,0px)) max(16px,env(safe-area-inset-bottom,0px)) max(16px,env(safe-area-inset-left,0px))}
.login-card{width:min(380px,100%);background:var(--card);border:1px solid var(--line);border-radius:16px;box-shadow:var(--shadow);padding:28px;display:flex;flex-direction:column;gap:14px}
.login-card h2{font-size:20px;letter-spacing:-.01em}
.login-err{color:var(--bad);font-size:13px;margin:0}
.whoami{display:flex;align-items:center;justify-content:space-between;gap:8px;font-weight:600}
@media (max-width:860px){.side,.top,.view{padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px))}}
@media (prefers-reduced-motion:reduce){*{transition:none!important}}
`;
fs.writeFileSync(path.join(out, 'styles.css'), css);

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>NEST Founders Hub</title>
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='8' fill='%234f46e5'/%3E%3Cpath d='M9 22V10l14 12V10' stroke='white' stroke-width='3' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E">
<link rel="stylesheet" href="styles.css">
</head>
<body>
<div class="app">
  <aside class="side" id="side">
    <div class="brand">
      <div class="logo">N</div>
      <div><div class="brand-name" id="brand-name">NEST</div><div class="brand-sub">Internal tracker</div></div>
    </div>
    <nav id="nav"></nav>
    <div class="side-foot">
      <span class="lbl">Signed in as</span>
      <div id="me" class="whoami"></div>
      <div class="sync" id="sync"></div>
    </div>
  </aside>
  <main class="main">
    <header class="top">
      <h1 id="page-title">Dashboard</h1>
      <div class="top-actions" id="actions"></div>
    </header>
    <div id="view" class="view"></div>
  </main>
</div>
<dialog id="modal"></dialog>
<div id="toast" role="status" aria-live="polite"></div>
<input type="file" id="imp" accept="application/json" hidden>
<script src="vendor/chart.umd.min.js"></script>
<script src="cloud.js"></script>
<script src="app.js"></script>
</body>
</html>
`;
fs.writeFileSync(path.join(out, 'index.html'), html);
fs.copyFileSync(path.join(root, 'hosted', 'app.js'), path.join(out, 'app.js'));
fs.copyFileSync(path.join(root, 'src', 'cloud.js'), path.join(out, 'cloud.js'));
fs.copyFileSync(path.join(root, 'vendor', 'chart.umd.min.js'), path.join(out, 'vendor', 'chart.umd.min.js'));
console.log('public/ ready');
