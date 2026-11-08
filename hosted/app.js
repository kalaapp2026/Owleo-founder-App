'use strict';
/* =====================================================================
   Founders Hub — expense splitting, phases, leads & activity tracker
   ===================================================================== */

/* ---------- constants ---------- */
const KEY = 'founders-hub-v1';
const ME_KEY = 'founders-hub-me';
const AUTH_KEY = 'founders-hub-auth';
const DEFAULT_PASS_HASH = 'b1cbfc2d31e44277491ce9f22db585823b4cbcb1c4247bd0e820e87edaa4ba4d'; // salted SHA-256 of the starting team password
const DEFAULT_CATS = ['Software & Tools', 'Cloud & Hosting', 'Marketing', 'Salaries & Stipends', 'Legal & Compliance',
  'Office & Rent', 'Travel', 'Food & Meetings', 'Equipment', 'Design & Branding', 'Other'];
const PALETTE = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#8b5cf6', '#ec4899', '#84cc16', '#f97316', '#14b8a6', '#64748b'];
const FOUNDER_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#06b6d4', '#8b5cf6'];
const ITEM_STATUS = { todo: 'To do', doing: 'In progress', review: 'In review', blocked: 'Blocked', done: 'Done' };
const STATUS_TONE = { todo: '', doing: 'brand', review: 'warn', blocked: 'bad', done: 'good' };
const PRIORITY = ['Low', 'Medium', 'High', 'Critical'];
const PRIORITY_TONE = ['', 'brand', 'warn', 'bad'];
const PHASE_STATUS = ['Planned', 'Active', 'Completed', 'On hold'];
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
  pie: '<path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/>',
  bulb: '<path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.2 1 2V17h6v-.3c0-.8.4-1.5 1-2A7 7 0 0 0 12 2z"/>',
  up: '<polyline points="18 15 12 9 6 15"/>',
  copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  play: '<polygon points="5 3 19 12 5 21 5 3"/>',
  stop: '<rect x="6" y="6" width="12" height="12" rx="1"/>',
  stopwatch: '<circle cx="12" cy="14" r="8"/><path d="M12 10v4l2 2"/><path d="M9 2h6"/>',
  list: '<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>',
};
const ico = (n, s = 18) => `<svg class="ico" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n]}</svg>`;

/* ---------- state (shared live database, falls back to this browser) ---------- */
function fresh() {
  return {
    settings: {
      company: 'NEST', currency: 'INR', setup: false, categories: [...DEFAULT_CATS],
      founders: ['Vishruth', 'Prajwal', 'Nandish'].map((name, i) => ({ id: 'f' + (i + 1), name, color: FOUNDER_COLORS[i] })),
    },
    expenses: [], settlements: [], phases: [], items: [], leads: [], activity: [], plans: [], ideas: [],
  };
}
function normalize(s) {
  const d = fresh(); s = s || {};
  return { ...d, ...s, settings: { ...d.settings, ...(s.settings || {}) } };
}
let S = fresh();
let DB = null, canWrite = true, meId = null, meRef = null, meKnown = false;
try { meId = localStorage.getItem(ME_KEY); } catch { }
const COLS = ['expenses', 'settlements', 'phases', 'items', 'leads', 'activity', 'plans', 'ideas'];
const known = {}; COLS.forEach(c => known[c] = new Map());
let knownSettings = '', incoming = {}, incomingSettings = null, inflight = 0;
const chains = new Map();
const canon = o => JSON.stringify(o, (k, v) => v && typeof v === 'object' && !Array.isArray(v) ? Object.fromEntries(Object.keys(v).sort().map(x => [x, v[x]])) : v);
const clone = o => JSON.parse(JSON.stringify(o));

function setSync(state) {
  const el = $('#sync'); if (!el) return;
  const map = { ok: ['ok', 'Shared · live'], busy: ['busy', 'Saving…'], err: ['err', 'Connection problem'], local: ['', 'Saved in this browser'] };
  const [c, t] = map[state];
  el.className = 'sync ' + c; el.innerHTML = `<i></i>${t}`;
}
/* Every record is its own document (expenses/<id>, items/<id> …). save() diffs the in-memory state against what the
   store last held and writes only what changed, so two founders editing different records never overwrite each other. */
function save() {
  if (DB) { flush(); return; }
  try { localStorage.setItem(KEY, JSON.stringify(S)); } catch { }
}
function queue(path, fn) {
  const p = (chains.get(path) || Promise.resolve()).then(fn);
  chains.set(path, p.catch(() => { }));
  return p;
}
function onWriteErr(e) {
  if (e && e.code === 'invalid_argument' && canWrite) { canWrite = false; render(); }
  toast(e && e.code === 'quota_exceeded' ? 'Storage is full — delete some old records.' : 'A change could not be saved. Check your access and try again.');
}
function flush() {
  const jobs = [];
  COLS.forEach(c => {
    const m = known[c], seen = new Set();
    S[c].forEach(d => {
      seen.add(d.id); const j = canon(d);
      if (m.get(d.id) !== j) { m.set(d.id, j); jobs.push([c + '/' + d.id, () => DB.doc(c + '/' + d.id).set(JSON.parse(j))]); }
    });
    [...m.keys()].forEach(id => { if (!seen.has(id)) { m.delete(id); jobs.push([c + '/' + id, () => DB.doc(c + '/' + id).delete()]); } });
  });
  const sj = canon(S.settings);
  if (sj !== knownSettings) { knownSettings = sj; jobs.push(['meta/settings', () => DB.doc('meta/settings').set(JSON.parse(sj))]); }
  jobs.forEach(([path, fn]) => {
    inflight++; setSync('busy');
    queue(path, fn).catch(onWriteErr).finally(() => {
      if (--inflight) return;
      setSync('ok');
      if (!modalOpen() && applyIncoming()) render();
    });
  });
}
const modalOpen = () => $('#modal').open;
const byCreated = (a, b) => (a.createdAt || 0) - (b.createdAt || 0);
function applyIncoming() {
  let changed = false;
  COLS.forEach(c => {
    if (!incoming[c]) return;
    const docs = incoming[c].filter(d => d && d.id), map = new Map(docs.map(d => [d.id, canon(d)]));
    if (map.size !== known[c].size || [...map].some(([k, v]) => known[c].get(k) !== v)) {
      known[c] = map; S[c] = docs.sort(c === 'activity' ? (a, b) => b.at - a.at : byCreated); changed = true;
    }
  });
  incoming = {};
  if (incomingSettings) {
    const j = canon(incomingSettings);
    if (j !== knownSettings) { knownSettings = j; S.settings = { ...fresh().settings, ...incomingSettings }; changed = true; }
    incomingSettings = null;
  }
  return changed;
}
function watch(ref, handler) {
  return new Promise(resolve => {
    let first = true;
    ref.onSnapshot(snap => {
      handler(snap);
      if (first) { first = false; resolve(); return; }
      if (!inflight && !modalOpen() && applyIncoming()) render();
    }, () => { setSync('err'); if (first) { first = false; resolve(); } });
  });
}
async function loadMe() {
  try {
    const user = await claude.use('user'); if (!user) return;
    if ((await user.can('data.write')) === false) canWrite = false;
    const id = await user.id();
    if (id) {
      meRef = DB.doc('data/users/' + id + '/profile');
      const snap = await meRef.get();
      if (snap.exists && fById(snap.data().founder)) { meId = snap.data().founder; meKnown = true; }
    }
  } catch { }
}
function persistMe() {
  try { localStorage.setItem(ME_KEY, meId); } catch { }
  meRef?.set({ founder: meId }).catch(() => { });
}

