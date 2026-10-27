/* SN Logistics vendor portal: a verified vendor raises pickup requests, sees their pickups and LRs, tracks them, and
   keeps their onboarding documents up to date. SN Logistics admins can sign in with Google to see any vendor's view. */
(function () {
'use strict';
const $ = s => document.querySelector(s);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = (n, w) => String(n).padStart(w, '0');
const today = () => { const d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1, 2) + '-' + pad(d.getDate(), 2); };
const fd = k => k ? new Date(k + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
const fdt = t => t ? new Date(+t).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : '';
let tt; const toast = (m, bad) => { let t = $('.toast'); if (!t) { t = document.createElement('div'); t.className = 'toast'; document.body.appendChild(t); } t.textContent = m; t.classList.toggle('bad', !!bad); clearTimeout(tt); tt = setTimeout(() => t.remove(), 3200); };
const cfg = window.MOVANA_FIREBASE_CONFIG; if (!cfg || !window.firebase) { document.body.textContent = 'Could not load. Check the internet and open again.'; return; }
const app = firebase.apps.length ? firebase.app() : firebase.initializeApp(cfg), auth = app.auth(), fs = app.firestore();
const DOMAIN = 'staff.movana.app', toEmail = u => { u = String(u || '').trim().toLowerCase(); return u.includes('@') ? u : u.replace(/[^a-z0-9._-]/g, '') + '@' + DOMAIN; };
const DOCS = [['GST', 'GST registration certificate'], ['PAN', 'PAN card'], ['BANK', 'Cancelled cheque / bank proof'], ['ADDR', 'Address proof (shop / factory)'], ['AGR', 'Signed vendor agreement']];
const VST = { Draft: '#6b7280', Submitted: '#b54708', Verified: '#0c9b76', Rejected: '#d92d20', Blocked: '#d92d20' };
const PST = p => p.hht === 'Completed' ? (p.inbound === 'Received' ? 'At hub' : 'Picked up – in transit') : p.hht === 'Labelled' ? 'Executive at your place' : p.hht === 'Accepted' ? 'Executive on the way' : p.exec ? 'Executive assigned' : 'Requested';
const V = { me: null, v: null, admin: false, tab: 'home', pk: [], all: [], un: [], gpend: false };
const svg = d => '<svg viewBox="0 0 24 24" aria-hidden="true">' + d + '</svg>';
const IC = { home: '<path d="M3 11l9-8 9 8v10H3z"/><path d="M9 21v-6h6v6"/>', req: '<path d="M12 5v14M5 12h14"/>', list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>', me: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/>' };

/* ---------- sign in ---------- */
const showLogin = m => { $('#app').hidden = true; $('#login').hidden = false; $('#le').textContent = m || ''; };
$('#lf').addEventListener('submit', async e => { e.preventDefault(); const b = $('#lb'); b.disabled = true; $('#le').textContent = 'Signing in…';
  try { await auth.signInWithEmailAndPassword(toEmail($('#lu').value), $('#lp').value); $('#lp').value = ''; }
  catch (x) { $('#le').textContent = ['auth/invalid-credential', 'auth/wrong-password', 'auth/user-not-found'].includes(x.code) ? 'Wrong username or password.' : x.code === 'auth/too-many-requests' ? 'Too many tries. Wait a few minutes.' : 'Could not sign in (' + (x.code || 'error') + ').'; }
  finally { b.disabled = false; } });
$('#lg').addEventListener('click', async () => {
  const b = $('#lg'); b.disabled = true; $('#le').textContent = '';
  try { const pr = new firebase.auth.GoogleAuthProvider(); pr.setCustomParameters({ prompt: 'select_account' }); V.gpend = true; const r = await auth.signInWithPopup(pr);
    let ok = false; try { const m = await fs.doc('members/' + r.user.uid).get(); ok = m.exists && m.data().status !== 'Suspended'; } catch (x) {}
    if (!ok) { const em = String(r.user.email || '').toLowerCase(); let g = null; try { const d = await fs.doc('gmail/' + em).get(); g = d.exists ? d.data() : null; } catch (x) {}
      if (g && g.role) { const now = Date.now(); try { await fs.doc('members/' + r.user.uid).set({ role: g.role, status: 'Active', staff: g.staff || '', google: em, createdAt: now, updatedAt: now, addedBy: r.user.uid }); await fs.doc('users/' + r.user.uid).set({ name: g.name || r.user.displayName || em, username: em, createdAt: now }); ok = true; } catch (x) {} } }
    if (!ok) { try { r.additionalUserInfo && r.additionalUserInfo.isNewUser ? await r.user.delete() : await auth.signOut(); } catch (x) { await auth.signOut(); } V.gpend = false; $('#le').textContent = 'This Google account is not an approved SN Logistics admin.'; }
  } catch (x) { if (!['auth/popup-closed-by-user', 'auth/cancelled-popup-request'].includes(x.code)) $('#le').textContent = 'Google sign-in failed (' + (x.code || 'error') + ').'; }
  finally { b.disabled = false; if (V.gpend) { V.gpend = false; onUser(auth.currentUser); } } });
$('#out').addEventListener('click', async () => { V.un.forEach(f => f()); V.un = []; await auth.signOut(); });

async function onUser(u) {
  V.un.forEach(f => f()); V.un = []; V.v = null; V.admin = false; V.pk = [];
  if (!u) { showLogin(); return; }
  V.me = u.uid;
  /* staff admin (Google or staff login) → preview any vendor */
  let m = null; try { const d = await fs.doc('members/' + u.uid).get(); m = d.exists ? d.data() : null; } catch (x) {}
  let own = false; try { const o = await fs.doc('settings/owner').get(); own = o.exists && o.data().uid === u.uid; } catch (x) {}
  if (own || (m && m.status !== 'Suspended' && [m.role].concat(m.roles || []).some(r => ['superadmin', 'admin_head', 'director', 'gm', 'ops_manager', 'pickup_coord', 'vendor_coord'].includes(r) || /^ops_(mgr|srm|gm|sgm|avp|vp|svp|tl|am)$/.test(r)))) {
    V.admin = true; $('#login').hidden = true; $('#app').hidden = false; $('#vn').textContent = 'Vendor portal'; $('#vc').textContent = 'Admin preview';
    V.un.push(fs.collection('pvendors').onSnapshot(s => { V.all = s.docs.map(d => Object.assign({ _id: d.id }, d.data())).sort((a, b) => String(a.name).localeCompare(String(b.name))); render(); }, () => {}));
    render(); return;
  }
  /* vendor */
  try { const s = await fs.collection('pvendors').where('uid', '==', u.uid).limit(1).get();
    if (s.empty) { await auth.signOut(); showLogin('This login is not active. Contact SN Logistics.'); return; }
    $('#login').hidden = true; $('#app').hidden = false; V.tab = 'home';
    watchVendor(s.docs[0].id);
  } catch (x) { await auth.signOut(); showLogin('Could not open your account (' + (x.code || 'error') + ').'); return; }
  render();
}
auth.onAuthStateChanged(u => { if (!V.gpend) onUser(u); });
function watchVendor(id) {
  V.un.push(fs.collection('pvendors').doc(id).onSnapshot(d => { V.v = d.exists ? Object.assign({ _id: d.id }, d.data()) : null;
    if (V.v && !V.admin && (V.v.uid !== V.me || V.v.status === 'Blocked')) { auth.signOut(); showLogin(V.v.status === 'Blocked' ? 'Your vendor account is blocked. Contact SN Logistics.' : 'This login was replaced. Use your new login.'); return; }
    $('#vn').textContent = V.v ? V.v.name : 'Vendor'; $('#vc').textContent = V.v ? V.v.code + (V.admin ? ' · admin preview' : '') : ''; render(); }, () => {}));
  const q = V.admin ? fs.collection('pickups').where('vendorId', '==', id) : fs.collection('pickups').where('vendorUid', '==', V.me);
  V.un.push(q.onSnapshot(s => { V.pk = s.docs.map(d => Object.assign({ _id: d.id }, d.data())).sort((a, b) => (+b.createdAt || 0) - (+a.createdAt || 0)); render(); }, () => {}));
}

/* ---------- back: every tab is a step in the phone's history; ← at the top goes back one step ---------- */
let vnPop = false, vnLast = null;
function vnTrack() { const k = (V.v ? V.v._id : '') + '|' + V.tab; const b = $('#vback'); if (b) b.hidden = V.tab === 'home' && !(V.admin && V.v);
  if (k === vnLast) return; const st = { vt: V.tab, vid: V.admin && V.v ? V.v._id : null };
  if (vnLast === null) history.replaceState(st, ''); else if (!vnPop) history.pushState(st, ''); vnLast = k; vnPop = false; }
addEventListener('popstate', e => { const st = e.state; if (!st || $('#app').hidden) return; vnPop = true; V.tab = st.vt || 'home';
  if (V.admin && !st.vid && V.v) { V.un.splice(1).forEach(f => f()); V.v = null; V.pk = []; } render(); scrollTo(0, 0); });
document.addEventListener('click', e => { if (!e.target.closest('#vback')) return; if (history.state && vnLast !== null && history.length > 1) history.back(); else { V.tab = 'home'; render(); } });
/* ---------- screens ---------- */
function render() {
  if ($('#app').hidden) return;
  try { vnTrack(); } catch (e) {}
  if (V.admin && !V.v) { $('#bar').innerHTML = ''; $('#main').innerHTML = '<div class="ph"><div><h1>Vendor portal · admin preview</h1><p>Open any vendor to see exactly what they see.</p></div></div>' + (V.all.length ? V.all.map(v => '<button class="pk" type="button" data-pv="' + esc(v._id) + '"><div class="t"><b>' + esc(v.name) + '</b><span class="st" style="--c:' + (VST[v.status] || '#6b7280') + '">' + esc(v.status || 'Draft') + '</span></div><div class="m">' + esc([v.code, v.city, v.uid ? 'login: ' + v.username : 'no login'].filter(Boolean).join(' · ')) + '</div></button>').join('') : '<div class="card mute">No vendors yet.</div>'); return; }
  const v = V.v; if (!v) { $('#main').innerHTML = '<div class="card mute">Loading…</div>'; return; }
  const ok = v.status === 'Verified';
  $('#bar').innerHTML = [['home', 'Home', 'home'], ['req', 'Request pickup', 'req'], ['list', 'My pickups', 'list'], ['me', 'Account', 'me']].map(([id, l, ic]) => '<button type="button" data-t="' + id + '"' + (V.tab === id ? ' aria-current="page"' : '') + '>' + svg(IC[ic]) + l + '</button>').join('');
  const pre = V.admin ? '<div class="banner w">Admin preview of ' + esc(v.name) + ' – read only. <button class="btn sm" type="button" data-a="pv-back">All vendors</button></div>' : '';
  let h = '';
  if (V.tab === 'home') {
    const open = V.pk.filter(p => p.hht !== 'Completed' && p.stage !== 'Cancelled'), done = V.pk.filter(p => p.hht === 'Completed');
    h = '<div class="ph"><div><h1>Hello, ' + esc(v.contact || v.name) + '</h1><p>' + esc(v.code) + ' · ' + esc(v.city || '') + '</p></div><span class="st" style="--c:' + (VST[v.status] || '#6b7280') + '">' + esc(v.status) + '</span></div>' +
      (ok ? '<div class="banner g">Your account is verified. You can request pickups.</div>' : v.status === 'Rejected' ? '<div class="banner b">Correction needed: ' + esc(v.rejectWhy || '') + '. Upload the corrected documents under Account.</div>' : '<div class="banner w">Your documents are being verified by SN Logistics. You can request pickups once verified.</div>') +
      '<div class="card"><div class="kv"><span>Open pickups</span><b>' + open.length + '</b><span>Picked up (all time)</span><b>' + done.length + '</b><span>Last LR</span><b>' + esc((done[0] && done[0].lr) || '—') + '</b></div></div>' +
      (ok && !V.admin ? '<button class="btn p full" type="button" data-t="req">+ Request a pickup</button>' : '');
  } else if (V.tab === 'req') {
    h = !ok ? '<div class="card mute">Pickups can be requested once your account is verified.</div>' : V.admin ? '<div class="card mute">Admins cannot raise pickups for a vendor here – use SN Pickup › Assign.</div>' :
      '<form class="card" id="rf"><h2>Request a pickup</h2><p class="mute small">From: ' + esc(v.address || '') + ', ' + esc(v.city || '') + ' ' + esc(v.pin || '') + '</p>' +
      '<div class="row"><label class="f">Pickup date<input name="date" type="date" min="' + today() + '" value="' + today() + '" required></label><label class="f">Time slot<select name="slot"><option>06–09</option><option selected>09–12</option><option>12–15</option><option>15–18</option><option>18–21</option></select></label></div>' +
      '<div class="row"><label class="f">Approx. boxes<input name="pieces" type="number" min="1" inputmode="numeric" required></label><label class="f">Your ref / invoice no<input name="ref"></label></div>' +
      '<div class="row"><label class="f">Deliver to pincode<input name="toPin" inputmode="numeric" maxlength="6" required></label><label class="f">Consignee name<input name="cname"></label></div>' +
      '<label class="f">Destination address<textarea name="caddr"></textarea></label><label class="f">Pickup contact on site / notes<textarea name="notes"></textarea></label>' +
      '<p class="err" id="re"></p><button class="btn p full">Send pickup request</button></form>';
  } else if (V.tab === 'list') {
    h = '<div class="ph"><div><h1>My pickups</h1><p>' + V.pk.length + ' in all · updates live</p></div></div>' + (V.pk.length ? V.pk.map(p => '<div class="pk"><div class="t"><b>' + esc(p.no || 'Pickup') + '</b><span class="st" style="--c:' + (p.hht === 'Completed' ? '#0c9b76' : '#b54708') + '">' + esc(PST(p)) + '</span></div><div class="m">' + esc(fd(p.date) + (p.slot ? ' · ' + p.slot : '') + ' · ' + (p.pieces || '?') + ' boxes → ' + (p.toCity || p.toPin || '')) + '</div>' +
      (p.lr ? '<div class="m">LR <b>' + esc(p.lr) + '</b> · picked ' + esc(fdt(p.pickedAt)) + ' · <a href="../#track=' + esc(p.lr) + '" target="_blank" rel="noopener">Track</a></div>' : p.execName ? '<div class="m">Executive: ' + esc(p.execName) + '</div>' : '') + (!V.admin && p.stage === 'Requested' && !p.exec ? '<div class="row" style="margin-top:8px"><button class="btn sm d" type="button" data-cx="' + esc(p._id) + '">Cancel request</button></div>' : '') + '</div>').join('') : '<div class="card mute">No pickups yet.</div>');
  } else {
    const ds = v.docs || {};
    h = '<div class="ph"><div><h1>Account</h1><p>' + esc(v.name) + '</p></div></div><div class="card"><div class="kv">' + [['Vendor code', v.code], ['GSTIN', v.gstin], ['PAN', v.pan], ['Contact', v.contact + ' · ' + v.phone], ['Address', v.address + ', ' + v.city + ' ' + v.pin], ['Bank', v.bank ? (v.bank.bankName || '') + ' · XXXX' + String(v.bank.acct || '').slice(-4) : ''], ['Status', v.status]].map(r => '<span>' + r[0] + '</span><b>' + esc(r[1] || '') + '</b>').join('') + '</div><p class="small mute">To change these details, contact SN Logistics.</p></div>' +
      '<div class="card"><h2>Documents</h2>' + DOCS.map(([k, l]) => { const d = ds[k]; return '<div style="display:flex;gap:10px;align-items:center;padding:9px 0;border-top:1px solid var(--line);flex-wrap:wrap"><div style="flex:1 1 170px"><b>' + esc(l) + '</b><div class="small mute">' + (d ? esc((d.name || '') + (d.note ? ' · ' + d.note : '')) : 'Not uploaded') + '</div></div><span class="st" style="--c:' + (!d ? '#6b7280' : d.s === 'Verified' ? '#0c9b76' : d.s === 'Rejected' ? '#d92d20' : '#b54708') + '">' + esc(d ? d.s : 'Missing') + '</span>' + (!V.admin && v.status !== 'Verified' && (!d || d.s === 'Rejected') ? '<button class="btn sm" type="button" data-up="' + k + '">Upload</button>' : '') + '</div>'; }).join('') + '</div>' +
      (V.admin ? '' : '<form class="card" id="pf"><h2>Change password</h2><label class="f">Current password<input name="o" type="password" required autocomplete="current-password"></label><label class="f">New password<input name="n" type="password" minlength="8" required autocomplete="new-password"></label><p class="err" id="pe"></p><button class="btn">Change password</button></form>');
  }
  $('#main').innerHTML = pre + h;
}

/* ---------- actions ---------- */
document.addEventListener('click', e => {
  const t = e.target.closest('[data-t]'); if (t) { V.tab = t.dataset.t; render(); scrollTo(0, 0); return; }
  const pv = e.target.closest('[data-pv]'); if (pv) { V.tab = 'home'; watchVendor(pv.dataset.pv); return; }
  const a = e.target.closest('[data-a]'); if (a && a.dataset.a === 'pv-back') { V.un.splice(1).forEach(f => f()); V.v = null; V.pk = []; render(); return; }
  const u = e.target.closest('[data-up]'); if (u) upload(u.dataset.up);
  const cx = e.target.closest('[data-cx]'); if (cx) cancelReq(cx.dataset.cx);
});
/* in-app box (no browser popups) */
function askBox(text, okText) { return new Promise(res => { const w = document.createElement('div');
  w.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;padding:18px';
  w.innerHTML = '<div style="background:var(--card,#fff);color:var(--ink,#111);border-radius:20px;padding:20px;max-width:420px;width:100%"><p style="margin:0 0 12px;line-height:1.5">' + esc(text) + '</p><textarea rows="3" maxlength="200" placeholder="Reason" style="width:100%;box-sizing:border-box;font:inherit;padding:10px;border-radius:12px;border:1px solid #d0d5dd"></textarea><div class="row" style="margin-top:12px;justify-content:flex-end;gap:8px"><button class="btn" type="button" data-k="0">Keep</button><button class="btn d" type="button" data-k="1">' + esc(okText) + '</button></div></div>';
  document.body.appendChild(w); const ta = w.querySelector('textarea');
  w.addEventListener('click', ev => { const b = ev.target.closest('[data-k]'); if (!b && ev.target !== w) return; if (b && b.dataset.k === '1' && !ta.value.trim()) { ta.focus(); return; } w.remove(); res(b && b.dataset.k === '1' ? ta.value.trim() : ''); }); }); }
async function cancelReq(id) {
  const p = V.pk.find(x => x._id === id); if (!p || p.stage !== 'Requested' || p.exec) return;
  const why = await askBox('Cancel pickup request ' + (p.no || '') + '?', 'Cancel request'); if (!why) return;
  const now = Date.now();
  try { await fs.collection('pickups').doc(id).update({ stage: 'Cancelled', hht: 'Cancelled', cancelWhy: why.slice(0, 200), updatedAt: now, events: (p.events || []).concat([{ s: 'Cancelled', t: now, n: 'Cancelled by vendor: ' + why.slice(0, 120) }]).slice(-60) }); toast('Pickup request cancelled.'); }
  catch (x) { toast('Could not cancel (' + (x.code || 'error') + ').', true); }
}
document.addEventListener('submit', async e => {
  e.preventDefault(); const f = e.target, v = V.v; if (!v) return;
  if (f.id === 'rf') { const d = Object.fromEntries(new FormData(f)), er = $('#re');
    if (!/^\d{6}$/.test(d.toPin)) { er.textContent = 'Pincode must be 6 digits.'; return; }
    const now = Date.now(); let no;
    try { const ref = fs.doc('counters/pickup'); const n = await fs.runTransaction(async t => { const c = await t.get(ref), v = (c.exists ? +c.data().n || 0 : 0) + 1; t.set(ref, { n: v, at: now }); return v; }); no = 'PU' + String(n).padStart(5, '0'); }
    catch (x) { er.textContent = 'Could not get a pickup number (' + (x.code || 'error') + '). Try again.'; return; }
    let to = null; try { const r = await fetch('https://api.postalpincode.in/pincode/' + d.toPin), j = await r.json(), po = j && j[0] && j[0].PostOffice && j[0].PostOffice[0]; if (po) to = { city: po.District, state: po.State }; } catch (x) {}
    const doc = { no, source: 'vendor', vendorId: v._id, vendorUid: V.me, customer: v.name, shipper: { id: v._id, name: v.name, code: v.code, gstin: v.gstin, phone: v.phone, address: v.address, pin: v.pin, city: v.city, state: v.state, uid: V.me },
      date: d.date, slot: d.slot, pieces: +d.pieces || '', ref: d.ref, fromPin: v.pin, fromCity: v.city, fromState: v.state, fromAddress: v.address, toPin: d.toPin, toCity: to ? to.city : '', toState: to ? to.state : '',
      consigneeHint: { name: d.cname, address: d.caddr }, toAddress: d.caddr, notes: d.notes, stage: 'Requested', events: [{ s: 'Requested', t: now, n: 'Raised by vendor ' + v.code }], createdAt: now, updatedAt: now, createdBy: V.me };
    try { await fs.collection('pickups').doc().set(doc); toast('Pickup requested · ' + no); V.tab = 'list'; render(); } catch (x) { er.textContent = 'Could not send (' + (x.code || 'error') + ').'; }
    return; }
  if (f.id === 'pf') { const er = $('#pe');
    try { const u = auth.currentUser; await u.reauthenticateWithCredential(firebase.auth.EmailAuthProvider.credential(u.email, f.o.value)); await u.updatePassword(f.n.value); f.reset(); toast('Password changed.'); }
    catch (x) { er.textContent = ['auth/invalid-credential', 'auth/wrong-password'].includes(x.code) ? 'Current password is wrong.' : x.code === 'auth/weak-password' ? 'Use at least 8 characters.' : 'Could not change (' + (x.code || 'error') + ').'; } }
});
function upload(k) {
  const v = V.v, i = document.createElement('input'); i.type = 'file'; i.accept = 'image/*,application/pdf';
  i.onchange = async () => { const f = i.files && i.files[0]; if (!f) return; let data = '';
    if (/^image\//.test(f.type)) data = await new Promise(ok => { const img = new Image(), u = URL.createObjectURL(f); img.onload = () => { const sc = Math.min(1, 1500 / Math.max(img.width, img.height)), c = document.createElement('canvas'); c.width = Math.round(img.width * sc); c.height = Math.round(img.height * sc); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); let q = .75, d = c.toDataURL('image/jpeg', q); while (d.length > 700000 && q > .3) { q -= .1; d = c.toDataURL('image/jpeg', q); } ok(d); }; img.src = u; });
    else if (f.type === 'application/pdf' && f.size <= 700000) data = await new Promise(ok => { const r = new FileReader(); r.onload = () => ok(r.result); r.readAsDataURL(f); });
    else { toast('Use a photo, or a PDF under 700 KB.', true); return; }
    const now = Date.now();
    try { await fs.doc('pvdocs/' + v._id + '_' + k).set({ vid: v._id, type: k, name: f.name.slice(0, 80), mime: f.type, data, size: data.length, at: now, by: V.me, byName: v.name, vendorUid: V.me });
      await fs.collection('pvendors').doc(v._id).update({ ['docs.' + k]: { s: 'Uploaded', name: f.name.slice(0, 80), at: now, by: v.name + ' (vendor)' }, status: 'Submitted', updatedAt: now }); toast('Uploaded. SN Logistics will verify it.'); }
    catch (x) { toast('Could not upload (' + (x.code || 'error') + ').', true); } };
  i.click();
}
})();
