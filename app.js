'use strict';
/* =====================================================================
   Founders Hub — expense splitting, phases, leads & activity tracker
   ===================================================================== */

/* ---------- constants ---------- */
const KEY = 'founders-hub-v1';
const ME_KEY = 'founders-hub-me';
const DEFAULT_CATS = ['Software & Tools', 'Cloud & Hosting', 'Marketing', 'Salaries & Stipends', 'Legal & Compliance',
  'Office & Rent', 'Travel', 'Food & Meetings', 'Equipment', 'Design & Branding', 'Other'];
const PALETTE = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#8b5cf6', '#ec4899', '#84cc16', '#f97316', '#14b8a6', '#64748b'];
const FOUNDER_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#06b6d4', '#8b5cf6'];
const ITEM_STATUS = { todo: 'To do', doing: 'In progress', review: 'In review', blocked: 'Blocked', done: 'Done' };
const STATUS_TONE = { todo: '', doing: 'brand', review: 'warn', blocked: 'bad', done: 'good' };
const PRIORITY = ['Low', 'Medium', 'High', 'Critical'];
const PRIORITY_TONE = ['', 'brand', 'warn', 'bad'];
const PHASE_STATUS = ['Planned', 'Active', 'Completed', 'On hold'];
const STAGES = ['New', 'Contacted', 'Meeting', 'Proposal', 'Won', 'Lost'];
const STAGE_TONE = { New: '', Contacted: 'brand', Meeting: 'brand', Proposal: 'warn', Won: 'good', Lost: 'bad' };
const SOURCES = ['Referral', 'LinkedIn', 'Website', 'Event', 'Cold outreach', 'Investor intro', 'Other'];
const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD', 'AUD', 'CAD'];

/* ---------- tiny helpers ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-3);
const sum = a => a.reduce((x, y) => x + y, 0);
const today = () => { const d = new Date(); return new Date(d - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10); };
const daysFromNow = n => { const d = new Date(); d.setDate(d.getDate() + n); return new Date(d - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10); };
const ym = d => d.slice(0, 7);
const css = v => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
const fmtDate = s => s ? new Date(s + 'T00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fmtTime = ts => new Date(ts).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
const monthLabel = k => new Date(k + '-01T00:00').toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });
const locale = () => S.settings.currency === 'INR' ? 'en-IN' : 'en-US';
const fmt = n => new Intl.NumberFormat(locale(), { style: 'currency', currency: S.settings.currency, maximumFractionDigits: 2 }).format(n || 0);
const fmtShort = n => new Intl.NumberFormat(locale(), { notation: 'compact', maximumFractionDigits: 1 }).format(n || 0);
const pct = (a, b) => b ? Math.round(a / b * 100) : 0;

const ICONS = {
  grid: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>',
  wallet: '<rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>',
  repeat: '<polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>',
  layers: '<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>',
  users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  activity: '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>',
  sliders: '<line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/>',
  plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
  trash: '<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>',
  x: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
  moon: '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>',
  sun: '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>',
  msg: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  left: '<polyline points="15 18 9 12 15 6"/>',
  right: '<polyline points="9 18 15 12 9 6"/>',
  clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  list: '<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>',
};
const ico = (n, s = 18) => `<svg class="ico" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n]}</svg>`;

/* ---------- state (local + optional shared server) ---------- */
function fresh() {
  return {
    settings: {
      company: 'NEST', currency: 'INR', setup: false, categories: [...DEFAULT_CATS],
      founders: ['Vishruth', 'Prajwal', 'Nandish'].map((name, i) => ({ id: 'f' + (i + 1), name, color: FOUNDER_COLORS[i] })),
    },
    expenses: [], settlements: [], phases: [], items: [], leads: [], activity: [],
  };
}
function normalize(s) {
  const d = fresh(); s = s || {};
  return { ...d, ...s, settings: { ...d.settings, ...(s.settings || {}) } };
}
let S = (() => { try { const r = JSON.parse(localStorage.getItem(KEY)); if (r && r.settings) return normalize(r); } catch { } return fresh(); })();
let remote = false, rev = 0, pending = false, pushTimer, keyAsked = false;
const AK = 'founders-hub-key';
// fetch wrapper: sends the team access key (only enforced if the server has ACCESS_KEY set); asks for it on 401.
async function api(url, o = {}) {
  let k = ''; try { k = localStorage.getItem(AK) || ''; } catch { }
  const r = await fetch(url, { ...o, headers: { ...(o.headers || {}), 'x-access-key': k } });
  if (r.status === 401 && !keyAsked) {
    keyAsked = true;
    const v = prompt('Enter the team access key');
    if (v) { try { localStorage.setItem(AK, v); } catch { } keyAsked = false; return api(url, o); }
  }
  return r;
}

function setSync(state) {
  const el = $('#sync'); if (!el) return;
  const map = { ok: ['ok', 'Shared · synced'], busy: ['busy', 'Saving…'], err: ['err', 'Server offline'], local: ['', 'Saved in this browser'] };
  const [c, t] = map[state];
  el.className = 'sync ' + c; el.innerHTML = `<i></i>${t}`;
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(S)); } catch { }
  if (remote) { pending = true; clearTimeout(pushTimer); pushTimer = setTimeout(push, 300); setSync('busy'); }
}
async function push() {
  try {
    const r = await api('api/state', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ state: S }) });
    if (!r.ok) throw 0; const j = await r.json(); rev = j.rev; pending = false; setSync('ok');
  } catch { setSync('err'); }
}
async function poll() {
  if (pending || $('#modal').open) return;
  try {
    const pr = await api('api/state?since=' + rev, { cache: 'no-store' }); if (!pr.ok) throw 0; const j = await pr.json();
    if (j.state && j.rev !== rev) {
      S = normalize(j.state); rev = j.rev;
      try { localStorage.setItem(KEY, JSON.stringify(S)); } catch { }
      render();
    }
    setSync('ok');
  } catch { setSync('err'); }
}

const F = () => S.settings.founders;
const fById = id => F().find(f => f.id === id);
const fname = id => fById(id)?.name || '—';
const cu = () => { let id = null; try { id = localStorage.getItem(ME_KEY); } catch { } return fById(id) ? id : F()[0].id; };
const phaseName = id => S.phases.find(p => p.id === id)?.name || 'No phase';
function chip(id) {
  const f = fById(id); if (!f) return '<span class="chip">—</span>';
  return `<span class="chip"><i style="background:${esc(f.color)}">${esc(f.name[0] || '?').toUpperCase()}</i>${esc(f.name)}</span>`;
}
function log(text, type) {
  S.activity.unshift({ id: uid(), at: Date.now(), by: cu(), text, type });
  S.activity.length = Math.min(S.activity.length, 1500);
}
function commit(text, type) { if (text) log(text, type); save(); render(); }

/* ---------- money logic ---------- */
function sharesOf(e) {
  const out = {}; F().forEach(f => out[f.id] = 0);
  const sp = e.split || { type: 'equal', ids: F().map(f => f.id) };
  if (sp.type === 'owned') out[sp.owner] = (out[sp.owner] || 0) + e.amount;
  else if (sp.type === 'custom') Object.keys(sp.pct || {}).forEach(id => out[id] = (out[id] || 0) + e.amount * (sp.pct[id] || 0) / 100);
  else { const ids = sp.ids?.length ? sp.ids : F().map(f => f.id); ids.forEach(id => out[id] = (out[id] || 0) + e.amount / ids.length); }
  return out;
}
function balances(list = S.expenses) {
  const paid = {}, owed = {}, net = {}, owned = {};
  F().forEach(f => { paid[f.id] = 0; owed[f.id] = 0; owned[f.id] = 0; });
  list.forEach(e => {
    paid[e.paidBy] = (paid[e.paidBy] || 0) + e.amount;
    const sh = sharesOf(e); Object.keys(sh).forEach(id => owed[id] = (owed[id] || 0) + sh[id]);
    if (e.split?.type === 'owned') owned[e.split.owner] = (owned[e.split.owner] || 0) + e.amount;
  });
  F().forEach(f => net[f.id] = paid[f.id] - owed[f.id]);
  S.settlements.forEach(s => { net[s.from] = (net[s.from] || 0) + s.amount; net[s.to] = (net[s.to] || 0) - s.amount; });
  return { paid, owed, net, owned };
}
function suggestions(net) {
  const d = [], c = [];
  Object.keys(net).forEach(id => { const v = Math.round(net[id] * 100) / 100; if (v < -0.5) d.push({ id, v: -v }); else if (v > 0.5) c.push({ id, v }); });
  d.sort((a, b) => b.v - a.v); c.sort((a, b) => b.v - a.v);
  const out = []; let i = 0, j = 0;
  while (i < d.length && j < c.length) {
    const a = Math.min(d[i].v, c[j].v);
    out.push({ from: d[i].id, to: c[j].id, amount: Math.round(a * 100) / 100 });
    d[i].v -= a; c[j].v -= a;
    if (d[i].v < 0.5) i++; if (c[j].v < 0.5) j++;
  }
  return out;
}
function splitLabel(e) {
  const sp = e.split || { type: 'equal', ids: [] };
  if (sp.type === 'owned') return `<span class="badge warn">Owned · ${esc(fname(sp.owner))}</span>`;
  if (sp.type === 'custom') return `<span class="badge brand">Custom %</span>`;
  const n = sp.ids?.length || F().length;
  return `<span class="badge">${n === F().length ? 'Equal · all' : 'Equal · ' + n}</span>`;
}

/* ---------- UI plumbing ---------- */
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), 2600);
}
function modal({ title, body, submit = 'Save', onSubmit, onOpen, extra = '', small = false }) {
  const d = $('#modal'); if (d.open) d.close();
  d.innerHTML = `<form class="modal-card ${small ? 'sm' : ''}" autocomplete="off">
    <header><h3>${title}</h3><button type="button" class="icon-btn" data-close aria-label="Close">${ico('x')}</button></header>
    <div class="modal-body">${body}</div>
    <footer>${extra}<span class="spacer"></span><button type="button" class="btn" data-close>${onSubmit ? 'Cancel' : 'Close'}</button>${onSubmit ? `<button class="btn primary">${submit}</button>` : ''}</footer>
  </form>`;
  const form = $('form', d);
  form.onsubmit = e => { e.preventDefault(); if (onSubmit && onSubmit(new FormData(form), form) === false) return; d.close(); };
  d.showModal();
  onOpen?.(form, d);
  return form;
}
function confirmBox(msg, label, onYes) {
  modal({ title: 'Please confirm', body: `<p>${msg}</p>`, submit: label, small: true, onSubmit: () => { onYes(); } });
  $('#modal .btn.primary').classList.add('danger', 'solid');
}
function askRemark(title, intro, onDone) {
  modal({
    title, submit: 'Confirm', small: true,
    body: `<p style="margin-bottom:10px">${intro}</p><label class="field">Remark (optional)<textarea name="remark" rows="3" placeholder="Why is this changing?"></textarea></label>`,
    onSubmit: fd => onDone((fd.get('remark') || '').trim()),
  });
}
function download(name, text, type) {
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1500);
}
const opts = (list, sel, getV = x => x, getL = x => x) => list.map(x => `<option value="${esc(getV(x))}" ${getV(x) === sel ? 'selected' : ''}>${esc(getL(x))}</option>`).join('');
const founderOpts = sel => opts(F(), sel, f => f.id, f => f.name);
const phaseOpts = (sel, blank) => (blank ? `<option value="">${blank}</option>` : '') + opts([...S.phases].sort((a, b) => a.order - b.order), sel, p => p.id, p => p.name);
const setActions = html => { $('#actions').innerHTML = html; };