const F = () => S.settings.founders;
const fById = id => F().find(f => f.id === id);
const fname = id => fById(id)?.name || '—';
const cu = () => fById(meId) ? meId : F()[0].id;
const phaseName = id => S.phases.find(p => p.id === id)?.name || 'No phase';
function chip(id) {
  const f = fById(id); if (!f) return '<span class="chip">—</span>';
  return `<span class="chip"><i style="background:${esc(f.color)}">${esc(f.name[0] || '?').toUpperCase()}</i>${esc(f.name)}</span>`;
}
function log(text, type) {
  S.activity.unshift({ id: uid(), at: Date.now(), by: cu(), text, type });
  S.activity.length = Math.min(S.activity.length, 500);
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
async function download(name, text) {
  const dl = await claude.use('downloads');
  if (!dl) { toast('Saving files is not available in this view.'); return; }
  try { await dl.save({ filename: name, data: text }); toast('File saved'); }
  catch (e) { if (!e || e.code !== 'declined') toast('Could not save the file.'); }
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
  const companies = new Set(S.leads.map(l => (l.company || '').trim().toLowerCase()).filter(Boolean)).size;
  const delta = pTot ? Math.round((mTot - pTot) / pTot * 100) : null;

  const tAll = S.items.flatMap(i => logsOf(i).map(l => ({ ...l, phaseId: i.phaseId }))), tTotal = sum(S.items.map(itemMins)), hasTime = tAll.length > 0;
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
    ...openPlans().filter(p => p.due <= soon).map(p => ({ d: p.due, t: p.title, s: `${fmt(p.amount)}${p.owner ? ' · ' + fname(p.owner) : ''}`, act: 'plan-open', id: p.id, k: 'Payment due' })),
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
    <div class="card kpi"><div class="k">Time logged</div><div class="v" data-total-all>${fmtDur(tTotal)}</div><div class="s">${new Set(tAll.map(l => l.by)).size} people · ${S.items.filter(i => itemMins(i) > 0).length} tasks</div></div>
    <div class="card kpi"><div class="k">Contacts</div><div class="v">${S.leads.length}</div><div class="s">${companies} compan${companies === 1 ? 'y' : 'ies'}</div></div>
  </div>
  <div class="grid g2">
    <div class="card"><h3>Spend by category <small>${rangeLabel[dashRange]}</small></h3>${ex.length ? '<div class="chart"><canvas id="c-cat"></canvas></div>' : '<div class="empty">No expenses in this period</div>'}</div>
    <div class="card"><h3>Monthly spend — who paid <small>last 6 months</small></h3>${S.expenses.length ? '<div class="chart"><canvas id="c-month"></canvas></div>' : '<div class="empty">No expenses yet</div>'}</div>
    <div class="card"><h3>Paid vs. own share <small>${rangeLabel[dashRange]}</small></h3>${ex.length ? '<div class="chart"><canvas id="c-fnd"></canvas></div>' : '<div class="empty">No expenses in this period</div>'}</div>
    <div class="card"><h3>Spend by phase <small>${rangeLabel[dashRange]}</small></h3>${ex.length ? '<div class="chart"><canvas id="c-phase"></canvas></div>' : '<div class="empty">No expenses in this period</div>'}</div>
    <div class="card"><h3>Time logged by phase <small>who spent it</small></h3>${hasTime ? '<div class="chart"><canvas id="c-tphase"></canvas></div>' : '<div class="empty">No time logged yet. Start a timer on a task in Phases.</div>'}</div>
    <div class="card"><h3>Time logged by person <small>all tasks</small></h3>${hasTime ? '<div class="chart"><canvas id="c-tperson"></canvas></div>' : '<div class="empty">No time logged yet.</div>'}</div>
  </div>
  <div class="grid g3">
    <div class="card"><h3>Smart insights</h3>${insights.length ? `<ul class="insights">${insights.map(i => `<li><div>${i}</div></li>`).join('')}</ul>` : '<div class="empty">Insights appear once you add data</div>'}</div>
    <div class="card"><h3>Needs attention <small>next 7 days</small></h3>${att.length ? att.map(a => `<div class="list-row" data-act="${a.act}" data-id="${a.id}"><div class="grow"><div class="t">${esc(a.t)}</div><div class="sub">${a.k} · ${esc(a.s)}</div></div><span class="badge ${a.d < today() ? 'bad' : 'warn'}">${a.d < today() ? 'Overdue ' : ''}${fmtDate(a.d)}</span></div>`).join('') : '<div class="empty">Nothing due. Nice.</div>'}</div>
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
  if (hasTime) {
    const P = [...S.phases].sort((a, b) => a.order - b.order), hrs = (arr) => +(sum(arr.map(l => l.mins)) / 60).toFixed(2);
    drawChart('c-tphase', { type: 'bar', data: { labels: P.map(p => p.name), datasets: F().map(f => ({ label: f.name, backgroundColor: f.color, borderRadius: 4, data: P.map(p => hrs(tAll.filter(l => l.phaseId === p.id && l.by === f.id))) })) },
      options: { indexAxis: 'y', plugins: { tooltip: { callbacks: { label: c => ` ${c.dataset.label}: ${fmtDur(c.parsed.x * 60)}` } }, legend: { labels: { boxWidth: 10, usePointStyle: true } } }, scales: { x: { stacked: true, ticks: { callback: v => v + 'h' } }, y: { stacked: true } } } });
    drawChart('c-tperson', { type: 'bar', data: { labels: F().map(f => f.name), datasets: [{ data: F().map(f => hrs(tAll.filter(l => l.by === f.id))), backgroundColor: F().map(f => f.color), borderRadius: 6 }] },
      options: { plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => ` ${fmtDur(c.parsed.y * 60)}` } } }, scales: { y: { beginAtZero: true, ticks: { callback: v => v + 'h' } } } } });
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
function expModal(id, pre) {
  const e = id ? S.expenses.find(x => x.id === id) : null, pf0 = pre || {}; // pre: values carried over from a planned payment
  const sp = e ? JSON.parse(JSON.stringify(e.split)) : { type: 'equal', ids: F().map(f => f.id), pct: {}, owner: cu() };
  sp.pct = sp.pct || {}; sp.ids = sp.ids || F().map(f => f.id); sp.owner = sp.owner || cu();
  F().forEach((f, i) => { if (sp.pct[f.id] === undefined) sp.pct[f.id] = i < F().length - 1 ? +(100 / F().length).toFixed(2) : +(100 - +(100 / F().length).toFixed(2) * (F().length - 1)).toFixed(2); });
  const cats = [...new Set([...S.settings.categories, ...(e ? [e.category] : pf0.category ? [pf0.category] : [])])];
  const body = `<div class="grid2">
    <label class="field span2">Title<input name="title" required placeholder="e.g. AWS bill, domain, Figma seats" value="${esc(e?.title ?? pf0.title)}"></label>
    <label class="field">Amount (${esc(S.settings.currency)})<input type="number" name="amount" step="0.01" min="0.01" required value="${e?.amount ?? pf0.amount ?? ''}"></label>
    <label class="field">Date<input type="date" name="date" required value="${e?.date || today()}"></label>
    <label class="field">Category<select name="category">${opts(cats, e?.category ?? pf0.category)}</select></label>
    <label class="field">Paid by<select name="paidBy">${founderOpts(e?.paidBy || pf0.paidBy || cu())}</select></label>
    <label class="field">Phase (optional)<select name="phaseId">${phaseOpts(e?.phaseId ?? pf0.phaseId, '— None —')}</select></label>
    <label class="field">Bill / invoice link<input type="url" name="link" placeholder="https://…" value="${esc(e?.link ?? pf0.link)}"></label>
    <div class="field span2"><span>Who owns this expense?</span>
      <div class="seg">
        <label><input type="radio" name="stype" value="equal" ${sp.type === 'equal' ? 'checked' : ''}> Split equally</label>
        <label><input type="radio" name="stype" value="custom" ${sp.type === 'custom' ? 'checked' : ''}> Custom %</label>
        <label><input type="radio" name="stype" value="owned" ${sp.type === 'owned' ? 'checked' : ''}> Owned by one</label>
      </div><div id="split-area"></div></div>
    <label class="field span2">Notes<textarea name="notes" rows="2">${esc(e?.notes ?? pf0.notes)}</textarea></label></div>`;
  modal({
    title: e ? 'Edit expense' : pf0.planId ? 'Record payment' : 'Add expense', body, submit: e ? 'Save changes' : pf0.planId ? 'Mark as paid' : 'Add expense',
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
      else { const nid = uid(); S.expenses.push({ id: nid, ...data, createdBy: cu(), createdAt: Date.now() }); if (pf0.planId) settlePlan(pf0.planId, nid, data); }
      commit(`${e ? 'updated' : pf0.planId ? 'paid planned payment, recorded as' : 'added'} expense “${data.title}” (${fmt(data.amount)}, paid by ${fname(data.paidBy)})`, 'expense');
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
    const over = p.budget && spend > p.budget, pm = phaseMins(p.id), pe = phaseEst(p.id);
    return `<section class="col" data-drop="item" data-id="${p.id}">
      <header><div class="grow"><h3>${esc(p.name)}</h3><small><span class="badge ${p.status === 'Active' ? 'brand' : p.status === 'Completed' ? 'good' : p.status === 'On hold' ? 'warn' : ''}">${esc(p.status)}</span>${p.start || p.end ? `<div style="margin-top:4px">${fmtDate(p.start)} → ${fmtDate(p.end)}</div>` : ''}</small></div>
      <div class="tools">${idx > 0 ? `<button class="icon-btn" data-act="ph-left" data-id="${p.id}" title="Move phase left" aria-label="Move left">${ico('left', 16)}</button>` : ''}${idx < P.length - 1 ? `<button class="icon-btn" data-act="ph-right" data-id="${p.id}" title="Move phase right" aria-label="Move right">${ico('right', 16)}</button>` : ''}
      <button class="icon-btn" data-act="ph-edit" data-id="${p.id}" title="Edit phase" aria-label="Edit phase">${ico('edit', 16)}</button><button class="icon-btn bad" data-act="ph-del" data-id="${p.id}" title="Delete phase" aria-label="Delete phase">${ico('trash', 16)}</button></div></header>
      ${p.description ? `<div class="hint" style="margin:0">${esc(p.description)}</div>` : ''}
      <div class="meta"><div style="display:flex;justify-content:space-between"><span>${done}/${all.length} done</span><span>Spend ${fmtShort(spend)}${p.budget ? ' / ' + fmtShort(p.budget) : ''}</span></div>
        ${pm > 0 || pe > 0 ? `<div style="display:flex;justify-content:space-between"><span>${ico('stopwatch', 13)} Time logged</span><span><b data-total-phase="${p.id}">${fmtDur(pm)}</b>${pe ? ` · ${pe}h estimated` : ''}</span></div>` : ''}
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
      <span class="sp">${avatars(assigneesOf(i))}</span></div>${timerRow(i)}</article>`;
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
    <label class="field">Estimate (hours, optional)<input type="number" name="est" min="0" step="0.5" value="${it?.est || ''}"></label>
    <label class="field">Remark for this change (optional)<input name="remark" placeholder="Shown in history"></label></div>
    ${it ? timeSection(it) : ''}
    ${it ? `<div class="sect"><h4>Comments &amp; history</h4>
      <div class="addrow"><input id="cm" placeholder="Write a comment or remark… (Enter to post)"><button type="button" class="btn" id="cm-add">Post</button></div>
      <div class="thread" id="thread">${threadHTML(it.thread)}</div></div>` : ''}`;
  modal({
    title: it ? 'Item details' : 'Add item', body, submit: it ? 'Save changes' : 'Add item',
    extra: it ? `<button type="button" class="btn danger" data-act="item-del" data-id="${it.id}">Delete</button>` : '',
    onOpen(form) {
      if (!it) return;
      const addTime = () => {
        const mins = (parseFloat($('#t-h', form).value) || 0) * 60 + (parseFloat($('#t-m', form).value) || 0);
        if (mins <= 0) { toast('Enter hours or minutes to log'); return; }
        const note = $('#t-note', form).value.trim(), d = $('#t-d', form).value;
        (it.logs ||= []).push({ id: uid(), by: cu(), mins, at: d && d !== today() ? new Date(d + 'T12:00').getTime() : Date.now(), src: 'manual', note });
        commit(`logged ${fmtDur(mins)} on “${it.title}”${note ? ': ' + note : ''}`, 'item');
        ['#t-h', '#t-m', '#t-note'].forEach(s => $(s, form).value = ''); refreshTime(it);
      };
      $('#t-add', form).onclick = addTime;
      $$('#t-h, #t-m, #t-note', form).forEach(x => x.addEventListener('keydown', ev => { if (ev.key === 'Enter') { ev.preventDefault(); addTime(); } }));
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
      const data = { title: fd.get('title').trim(), desc: fd.get('desc').trim(), phaseId: fd.get('phaseId'), status: fd.get('status'), assignees: fd.getAll('assignees'), priority: +fd.get('priority'), due: fd.get('due'), est: parseFloat(fd.get('est')) || 0 };
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
      if ((+it.est || 0) !== data.est) ch.push(`Estimate ${it.est || 0}h → ${data.est}h`);
      const moved = it.phaseId !== data.phaseId, old = it.title;
      Object.assign(it, data); delete it.assignee; if (data.status === 'done') stopAll(it);
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
    const from = i.status; i.status = status; if (status === 'done') stopAll(i);
    i.thread.push({ id: uid(), at: Date.now(), by: cu(), kind: 'change', text: `Status ${ITEM_STATUS[from]} → ${ITEM_STATUS[status]}`, remark });
    commit(`changed “${i.title}” from ${ITEM_STATUS[from]} to ${ITEM_STATUS[status]}${remark ? ` — “${remark}”` : ''}`, 'item');
  };
  if (status === 'blocked') askRemark('Mark as blocked', `What is blocking <b>${esc(i.title)}</b>?`, apply);
  else apply('');
}

/* ---------- time tracking ----------
   Each item keeps `logs` (finished work: who, minutes, when, note) and `running` ({founderId: startTimestamp}) for live timers.
   Timers are stored with their start time, so they keep counting across reloads and devices. */
const logsOf = i => i.logs || [];
const runningOf = i => i.running || {};
const itemMins = i => sum(logsOf(i).map(l => l.mins)) + sum(Object.values(runningOf(i)).map(t => Math.max(0, Date.now() - t) / 6e4));
const phaseMins = pid => sum(S.items.filter(i => i.phaseId === pid).map(itemMins));
const phaseEst = pid => sum(S.items.filter(i => i.phaseId === pid).map(i => +i.est || 0));
const fmtDur = m => { m = Math.round(m); if (m < 60) return m + 'm'; const h = Math.floor(m / 60), r = m % 60; return r ? `${h}h ${r}m` : `${h}h`; };
const fmtClock = ms => { const s = Math.max(0, Math.floor(ms / 1000)); return [Math.floor(s / 3600), Math.floor(s % 3600 / 60), s % 60].map(x => String(x).padStart(2, '0')).join(':'); };

function stopTimer(i, who) {
  const t = runningOf(i)[who]; if (!t) return 0;
  const mins = (Date.now() - t) / 6e4;
  delete i.running[who]; if (!Object.keys(i.running).length) delete i.running;
  if (mins >= 0.1) (i.logs ||= []).push({ id: uid(), by: who, mins: +mins.toFixed(2), at: Date.now(), start: t, src: 'timer', note: '' });
  return mins;
}
function stopAll(i) { Object.keys(runningOf(i)).forEach(who => { const m = stopTimer(i, who); if (m >= 0.1) log(`logged ${fmtDur(m)} on “${i.title}” (task marked done)`, 'item'); }); }
function toggleTimer(id) {
  const i = S.items.find(x => x.id === id); if (!i) return;
  const me = cu();
  if (runningOf(i)[me]) {
    const m = stopTimer(i, me);
    commit(m >= 0.1 ? `logged ${fmtDur(m)} on “${i.title}”` : '', 'item'); refreshTime(i); toast(`Timer stopped · ${fmtDur(m)} logged`);
    return;
  }
  // one running timer per person: stop the one that is open elsewhere
  S.items.forEach(o => {
    if (o !== i && runningOf(o)[me]) { const m = stopTimer(o, me); log(`logged ${fmtDur(m)} on “${o.title}”`, 'item'); toast(`Switched timers · ${fmtDur(m)} logged on “${o.title}”`); }
  });
  (i.running ||= {})[me] = Date.now();
  if (i.status === 'todo') { i.status = 'doing'; i.thread.push({ id: uid(), at: Date.now(), by: me, kind: 'change', text: 'Status To do → In progress (timer started)' }); }
  commit(`started a timer on “${i.title}”`, 'item'); refreshTime(i);
}
function timerRow(i) {
  const run = runningOf(i), me = cu(), mine = run[me], others = Object.keys(run).filter(k => k !== me), tm = itemMins(i);
  return `<div class="row timerow"><button class="icon-btn tbtn ${mine ? 'on' : ''}" data-act="timer-toggle" data-id="${i.id}" title="${mine ? 'Stop timer' : 'Start timer'}" aria-label="${mine ? 'Stop timer' : 'Start timer'}">${ico(mine ? 'stop' : 'play', 13)}</button>
    ${mine ? `<span class="run" data-run-start="${mine}">${fmtClock(Date.now() - mine)}</span>` : ''}
    ${tm > 0 || i.est ? `<span class="tm" title="Time spent${i.est ? ' / estimate' : ''}">${ico('stopwatch', 13)} <span data-total-item="${i.id}">${fmtDur(tm)}</span>${i.est ? ' / ' + i.est + 'h' : ''}</span>` : ''}
    ${others.length ? `<span class="badge brand">● ${esc(others.map(fname).join(', '))} timing</span>` : ''}</div>`;
}
function timeTop(it) {
  const me = cu(), mine = runningOf(it)[me], per = {};
  logsOf(it).forEach(l => per[l.by] = (per[l.by] || 0) + l.mins);
  Object.entries(runningOf(it)).forEach(([u, t]) => per[u] = (per[u] || 0) + Math.max(0, Date.now() - t) / 6e4);
  const est = +it.est || 0, spent = itemMins(it);
  return `<div class="timebar"><div><div class="k">Time spent</div><div class="big"><span data-total-item="${it.id}">${fmtDur(spent)}</span>${est ? ` <small>of ${est}h estimate</small>` : ''}</div></div>
    <button type="button" class="btn ${mine ? 'danger' : 'primary'}" data-act="timer-toggle" data-id="${it.id}">${mine ? `${ico('stop', 14)} Stop · <span data-run-start="${mine}">${fmtClock(Date.now() - mine)}</span>` : `${ico('play', 14)} Start timer`}</button></div>
    ${est ? `<div class="bar ${spent / 60 > est ? 'over' : ''}" style="margin-top:10px"><i style="width:${Math.min(100, pct(spent / 60, est))}%;${spent / 60 > est ? '' : 'background:var(--brand)'}"></i></div>` : ''}
    ${Object.keys(per).length ? `<div class="per">${Object.entries(per).map(([u, m]) => `<span class="badge">${esc(fname(u))} · ${fmtDur(m)}</span>`).join('')}</div>` : ''}`;
}
function timeList(it) {
  const logs = [...logsOf(it)].sort((a, b) => b.at - a.at);
  return logs.length ? logs.map(l => `<div class="logrow">${chip(l.by)}<b>${fmtDur(l.mins)}</b><span class="sub grow">${fmtTime(l.at)}${l.src === 'manual' ? ' · added manually' : ''}${l.note ? ' · ' + esc(l.note) : ''}</span>
    <button type="button" class="icon-btn bad" data-act="log-del" data-item="${it.id}" data-id="${l.id}" title="Remove this entry" aria-label="Remove time entry">${ico('trash', 15)}</button></div>`).join('')
    : '<p class="hint">No time logged yet. Start the timer or add time below.</p>';
}
function timeSection(it) {
  return `<div class="sect"><h4>Time tracking</h4><div id="time-top">${timeTop(it)}</div>
    <div class="timeadd"><input type="number" id="t-h" min="0" step="1" placeholder="Hours" aria-label="Hours"><input type="number" id="t-m" min="0" max="59" step="1" placeholder="Min" aria-label="Minutes"><input type="date" id="t-d" value="${today()}" aria-label="Date worked"><input id="t-note" placeholder="What did you work on? (optional)"><button type="button" class="btn" id="t-add">Log time</button></div>
    <div id="time-list">${timeList(it)}</div></div>`;
}
function refreshTime(it) {
  const a = $('#time-top'), b = $('#time-list'); if (a) a.innerHTML = timeTop(it); if (b) b.innerHTML = timeList(it);
}
function delLog(itemId, logId) {
  const i = S.items.find(x => x.id === itemId), l = i && logsOf(i).find(x => x.id === logId); if (!l) return;
  i.logs = i.logs.filter(x => x.id !== logId);
  commit(`removed ${fmtDur(l.mins)} logged by ${fname(l.by)} on “${i.title}”`, 'item'); refreshTime(i);
}

/* ---------- time tracker page ---------- */
const tf = { who: '', period: 'month', phase: '' };
const PERIODS = { today: 'Today', week: 'This week', month: 'This month', all: 'All time' };
const startOfDay = d => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x.getTime(); };
function periodStart(p) {
  const now = new Date();
  if (p === 'today') return startOfDay(now);
  if (p === 'week') { const d = new Date(startOfDay(now)); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d.getTime(); } // weeks start on Monday
  if (p === 'month') return new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  return 0;
}
const allLogs = () => S.items.flatMap(i => logsOf(i).map(l => ({ ...l, item: i })));
// minutes a person (or the whole team when who is empty) logged in a period, counting any timer still running
function userMins(who, period) {
  const from = periodStart(period);
  let m = sum(allLogs().filter(l => (!who || l.by === who) && l.at >= from).map(l => l.mins));
  S.items.forEach(i => Object.entries(runningOf(i)).forEach(([u, t]) => { if (!who || u === who) m += Math.max(0, Date.now() - Math.max(t, from)) / 6e4; }));
  return m;
}
function ttCard(f) {
  const id = f ? f.id : '';
  const cell = (p, label) => `<div><div class="k">${label}</div><div class="v2" data-tt data-who="${id}" data-p="${p}">${fmtDur(userMins(id, p))}</div></div>`;
  return `<div class="card tt-card ${tf.who === id ? 'sel' : ''}" data-act="tt-person" data-id="${id}" title="Show ${f ? esc(f.name) + '’s' : 'everyone’s'} entries">
    <div class="name">${f ? chip(f.id) : '<b>Whole team</b>'}</div>
    <div class="tt-grid">${cell('today', 'Today')}${cell('week', 'This week')}${cell('month', 'This month')}${cell('all', 'Overall')}</div></div>`;
}
function pgTime() {
  setActions(`<button class="btn" data-act="tt-csv">${ico('download')} Export CSV</button>`);
  const running = S.items.flatMap(i => Object.entries(runningOf(i)).map(([u, t]) => ({ i, u, t })));
  const any = allLogs().length > 0;
  $('#view').innerHTML = `
  ${running.length ? `<div class="card"><h3>Running now</h3>${running.map(r => `<div class="list-row" data-act="item-open" data-id="${r.i.id}"><div class="grow"><div class="t">${esc(r.i.title)}</div><div class="sub">${esc(phaseName(r.i.phaseId))}</div></div>${chip(r.u)}<b class="live" data-run-start="${r.t}">${fmtClock(Date.now() - r.t)}</b></div>`).join('')}</div>` : ''}
  <div class="grid ttgrid">${ttCard(null)}${F().map(ttCard).join('')}</div>
  <div class="card"><h3>Hours per day <small>last 14 days, by person</small></h3>${any ? '<div class="chart"><canvas id="c-tt"></canvas></div>' : '<div class="empty">No time logged yet. Start a timer on any task in Phases, or add time by hand inside a task.</div>'}</div>
  <div class="card">
    <div class="toolbar" style="margin-bottom:6px">
      <select class="sel" data-filter="tf" data-k="who" aria-label="Person"><option value="">Everyone</option>${founderOpts(tf.who)}</select>
      <select class="sel" data-filter="tf" data-k="period" aria-label="Period">${opts(Object.keys(PERIODS), tf.period, k => k, k => PERIODS[k])}</select>
      <select class="sel" data-filter="tf" data-k="phase" aria-label="Phase"><option value="">All phases</option>${phaseOpts(tf.phase)}</select>
    </div><div id="tt-body"></div></div>`;
  if (any) drawTimeChart();
  drawTimeTables();
}
function drawTimeChart() {
  const days = []; for (let n = 13; n >= 0; n--) { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - n); days.push(d); }
  const key = d => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`, L = allLogs();
  drawChart('c-tt', { type: 'bar', data: { labels: days.map(d => d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })), datasets: F().map(f => ({ label: f.name, backgroundColor: f.color, borderRadius: 4,
    data: days.map(d => +(sum(L.filter(l => l.by === f.id && key(new Date(l.at)) === key(d)).map(l => l.mins)) / 60).toFixed(2)) })) },
    options: { plugins: { legend: { labels: { boxWidth: 10, usePointStyle: true } }, tooltip: { callbacks: { label: c => ` ${c.dataset.label}: ${fmtDur(c.parsed.y * 60)}` } } }, scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true, ticks: { callback: v => v + 'h' } } } } });
}
function ttEntries() {
  const from = periodStart(tf.period);
  return allLogs().filter(l => l.at >= from && (!tf.who || l.by === tf.who) && (!tf.phase || l.item.phaseId === tf.phase)).sort((a, b) => b.at - a.at);
}
function drawTimeTables() {
  const el = $('#tt-body'); if (!el) return;
  const L = ttEntries(), total = sum(L.map(l => l.mins));
  const byTask = new Map();
  L.forEach(l => { const r = byTask.get(l.item.id) || { item: l.item, mins: 0, per: {} }; r.mins += l.mins; r.per[l.by] = (r.per[l.by] || 0) + l.mins; byTask.set(l.item.id, r); });
  const rows = [...byTask.values()].sort((a, b) => b.mins - a.mins);
  const scope = `${PERIODS[tf.period]} · ${tf.who ? esc(fname(tf.who)) : 'everyone'}${tf.phase ? ' · ' + esc(phaseName(tf.phase)) : ''}`;
  if (!L.length) { el.innerHTML = `<div class="empty">No time logged for ${scope}.</div>`; return; }
  el.innerHTML = `<h3 style="margin:10px 0 8px">Time by task <small>${scope} · <b>${fmtDur(total)}</b> in total</small></h3>
    <div class="tbl-wrap"><table><thead><tr><th>Task</th><th>Phase</th><th>Status</th><th>Who</th><th class="num">Time</th></tr></thead><tbody>
    ${rows.map(r => `<tr style="cursor:pointer" data-act="item-open" data-id="${r.item.id}"><td><b>${esc(r.item.title)}</b></td><td>${esc(phaseName(r.item.phaseId))}</td>
      <td><span class="badge ${STATUS_TONE[r.item.status]}">${ITEM_STATUS[r.item.status]}</span></td>
      <td>${Object.entries(r.per).map(([u, m]) => `<span class="badge">${esc(fname(u))} · ${fmtDur(m)}</span>`).join(' ')}</td><td class="num"><b>${fmtDur(r.mins)}</b></td></tr>`).join('')}
    </tbody><tfoot><tr><td colspan="4">${rows.length} task${rows.length > 1 ? 's' : ''}</td><td class="num">${fmtDur(total)}</td></tr></tfoot></table></div>
    <h3 style="margin:22px 0 8px">All entries <small>${L.length}</small></h3>
    <div class="tbl-wrap"><table><thead><tr><th>When</th><th>Person</th><th>Task</th><th>Phase</th><th>Note</th><th class="num">Time</th></tr></thead><tbody>
    ${L.slice(0, 300).map(l => `<tr style="cursor:pointer" data-act="item-open" data-id="${l.item.id}"><td>${fmtTime(l.at)}</td><td>${chip(l.by)}</td><td>${esc(l.item.title)}</td><td>${esc(phaseName(l.item.phaseId))}</td>
      <td><span class="sub">${l.src === 'manual' ? 'Added manually' : 'Timer'}${l.note ? ' · ' + esc(l.note) : ''}</span></td><td class="num"><b>${fmtDur(l.mins)}</b></td></tr>`).join('')}
    </tbody></table></div>${L.length > 300 ? '<p class="hint">Showing the latest 300 entries. Export the CSV for everything.</p>' : ''}`;
}
function exportTimeCSV() {
  const q = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const head = ['Date', 'Person', 'Task', 'Phase', 'Minutes', 'Hours', 'Source', 'Note'];
  const rows = ttEntries().map(l => [new Date(l.at).toLocaleString('en-GB'), fname(l.by), l.item.title, phaseName(l.item.phaseId), l.mins.toFixed(1), (l.mins / 60).toFixed(2), l.src, l.note].map(q).join(','));
  download(`time-log-${tf.period}-${today()}.csv`, [head.map(q).join(','), ...rows].join('\n'));
}

