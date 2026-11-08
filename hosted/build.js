// Builds hosted/artifact.html (one self-contained page) from ../styles.css and ./app.js
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');

let css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
// light/dark tokens: bare :root (light) + prefers-color-scheme + explicit data-theme, as the viewer expects
const m = css.match(/\[data-theme=dark\]\{([\s\S]*?)\n\}/);
if (!m) throw new Error('dark token block not found');
const dark = m[1];
css = css.replace(m[0], `@media (prefers-color-scheme:dark){:root:not([data-theme=light]){${dark}\n}}\n:root[data-theme=dark]{${dark}\n}`);
css += `
body{background:var(--bg);color:var(--ink)}
#login{position:fixed;inset:0;z-index:50;display:grid;place-items:center;background:var(--bg);overflow:auto;
  padding:max(16px,env(safe-area-inset-top,0px)) max(16px,env(safe-area-inset-right,0px)) max(16px,env(safe-area-inset-bottom,0px)) max(16px,env(safe-area-inset-left,0px))}
.login-card{width:min(380px,100%);background:var(--card);border:1px solid var(--line);border-radius:16px;box-shadow:var(--shadow);padding:28px;display:flex;flex-direction:column;gap:14px}
.login-card h2{font-size:20px;letter-spacing:-.01em}
.login-err{color:var(--bad);font-size:13px;margin:0}
.whoami{display:flex;align-items:center;justify-content:space-between;gap:8px;font-weight:600}
@media (max-width:860px){
  .side,.top,.view{padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px))}
}
@media (prefers-reduced-motion:reduce){*{transition:none!important}}
`;

const js = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');
if (js.includes('</script>')) throw new Error('app.js contains </script>');

const html = `<title>NEST Founders Hub</title>
<meta name="claude:viewport-fit-sides" content="cover">
<style>
${css}
</style>
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
<script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js"></script>
<script>
${js}
</script>
`;
fs.writeFileSync(path.join(__dirname, 'artifact.html'), html);
console.log('wrote hosted/artifact.html', html.length, 'bytes');