function threadHTML(arr) {
  if (!arr?.length) return '<p class="hint">Nothing yet.</p>';
  return [...arr].sort((a, b) => b.at - a.at).map(m => {
    const f = fById(m.by);
    const label = { comment: 'commented', move: 'moved', change: 'updated', note: 'added a note' }[m.kind] || 'commented';
    return `<div class="msg ${m.kind === 'comment' || m.kind === 'note' ? '' : 'sys'}">
      <div class="av" style="background:${esc(f?.color || '#888')}">${esc((f?.name || '?')[0]).toUpperCase()}</div>
      <div class="bd"><div class="hd"><b>${esc(f?.name || 'Someone')}</b> ${label} · ${fmtTime(m.at)}</div>
      <div>${esc(m.text).replace(/\n/g, '<br>')}</div>${m.remark ? `<q>Remark: ${esc(m.remark)}</q>` : ''}</div></div>`;
  }).join('');
}

/* ---------- charts ---------- */
const charts = {};
function drawChart(id, cfg) {
  const el = document.getElementById(id); if (!el) return;
  Chart.defaults.color = css('--muted'); Chart.defaults.borderColor = css('--line'); Chart.defaults.font.family = 'inherit';
  cfg.options = { responsive: true, maintainAspectRatio: false, ...cfg.options };
  charts[id] = new Chart(el, cfg);
}
const moneyTip = { callbacks: { label: c => ` ${c.dataset.label ? c.dataset.label + ': ' : ''}${fmt(c.parsed.y ?? c.parsed.x ?? c.parsed)}` } };

/* =====================================================================
   PAGES
   ===================================================================== */
let dashRange = 'all';
const rangeLabel = { all: 'All time', month: 'This month', '3m': 'Last 3 months', year: 'This year' };
function inRange(e) {
  if (dashRange === 'all') return true;
  if (dashRange === 'month') return ym(e.date) === ym(today());
  if (dashRange === 'year') return e.date.slice(0, 4) === today().slice(0, 4);
  const d = new Date(); d.setMonth(d.getMonth() - 2); d.setDate(1);
  return e.date >= new Date(d - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
}
const isOpenItem = i => i.status !== 'done';
const isOpenLead = l => !['Won', 'Lost'].includes(l.stage);

function pgDashboard() {
  setActions(`<select class="sel" data-filter="range" aria-label="Period">${Object.entries(rangeLabel).map(([k, v]) => `<option value="${k}" ${k === dashRange ? 'selected' : ''}>${v}</option>`).join('')}</select>
    <button class="btn primary" data-act="exp-add">${ico('plus')} Add expense</button>`);
  const ex = S.expenses.filter(inRange), total = sum(ex.map(e => e.amount));
  const nowM = ym(today()), prev = new Date(); prev.setMonth(prev.getMonth() - 1); const prevM = ym(new Date(prev - prev.getTimezoneOffset() * 6e4).toISOString());
  const mTot = sum(S.expenses.filter(e => ym(e.date) === nowM).map(e => e.amount));
  const pTot = sum(S.expenses.filter(e => ym(e.date) === prevM).map(e => e.amount));
  const months = new Set(ex.map(e => ym(e.date))).size || 1;
  const { net } = balances(); const mine = net[cu()] || 0;
  const openItems = S.items.filter(isOpenItem), overdueItems = openItems.filter(i => i.due && i.due < today());
  const openLeads = S.leads.filter(isOpenLead), pipeline = sum(openLeads.map(l => +l.value || 0));
  const delta = pTot ? Math.round((mTot - pTot) / pTot * 100) : null;

  // insights
  const bycat = {}; ex.forEach(e => bycat[e.category] = (bycat[e.category] || 0) + e.amount);
  const catRows = Object.entries(bycat).sort((a, b) => b[1] - a[1]);
  const insights = [];
  if (catRows[0]) insights.push(`<b>${esc(catRows[0][0])}</b> is your biggest cost — ${pct(catRows[0][1], total)}% of spend (${fmt(catRows[0][1])}).`);
  if (delta !== null) insights.push(`This month's spend is <b class="${delta > 0 ? 'up' : 'down'}">${delta > 0 ? '+' : ''}${delta}%</b> vs last month (${fmt(mTot)} vs ${fmt(pTot)}).`);
  const big = [...ex].sort((a, b) => b.amount - a.amount)[0];
  if (big) insights.push(`Largest single expense: <b>${esc(big.title)}</b> — ${fmt(big.amount)} paid by ${esc(fname(big.paidBy))}.`);
  const bySugg = suggestions(net);
  if (bySugg.length) insights.push(`Settle up: <b>${esc(fname(bySugg[0].from))}</b> owes <b>${esc(fname(bySugg[0].to))}</b> ${fmt(bySugg[0].amount)}${bySugg.length > 1 ? ` (+${bySugg.length - 1} more)` : ''}.`);
  else if (S.expenses.length) insights.push('Everyone is settled up. 🎉');
  if (overdueItems.length) insights.push(`<b class="up">${overdueItems.length}</b> phase item${overdueItems.length > 1 ? 's are' : ' is'} overdue.`);

  // attention
  const soon = daysFromNow(7);
  const att = [
    ...openItems.filter(i => i.due && i.due <= soon).map(i => ({ d: i.due, t: i.title, s: `${phaseName(i.phaseId)} · ${assigneeNames(i)}`, act: 'item-open', id: i.id, k: 'Task' })),
    ...openLeads.filter(l => l.next && l.next <= soon).map(l => ({ d: l.next, t: l.name + (l.company ? ' · ' + l.company : ''), s: `${l.stage} · ${fname(l.owner)}`, act: 'lead-open', id: l.id, k: 'Follow-up' })),
  ].sort((a, b) => a.d.localeCompare(b.d)).slice(0, 7);

  $('#view').innerHTML = `
  ${!S.expenses.length && !S.phases.length && !S.leads.length ? `<div class="card empty"><h3>Welcome 👋</h3><p>Start by adding an expense, creating your first phase, or load sample data to explore.</p>
     <div class="toolbar" style="justify-content:center;margin-top:12px"><button class="btn primary" data-act="exp-add">${ico('plus')} Add expense</button><button class="btn" data-act="ph-add">${ico('layers')} Create phase</button><button class="btn" data-act="sample">Load sample data</button></div></div>` : ''}
  <div class="grid kpis">
    <div class="card kpi"><div class="k">Total spend</div><div class="v">${fmt(total)}</div><div class="s">${rangeLabel[dashRange]} · ${ex.length} expenses</div></div>
    <div class="card kpi"><div class="k">This month</div><div class="v">${fmt(mTot)}</div><div class="s">${delta === null ? 'No data for last month' : `<span class="${delta > 0 ? 'up' : 'down'}">${delta > 0 ? '▲' : '▼'} ${Math.abs(delta)}%</span> vs last month`}</div></div>
    <div class="card kpi"><div class="k">Avg / month</div><div class="v">${fmt(total / months)}</div><div class="s">across ${months} month${months > 1 ? 's' : ''}</div></div>
    <div class="card kpi"><div class="k">Your balance</div><div class="v ${mine >= 0.5 ? 'pos' : mine <= -0.5 ? 'neg' : ''}">${fmt(Math.abs(mine))}</div><div class="s">${mine >= 0.5 ? 'you are owed' : mine <= -0.5 ? 'you owe the team' : 'all settled'} · ${esc(fname(cu()))}</div></div>
    <div class="card kpi"><div class="k">Open tasks</div><div class="v">${openItems.length}</div><div class="s">${overdueItems.length ? `<span class="up">${overdueItems.length} overdue</span>` : 'none overdue'} · ${S.phases.length} phases</div></div>
    <div class="card kpi"><div class="k">Open pipeline</div><div class="v">${fmt(pipeline)}</div><div class="s">${openLeads.length} active leads</div></div>
  </div>
  <div class="grid g2">
    <div class="card"><h3>Spend by category <small>${rangeLabel[dashRange]}</small></h3>${ex.length ? '<div class="chart"><canvas id="c-cat"></canvas></div>' : '<div class="empty">No expenses in this period</div>'}</div>
    <div class="card"><h3>Monthly spend — who paid <small>last 6 months</small></h3>${S.expenses.length ? '<div class="chart"><canvas id="c-month"></canvas></div>' : '<div class="empty">No expenses yet</div>'}</div>
    <div class="card"><h3>Paid vs. own share <small>${rangeLabel[dashRange]}</small></h3>${ex.length ? '<div class="chart"><canvas id="c-fnd"></canvas></div>' : '<div class="empty">No expenses in this period</div>'}</div>
    <div class="card"><h3>Spend by phase <small>${rangeLabel[dashRange]}</small></h3>${ex.length ? '<div class="chart"><canvas id="c-phase"></canvas></div>' : '<div class="empty">No expenses in this period</div>'}</div>
  </div>
  <div class="grid g3">
    <div class="card"><h3>Smart insights</h3>${insights.length ? `<ul class="insights">${insights.map(i => `<li><div>${i}</div></li>`).join('')}</ul>` : '<div class="empty">Insights appear once you add data</div>'}</div>
    <div class="card"><h3>Needs attention <small>next 7 days</small></h3>${att.length ? att.map(a => `<div class="list-row" data-act="${a.act}" data-id="${a.id}"><div class="grow"><div class="t">${esc(a.t)}</div><div class="sub">${a.k} · ${esc(a.s)}</div></div><span class="badge ${a.d < today() ? 'bad' : 'warn'}">${a.d < today() ? 'Overdue ' : ''}${fmtDate(a.d)}</span></div>`).join('') : '<div class="empty">Nothing due. Nice.</div>'}</div>
    <div class="card"><h3>Lead pipeline</h3>${S.leads.length ? '<div class="chart" style="height:220px"><canvas id="c-lead"></canvas></div>' : '<div class="empty">No leads yet</div>'}</div>
  </div>
  <div class="card"><h3>Recent activity <small><a href="#/activity">view all</a></small></h3>${activityHTML(S.activity.slice(0, 6))}</div>`;

  // charts
  if (ex.length) {
    drawChart('c-cat', { type: 'doughnut', data: { labels: catRows.map(r => r[0]), datasets: [{ data: catRows.map(r => r[1]), backgroundColor: PALETTE, borderColor: css('--card'), borderWidth: 2 }] },
      options: { cutout: '62%', plugins: { legend: { position: 'right', labels: { boxWidth: 10, usePointStyle: true } }, tooltip: { callbacks: { label: c => ` ${c.label}: ${fmt(c.parsed)} (${pct(c.parsed, total)}%)` } } } } });
    const bal = balances(ex);
    drawChart('c-fnd', { type: 'bar', data: { labels: F().map(f => f.name), datasets: [
      { label: 'Paid', data: F().map(f => bal.paid[f.id]), backgroundColor: F().map(f => f.color), borderRadius: 6 },
      { label: 'Own share', data: F().map(f => bal.owed[f.id]), backgroundColor: F().map(f => f.color + '55'), borderColor: F().map(f => f.color), borderWidth: 1.5, borderRadius: 6 }] },
      options: { plugins: { tooltip: moneyTip }, scales: { y: { ticks: { callback: fmtShort }, beginAtZero: true } } } });
    const byph = {}; ex.forEach(e => { const k = e.phaseId ? phaseName(e.phaseId) : 'No phase'; byph[k] = (byph[k] || 0) + e.amount; });
    const phRows = Object.entries(byph).sort((a, b) => b[1] - a[1]);
    drawChart('c-phase', { type: 'bar', data: { labels: phRows.map(r => r[0]), datasets: [{ data: phRows.map(r => r[1]), backgroundColor: PALETTE[0], borderRadius: 6 }] },
      options: { indexAxis: 'y', plugins: { legend: { display: false }, tooltip: moneyTip }, scales: { x: { ticks: { callback: fmtShort } } } } });
  }
  if (S.expenses.length) {
    const keys = []; for (let i = 5; i >= 0; i--) { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - i); keys.push(new Date(d - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 7)); }
    drawChart('c-month', { type: 'bar', data: { labels: keys.map(monthLabel), datasets: F().map(f => ({ label: f.name, backgroundColor: f.color, borderRadius: 4,
      data: keys.map(k => sum(S.expenses.filter(e => ym(e.date) === k && e.paidBy === f.id).map(e => e.amount))) })) },
      options: { plugins: { tooltip: moneyTip, legend: { labels: { boxWidth: 10, usePointStyle: true } } }, scales: { x: { stacked: true }, y: { stacked: true, ticks: { callback: fmtShort }, beginAtZero: true } } } });
  }
  if (S.leads.length) {
    drawChart('c-lead', { type: 'bar', data: { labels: STAGES, datasets: [{ data: STAGES.map(s => S.leads.filter(l => l.stage === s).length),
      backgroundColor: STAGES.map(s => s === 'Won' ? css('--good') : s === 'Lost' ? css('--bad') : PALETTE[0]), borderRadius: 6 }] },
      options: { plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => { const v = sum(S.leads.filter(l => l.stage === STAGES[c.dataIndex]).map(l => +l.value || 0)); return ` ${c.parsed.y} leads · ${fmt(v)}`; } } } }, scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } } });
  }
}