/* ---------- budget & upcoming payments ----------
   `plans` are payments we know are coming (rent, subscriptions, invoices). Marking one paid records a real expense and, for
   repeating payments, schedules the next one. Phase budgets still live on the phase; this page shows them against spend. */
const bf = { status: 'upcoming', who: '', phase: '' };
const REPEATS = { none: 'One-off', monthly: 'Every month', quarterly: 'Every 3 months', yearly: 'Every year' };
const REPEAT_MONTHS = { monthly: 1, quarterly: 3, yearly: 12 };
function addMonths(dateStr, n) {
  const d = new Date(dateStr + 'T00:00'), day = d.getDate();
  d.setMonth(d.getMonth() + n); if (d.getDate() !== day) d.setDate(0); // 31 Jan + 1 month -> 28/29 Feb
  return new Date(d - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
}
const daysUntil = s => Math.round((new Date(s + 'T00:00') - new Date(today() + 'T00:00')) / 864e5);
const openPlans = () => S.plans.filter(p => p.status !== 'paid');
const phaseSpent = pid => sum(S.expenses.filter(e => (e.phaseId || '') === pid).map(e => e.amount));
const phaseCommitted = pid => sum(openPlans().filter(p => (p.phaseId || '') === pid).map(p => p.amount));
function dueBadge(p) {
  const n = daysUntil(p.due);
  if (n < 0) return `<span class="badge bad">Overdue ${-n}d</span>`;
  if (n === 0) return '<span class="badge warn">Due today</span>';
  return `<span class="badge ${n <= 7 ? 'warn' : ''}">in ${n} day${n > 1 ? 's' : ''}</span>`;
}
function pgBudget() {
  setActions(`<button class="btn primary" data-act="plan-add">${ico('plus')} Add planned payment</button>`);
  const open = openPlans(), t0 = today(), t7 = daysFromNow(7), t30 = daysFromNow(30);
  const overdue = open.filter(p => p.due < t0), in7 = open.filter(p => p.due >= t0 && p.due <= t7), in30 = open.filter(p => p.due >= t0 && p.due <= t30);
  const spentAll = sum(S.expenses.map(e => e.amount)), committed = sum(open.map(p => p.amount)), tb = +S.settings.totalBudget || 0;
  const tile = (k, list, tone) => `<div class="card kpi"><div class="k">${k}</div><div class="v ${list.length ? tone : ''}">${fmt(sum(list.map(p => p.amount)))}</div><div class="s">${list.length} payment${list.length === 1 ? '' : 's'}</div></div>`;
  const rows = [...S.phases].sort((a, b) => a.order - b.order).map(p => ({ id: p.id, name: p.name, budget: +p.budget || 0, spent: phaseSpent(p.id), up: phaseCommitted(p.id) }));
  const loose = { id: '', name: 'No phase', budget: 0, spent: phaseSpent(''), up: phaseCommitted('') };
  if (loose.spent || loose.up) rows.push(loose);
  const shown = rows.filter(r => r.budget || r.spent || r.up || r.id);
  const budgeted = rows.filter(r => r.budget > 0);
  $('#view').innerHTML = `
  <div class="grid kpis">
    ${tile('Overdue', overdue, 'neg')}${tile('Due in 7 days', in7, '')}${tile('Due in 30 days', in30, '')}${tile('All upcoming', open, '')}
    <div class="card kpi"><div class="k">Overall budget</div>
      ${tb ? `<div class="v ${tb - spentAll - committed < 0 ? 'neg' : 'pos'}">${fmt(tb - spentAll - committed)}</div><div class="s">left of ${fmt(tb)} · spent ${fmtShort(spentAll)} · upcoming ${fmtShort(committed)}</div>` : `<div class="v">Not set</div><div class="s">Spent ${fmtShort(spentAll)} · upcoming ${fmtShort(committed)}</div>`}
      <button class="btn sm" style="margin-top:8px" data-act="budget-total">${tb ? 'Change' : 'Set overall budget'}</button></div>
  </div>
  <div class="grid g2">
    <div class="card"><h3>When money is needed <small>unpaid payments by week</small></h3>${open.length ? '<div class="chart"><canvas id="c-bweek"></canvas></div>' : '<div class="empty">No upcoming payments. Add rent, subscriptions, salaries or vendor invoices you know are coming.</div>'}</div>
    <div class="card"><h3>Phase budgets <small>spent, upcoming and left</small></h3>${budgeted.length ? '<div class="chart"><canvas id="c-bphase"></canvas></div>' : '<div class="empty">No phase has a budget yet. Use “Set” in the table below.</div>'}</div>
  </div>
  <div class="card"><h3>Upcoming payments</h3>
    <div class="toolbar" style="margin-bottom:10px">
      <select class="sel" data-filter="bf" data-k="status" aria-label="Status"><option value="upcoming" ${bf.status === 'upcoming' ? 'selected' : ''}>Still to pay</option><option value="paid" ${bf.status === 'paid' ? 'selected' : ''}>Paid</option><option value="all" ${bf.status === 'all' ? 'selected' : ''}>All</option></select>
      <select class="sel" data-filter="bf" data-k="who" aria-label="Responsible"><option value="">Anyone responsible</option>${founderOpts(bf.who)}</select>
      <select class="sel" data-filter="bf" data-k="phase" aria-label="Phase"><option value="">All phases</option>${phaseOpts(bf.phase)}</select>
    </div><div id="plan-table"></div></div>
  <div class="card"><h3>Budget by phase</h3>${shown.length ? `<div class="tbl-wrap"><table><thead><tr><th>Phase</th><th class="num">Budget</th><th class="num">Spent</th><th class="num">Upcoming</th><th class="num">Left</th><th style="min-width:140px">Used</th></tr></thead><tbody>
    ${shown.map(r => { const left = r.budget - r.spent - r.up, used = r.budget ? (r.spent + r.up) / r.budget : 0, sc = used > 1 ? 1 / used : 1;
      return `<tr><td><b>${esc(r.name)}</b></td>
      <td class="num">${r.id ? `${r.budget ? fmt(r.budget) : '<span class="sub" style="display:inline">not set</span>'} <button class="icon-btn" data-act="budget-edit" data-id="${r.id}" title="${r.budget ? 'Change budget' : 'Set budget'}" aria-label="Set budget for ${esc(r.name)}">${ico('edit', 15)}</button>` : '<span class="sub" style="display:inline">—</span>'}</td>
      <td class="num">${fmt(r.spent)}</td><td class="num">${r.up ? fmt(r.up) : '—'}</td>
      <td class="num ${r.budget ? (left < 0 ? 'neg' : 'pos') : ''}"><b>${r.budget ? fmt(left) : '—'}</b></td>
      <td>${r.budget ? `<div class="bar stack ${used > 1 ? 'over' : ''}" title="${Math.round(used * 100)}% of budget used or committed"><i style="width:${r.spent / r.budget * 100 * sc}%"></i><i class="up" style="width:${r.up / r.budget * 100 * sc}%"></i></div><span class="sub">${Math.round(used * 100)}%</span>` : ''}</td></tr>`; }).join('')}
    </tbody><tfoot><tr><td>Total</td><td class="num">${fmt(sum(rows.map(r => r.budget)))}</td><td class="num">${fmt(sum(rows.map(r => r.spent)))}</td><td class="num">${fmt(sum(rows.map(r => r.up)))}</td><td class="num">${budgeted.length ? fmt(sum(budgeted.map(r => r.budget - r.spent - r.up))) : '—'}</td><td></td></tr></tfoot></table></div>
    <p class="hint">Left = budget minus what is already spent minus payments still to pay. Phase budgets can also be edited in the phase itself.</p>` : '<div class="empty">Create phases to budget them.</div>'}</div>`;
  drawPlanTable();
  if (open.length) {
    const wk = []; for (let n = 0; n < 8; n++) wk.push({ from: daysFromNow(n * 7), to: daysFromNow(n * 7 + 6) });
    const short = d => new Date(d + 'T00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
    const later = open.filter(p => p.due > wk[7].to);
    drawChart('c-bweek', { type: 'bar', data: { labels: ['Overdue', ...wk.map(w => short(w.from)), 'Later'], datasets: [{
      data: [sum(overdue.map(p => p.amount)), ...wk.map(w => sum(open.filter(p => p.due >= w.from && p.due <= w.to).map(p => p.amount))), sum(later.map(p => p.amount))],
      backgroundColor: [css('--bad'), ...wk.map(() => PALETTE[0]), css('--muted')], borderRadius: 6 }] },
      options: { plugins: { legend: { display: false }, tooltip: { callbacks: { title: i => i[0].dataIndex === 0 ? 'Overdue' : i[0].dataIndex === 9 ? 'Later than 8 weeks' : `Week of ${i[0].label}`, label: c => ` ${fmt(c.parsed.y)}` } } }, scales: { y: { beginAtZero: true, ticks: { callback: fmtShort } } } } });
  }
  if (budgeted.length) {
    drawChart('c-bphase', { type: 'bar', data: { labels: budgeted.map(r => r.name), datasets: [
      { label: 'Spent', data: budgeted.map(r => r.spent), backgroundColor: PALETTE[0], borderRadius: 4 },
      { label: 'Upcoming', data: budgeted.map(r => r.up), backgroundColor: PALETTE[2], borderRadius: 4 },
      { label: 'Left', data: budgeted.map(r => Math.max(0, r.budget - r.spent - r.up)), backgroundColor: css('--line'), borderRadius: 4 }] },
      options: { indexAxis: 'y', plugins: { tooltip: moneyTip, legend: { labels: { boxWidth: 10, usePointStyle: true } } }, scales: { x: { stacked: true, ticks: { callback: fmtShort } }, y: { stacked: true } } } });
  }
}
function drawPlanTable() {
  const el = $('#plan-table'); if (!el) return;
  const list = S.plans.filter(p => (bf.status === 'all' || (bf.status === 'paid') === (p.status === 'paid')) && (!bf.who || p.owner === bf.who) && (!bf.phase || (p.phaseId || '') === bf.phase))
    .sort((a, b) => (a.status === 'paid') - (b.status === 'paid') || (a.status === 'paid' ? (b.paidAt || 0) - (a.paidAt || 0) : a.due.localeCompare(b.due)));
  if (!list.length) { el.innerHTML = `<div class="empty">${S.plans.length ? 'Nothing matches these filters.' : 'No planned payments yet. Add the payments you know are coming, such as rent, subscriptions, salaries or vendor invoices.'}</div>`; return; }
  el.innerHTML = `<div class="tbl-wrap"><table><thead><tr><th>Due</th><th>Payment</th><th>Phase</th><th>Responsible</th><th class="num">Amount</th><th></th></tr></thead><tbody>
    ${list.map(p => { const paid = p.status === 'paid'; return `<tr class="${paid ? 'dim' : ''}">
      <td>${fmtDate(p.due)}<span class="sub">${paid ? `<span class="badge good">Paid ${p.paidAt ? fmtDate(new Date(p.paidAt - new Date().getTimezoneOffset() * 6e4).toISOString().slice(0, 10)) : ''}</span>` : dueBadge(p)}</span></td>
      <td><b>${esc(p.title)}</b><span class="sub">${esc(p.category)}${p.repeat && p.repeat !== 'none' ? ' · ' + REPEATS[p.repeat] : ''}${p.notes ? ' · ' + esc(p.notes.slice(0, 60)) : ''}</span>${p.link ? `<span class="sub"><a href="${esc(p.link)}" target="_blank" rel="noopener noreferrer">invoice ↗</a></span>` : ''}</td>
      <td>${p.phaseId ? esc(phaseName(p.phaseId)) : '<span class="sub">—</span>'}</td>
      <td>${paid && p.paidBy ? `<span class="sub" style="display:inline">paid by</span> ${chip(p.paidBy)}` : p.owner ? chip(p.owner) : '<span class="sub">Anyone</span>'}</td>
      <td class="num"><b>${fmt(p.amount)}</b></td>
      <td><div class="row-actions">${paid ? '' : `<button class="btn sm primary" data-act="plan-pay" data-id="${p.id}">Mark paid</button>`}<button class="icon-btn" data-act="plan-edit" data-id="${p.id}" title="Edit" aria-label="Edit">${ico('edit')}</button><button class="icon-btn bad" data-act="plan-del" data-id="${p.id}" title="Delete" aria-label="Delete">${ico('trash')}</button></div></td></tr>`; }).join('')}
    </tbody><tfoot><tr><td colspan="4">${list.length} payment${list.length > 1 ? 's' : ''}</td><td class="num">${fmt(sum(list.map(p => p.amount)))}</td><td></td></tr></tfoot></table></div>`;
}
function planModal(id) {
  const p = id ? S.plans.find(x => x.id === id) : null;
  const cats = [...new Set([...S.settings.categories, ...(p ? [p.category] : [])])];
  modal({
    title: p ? 'Edit planned payment' : 'Add planned payment', submit: p ? 'Save changes' : 'Add payment',
    extra: p ? `<button type="button" class="btn danger" data-act="plan-del" data-id="${p.id}">Delete</button>` : '',
    body: `<div class="grid2">
      <label class="field span2">What is it for?<input name="title" required placeholder="e.g. Office rent, AWS invoice, designer stipend" value="${esc(p?.title)}"></label>
      <label class="field">Amount (${esc(S.settings.currency)})<input type="number" name="amount" step="0.01" min="0.01" required value="${p?.amount ?? ''}"></label>
      <label class="field">Due date<input type="date" name="due" required value="${p?.due || daysFromNow(7)}"></label>
      <label class="field">Category<select name="category">${opts(cats, p?.category)}</select></label>
      <label class="field">Phase (optional)<select name="phaseId">${phaseOpts(p?.phaseId, '— None —')}</select></label>
      <label class="field">Who should pay it<select name="owner"><option value="">Anyone</option>${founderOpts(p?.owner)}</select></label>
      <label class="field">Repeats<select name="repeat">${opts(Object.keys(REPEATS), p?.repeat || 'none', k => k, k => REPEATS[k])}</select></label>
      <label class="field span2">Invoice / payment link<input type="url" name="link" placeholder="https://…" value="${esc(p?.link)}"></label>
      <label class="field span2">Notes (vendor, account, reference)<textarea name="notes" rows="2">${esc(p?.notes)}</textarea></label></div>`,
    onSubmit(fd) {
      const data = { title: fd.get('title').trim(), amount: parseFloat(fd.get('amount')), due: fd.get('due'), category: fd.get('category'), phaseId: fd.get('phaseId'),
        owner: fd.get('owner'), repeat: fd.get('repeat'), link: fd.get('link').trim(), notes: fd.get('notes').trim() };
      if (p) Object.assign(p, data); else S.plans.push({ id: uid(), status: 'upcoming', ...data, createdBy: cu(), createdAt: Date.now() });
      commit(`${p ? 'updated' : 'planned'} payment “${data.title}” (${fmt(data.amount)}, due ${fmtDate(data.due)})`, 'budget');
    },
  });
}
function payPlan(id) {
  const p = S.plans.find(x => x.id === id); if (!p) return;
  expModal(null, { title: p.title, amount: p.amount, category: p.category, phaseId: p.phaseId, paidBy: p.owner || cu(), link: p.link, notes: p.notes, planId: p.id });
}
// called when the expense form saves a payment made from a plan
function settlePlan(planId, expId, exp) {
  const p = S.plans.find(x => x.id === planId); if (!p) return;
  p.status = 'paid'; p.expenseId = expId; p.paidAt = Date.now(); p.paidBy = exp.paidBy;
  if (REPEAT_MONTHS[p.repeat]) S.plans.push({ id: uid(), status: 'upcoming', title: p.title, amount: p.amount, due: addMonths(p.due, REPEAT_MONTHS[p.repeat]), category: p.category,
    phaseId: p.phaseId, owner: p.owner, repeat: p.repeat, link: p.link, notes: p.notes, createdBy: cu(), createdAt: Date.now() });
}
function delPlan(id) {
  const p = S.plans.find(x => x.id === id); if (!p) return;
  confirmBox(`Delete the planned payment <b>${esc(p.title)}</b> (${fmt(p.amount)})?${p.status === 'paid' ? ' The expense it created stays.' : ''}`, 'Delete', () => {
    S.plans = S.plans.filter(x => x.id !== id); commit(`deleted planned payment “${p.title}”`, 'budget');
  });
}
function budgetModal(phaseId) {
  const p = S.phases.find(x => x.id === phaseId); if (!p) return;
  modal({
    title: `Budget · ${esc(p.name)}`, submit: 'Save budget', small: true,
    body: `<label class="field">Budget (${esc(S.settings.currency)})<input type="number" name="budget" min="0" step="0.01" value="${p.budget || ''}" placeholder="Leave empty for no budget"></label>
      <p class="hint">Spent so far: ${fmt(phaseSpent(p.id))}. Still to pay: ${fmt(phaseCommitted(p.id))}.</p>`,
    onSubmit(fd) { p.budget = parseFloat(fd.get('budget')) || 0; commit(`set the budget of “${p.name}” to ${p.budget ? fmt(p.budget) : 'none'}`, 'budget'); },
  });
}
function totalBudgetModal() {
  modal({
    title: 'Overall budget', submit: 'Save budget', small: true,
    body: `<label class="field">Total budget for the company (${esc(S.settings.currency)})<input type="number" name="total" min="0" step="0.01" value="${S.settings.totalBudget || ''}" placeholder="Leave empty for no overall budget"></label>
      <p class="hint">Compared with everything spent so far plus payments still to pay.</p>`,
    onSubmit(fd) { S.settings.totalBudget = parseFloat(fd.get('total')) || 0; commit(`set the overall budget to ${S.settings.totalBudget ? fmt(S.settings.totalBudget) : 'none'}`, 'budget'); },
  });
}

/* ---------- ideas ----------
   A running list of ideas for the team: quick capture, one vote each, comments, a status, and a button to turn an idea into a task. */
const IDEA_TAGS = ['Product', 'Marketing', 'Business', 'Tech', 'Operations', 'Funding', 'Other'];
const IDEA_STATUS = { new: 'New', exploring: 'Exploring', planned: 'Planned', done: 'Done', parked: 'Parked' };
const IDEA_TONE = { new: '', exploring: 'brand', planned: 'warn', done: 'good', parked: '' };
const idf = { q: '', status: '', tag: '', who: '', sort: 'votes' };
const ideaOff = i => i.status === 'done' || i.status === 'parked';
function pgIdeas() {
  setActions(`<button class="btn primary" data-act="idea-add">${ico('plus')} Add idea with details</button>`);
  const open = S.ideas.filter(i => !ideaOff(i)).length;
  $('#view').innerHTML = `
  <form class="card quick" id="idea-quick" autocomplete="off">
    <input name="title" id="idea-title" placeholder="Got an idea? Type it here and press Enter" aria-label="New idea" maxlength="140" required>
    <select name="tag" aria-label="Tag">${opts(IDEA_TAGS, 'Product')}</select>
    <button class="btn primary">${ico('plus')} Add</button></form>
  <div class="toolbar">
    <input class="grow" type="search" placeholder="Search ideas and comments…" data-filter="idf" data-k="q" value="${esc(idf.q)}">
    <select class="sel" data-filter="idf" data-k="status" aria-label="Status"><option value="">Any status</option>${Object.entries(IDEA_STATUS).map(([k, v]) => `<option value="${k}" ${idf.status === k ? 'selected' : ''}>${v}</option>`).join('')}</select>
    <select class="sel" data-filter="idf" data-k="tag" aria-label="Tag"><option value="">All tags</option>${opts(IDEA_TAGS, idf.tag)}</select>
    <select class="sel" data-filter="idf" data-k="who" aria-label="Who shared it"><option value="">Anyone’s ideas</option>${founderOpts(idf.who)}</select>
    <select class="sel" data-filter="idf" data-k="sort" aria-label="Sort"><option value="votes" ${idf.sort === 'votes' ? 'selected' : ''}>Most votes</option><option value="new" ${idf.sort === 'new' ? 'selected' : ''}>Newest</option></select>
  </div>
  <p class="hint" style="margin:0">${S.ideas.length} idea${S.ideas.length === 1 ? '' : 's'} · ${open} still open. Vote with the arrow, open an idea to discuss it or turn it into a task.</p>
  <div id="idea-grid"></div>`;
  drawIdeas();
}
function drawIdeas() {
  const el = $('#idea-grid'); if (!el) return;
  if (!S.ideas.length) { el.innerHTML = '<div class="card empty"><h3>No ideas yet</h3><p>Anything worth trying goes here: product features, ways to get customers, partnerships, funding options. Type the first one above.</p></div>'; return; }
  const q = idf.q.toLowerCase();
  const list = S.ideas.filter(i => (!q || (i.title + ' ' + (i.desc || '') + ' ' + (i.thread || []).map(m => m.text).join(' ')).toLowerCase().includes(q))
    && (!idf.status || i.status === idf.status) && (!idf.tag || i.tag === idf.tag) && (!idf.who || i.createdBy === idf.who));
  const cmp = idf.sort === 'new' ? (a, b) => b.createdAt - a.createdAt : (a, b) => (b.votes || []).length - (a.votes || []).length || b.createdAt - a.createdAt;
  const live = list.filter(i => !ideaOff(i)).sort(cmp), off = list.filter(ideaOff).sort(cmp);
  if (!list.length) { el.innerHTML = '<div class="empty">No ideas match these filters.</div>'; return; }
  el.innerHTML = `${live.length ? `<div class="ideas">${live.map(ideaCard).join('')}</div>` : ''}
    ${off.length ? `<div class="divider2">Done &amp; parked · ${off.length}</div><div class="ideas">${off.map(ideaCard).join('')}</div>` : ''}`;
}
function ideaCard(i) {
  const votes = i.votes || [], mine = votes.includes(cu()), comments = (i.thread || []).filter(m => m.kind === 'comment').length;
  return `<article class="idea ${ideaOff(i) ? 'inactive' : ''}" data-act="idea-open" data-id="${i.id}">
    <div class="t">${esc(i.title)}</div>
    ${i.desc ? `<p class="d">${esc(i.desc)}</p>` : ''}
    <div class="row"><span class="badge brand">${esc(i.tag)}</span>
      <select class="badge st ${IDEA_TONE[i.status]}" data-filter="ideastatus" data-id="${i.id}" aria-label="Status of ${esc(i.title)}" title="Change status">${Object.entries(IDEA_STATUS).map(([k, v]) => `<option value="${k}" ${k === i.status ? 'selected' : ''}>${v}</option>`).join('')}</select>
      ${i.taskId && S.items.some(x => x.id === i.taskId) ? '<span class="badge good">Task created</span>' : ''}</div>
    <div class="foot">
      <button class="vote ${mine ? 'on' : ''}" data-act="idea-vote" data-id="${i.id}" title="${votes.length ? 'Voted: ' + esc(votes.map(fname).join(', ')) : 'No votes yet'}" aria-label="Vote for this idea" aria-pressed="${mine}">${ico('up', 14)} ${votes.length}</button>
      <span class="chip" style="gap:4px;color:var(--muted)">${ico('msg', 13)} ${comments}</span>
      <span class="sp">${chip(i.createdBy)}</span></div></article>`;
}
function voteIdea(id) {
  const i = S.ideas.find(x => x.id === id); if (!i) return;
  const me = cu(), v = i.votes || [];
  i.votes = v.includes(me) ? v.filter(x => x !== me) : [...v, me];
  commit('', '');
}
function setIdeaStatus(id, status) {
  const i = S.ideas.find(x => x.id === id); if (!i || i.status === status) return;
  const from = i.status; i.status = status;
  (i.thread ||= []).push({ id: uid(), at: Date.now(), by: cu(), kind: 'change', text: `Status ${IDEA_STATUS[from]} → ${IDEA_STATUS[status]}` });
  commit(`moved idea “${i.title}” from ${IDEA_STATUS[from]} to ${IDEA_STATUS[status]}`, 'idea');
}
function ideaModal(id) {
  const i = id ? S.ideas.find(x => x.id === id) : null;
  const task = i && i.taskId ? S.items.find(x => x.id === i.taskId) : null;
  const work = !i ? '' : task
    ? `<div class="sect"><h4>Turned into work</h4><p style="margin:6px 0 0">This became the task <b>${esc(task.title)}</b> in ${esc(phaseName(task.phaseId))}. <button type="button" class="btn sm" data-act="item-open" data-id="${task.id}">Open task</button></p></div>`
    : S.phases.length
      ? `<div class="sect"><h4>Turn it into a task</h4><div class="addrow"><select id="idea-phase" aria-label="Phase for the new task">${phaseOpts(S.phases.find(p => p.status === 'Active')?.id || '')}</select><button type="button" class="btn" data-act="idea-task" data-id="${i.id}">Create task</button></div></div>`
      : '<div class="sect"><h4>Turn it into a task</h4><p class="hint">Create a phase first, then you can turn this idea into a task in it.</p></div>';
  modal({
    title: i ? 'Idea' : 'Add idea', submit: i ? 'Save changes' : 'Add idea',
    extra: i ? `<button type="button" class="btn danger" data-act="idea-del" data-id="${i.id}">Delete</button>` : '',
    body: `<div class="grid2">
      <label class="field span2">Idea<input name="title" required maxlength="140" placeholder="What is the idea?" value="${esc(i?.title)}"></label>
      <label class="field span2">Details, why it could work<textarea name="desc" rows="4">${esc(i?.desc)}</textarea></label>
      <label class="field">Tag<select name="tag">${opts(IDEA_TAGS, i?.tag || 'Product')}</select></label>
      <label class="field">Status<select name="status">${Object.entries(IDEA_STATUS).map(([k, v]) => `<option value="${k}" ${k === (i?.status || 'new') ? 'selected' : ''}>${v}</option>`).join('')}</select></label></div>
      ${i ? `<p class="hint">Shared by ${esc(fname(i.createdBy))} on ${fmtTime(i.createdAt)} · ${(i.votes || []).length} vote${(i.votes || []).length === 1 ? '' : 's'}</p>` : ''}
      ${work}
      ${i ? `<div class="sect"><h4>Discussion</h4>
        <div class="addrow"><input id="cm" placeholder="Add a thought, a risk, a next step… (Enter to post)"><button type="button" class="btn" id="cm-add">Post</button></div>
        <div class="thread" id="thread">${threadHTML(i.thread)}</div></div>` : ''}`,
    onOpen(form) {
      if (!i) return;
      const inp = $('#cm', form);
      const post = () => {
        const v = inp.value.trim(); if (!v) return;
        (i.thread ||= []).push({ id: uid(), at: Date.now(), by: cu(), kind: 'comment', text: v });
        commit(`commented on idea “${i.title}”: ${v}`, 'idea'); inp.value = ''; $('#thread', form).innerHTML = threadHTML(i.thread);
      };
      $('#cm-add', form).onclick = post;
      inp.addEventListener('keydown', ev => { if (ev.key === 'Enter') { ev.preventDefault(); post(); } });
    },
    onSubmit(fd) {
      const data = { title: fd.get('title').trim(), desc: fd.get('desc').trim(), tag: fd.get('tag'), status: fd.get('status') };
      if (!i) { S.ideas.push({ id: uid(), ...data, votes: [cu()], thread: [], createdBy: cu(), createdAt: Date.now() }); return commit(`added idea “${data.title}”`, 'idea'); }
      const from = i.status; Object.assign(i, data);
      if (from !== data.status) (i.thread ||= []).push({ id: uid(), at: Date.now(), by: cu(), kind: 'change', text: `Status ${IDEA_STATUS[from]} → ${IDEA_STATUS[data.status]}` });
      commit(`updated idea “${data.title}”`, 'idea');
    },
  });
}
function makeTaskFromIdea(id) {
  const i = S.ideas.find(x => x.id === id), phaseId = $('#idea-phase')?.value; if (!i) return;
  if (!phaseId) { toast('Pick a phase first'); return; }
  const t = { id: uid(), phaseId, title: i.title, desc: (i.desc ? i.desc + '\n\n' : '') + 'Started from an idea.', status: 'todo', assignees: [], priority: 1, due: '', est: 0,
    createdBy: cu(), createdAt: Date.now(), thread: [{ id: uid(), at: Date.now(), by: cu(), kind: 'change', text: `Created from the idea “${i.title}”` }] };
  S.items.push(t); i.taskId = t.id;
  if (i.status === 'new' || i.status === 'exploring') {
    (i.thread ||= []).push({ id: uid(), at: Date.now(), by: cu(), kind: 'change', text: `Status ${IDEA_STATUS[i.status]} → Planned (task created)` }); i.status = 'planned';
  }
  commit(`turned idea “${i.title}” into a task in ${phaseName(phaseId)}`, 'idea'); ideaModal(id); toast('Task created');
}
function delIdea(id) {
  const i = S.ideas.find(x => x.id === id); if (!i) return;
  confirmBox(`Delete the idea <b>${esc(i.title)}</b> and its discussion?${i.taskId ? ' The task made from it stays.' : ''}`, 'Delete', () => { S.ideas = S.ideas.filter(x => x.id !== id); commit(`deleted idea “${i.title}”`, 'idea'); });
}
$('#view').addEventListener('submit', e => {
  if (e.target.id !== 'idea-quick') return;
  e.preventDefault(); const fd = new FormData(e.target), title = fd.get('title').trim(); if (!title) return;
  S.ideas.push({ id: uid(), title, desc: '', tag: fd.get('tag'), status: 'new', votes: [cu()], thread: [], createdBy: cu(), createdAt: Date.now() });
  commit(`added idea “${title}”`, 'idea'); $('#idea-title')?.focus();
});

/* ---------- contacts ----------
   Stored in the same `leads` collection as before, so nothing is lost. Only name, company, email, phone, description (`about`)
   and owner are shown and edited; older fields such as stage, value and notes stay in the data untouched. */
const cf = { q: '', owner: '' };
function pgContacts() {
  setActions(`<button class="btn" data-act="contact-csv">${ico('download')} Export CSV</button><button class="btn primary" data-act="contact-add">${ico('plus')} Add contact</button>`);
  $('#view').innerHTML = `<div class="card">
    <div class="toolbar" style="margin-bottom:12px"><input class="grow" type="search" placeholder="Search name, company, email, phone…" data-filter="cf" data-k="q" value="${esc(cf.q)}">
      <select class="sel" data-filter="cf" data-k="owner" aria-label="Owner"><option value="">Any owner</option>${founderOpts(cf.owner)}</select></div>
    <div id="contact-table"></div></div>`;
  drawContacts();
}
function filteredContacts() {
  const q = cf.q.toLowerCase();
  return S.leads.filter(c => (!q || [c.name, c.company, c.email, c.phone, c.address, c.about].join(' ').toLowerCase().includes(q)) && (!cf.owner || c.owner === cf.owner))
    .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
}
/* Location: a pasted Google Maps link is used as-is (http/https only); otherwise the address is opened as a Google Maps search. */
const mapUrl = c => {
  const l = (c.mapLink || '').trim();
  if (/^https?:\/\//i.test(l)) return l;
  const a = (c.address || '').trim();
  return a ? 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(a) : '';
};
const locCell = c => {
  const u = mapUrl(c); if (!c.address && !u) return '<span class="sub">—</span>';
  return `${c.address ? `<div style="overflow-wrap:anywhere">${esc(c.address.slice(0, 120))}</div>` : ''}${u ? `<a href="${esc(u)}" target="_blank" rel="noopener noreferrer">Open in Maps</a>` : ''}`;
};
const copyBtn = (text, what) => text ? `<button class="icon-btn" data-act="copy" data-text="${esc(text)}" title="Copy ${what}" aria-label="Copy ${what}">${ico('copy', 14)}</button>` : '';
function drawContacts() {
  const el = $('#contact-table'); if (!el) return;
  if (!S.leads.length) { el.innerHTML = `<div class="empty"><h3>No contacts yet</h3><p>Keep the people you talk to here: customers, investors, vendors and partners.</p><button class="btn primary" data-act="contact-add">${ico('plus')} Add the first contact</button></div>`; return; }
  const list = filteredContacts();
  if (!list.length) { el.innerHTML = '<div class="empty">No contacts match.</div>'; return; }
  el.innerHTML = `<div class="tbl-wrap"><table><thead><tr><th>Name</th><th>Company</th><th>Email</th><th>Phone</th><th>Address / location</th><th>Description</th><th>Owner</th><th></th></tr></thead><tbody>
    ${list.map(c => `<tr style="cursor:pointer" data-act="contact-open" data-id="${c.id}">
      <td><b>${esc(c.name)}</b></td><td>${esc(c.company) || '<span class="sub">—</span>'}</td>
      <td>${c.email ? `<span style="overflow-wrap:anywhere">${esc(c.email)}</span> ${copyBtn(c.email, 'email')}` : '<span class="sub">—</span>'}</td>
      <td style="white-space:nowrap">${c.phone ? `${esc(c.phone)} ${copyBtn(c.phone, 'phone number')}` : '<span class="sub">—</span>'}</td>
      <td style="min-width:180px;max-width:280px">${locCell(c)}</td>
      <td style="min-width:200px;max-width:340px">${esc((c.about || '').slice(0, 140)) || '<span class="sub">—</span>'}</td>
      <td>${chip(c.owner)}</td>
      <td><div class="row-actions"><button class="icon-btn" data-act="contact-open" data-id="${c.id}" title="Edit" aria-label="Edit">${ico('edit')}</button><button class="icon-btn bad" data-act="contact-del" data-id="${c.id}" title="Delete" aria-label="Delete">${ico('trash')}</button></div></td></tr>`).join('')}
    </tbody><tfoot><tr><td colspan="8">${list.length} contact${list.length > 1 ? 's' : ''}</td></tr></tfoot></table></div>`;
}
function contactModal(id) {
  const c = id ? S.leads.find(x => x.id === id) : null;
  modal({
    title: c ? 'Edit contact' : 'Add contact', submit: c ? 'Save changes' : 'Add contact',
    extra: c ? `<button type="button" class="btn danger" data-act="contact-del" data-id="${c.id}">Delete</button>` : '',
    body: `<div class="grid2">
      <label class="field">Name<input name="name" required value="${esc(c?.name)}"></label>
      <label class="field">Company<input name="company" value="${esc(c?.company)}"></label>
      <label class="field">Email<input type="email" name="email" value="${esc(c?.email)}"></label>
      <label class="field">Phone number<input type="tel" name="phone" value="${esc(c?.phone)}"></label>
      <label class="field span2">Address<textarea name="address" rows="2" placeholder="Street, area, city, PIN">${esc(c?.address)}</textarea></label>
      <label class="field span2">Google Maps location link (optional)<input type="url" name="mapLink" placeholder="https://maps.app.goo.gl/…" value="${esc(c?.mapLink)}"></label>
      <label class="field span2">Owner (who looks after this contact)<select name="owner">${founderOpts(c?.owner || cu())}</select></label>
      <label class="field span2">Description<textarea name="about" rows="4" placeholder="Who they are, what they need, what was agreed">${esc(c?.about)}</textarea></label></div>`,
    onSubmit(fd) {
      const data = { name: fd.get('name').trim(), company: fd.get('company').trim(), email: fd.get('email').trim(), phone: fd.get('phone').trim(), address: fd.get('address').trim(), mapLink: fd.get('mapLink').trim(), owner: fd.get('owner'), about: fd.get('about').trim() };
      if (c) Object.assign(c, data); else S.leads.push({ id: uid(), ...data, createdAt: Date.now(), createdBy: cu() });
      commit(`${c ? 'updated' : 'added'} contact “${data.name}”${data.company ? ' (' + data.company + ')' : ''}`, 'lead');
    },
  });
}
function delContact(id) {
  const c = S.leads.find(x => x.id === id); if (!c) return;
  confirmBox(`Delete the contact <b>${esc(c.name)}</b>?`, 'Delete', () => { S.leads = S.leads.filter(x => x.id !== id); commit(`deleted contact “${c.name}”`, 'lead'); });
}
function exportContactsCSV() {
  const q = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const rows = filteredContacts().map(c => [c.name, c.company, c.email, c.phone, c.address, mapUrl(c), fname(c.owner), c.about].map(q).join(','));
  download(`contacts-${today()}.csv`, [['Name', 'Company', 'Email', 'Phone', 'Address', 'Map link', 'Owner', 'Description'].map(q).join(','), ...rows].join('\n'));
}
async function copyText(text) {
  try { await navigator.clipboard.writeText(text); toast('Copied'); } catch { toast('Could not copy. Select the text and copy it.'); }
}

/* ---------- activity ---------- */
const af = { q: '', who: '', type: '' };
const TYPE_LABEL = { expense: 'Expense', balance: 'Settlement', phase: 'Phase', item: 'Phase item', lead: 'Contact', settings: 'Settings', budget: 'Budget', idea: 'Idea' };
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
    <div class="card"><h3>Team password</h3>
      <form id="pw-form" class="grid2" autocomplete="off">
        <label class="field span2">Current password<input type="password" name="cur" required autocomplete="current-password"></label>
        <label class="field">New password<input type="password" name="new" required minlength="6" autocomplete="new-password"></label>
        <label class="field">Repeat new password<input type="password" name="again" required minlength="6" autocomplete="new-password"></label>
        <div class="span2"><button class="btn">Change password</button></div></form>
      <p class="hint">Changing it signs everyone out until they enter the new one.</p></div>
    <div class="card"><h3>Data</h3><div class="toolbar"><button class="btn" data-act="sample">Add sample data</button><button class="btn danger" data-act="reset">Erase everything</button></div>
      <p class="hint">${DB ? 'Shared workspace: everyone this page is shared with sees the same data, live.' : 'Shared storage is unavailable in this view, so data is kept only in this browser.'}</p></div></div>`;
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
  [['AWS invoice', 14500, 4, 'Cloud & Hosting', p2, a, 'monthly'], ['Co-working desk (3 seats)', 18000, 9, 'Office & Rent', '', b, 'monthly'], ['Designer stipend', 30000, 2, 'Salaries & Stipends', p2, b, 'monthly'],
   ['Figma + Notion seats', 5400, -3, 'Software & Tools', p2, c, 'monthly'], ['Annual compliance filing', 22000, 21, 'Legal & Compliance', '', a, 'yearly'], ['Domain renewals', 3800, 47, 'Software & Tools', p2, a, 'yearly'],
   ['Pilot onboarding travel', 12000, 70, 'Travel', p3, c, 'none']]
    .forEach(([title, amount, inDays, category, phaseId, owner, repeat]) => S.plans.push({ id: uid(), status: 'upcoming', title, amount, due: daysFromNow(inDays), category, phaseId, owner, repeat, link: '', notes: '', createdBy: owner, createdAt: Date.now() }));
  [['WhatsApp payment reminders', 'Send payment reminders to customers on WhatsApp automatically, so invoices get paid sooner.', 'Product', 'exploring', [a, b]],
   ['Referral rewards for early customers', 'Give the first 20 customers a month free for every company they refer.', 'Marketing', 'new', [c]],
   ['Annual plan with two months free', 'Improves cash in hand early and reduces churn.', 'Business', 'planned', [a, b, c]],
   ['Mobile app for quick expense capture', 'Snap a bill and log it in 10 seconds.', 'Product', 'parked', [a]],
   ['Apply for the state startup grant', 'Check eligibility and the deadline for this year’s scheme.', 'Funding', 'new', [b, c]]]
    .forEach(([title, desc, tag, status, votes], k) => S.ideas.push({ id: uid(), title, desc, tag, status, votes, createdBy: votes[0], createdAt: Date.now() - (k + 1) * 864e5,
      thread: k === 0 ? [{ id: uid(), at: Date.now() - 864e5, by: b, kind: 'comment', text: 'Worth a quick test with 3 pilot customers before we build it.' }] : [] }));
  const sampleHours = { 'Interview 20 target customers': [[a, 300], [b, 240]], 'Incorporate the company': [[b, 180]], 'Design onboarding flow': [[b, 420], [a, 90]], 'Build core dashboard': [[a, 600], [b, 360]], 'Payments integration': [[c, 210]] };
  S.items.forEach(i => (sampleHours[i.title] || []).forEach(([by, mins], k) => (i.logs ||= []).push({ id: uid(), by, mins, at: Date.now() - (k + 1) * 3 * 864e5, src: 'manual', note: '' })));
  S.items.forEach(i => { if (i.title === 'Build core dashboard') i.est = 24; });
  [['Priya Nair', 'Acme Retail', 'priya@acmeretail.example', '+91 98765 43210', 'Interested in a pilot of the dashboard. Wants a demo with her ops team.', b],
   ['Rahul Mehta', 'Bluepeak Capital', 'rahul@bluepeak.example', '+91 91234 56780', 'Investor intro through an advisor. Asked for the seed deck and traction numbers.', a],
   ['Sara Khan', 'FreshCart', 'sara@freshcart.example', '+91 99887 76655', 'Needs inventory insights for 40 stores. Budget approved for Q1.', c],
   ['Dev Patel', 'Orbit Labs', 'dev@orbitlabs.example', '+91 90000 11122', 'Potential integration partner. Send API docs once ready.', c],
   ['Meera Iyer', 'Northwind', 'meera@northwind.example', '+91 97777 22233', 'Signed a one-year pilot. Main contact for onboarding.', b]]
    .forEach(([name, company, email, phone, about, owner]) => S.leads.push({ id: uid(), name, company, email, phone, about, owner, createdBy: owner, createdAt: Date.now() }));
  commit('loaded sample data', 'settings');
}

/* =====================================================================
   ROUTER + EVENTS
   ===================================================================== */
const ROUTES = {
  dashboard: { title: 'Dashboard', icon: 'grid', fn: pgDashboard }, expenses: { title: 'Expenses', icon: 'wallet', fn: pgExpenses }, budget: { title: 'Budget', icon: 'pie', fn: pgBudget },
  balances: { title: 'Balances', icon: 'repeat', fn: pgBalances }, phases: { title: 'Phases', icon: 'layers', fn: pgPhases }, time: { title: 'Time tracker', icon: 'stopwatch', fn: pgTime },
  contacts: { title: 'Contacts', icon: 'users', fn: pgContacts }, ideas: { title: 'Ideas', icon: 'bulb', fn: pgIdeas }, activity: { title: 'Activity', icon: 'activity', fn: pgActivity }, settings: { title: 'Settings', icon: 'sliders', fn: pgSettings },
};
const route = () => { const r = location.hash.replace(/^#\/?/, ''); return ROUTES[r] ? r : 'dashboard'; };
function render() {
  if (!authed()) { lock().then(render); return; }
  Object.values(charts).forEach(c => c.destroy());
  const r = route();
  $('#nav').innerHTML = Object.entries(ROUTES).map(([k, v]) => `<a href="#/${k}" class="${k === r ? 'on' : ''}">${ico(v.icon)}${v.title}</a>`).join('');
  $('#page-title').textContent = ROUTES[r].title;
  $('#brand-name').textContent = S.settings.company;
  document.title = `${ROUTES[r].title} · ${S.settings.company}`;
  $('#me').innerHTML = `${chip(cu())}<button class="btn sm" data-act="logout">Sign out</button>`;
  ROUTES[r].fn();
  if (!canWrite) $('#view').insertAdjacentHTML('afterbegin', '<div class="card" style="border-color:var(--warn)"><b>View-only access.</b> Changes you make here will not be saved. Ask the owner to share this page with you as a Contributor.</div>');
  window.scrollTo({ top: 0 });
}

const ACTIONS = {
  'exp-add': () => expModal(), 'exp-edit': d => expModal(d.id), 'exp-del': d => delExpense(d.id), 'exp-csv': exportCSV,
  'set-add': d => setModal(d), 'set-del': d => { const s = S.settlements.find(x => x.id === d.id); confirmBox('Delete this settlement record?', 'Delete', () => { S.settlements = S.settlements.filter(x => x.id !== d.id); commit(`deleted settlement ${fname(s.from)} → ${fname(s.to)} (${fmt(s.amount)})`, 'balance'); }); },
  'ph-add': () => phaseModal(), 'ph-edit': d => phaseModal(d.id), 'ph-del': d => delPhase(d.id), 'ph-left': d => shiftPhase(d.id, -1), 'ph-right': d => shiftPhase(d.id, 1),
  'item-add': d => itemModal(null, d.phase), 'item-open': d => itemModal(d.id), 'item-del': d => delItem(d.id),
  'contact-add': () => contactModal(), 'contact-open': d => contactModal(d.id), 'contact-del': d => delContact(d.id), 'contact-csv': exportContactsCSV, copy: d => copyText(d.text),
  sample: () => { if (S.expenses.length || S.phases.length || S.leads.length) confirmBox('Add sample data on top of your existing data?', 'Add sample data', loadSample); else loadSample(); },
  reset: () => confirmBox('This permanently erases ALL expenses, phases, leads and activity for everyone using this workspace. Download a backup first if unsure.', 'Erase everything', () => { const s = S.settings; S = fresh(); S.settings = s; save(); render(); toast('Everything erased'); }),
  export: () => download(`founders-hub-backup-${today()}.json`, JSON.stringify({ ...S, settings: { ...S.settings, passHash: undefined } }, null, 2), 'application/json'),
  import: () => $('#imp').click(),
  logout: () => { session = null; try { localStorage.removeItem(AUTH_KEY); } catch { } render(); },
  'idea-add': () => ideaModal(), 'idea-open': d => ideaModal(d.id), 'idea-vote': d => voteIdea(d.id), 'idea-task': d => makeTaskFromIdea(d.id), 'idea-del': d => delIdea(d.id),
  'plan-add': () => planModal(), 'plan-edit': d => planModal(d.id), 'plan-open': d => planModal(d.id), 'plan-del': d => delPlan(d.id), 'plan-pay': d => payPlan(d.id),
  'budget-edit': d => budgetModal(d.id), 'budget-total': () => totalBudgetModal(),
  'tt-person': d => { tf.who = d.id || ''; render(); }, 'tt-csv': exportTimeCSV,
  'timer-toggle': d => toggleTimer(d.id), 'log-del': d => delLog(d.item, d.id),
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
  idf: (v, t) => { idf[t.dataset.k] = v; drawIdeas(); }, ideastatus: (v, t) => setIdeaStatus(t.dataset.id, v),
  bf: (v, t) => { bf[t.dataset.k] = v; drawPlanTable(); },
  tf: (v, t) => { tf[t.dataset.k] = v; drawTimeTables(); },
  itemstatus: (v, t) => setItemStatus(t.dataset.id, v),
  ef: (v, t) => { ef[t.dataset.k] = v; drawExpTable(); }, cf: (v, t) => { cf[t.dataset.k] = v; drawContacts(); }, af: (v, t) => { af[t.dataset.k] = v; drawActivity(); },
};
// filters live both in the page and in the top bar, so listen on the whole document
document.addEventListener('input', e => { const t = e.target.closest?.('[data-filter]'); if (t) FILTERS[t.dataset.filter]?.(t.value, t); });
$('#view').addEventListener('submit', async e => {
  if (e.target.id === 'pw-form') {
    e.preventDefault(); const fd = new FormData(e.target), nw = fd.get('new');
    if (await sha(fd.get('cur')) !== passHash()) { toast('The current password is wrong'); return; }
    if (nw.length < 6) { toast('Use at least 6 characters'); return; }
    if (nw !== fd.get('again')) { toast('The two new passwords do not match'); return; }
    S.settings.passHash = await sha(nw); setAuth(cu());
    commit('changed the team password', 'settings'); toast('Password changed. Everyone else will be asked to sign in again.');
    return;
  }
  if (e.target.id !== 'settings-form') return;
  e.preventDefault(); applySettings(new FormData(e.target)); commit('updated settings', 'settings'); toast('Settings saved');
});
$('#modal').addEventListener('close', () => { if (!$('#modal').open) $('#modal').innerHTML = ''; if (!inflight) applyIncoming(); render(); });
$('#modal').addEventListener('click', e => { if (e.target === e.currentTarget) e.currentTarget.close(); });
$('#imp').addEventListener('change', e => {
  const f = e.target.files[0]; e.target.value = ''; if (!f) return;
  f.text().then(txt => {
    let data; try { data = JSON.parse(txt); if (!data.settings || !Array.isArray(data.expenses)) throw 0; } catch { toast('That file is not a valid backup'); return; }
    confirmBox(`Replace ALL current data with this backup (${data.expenses.length} expenses, ${(data.phases || []).length} phases, ${(data.leads || []).length} leads)?`, 'Restore', () => { const keep = S.settings.passHash; S = normalize(data); S.settings.passHash = keep; log('restored a backup', 'settings'); save(); render(); toast('Backup restored'); });
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
});

window.addEventListener('hashchange', render);
// keep running clocks and totals ticking without re-rendering the page
setInterval(() => {
  $$('[data-run-start]').forEach(el => el.textContent = fmtClock(Date.now() - +el.dataset.runStart));
  $$('[data-total-item]').forEach(el => { const i = S.items.find(x => x.id === el.dataset.totalItem); if (i) el.textContent = fmtDur(itemMins(i)); });
  $$('[data-total-phase]').forEach(el => el.textContent = fmtDur(phaseMins(el.dataset.totalPhase)));
  $$('[data-tt]').forEach(el => el.textContent = fmtDur(userMins(el.dataset.who, el.dataset.p)));
  $$('[data-total-all]').forEach(el => el.textContent = fmtDur(sum(S.items.map(itemMins))));
}, 1000);

/* ---------- sign in ----------
   A shared team password in front of the app. The check runs in the page, so it keeps casual visitors out and records who
   is acting; it is not a substitute for the artifact's Share list, which controls who can open or change the data at all. */
let session = null, lockP = null;
async function sha(pw) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('nest-hub|' + pw));
  return [...new Uint8Array(buf)].map(x => x.toString(16).padStart(2, '0')).join('');
}
const passHash = () => S.settings.passHash || DEFAULT_PASS_HASH;
function authed() {
  let a = session;
  if (!a) { try { a = JSON.parse(localStorage.getItem(AUTH_KEY)); } catch { a = null; } }
  if (!a || a.h !== passHash() || !fById(a.who)) return false;
  meId = a.who; return true;
}
function setAuth(who) {
  meId = who; persistMe(); session = { who, h: passHash() };
  try { localStorage.setItem(AUTH_KEY, JSON.stringify(session)); } catch { }
}
function lock() {
  if (lockP) return lockP;
  if ($('#modal').open) $('#modal').close();
  lockP = new Promise(resolve => {
    const el = document.createElement('div'); el.id = 'login';
    el.innerHTML = `<form class="login-card">
      <div class="logo">N</div><h2>Sign in to ${esc(S.settings.company)}</h2>
      <p class="hint" style="margin:0">Founders only. Choose your name and enter the team password.</p>
      <label class="field">Who are you<select name="who">${founderOpts(cu())}</select></label>
      <label class="field">Password<input type="password" name="pw" required autocomplete="current-password"></label>
      <p class="login-err" role="alert" hidden></p>
      <button class="btn primary block">Sign in</button></form>`;
    document.body.appendChild(el);
    const form = $('form', el), err = $('.login-err', el);
    form.pw.focus();
    form.onsubmit = async e => {
      e.preventDefault();
      let h; try { h = await sha(form.pw.value); } catch { err.textContent = 'This browser cannot check passwords.'; err.hidden = false; return; }
      if (h === passHash()) { setAuth(form.who.value); el.remove(); lockP = null; resolve(); return; }
      err.textContent = 'Wrong password. Try again.'; err.hidden = false; form.pw.value = ''; form.pw.focus();
    };
  });
  return lockP;
}

/* ---------- boot ---------- */
(async function boot() {
  try { DB = window.claude ? await window.claude.use('db') : null; } catch { DB = null; }
  if (DB) {
    setSync('busy');
    const ps = [watch(DB.doc('meta/settings'), snap => { if (snap.exists) incomingSettings = clone(snap.data()); })];
    COLS.forEach(c => ps.push(watch(DB.collection(c), snap => { incoming[c] = snap.docs.map(d => clone(d.data())); })));
    await Promise.race([Promise.all(ps), new Promise(r => setTimeout(r, 8000))]);
    applyIncoming(); setSync('ok');
    await loadMe();
  } else {
    try { const r = JSON.parse(localStorage.getItem(KEY)); if (r && r.settings) S = normalize(r); } catch { }
    setSync('local');
  }
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => render());
  new MutationObserver(() => render()).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  if (!authed()) await lock();
  render();
  if (!S.settings.setup) { S.settings.setup = true; save(); setupModal(); }
})();