/* ---------- expenses ---------- */
const ef = { q: '', cat: '', payer: '', phase: '', month: '', split: '' };
function pgExpenses() {
  setActions(`<button class="btn" data-act="exp-csv">${ico('download')} Export CSV</button><button class="btn primary" data-act="exp-add">${ico('plus')} Add expense</button>`);
  const months = [...new Set(S.expenses.map(e => ym(e.date)))].sort().reverse();
  const cats = [...new Set([...S.settings.categories, ...S.expenses.map(e => e.category)])];
  $('#view').innerHTML = `<div class="card">
    <div class="toolbar" style="margin-bottom:12px">
      <input class="grow" type="search" placeholder="Search title, notes…" data-filter="ef" data-k="q" value="${esc(ef.q)}">
      <select class="sel" data-filter="ef" data-k="cat"><option value="">All categories</option>${opts(cats, ef.cat)}</select>
      <select class="sel" data-filter="ef" data-k="payer"><option value="">Paid by anyone</option>${founderOpts(ef.payer)}</select>
      <select class="sel" data-filter="ef" data-k="phase"><option value="">All phases</option>${phaseOpts(ef.phase)}</select>
      <select class="sel" data-filter="ef" data-k="month"><option value="">All months</option>${opts(months, ef.month, m => m, monthLabel)}</select>
      <select class="sel" data-filter="ef" data-k="split"><option value="">Any split</option><option value="equal" ${ef.split === 'equal' ? 'selected' : ''}>Equal</option><option value="custom" ${ef.split === 'custom' ? 'selected' : ''}>Custom %</option><option value="owned" ${ef.split === 'owned' ? 'selected' : ''}>Owned</option></select>
    </div><div id="exp-table"></div></div>`;
  drawExpTable();
}
function filteredExpenses() {
  const q = ef.q.toLowerCase();
  return S.expenses.filter(e => (!q || (e.title + ' ' + (e.notes || '') + ' ' + e.category).toLowerCase().includes(q))
    && (!ef.cat || e.category === ef.cat) && (!ef.payer || e.paidBy === ef.payer) && (!ef.phase || e.phaseId === ef.phase)
    && (!ef.month || ym(e.date) === ef.month) && (!ef.split || e.split?.type === ef.split))
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);
}
function drawExpTable() {
  const el = $('#exp-table'); if (!el) return;
  const list = filteredExpenses();
  if (!list.length) { el.innerHTML = `<div class="empty">${S.expenses.length ? 'No expenses match these filters.' : 'No expenses yet. Add your first one!'}</div>`; return; }
  el.innerHTML = `<div class="tbl-wrap"><table><thead><tr><th>Date</th><th>Expense</th><th>Category</th><th>Paid by</th><th>Split</th><th>Phase</th><th class="num">Amount</th><th></th></tr></thead><tbody>
    ${list.map(e => `<tr>
      <td>${fmtDate(e.date)}</td>
      <td><b>${esc(e.title)}</b>${e.notes ? `<span class="sub">${esc(e.notes.slice(0, 70))}</span>` : ''}${e.link ? `<span class="sub"><a href="${esc(e.link)}" target="_blank" rel="noopener noreferrer">bill ↗</a></span>` : ''}</td>
      <td>${esc(e.category)}</td><td>${chip(e.paidBy)}</td><td>${splitLabel(e)}</td>
      <td>${e.phaseId ? esc(phaseName(e.phaseId)) : '<span class="sub">—</span>'}</td>
      <td class="num"><b>${fmt(e.amount)}</b></td>
      <td><div class="row-actions"><button class="icon-btn" data-act="exp-edit" data-id="${e.id}" title="Edit" aria-label="Edit">${ico('edit')}</button><button class="icon-btn bad" data-act="exp-del" data-id="${e.id}" title="Delete" aria-label="Delete">${ico('trash')}</button></div></td></tr>`).join('')}
    </tbody><tfoot><tr><td colspan="6">${list.length} expense${list.length > 1 ? 's' : ''}</td><td class="num">${fmt(sum(list.map(e => e.amount)))}</td><td></td></tr></tfoot></table></div>`;
}
function expModal(id) {
  const e = id ? S.expenses.find(x => x.id === id) : null;
  const sp = e ? JSON.parse(JSON.stringify(e.split)) : { type: 'equal', ids: F().map(f => f.id), pct: {}, owner: cu() };
  sp.pct = sp.pct || {}; sp.ids = sp.ids || F().map(f => f.id); sp.owner = sp.owner || cu();
  F().forEach((f, i) => { if (sp.pct[f.id] === undefined) sp.pct[f.id] = i < F().length - 1 ? +(100 / F().length).toFixed(2) : +(100 - +(100 / F().length).toFixed(2) * (F().length - 1)).toFixed(2); });
  const cats = [...new Set([...S.settings.categories, ...(e ? [e.category] : [])])];
  const body = `<div class="grid2">
    <label class="field span2">Title<input name="title" required placeholder="e.g. AWS bill, domain, Figma seats" value="${esc(e?.title)}"></label>
    <label class="field">Amount (${esc(S.settings.currency)})<input type="number" name="amount" step="0.01" min="0.01" required value="${e?.amount ?? ''}"></label>
    <label class="field">Date<input type="date" name="date" required value="${e?.date || today()}"></label>
    <label class="field">Category<select name="category">${opts(cats, e?.category)}</select></label>
    <label class="field">Paid by<select name="paidBy">${founderOpts(e?.paidBy || cu())}</select></label>
    <label class="field">Phase (optional)<select name="phaseId">${phaseOpts(e?.phaseId, '— None —')}</select></label>
    <label class="field">Bill / invoice link<input type="url" name="link" placeholder="https://…" value="${esc(e?.link)}"></label>
    <div class="field span2"><span>Who owns this expense?</span>
      <div class="seg">
        <label><input type="radio" name="stype" value="equal" ${sp.type === 'equal' ? 'checked' : ''}> Split equally</label>
        <label><input type="radio" name="stype" value="custom" ${sp.type === 'custom' ? 'checked' : ''}> Custom %</label>
        <label><input type="radio" name="stype" value="owned" ${sp.type === 'owned' ? 'checked' : ''}> Owned by one</label>
      </div><div id="split-area"></div></div>
    <label class="field span2">Notes<textarea name="notes" rows="2">${esc(e?.notes)}</textarea></label></div>`;
  modal({
    title: e ? 'Edit expense' : 'Add expense', body, submit: e ? 'Save changes' : 'Add expense',
    extra: e ? `<button type="button" class="btn danger" data-act="exp-del" data-id="${e.id}">Delete</button>` : '',
    onOpen(form) {
      const area = $('#split-area', form);
      const hint = () => {
        const amt = parseFloat(form.amount.value) || 0, h = $('.hint', area); if (!h) return;
        if (sp.type === 'equal') h.textContent = sp.ids.length ? `Each of ${sp.ids.length} pays ${fmt(amt / sp.ids.length)}` : 'Select at least one founder';
        else if (sp.type === 'custom') { const t = sum(F().map(f => +sp.pct[f.id] || 0)); h.innerHTML = `Total: <b class="${Math.abs(t - 100) < 0.05 ? 'pos' : 'neg'}">${+t.toFixed(2)}%</b> (must be 100%)`; }
        else h.textContent = `${fname(sp.owner)} owns the full ${fmt(amt)}${form.paidBy.value !== sp.owner ? ` — ${fname(form.paidBy.value)} paid, so ${fname(sp.owner)} will owe them.` : ' (personal / no one owes anyone).'}`;
      };
      const draw = () => {
        if (sp.type === 'equal') area.innerHTML = `<div class="checks">${F().map(f => `<label class="check"><input type="checkbox" data-sid="${f.id}" ${sp.ids.includes(f.id) ? 'checked' : ''}>${chip(f.id)}</label>`).join('')}</div><p class="hint"></p>`;
        else if (sp.type === 'custom') area.innerHTML = F().map(f => `<div class="pctrow">${chip(f.id)}<input type="number" step="0.01" min="0" max="100" data-pid="${f.id}" value="${sp.pct[f.id]}"><span>%</span></div>`).join('') + '<p class="hint"></p>';
        else area.innerHTML = `<select data-owner>${founderOpts(sp.owner)}</select><p class="hint"></p>`;
        hint();
      };
      form.addEventListener('input', ev => {
        const t = ev.target;
        if (t.name === 'stype') { sp.type = t.value; draw(); return; }
        if (t.dataset.sid) sp.ids = $$('[data-sid]:checked', form).map(c => c.dataset.sid);
        if (t.dataset.pid) sp.pct[t.dataset.pid] = parseFloat(t.value) || 0;
        if (t.matches('[data-owner]')) sp.owner = t.value;
        hint();
      });
      draw();
    },
    onSubmit(fd) {
      if (sp.type === 'equal' && !sp.ids.length) { toast('Select at least one founder'); return false; }
      if (sp.type === 'custom' && Math.abs(sum(F().map(f => +sp.pct[f.id] || 0)) - 100) > 0.05) { toast('Percentages must add up to 100%'); return false; }
      const data = {
        title: fd.get('title').trim(), amount: parseFloat(fd.get('amount')), date: fd.get('date'), category: fd.get('category'),
        paidBy: fd.get('paidBy'), phaseId: fd.get('phaseId'), link: fd.get('link').trim(), notes: fd.get('notes').trim(),
        split: { type: sp.type, ids: [...sp.ids], pct: { ...sp.pct }, owner: sp.owner },
      };
      if (e) Object.assign(e, data, { updatedBy: cu(), updatedAt: Date.now() });
      else S.expenses.push({ id: uid(), ...data, createdBy: cu(), createdAt: Date.now() });
      commit(`${e ? 'updated' : 'added'} expense “${data.title}” (${fmt(data.amount)}, paid by ${fname(data.paidBy)})`, 'expense');
    },
  });
}
function delExpense(id) {
  const e = S.expenses.find(x => x.id === id); if (!e) return;
  confirmBox(`Delete expense <b>${esc(e.title)}</b> (${fmt(e.amount)})? This changes everyone's balance.`, 'Delete', () => {
    S.expenses = S.expenses.filter(x => x.id !== id); commit(`deleted expense “${e.title}” (${fmt(e.amount)})`, 'expense');
  });
}
function exportCSV() {
  const q = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const head = ['Date', 'Title', 'Category', 'Amount', 'Paid by', 'Split type', ...F().map(f => 'Share: ' + f.name), 'Phase', 'Notes', 'Link', 'Added by'];
  const rows = filteredExpenses().map(e => { const sh = sharesOf(e); return [e.date, e.title, e.category, e.amount, fname(e.paidBy), e.split?.type, ...F().map(f => (sh[f.id] || 0).toFixed(2)), e.phaseId ? phaseName(e.phaseId) : '', e.notes, e.link, fname(e.createdBy)].map(q).join(','); });
  download(`expenses-${today()}.csv`, [head.map(q).join(','), ...rows].join('\n'), 'text/csv');
}

/* ---------- balances ---------- */
function pgBalances() {
  setActions(`<button class="btn primary" data-act="set-add">${ico('plus')} Record settlement</button>`);
  const { paid, owed, net, owned } = balances(), sug = suggestions(net);
  const cats = [...new Set(S.expenses.map(e => e.category))];
  const catShare = {}; cats.forEach(c => { catShare[c] = {}; F().forEach(f => catShare[c][f.id] = 0); });
  S.expenses.forEach(e => { const sh = sharesOf(e); Object.keys(sh).forEach(id => catShare[e.category][id] = (catShare[e.category][id] || 0) + sh[id]); });
  $('#view').innerHTML = `
  <div class="grid g3">${F().map(f => { const n = net[f.id] || 0; return `<div class="card bal-card">
    <div class="name">${chip(f.id)}</div>
    <dl><dt>Paid out of pocket</dt><dd>${fmt(paid[f.id])}</dd><dt>Their share of costs</dt><dd>${fmt(owed[f.id])}</dd><dt>Owned expenses</dt><dd>${fmt(owned[f.id])}</dd></dl>
    <div class="net ${n >= 0.5 ? 'pos' : n <= -0.5 ? 'neg' : ''}">${n >= 0.5 ? 'Gets back ' + fmt(n) : n <= -0.5 ? 'Owes ' + fmt(-n) : 'Settled up'}</div></div>`; }).join('')}</div>
  <div class="grid g2">
    <div class="card"><h3>Suggested settlements</h3>${sug.length ? sug.map(s => `<div class="list-row" style="cursor:default"><div class="grow">${chip(s.from)} <span class="sub" style="display:inline">pays</span> ${chip(s.to)}</div><b>${fmt(s.amount)}</b>
      <button class="btn sm" data-act="set-add" data-from="${s.from}" data-to="${s.to}" data-amount="${s.amount}">Record</button></div>`).join('') : '<div class="empty">Everyone is settled up 🎉</div>'}</div>
    <div class="card"><h3>Settlement history</h3>${S.settlements.length ? [...S.settlements].sort((a, b) => b.date.localeCompare(a.date)).map(s => `<div class="list-row" style="cursor:default"><div class="grow">${chip(s.from)} → ${chip(s.to)}<div class="sub">${fmtDate(s.date)}${s.note ? ' · ' + esc(s.note) : ''} · logged by ${esc(fname(s.by))}</div></div><b>${fmt(s.amount)}</b>
      <button class="icon-btn bad" data-act="set-del" data-id="${s.id}" aria-label="Delete">${ico('trash')}</button></div>`).join('') : '<div class="empty">No settlements recorded yet</div>'}</div>
  </div>
  <div class="card"><h3>Who bears what — share of cost by category</h3>${cats.length ? `<div class="tbl-wrap"><table><thead><tr><th>Category</th>${F().map(f => `<th class="num">${esc(f.name)}</th>`).join('')}<th class="num">Total</th></tr></thead><tbody>
    ${cats.map(c => `<tr><td>${esc(c)}</td>${F().map(f => `<td class="num">${fmt(catShare[c][f.id])}</td>`).join('')}<td class="num"><b>${fmt(sum(Object.values(catShare[c])))}</b></td></tr>`).join('')}</tbody>
    <tfoot><tr><td>Total</td>${F().map(f => `<td class="num">${fmt(owed[f.id])}</td>`).join('')}<td class="num">${fmt(sum(Object.values(owed)))}</td></tr></tfoot></table></div>` : '<div class="empty">Add expenses to see the breakdown</div>'}</div>`;
}
function setModal(pre = {}) {
  const ids = F().map(f => f.id);
  modal({
    title: 'Record settlement', submit: 'Record',
    body: `<p class="hint" style="margin:0 0 12px">Use this when one founder pays money back to another outside the app.</p><div class="grid2">
      <label class="field">From (pays)<select name="from">${founderOpts(pre.from || ids[1] || ids[0])}</select></label>
      <label class="field">To (receives)<select name="to">${founderOpts(pre.to || ids[0])}</select></label>
      <label class="field">Amount<input type="number" name="amount" step="0.01" min="0.01" required value="${pre.amount || ''}"></label>
      <label class="field">Date<input type="date" name="date" required value="${today()}"></label>
      <label class="field span2">Note<input name="note" placeholder="UPI ref, bank transfer…"></label></div>`,
    onSubmit(fd) {
      if (fd.get('from') === fd.get('to')) { toast('Pick two different people'); return false; }
      const s = { id: uid(), from: fd.get('from'), to: fd.get('to'), amount: parseFloat(fd.get('amount')), date: fd.get('date'), note: fd.get('note').trim(), by: cu() };
      S.settlements.push(s); commit(`recorded settlement: ${fname(s.from)} paid ${fname(s.to)} ${fmt(s.amount)}`, 'balance');
    },
  });
}

/* ---------- phases ---------- */
const pf = { who: '' };
function pgPhases() {
  setActions(`<select class="sel" data-filter="pwho" aria-label="Filter by assignee"><option value="">Everyone's items</option>${founderOpts(pf.who)}</select><button class="btn primary" data-act="ph-add">${ico('plus')} Add phase</button>`);
  const P = [...S.phases].sort((a, b) => a.order - b.order);
  if (!P.length) { $('#view').innerHTML = `<div class="card empty"><h3>No phases yet</h3><p>Break your startup journey into phases (e.g. Idea → MVP → Launch) and track what belongs in each.</p><button class="btn primary" data-act="ph-add">${ico('plus')} Create first phase</button></div>`; return; }
  $('#view').innerHTML = `<p class="hint" style="margin:0">Drag cards between phases to move them, or open a card to edit, comment and see its full history.</p>
    <div class="board">${P.map((p, idx) => {
    const all = S.items.filter(i => i.phaseId === p.id), items = all.filter(i => !pf.who || assigneesOf(i).includes(pf.who));
    const done = all.filter(i => i.status === 'done').length, spend = sum(S.expenses.filter(e => e.phaseId === p.id).map(e => e.amount));
    const over = p.budget && spend > p.budget;
    return `<section class="col" data-drop="item" data-id="${p.id}">
      <header><div class="grow"><h3>${esc(p.name)}</h3><small><span class="badge ${p.status === 'Active' ? 'brand' : p.status === 'Completed' ? 'good' : p.status === 'On hold' ? 'warn' : ''}">${esc(p.status)}</span>${p.start || p.end ? `<div style="margin-top:4px">${fmtDate(p.start)} → ${fmtDate(p.end)}</div>` : ''}</small></div>
      <div class="tools">${idx > 0 ? `<button class="icon-btn" data-act="ph-left" data-id="${p.id}" title="Move phase left" aria-label="Move left">${ico('left', 16)}</button>` : ''}${idx < P.length - 1 ? `<button class="icon-btn" data-act="ph-right" data-id="${p.id}" title="Move phase right" aria-label="Move right">${ico('right', 16)}</button>` : ''}
      <button class="icon-btn" data-act="ph-edit" data-id="${p.id}" title="Edit phase" aria-label="Edit phase">${ico('edit', 16)}</button><button class="icon-btn bad" data-act="ph-del" data-id="${p.id}" title="Delete phase" aria-label="Delete phase">${ico('trash', 16)}</button></div></header>
      ${p.description ? `<div class="hint" style="margin:0">${esc(p.description)}</div>` : ''}
      <div class="meta"><div style="display:flex;justify-content:space-between"><span>${done}/${all.length} done</span><span>Spend ${fmtShort(spend)}${p.budget ? ' / ' + fmtShort(p.budget) : ''}</span></div>
        <div class="bar"><i style="width:${pct(done, all.length)}%"></i></div>${p.budget ? `<div class="bar ${over ? 'over' : ''}"><i style="width:${Math.min(100, pct(spend, p.budget))}%;${over ? '' : 'background:var(--brand)'}"></i></div>` : ''}</div>
      <div class="cards">${cardsHTML(items)}</div>
      <button class="btn ghost block" data-act="item-add" data-phase="${p.id}">${ico('plus', 16)} Add item</button></section>`;
  }).join('')}</div>`;
}
/* An item can have several assignees (older items stored a single `assignee`). */
const assigneesOf = i => i.assignees || (i.assignee ? [i.assignee] : []);
const assigneeNames = i => assigneesOf(i).map(fname).join(', ') || 'Unassigned';
function avatars(ids) {
  if (ids.length < 2) return ids.length ? chip(ids[0]) : '';
  return `<span class="chip" style="gap:3px" title="${esc(ids.map(fname).join(', '))}">${ids.map(id => { const f = fById(id); return f ? `<i style="background:${esc(f.color)}">${esc(f.name[0] || '?').toUpperCase()}</i>` : ''; }).join('')}</span>`;
}
/* Open work first, nearest deadline on top (no date last); done and blocked sink below a divider and are dimmed. */
const itemOrder = (a, b) => (a.due || '9999').localeCompare(b.due || '9999') || b.priority - a.priority || (a.createdAt || 0) - (b.createdAt || 0);
const isInactive = i => i.status === 'done' || i.status === 'blocked';
function cardsHTML(items) {
  const open = items.filter(i => !isInactive(i)).sort(itemOrder), off = items.filter(isInactive).sort(itemOrder);
  return open.map(itemCard).join('') + (off.length ? `<div class="divider">Done &amp; blocked · ${off.length}</div>` + off.map(itemCard).join('') : '');
}
function itemCard(i) {
  const overdue = i.due && i.due < today() && i.status !== 'done';
  return `<article class="tile ${isInactive(i) ? 'inactive' : ''}" draggable="true" data-drag="item" data-id="${i.id}" data-act="item-open">
    <div class="t">${esc(i.title)}</div>
    <div class="row"><select class="badge st ${STATUS_TONE[i.status]}" data-filter="itemstatus" data-id="${i.id}" aria-label="Status of ${esc(i.title)}" title="Change status">${Object.entries(ITEM_STATUS).map(([k, v]) => `<option value="${k}" ${k === i.status ? 'selected' : ''}>${v}</option>`).join('')}</select><span class="badge ${PRIORITY_TONE[i.priority]}">${PRIORITY[i.priority]}</span>
      ${i.due ? `<span class="${overdue ? 'neg' : ''}">${ico('clock', 13)} ${fmtDate(i.due)}</span>` : ''}${i.thread?.length ? `<span>${ico('msg', 13)} ${i.thread.filter(m => m.kind === 'comment').length}</span>` : ''}
      <span class="sp">${avatars(assigneesOf(i))}</span></div></article>`;
}
function phaseModal(id) {
  const p = id ? S.phases.find(x => x.id === id) : null;
  modal({
    title: p ? 'Edit phase' : 'Add phase', submit: p ? 'Save changes' : 'Add phase',
    body: `<div class="grid2">
      <label class="field span2">Phase name<input name="name" required placeholder="e.g. Phase 1 · MVP build" value="${esc(p?.name)}"></label>
      <label class="field span2">Goal / what belongs here<textarea name="description" rows="2">${esc(p?.description)}</textarea></label>
      <label class="field">Start<input type="date" name="start" value="${p?.start || ''}"></label>
      <label class="field">Target end<input type="date" name="end" value="${p?.end || ''}"></label>
      <label class="field">Status<select name="status">${opts(PHASE_STATUS, p?.status || 'Planned')}</select></label>
      <label class="field">Budget (${esc(S.settings.currency)}, optional)<input type="number" name="budget" min="0" step="0.01" value="${p?.budget || ''}"></label></div>`,
    onSubmit(fd) {
      const data = { name: fd.get('name').trim(), description: fd.get('description').trim(), start: fd.get('start'), end: fd.get('end'), status: fd.get('status'), budget: parseFloat(fd.get('budget')) || 0 };
      if (p) Object.assign(p, data); else S.phases.push({ id: uid(), order: Math.max(0, ...S.phases.map(x => x.order)) + 1, ...data });
      commit(`${p ? 'updated' : 'created'} phase “${data.name}”`, 'phase');
    },
  });
}
function delPhase(id) {
  const p = S.phases.find(x => x.id === id); if (!p) return;
  const n = S.items.filter(i => i.phaseId === id).length, others = S.phases.filter(x => x.id !== id);
  modal({
    title: 'Delete phase', submit: 'Delete phase', small: true,
    body: `<p>Delete <b>${esc(p.name)}</b>?</p>${n ? `<label class="field" style="margin-top:12px">What should happen to its ${n} item${n > 1 ? 's' : ''}?<select name="dest">${others.map(o => `<option value="${o.id}">Move to “${esc(o.name)}”</option>`).join('')}<option value="__del">Delete the items too</option></select></label>` : ''}
      ${S.expenses.some(e => e.phaseId === id) ? '<p class="hint">Expenses tagged to this phase will become “No phase”.</p>' : ''}`,
    onSubmit(fd) {
      const dest = fd.get('dest');
      if (n && !dest) { toast('Create another phase first, or delete the items'); return false; }
      if (n) {
        if (dest === '__del') S.items = S.items.filter(i => i.phaseId !== id);
        else S.items.filter(i => i.phaseId === id).forEach(i => { i.thread.push({ id: uid(), at: Date.now(), by: cu(), kind: 'move', text: `Moved from “${p.name}” to “${phaseName(dest)}” (phase deleted)` }); i.phaseId = dest; });
      }
      S.expenses.forEach(e => { if (e.phaseId === id) e.phaseId = ''; });
      S.phases = S.phases.filter(x => x.id !== id);
      commit(`deleted phase “${p.name}”${n ? (dest === '__del' ? ` and its ${n} items` : ` and moved ${n} items to “${phaseName(dest)}”`) : ''}`, 'phase');
    },
  });
}
function shiftPhase(id, dir) {
  const P = [...S.phases].sort((a, b) => a.order - b.order), i = P.findIndex(p => p.id === id), j = i + dir;
  if (j < 0 || j >= P.length) return;
  [P[i].order, P[j].order] = [P[j].order, P[i].order];
  commit(`reordered phase “${P[i].name}”`, 'phase');
}
function moveItem(i, toId, remark) {
  const from = phaseName(i.phaseId), to = phaseName(toId);
  i.phaseId = toId;
  i.thread.push({ id: uid(), at: Date.now(), by: cu(), kind: 'move', text: `Moved from “${from}” to “${to}”`, remark });
  commit(`moved “${i.title}” from ${from} to ${to}${remark ? ` — “${remark}”` : ''}`, 'item');
}
function askMoveItem(id, toId) {
  const i = S.items.find(x => x.id === id); if (!i || i.phaseId === toId) return;
  askRemark('Move item', `Move <b>${esc(i.title)}</b> from <b>${esc(phaseName(i.phaseId))}</b> to <b>${esc(phaseName(toId))}</b>?`, r => moveItem(i, toId, r));
}
function itemModal(id, phaseId) {
  const it = id ? S.items.find(x => x.id === id) : null;
  if (!it && !S.phases.length) { toast('Create a phase first'); return; }
  const body = `<div class="grid2">
    <label class="field span2">Title<input name="title" required placeholder="What needs to happen?" value="${esc(it?.title)}"></label>
    <label class="field span2">Details<textarea name="desc" rows="3">${esc(it?.desc)}</textarea></label>
    <label class="field">Phase<select name="phaseId">${phaseOpts(it?.phaseId || phaseId || S.phases[0].id)}</select></label>
    <label class="field">Status<select name="status">${Object.entries(ITEM_STATUS).map(([k, v]) => `<option value="${k}" ${k === (it?.status || 'todo') ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
    <label class="field">Priority<select name="priority">${PRIORITY.map((p, k) => `<option value="${k}" ${k === (it?.priority ?? 1) ? 'selected' : ''}>${p}</option>`).join('')}</select></label>
    <label class="field">Due date<input type="date" name="due" value="${it?.due || ''}"></label>
    <div class="field span2"><span>Assignees (pick one or more)</span><div class="checks">${F().map(f => `<label class="check"><input type="checkbox" name="assignees" value="${f.id}" ${it && assigneesOf(it).includes(f.id) ? 'checked' : ''}>${chip(f.id)}</label>`).join('')}</div></div>
    <label class="field span2">Remark for this change (optional)<input name="remark" placeholder="Shown in history"></label></div>
    ${it ? `<div class="sect"><h4>Comments &amp; history</h4>
      <div class="addrow"><input id="cm" placeholder="Write a comment or remark… (Enter to post)"><button type="button" class="btn" id="cm-add">Post</button></div>
      <div class="thread" id="thread">${threadHTML(it.thread)}</div></div>` : ''}`;
  modal({
    title: it ? 'Item details' : 'Add item', body, submit: it ? 'Save changes' : 'Add item',
    extra: it ? `<button type="button" class="btn danger" data-act="item-del" data-id="${it.id}">Delete</button>` : '',
    onOpen(form) {
      if (!it) return;
      const inp = $('#cm', form);
      const post = () => {
        const v = inp.value.trim(); if (!v) return;
        it.thread.push({ id: uid(), at: Date.now(), by: cu(), kind: 'comment', text: v });
        log(`commented on “${it.title}”: ${v}`, 'item'); save(); inp.value = ''; $('#thread', form).innerHTML = threadHTML(it.thread);
      };
      $('#cm-add', form).onclick = post;
      inp.addEventListener('keydown', ev => { if (ev.key === 'Enter') { ev.preventDefault(); post(); } });
    },
    onSubmit(fd) {
      const data = { title: fd.get('title').trim(), desc: fd.get('desc').trim(), phaseId: fd.get('phaseId'), status: fd.get('status'), assignees: fd.getAll('assignees'), priority: +fd.get('priority'), due: fd.get('due') };
      const remark = fd.get('remark').trim();
      if (!it) {
        S.items.push({ id: uid(), ...data, createdBy: cu(), createdAt: Date.now(), thread: [{ id: uid(), at: Date.now(), by: cu(), kind: 'change', text: `Created in “${phaseName(data.phaseId)}”`, remark }] });
        return commit(`added item “${data.title}” to ${phaseName(data.phaseId)}`, 'item');
      }
      const ch = [];
      if (it.phaseId !== data.phaseId) ch.push(`Moved from “${phaseName(it.phaseId)}” to “${phaseName(data.phaseId)}”`);
      if (it.status !== data.status) ch.push(`Status ${ITEM_STATUS[it.status]} → ${ITEM_STATUS[data.status]}`);
      if (assigneesOf(it).slice().sort().join() !== data.assignees.slice().sort().join()) ch.push(`Assignees ${assigneeNames(it)} → ${data.assignees.length ? data.assignees.map(fname).join(', ') : 'Unassigned'}`);
      if (it.priority !== data.priority) ch.push(`Priority ${PRIORITY[it.priority]} → ${PRIORITY[data.priority]}`);
      if (it.due !== data.due) ch.push(`Due ${fmtDate(it.due)} → ${fmtDate(data.due)}`);
      if (it.title !== data.title) ch.push(`Renamed from “${it.title}”`);
      const moved = it.phaseId !== data.phaseId, old = it.title;
      Object.assign(it, data); delete it.assignee;
      if (ch.length || remark) it.thread.push({ id: uid(), at: Date.now(), by: cu(), kind: moved ? 'move' : 'change', text: ch.join(' · ') || 'Remark added', remark });
      commit(ch.length ? `${moved ? 'moved' : 'updated'} “${old}”: ${ch.join(', ')}${remark ? ` — “${remark}”` : ''}` : '', 'item');
    },
  });
}
function delItem(id) {
  const it = S.items.find(x => x.id === id); if (!it) return;
  confirmBox(`Delete item <b>${esc(it.title)}</b> and its comments?`, 'Delete', () => { S.items = S.items.filter(x => x.id !== id); commit(`deleted item “${it.title}”`, 'item'); });
}

function setItemStatus(id, status) {
  const i = S.items.find(x => x.id === id); if (!i || i.status === status) return;
  const apply = remark => {
    const from = i.status; i.status = status;
    i.thread.push({ id: uid(), at: Date.now(), by: cu(), kind: 'change', text: `Status ${ITEM_STATUS[from]} → ${ITEM_STATUS[status]}`, remark });
    commit(`changed “${i.title}” from ${ITEM_STATUS[from]} to ${ITEM_STATUS[status]}${remark ? ` — “${remark}”` : ''}`, 'item');
  };
  if (status === 'blocked') askRemark('Mark as blocked', `What is blocking <b>${esc(i.title)}</b>?`, apply);
  else apply('');
}

/* ---------- leads ---------- */
const lf = { q: '', owner: '', view: 'board' };
function pgLeads() {
  setActions(`<div class="seg" style="flex-wrap:nowrap"><label style="min-width:0"><input type="radio" name="lv" value="board" data-filter="lview" ${lf.view === 'board' ? 'checked' : ''}> Board</label><label style="min-width:0"><input type="radio" name="lv" value="table" data-filter="lview" ${lf.view === 'table' ? 'checked' : ''}> Table</label></div>
    <button class="btn primary" data-act="lead-add">${ico('plus')} Add lead</button>`);
  const won = S.leads.filter(l => l.stage === 'Won'), open = S.leads.filter(isOpenLead), due = open.filter(l => l.next && l.next <= today());
  $('#view').innerHTML = `<div class="grid kpis">
      <div class="card kpi"><div class="k">Total leads</div><div class="v">${S.leads.length}</div><div class="s">${open.length} active</div></div>
      <div class="card kpi"><div class="k">Open pipeline</div><div class="v">${fmt(sum(open.map(l => +l.value || 0)))}</div><div class="s">expected value</div></div>
      <div class="card kpi"><div class="k">Won</div><div class="v pos">${fmt(sum(won.map(l => +l.value || 0)))}</div><div class="s">${won.length} deals · ${pct(won.length, S.leads.filter(l => !isOpenLead(l)).length)}% win rate</div></div>
      <div class="card kpi"><div class="k">Follow-ups due</div><div class="v ${due.length ? 'neg' : ''}">${due.length}</div><div class="s">today or overdue</div></div></div>
    <div class="toolbar"><input class="grow" type="search" placeholder="Search name, company, notes…" data-filter="lf" data-k="q" value="${esc(lf.q)}">
      <select class="sel" data-filter="lf" data-k="owner"><option value="">Any owner</option>${founderOpts(lf.owner)}</select></div>
    <div id="lead-body"></div>`;
  drawLeads();
}
function drawLeads() {
  const el = $('#lead-body'); if (!el) return;
  const q = lf.q.toLowerCase();
  const list = S.leads.filter(l => (!q || [l.name, l.company, l.about, l.email, ...(l.thread || []).map(m => m.text)].join(' ').toLowerCase().includes(q)) && (!lf.owner || l.owner === lf.owner));
  if (!S.leads.length) { el.innerHTML = `<div class="card empty"><h3>No leads yet</h3><p>Track potential customers, investors and partners — with notes and follow-up dates.</p><button class="btn primary" data-act="lead-add">${ico('plus')} Add first lead</button></div>`; return; }
  if (lf.view === 'table') {
    el.innerHTML = `<div class="card"><div class="tbl-wrap"><table><thead><tr><th>Lead</th><th>Stage</th><th class="num">Value</th><th>Owner</th><th>Follow-up</th><th>Source</th></tr></thead><tbody>
      ${list.map(l => `<tr style="cursor:pointer" data-act="lead-open" data-id="${l.id}"><td><b>${esc(l.name)}</b><span class="sub">${esc(l.company)}</span></td><td><span class="badge ${STAGE_TONE[l.stage]}">${l.stage}</span></td><td class="num">${fmt(l.value)}</td><td>${chip(l.owner)}</td>
      <td class="${l.next && l.next < today() && isOpenLead(l) ? 'neg' : ''}">${fmtDate(l.next)}</td><td>${esc(l.source)}</td></tr>`).join('') || '<tr><td colspan="6" class="empty">No leads match</td></tr>'}</tbody></table></div></div>`;
    return;
  }
  el.innerHTML = `<div class="board">${STAGES.map(st => {
    const cards = list.filter(l => l.stage === st);
    return `<section class="col narrow" data-drop="lead" data-id="${st}"><header><div class="grow"><h3>${st} <span class="badge ${STAGE_TONE[st]}">${cards.length}</span></h3><small>${fmt(sum(cards.map(l => +l.value || 0)))}</small></div></header>
      <div class="cards">${cards.map(l => `<article class="tile" draggable="true" data-drag="lead" data-id="${l.id}" data-act="lead-open">
        <div class="t">${esc(l.name)}</div>${l.company ? `<div class="row">${esc(l.company)}</div>` : ''}
        <div class="row"><b style="color:var(--ink)">${fmt(l.value)}</b>${l.next ? `<span class="${l.next < today() && isOpenLead(l) ? 'neg' : ''}">${ico('clock', 13)} ${fmtDate(l.next)}</span>` : ''}<span class="sp">${chip(l.owner)}</span></div></article>`).join('')}</div></section>`;
  }).join('')}</div>`;
}
function leadModal(id) {
  const l = id ? S.leads.find(x => x.id === id) : null;
  modal({
    title: l ? 'Lead details' : 'Add lead', submit: l ? 'Save changes' : 'Add lead',
    extra: l ? `<button type="button" class="btn danger" data-act="lead-del" data-id="${l.id}">Delete</button>` : '',
    body: `<div class="grid2">
      <label class="field">Contact name<input name="name" required value="${esc(l?.name)}"></label>
      <label class="field">Company<input name="company" value="${esc(l?.company)}"></label>
      <label class="field">Email<input type="email" name="email" value="${esc(l?.email)}"></label>
      <label class="field">Phone<input name="phone" value="${esc(l?.phone)}"></label>
      <label class="field">Stage<select name="stage">${opts(STAGES, l?.stage || 'New')}</select></label>
      <label class="field">Expected value (${esc(S.settings.currency)})<input type="number" name="value" min="0" step="0.01" value="${l?.value || ''}"></label>
      <label class="field">Source<select name="source">${opts(SOURCES, l?.source)}</select></label>
      <label class="field">Owner (who handles it)<select name="owner">${founderOpts(l?.owner || cu())}</select></label>
      <label class="field">Next follow-up<input type="date" name="next" value="${l?.next || ''}"></label>
      <label class="field">Remark for this change (optional)<input name="remark" placeholder="e.g. lost — chose competitor"></label>
      <label class="field span2">What do they need?<textarea name="about" rows="2">${esc(l?.about)}</textarea></label></div>
      ${l ? `<div class="sect"><h4>Notes &amp; timeline</h4><div class="addrow"><input id="cm" placeholder="Add a note — call summary, objection, next step… (Enter to post)"><button type="button" class="btn" id="cm-add">Add note</button></div>
      <div class="thread" id="thread">${threadHTML(l.thread)}</div></div>` : ''}`,
    onOpen(form) {
      if (!l) return;
      const inp = $('#cm', form);
      const post = () => {
        const v = inp.value.trim(); if (!v) return;
        l.thread.push({ id: uid(), at: Date.now(), by: cu(), kind: 'note', text: v });
        log(`added a note on lead “${l.name}”: ${v}`, 'lead'); save(); inp.value = ''; $('#thread', form).innerHTML = threadHTML(l.thread);
      };
      $('#cm-add', form).onclick = post;
      inp.addEventListener('keydown', ev => { if (ev.key === 'Enter') { ev.preventDefault(); post(); } });
    },
    onSubmit(fd) {
      const data = { name: fd.get('name').trim(), company: fd.get('company').trim(), email: fd.get('email').trim(), phone: fd.get('phone').trim(), stage: fd.get('stage'),
        value: parseFloat(fd.get('value')) || 0, source: fd.get('source'), owner: fd.get('owner'), next: fd.get('next'), about: fd.get('about').trim() };
      const remark = fd.get('remark').trim();
      if (!l) {
        S.leads.push({ id: uid(), ...data, createdAt: Date.now(), createdBy: cu(), thread: [{ id: uid(), at: Date.now(), by: cu(), kind: 'change', text: `Lead created in “${data.stage}”`, remark }] });
        return commit(`added lead “${data.name}”${data.company ? ' (' + data.company + ')' : ''}`, 'lead');
      }
      const ch = [];
      if (l.stage !== data.stage) ch.push(`Stage ${l.stage} → ${data.stage}`);
      if (l.owner !== data.owner) ch.push(`Owner ${fname(l.owner)} → ${fname(data.owner)}`);
      if ((+l.value || 0) !== data.value) ch.push(`Value ${fmt(l.value)} → ${fmt(data.value)}`);
      if (l.next !== data.next) ch.push(`Follow-up ${fmtDate(l.next)} → ${fmtDate(data.next)}`);
      const stageChanged = l.stage !== data.stage; Object.assign(l, data);
      if (ch.length || remark) l.thread.push({ id: uid(), at: Date.now(), by: cu(), kind: stageChanged ? 'move' : 'change', text: ch.join(' · ') || 'Remark added', remark });
      commit(ch.length ? `updated lead “${data.name}”: ${ch.join(', ')}${remark ? ` — “${remark}”` : ''}` : '', 'lead');
    },
  });
}
function askMoveLead(id, stage) {
  const l = S.leads.find(x => x.id === id); if (!l || l.stage === stage) return;
  askRemark('Move lead', `Move <b>${esc(l.name)}</b> from <b>${l.stage}</b> to <b>${stage}</b>?`, remark => {
    const from = l.stage; l.stage = stage;
    l.thread.push({ id: uid(), at: Date.now(), by: cu(), kind: 'move', text: `Stage ${from} → ${stage}`, remark });
    commit(`moved lead “${l.name}” from ${from} to ${stage}${remark ? ` — “${remark}”` : ''}`, 'lead');
  });
}
function delLead(id) {
  const l = S.leads.find(x => x.id === id); if (!l) return;
  confirmBox(`Delete lead <b>${esc(l.name)}</b> and all its notes?`, 'Delete', () => { S.leads = S.leads.filter(x => x.id !== id); commit(`deleted lead “${l.name}”`, 'lead'); });
}

/* ---------- activity ---------- */
const af = { q: '', who: '', type: '' };
const TYPE_LABEL = { expense: 'Expense', balance: 'Settlement', phase: 'Phase', item: 'Phase item', lead: 'Lead', settings: 'Settings' };
function activityHTML(list) {
  if (!list.length) return '<div class="empty">No activity yet</div>';
  return `<div class="feed">${list.map(a => { const f = fById(a.by); return `<div class="it"><div class="dot" style="background:${esc(f?.color || '#888')}">${esc((f?.name || '?')[0]).toUpperCase()}</div>
    <div class="tx"><b>${esc(f?.name || 'Someone')}</b> ${esc(a.text)} <span class="badge">${TYPE_LABEL[a.type] || a.type}</span></div><time>${fmtTime(a.at)}</time></div>`; }).join('')}</div>`;
}
function pgActivity() {
  setActions('');
  $('#view').innerHTML = `<div class="card"><div class="toolbar" style="margin-bottom:8px"><input class="grow" type="search" placeholder="Search activity…" data-filter="af" data-k="q" value="${esc(af.q)}">
    <select class="sel" data-filter="af" data-k="who"><option value="">Everyone</option>${founderOpts(af.who)}</select>
    <select class="sel" data-filter="af" data-k="type"><option value="">All types</option>${Object.entries(TYPE_LABEL).map(([k, v]) => `<option value="${k}" ${af.type === k ? 'selected' : ''}>${v}</option>`).join('')}</select></div>
    <div id="act-list"></div></div>`;
  drawActivity();
}
function drawActivity() {
  const el = $('#act-list'); if (!el) return; const q = af.q.toLowerCase();
  el.innerHTML = activityHTML(S.activity.filter(a => (!af.who || a.by === af.who) && (!af.type || a.type === af.type) && (!q || a.text.toLowerCase().includes(q))).slice(0, 300));
}

/* ---------- settings ---------- */
function pgSettings() {
  setActions('');
  $('#view').innerHTML = `<form class="grid g2" id="settings-form" autocomplete="off">
    <div class="card"><h3>Company &amp; money</h3><div class="grid2">
      <label class="field">Company / startup name<input name="company" value="${esc(S.settings.company)}"></label>
      <label class="field">Currency<select name="currency">${opts(CURRENCIES, S.settings.currency)}</select></label></div>
      <h3 style="margin-top:18px">Founders &amp; partners</h3>
      ${F().map(f => `<div class="fset"><input type="color" name="c_${f.id}" value="${esc(f.color)}" aria-label="Colour"><input name="n_${f.id}" required value="${esc(f.name)}" aria-label="Name"></div>`).join('')}
      ${F().length < 6 ? `<button type="button" class="btn sm" data-act="f-add">${ico('plus', 14)} Add partner</button>` : ''}
      <p class="hint">Names can be edited any time; people can’t be removed so history stays accurate.</p></div>
    <div class="card"><h3>Expense categories</h3><label class="field">One per line<textarea name="cats" rows="11">${esc(S.settings.categories.join('\n'))}</textarea></label>
      <p class="hint">Existing expenses keep their category even if you remove it here.</p></div>
    <div class="span2" style="grid-column:1/-1"><button class="btn primary">Save settings</button></div></form>
  <div class="grid g2">
    <div class="card"><h3>Backup &amp; restore</h3><p class="hint" style="margin:0 0 12px">Download everything as a JSON file, or restore from one. Restoring replaces current data.</p>
      <div class="toolbar"><button class="btn" data-act="export">${ico('download')} Download backup</button><button class="btn" data-act="import">Restore from file</button></div></div>
    <div class="card"><h3>Data</h3><div class="toolbar"><button class="btn" data-act="sample">Add sample data</button><button class="btn danger" data-act="reset">Erase everything</button></div>
      <p class="hint">${remote ? 'Connected to the shared server: all founders see the same data. Choose who you are from “Acting as” on the left.' : 'Running without the shared server: data lives only in this browser. Run start.bat (node server.js) to share one data set between founders.'}</p></div></div>`;
}
function applySettings(fd) {
  S.settings.company = fd.get('company').trim() || 'My Startup';
  S.settings.currency = fd.get('currency');
  F().forEach(f => { f.name = (fd.get('n_' + f.id) || f.name).trim(); f.color = fd.get('c_' + f.id) || f.color; });
  const cats = fd.get('cats').split('\n').map(s => s.trim()).filter(Boolean);
  S.settings.categories = [...new Set(cats.length ? cats : DEFAULT_CATS)];
}

/* ---------- first-run setup ---------- */
function setupModal() {
  modal({
    title: 'Welcome — set up your team', submit: 'Get started',
    body: `<p class="hint" style="margin:0 0 12px">Takes 10 seconds. You can change all of this later in Settings.</p><div class="grid2">
      <label class="field">Startup name<input name="company" placeholder="e.g. Nest Labs"></label>
      <label class="field">Currency<select name="currency">${opts(CURRENCIES, S.settings.currency)}</select></label>
      ${F().map((f, i) => `<label class="field ${i === 2 ? 'span2' : ''}">Founder ${i + 1}<input name="n_${f.id}" required value="${esc(f.name)}"></label>`).join('')}</div>`,
    onSubmit(fd) {
      S.settings.company = fd.get('company').trim() || 'My Startup'; S.settings.currency = fd.get('currency');
      F().forEach(f => f.name = fd.get('n_' + f.id).trim() || f.name);
      commit('set up the workspace', 'settings');
    },
  });
}

/* ---------- sample data ---------- */
function loadSample() {
  const [a, b, c] = F().map(f => f.id), D = n => daysFromNow(-n);
  const p1 = uid(), p2 = uid(), p3 = uid(), p4 = uid(), o = Math.max(0, ...S.phases.map(x => x.order));
  S.phases.push(
    { id: p1, order: o + 1, name: 'Phase 1 · Idea & validation', description: 'Customer interviews, market research, incorporate.', start: D(150), end: D(90), status: 'Completed', budget: 60000 },
    { id: p2, order: o + 2, name: 'Phase 2 · MVP build', description: 'Design, build and test the first version.', start: D(90), end: daysFromNow(30), status: 'Active', budget: 250000 },
    { id: p3, order: o + 3, name: 'Phase 3 · Launch & first customers', description: 'Go-to-market, pilots, feedback loops.', start: daysFromNow(30), end: daysFromNow(100), status: 'Planned', budget: 150000 },
    { id: p4, order: o + 4, name: 'Phase 4 · Scale', description: 'Hiring, fundraising, growth.', start: daysFromNow(100), end: '', status: 'Planned', budget: 0 });
  const eq = { type: 'equal', ids: [a, b, c], pct: {}, owner: a }, own = who => ({ type: 'owned', ids: [], pct: {}, owner: who }), cus = { type: 'custom', ids: [], pct: { [a]: 50, [b]: 30, [c]: 20 }, owner: a };
  const ex = [
    [D(140), 'Company registration', 'Legal & Compliance', 18000, a, eq, p1], [D(132), 'Domain + email workspace', 'Software & Tools', 4200, b, eq, p1],
    [D(120), 'Customer interview travel', 'Travel', 6800, c, own(c), p1], [D(100), 'Logo & brand kit', 'Design & Branding', 22000, b, eq, p1],
    [D(88), 'Cloud credits top-up', 'Cloud & Hosting', 9500, a, eq, p2], [D(80), 'Figma + Notion seats', 'Software & Tools', 5400, c, eq, p2],
    [D(66), 'Developer laptop', 'Equipment', 74000, a, own(a), p2], [D(58), 'Part-time designer stipend', 'Salaries & Stipends', 30000, b, cus, p2],
    [D(45), 'AWS bill', 'Cloud & Hosting', 12800, a, eq, p2], [D(38), 'Team dinner with advisor', 'Food & Meetings', 5200, c, eq, ''],
    [D(30), 'Part-time designer stipend', 'Salaries & Stipends', 30000, b, cus, p2], [D(22), 'LinkedIn ads test', 'Marketing', 15000, c, eq, p2],
    [D(14), 'AWS bill', 'Cloud & Hosting', 14100, a, eq, p2], [D(9), 'Co-working desk (3 seats)', 'Office & Rent', 18000, b, eq, ''], [D(3), 'Stripe + payment gateway setup', 'Software & Tools', 3500, a, eq, p2],
  ];
  ex.forEach(([date, title, category, amount, paidBy, split, phaseId]) => S.expenses.push({ id: uid(), date, title, category, amount, paidBy, split, phaseId, notes: '', link: '', createdBy: paidBy, createdAt: Date.now() }));
  const th = (t) => [{ id: uid(), at: Date.now() - 864e5, by: a, kind: 'change', text: t }];
  [[p1, 'Interview 20 target customers', 'done', a, 1, D(100)], [p1, 'Incorporate the company', 'done', b, 2, D(130)], [p2, 'Design onboarding flow', 'done', b, 2, D(40)],
   [p2, 'Build core dashboard', 'doing', [a, b], 3, daysFromNow(10)], [p2, 'Payments integration', 'doing', c, 2, daysFromNow(-2)], [p2, 'Security review', 'blocked', a, 1, daysFromNow(14)],
   [p3, 'Landing page + waitlist', 'todo', c, 2, daysFromNow(35)], [p3, 'Run 3 paid pilots', 'todo', b, 3, daysFromNow(60)], [p4, 'Prepare seed fundraising deck', 'todo', a, 1, '']]
    .forEach(([phaseId, title, status, who, priority, due]) => S.items.push({ id: uid(), phaseId, title, desc: '', status, assignees: [].concat(who), priority, due, createdBy: a, createdAt: Date.now(), thread: th('Created') }));
  [['Priya Nair', 'Acme Retail', 'Pilot for the dashboard', 'Meeting', 120000, 'Referral', b, daysFromNow(2)], ['Rahul Mehta', 'Bluepeak Capital', 'Seed round intro', 'Contacted', 2500000, 'Investor intro', a, daysFromNow(-1)],
   ['Sara Khan', 'FreshCart', 'Needs inventory insights', 'Proposal', 240000, 'LinkedIn', c, daysFromNow(5)], ['Dev Patel', 'Orbit Labs', '', 'New', 60000, 'Website', c, daysFromNow(7)],
   ['Meera Iyer', 'Northwind', 'Signed 1-year pilot', 'Won', 180000, 'Event', b, ''], ['Tom Becker', 'Loopworks', 'Went with in-house build', 'Lost', 90000, 'Cold outreach', a, '']]
    .forEach(([name, company, about, stage, value, source, owner, next]) => S.leads.push({ id: uid(), name, company, about, stage, value, source, owner, next, email: '', phone: '', createdBy: owner, createdAt: Date.now(),
      thread: [{ id: uid(), at: Date.now() - 2 * 864e5, by: owner, kind: 'note', text: about || 'First conversation went well. Sharing the deck.' }] }));
  commit('loaded sample data', 'settings');
}

/* =====================================================================
   ROUTER + EVENTS
   ===================================================================== */
const ROUTES = {
  dashboard: { title: 'Dashboard', icon: 'grid', fn: pgDashboard }, expenses: { title: 'Expenses', icon: 'wallet', fn: pgExpenses },
  balances: { title: 'Balances', icon: 'repeat', fn: pgBalances }, phases: { title: 'Phases', icon: 'layers', fn: pgPhases },
  leads: { title: 'Leads', icon: 'users', fn: pgLeads }, activity: { title: 'Activity', icon: 'activity', fn: pgActivity }, settings: { title: 'Settings', icon: 'sliders', fn: pgSettings },
};
const route = () => { const r = location.hash.replace(/^#\/?/, ''); return ROUTES[r] ? r : 'dashboard'; };
function render() {
  Object.values(charts).forEach(c => c.destroy());
  const r = route();
  $('#nav').innerHTML = Object.entries(ROUTES).map(([k, v]) => `<a href="#/${k}" class="${k === r ? 'on' : ''}">${ico(v.icon)}${v.title}</a>`).join('');
  $('#page-title').textContent = ROUTES[r].title;
  $('#brand-name').textContent = S.settings.company;
  document.title = `${ROUTES[r].title} · ${S.settings.company}`;
  $('#me').innerHTML = founderOpts(cu());
  $('#theme').innerHTML = ico(document.documentElement.dataset.theme === 'dark' ? 'sun' : 'moon');
  ROUTES[r].fn();
  window.scrollTo({ top: 0 });
}

const ACTIONS = {
  'exp-add': () => expModal(), 'exp-edit': d => expModal(d.id), 'exp-del': d => delExpense(d.id), 'exp-csv': exportCSV,
  'set-add': d => setModal(d), 'set-del': d => { const s = S.settlements.find(x => x.id === d.id); confirmBox('Delete this settlement record?', 'Delete', () => { S.settlements = S.settlements.filter(x => x.id !== d.id); commit(`deleted settlement ${fname(s.from)} → ${fname(s.to)} (${fmt(s.amount)})`, 'balance'); }); },
  'ph-add': () => phaseModal(), 'ph-edit': d => phaseModal(d.id), 'ph-del': d => delPhase(d.id), 'ph-left': d => shiftPhase(d.id, -1), 'ph-right': d => shiftPhase(d.id, 1),
  'item-add': d => itemModal(null, d.phase), 'item-open': d => itemModal(d.id), 'item-del': d => delItem(d.id),
  'lead-add': () => leadModal(), 'lead-open': d => leadModal(d.id), 'lead-del': d => delLead(d.id),
  sample: () => { if (S.expenses.length || S.phases.length || S.leads.length) confirmBox('Add sample data on top of your existing data?', 'Add sample data', loadSample); else loadSample(); },
  reset: () => confirmBox('This permanently erases ALL expenses, phases, leads and activity for everyone using this workspace. Download a backup first if unsure.', 'Erase everything', () => { const s = S.settings; S = fresh(); S.settings = s; save(); render(); toast('Everything erased'); }),
  export: () => download(`founders-hub-backup-${today()}.json`, JSON.stringify(S, null, 2), 'application/json'),
  import: () => $('#imp').click(),
  'f-add': () => { applySettings(new FormData($('#settings-form'))); const n = F().length + 1; F().push({ id: 'f' + uid(), name: 'Partner ' + n, color: FOUNDER_COLORS[(n - 1) % FOUNDER_COLORS.length] }); commit('added a new partner', 'settings'); },
};
document.addEventListener('click', e => {
  if (e.target.closest('[data-close]')) { $('#modal').close(); return; }
  if (e.target.closest('a[href], select')) return;
  // a button inside a clickable row/card wins over the row itself
  const el = e.target.closest('button[data-act]') || e.target.closest('[data-act]'); if (!el) return;
  e.preventDefault(); ACTIONS[el.dataset.act]?.(el.dataset, el);
});
const FILTERS = {
  range: v => { dashRange = v; render(); }, pwho: v => { pf.who = v; render(); },
  lview: v => { lf.view = v; render(); }, itemstatus: (v, t) => setItemStatus(t.dataset.id, v),
  ef: (v, t) => { ef[t.dataset.k] = v; drawExpTable(); }, lf: (v, t) => { lf[t.dataset.k] = v; drawLeads(); }, af: (v, t) => { af[t.dataset.k] = v; drawActivity(); },
};
// filters live both in the page and in the top bar, so listen on the whole document
document.addEventListener('input', e => { const t = e.target.closest?.('[data-filter]'); if (t) FILTERS[t.dataset.filter]?.(t.value, t); });
$('#view').addEventListener('submit', e => {
  if (e.target.id !== 'settings-form') return;
  e.preventDefault(); applySettings(new FormData(e.target)); commit('updated settings', 'settings'); toast('Settings saved');
});
$('#modal').addEventListener('close', () => { if (!$('#modal').open) $('#modal').innerHTML = ''; render(); });
$('#modal').addEventListener('click', e => { if (e.target === e.currentTarget) e.currentTarget.close(); });
$('#me').addEventListener('change', e => { try { localStorage.setItem(ME_KEY, e.target.value); } catch { } toast(`Now acting as ${fname(e.target.value)}`); render(); });
$('#theme').addEventListener('click', () => {
  const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = next; try { localStorage.setItem('founders-hub-theme', next); } catch { } render();
});
$('#imp').addEventListener('change', e => {
  const f = e.target.files[0]; e.target.value = ''; if (!f) return;
  f.text().then(txt => {
    let data; try { data = JSON.parse(txt); if (!data.settings || !Array.isArray(data.expenses)) throw 0; } catch { toast('That file is not a valid backup'); return; }
    confirmBox(`Replace ALL current data with this backup (${data.expenses.length} expenses, ${(data.phases || []).length} phases, ${(data.leads || []).length} leads)?`, 'Restore', () => { S = normalize(data); log('restored a backup', 'settings'); save(); render(); toast('Backup restored'); });
  });
});

/* drag & drop between phases / lead stages */
document.addEventListener('dragstart', e => { const t = e.target.closest?.('[data-drag]'); if (!t) return; e.dataTransfer.setData('text/plain', t.dataset.drag + ':' + t.dataset.id); e.dataTransfer.effectAllowed = 'move'; t.classList.add('dragging'); });
document.addEventListener('dragend', () => $$('.dragging,.over').forEach(x => x.classList.remove('dragging', 'over')));
document.addEventListener('dragover', e => { const z = e.target.closest?.('[data-drop]'); if (z) { e.preventDefault(); z.classList.add('over'); } });
document.addEventListener('dragleave', e => { const z = e.target.closest?.('[data-drop]'); if (z && !z.contains(e.relatedTarget)) z.classList.remove('over'); });
document.addEventListener('drop', e => {
  const z = e.target.closest?.('[data-drop]'); if (!z) return; e.preventDefault(); z.classList.remove('over');
  const [kind, id] = (e.dataTransfer.getData('text/plain') || '').split(':');
  if (kind === 'item' && z.dataset.drop === 'item') askMoveItem(id, z.dataset.id);
  if (kind === 'lead' && z.dataset.drop === 'lead') askMoveLead(id, z.dataset.id);
});

window.addEventListener('hashchange', render);

/* ---------- boot ---------- */
(async function boot() {
  let theme = null; try { theme = localStorage.getItem('founders-hub-theme'); } catch { }
  document.documentElement.dataset.theme = theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  setSync('local');
  if (location.protocol.startsWith('http')) {
    try {
      const r = await api('api/state', { cache: 'no-store' });
      if (r.ok && (r.headers.get('content-type') || '').includes('json')) {
        const j = await r.json(); remote = true; rev = j.rev || 0;
        if (j.state) { S = normalize(j.state); try { localStorage.setItem(KEY, JSON.stringify(S)); } catch { } setSync('ok'); }
        else await push();
        setInterval(poll, 8000);
      }
    } catch { }
  }
  render();
  if (!S.settings.setup) { S.settings.setup = true; save(); setupModal(); }
})();
