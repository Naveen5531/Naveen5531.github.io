/* SN Pickup › Vendors: onboarding with mandatory documents, live checks, maker-checker verification and the vendor's
   own login. Loaded by pickup/index.html; uses its shared helpers through window.SNP. */
(function () {
'use strict';
const P = window.SNP; if (!P) return;
const { $, $$, esc, num, toast, fs, S, fd, fdt, pinInfo } = P;

/* ---------- checks that run live ---------- */
const GST_STATES = { '01': 'Jammu and Kashmir', '02': 'Himachal Pradesh', '03': 'Punjab', '04': 'Chandigarh', '05': 'Uttarakhand', '06': 'Haryana', '07': 'Delhi', '08': 'Rajasthan', '09': 'Uttar Pradesh', '10': 'Bihar', '11': 'Sikkim', '12': 'Arunachal Pradesh', '13': 'Nagaland', '14': 'Manipur', '15': 'Mizoram', '16': 'Tripura', '17': 'Meghalaya', '18': 'Assam', '19': 'West Bengal', '20': 'Jharkhand', '21': 'Odisha', '22': 'Chhattisgarh', '23': 'Madhya Pradesh', '24': 'Gujarat', '26': 'Dadra and Nagar Haveli and Daman and Diu', '27': 'Maharashtra', '29': 'Karnataka', '30': 'Goa', '31': 'Lakshadweep', '32': 'Kerala', '33': 'Tamil Nadu', '34': 'Puducherry', '35': 'Andaman and Nicobar Islands', '36': 'Telangana', '37': 'Andhra Pradesh', '38': 'Ladakh' };
const PAN_TYPE = { P: 'Individual', C: 'Company', H: 'HUF', F: 'Firm / LLP', A: 'Association of persons', T: 'Trust', B: 'Body of individuals', L: 'Local authority', J: 'Artificial juridical person', G: 'Government' };
const AL = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
function gstCheck(g) {          // GSTIN check digit (mod 36), as used by the GST network
  if (!/^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(g)) return false;
  let sum = 0; for (let i = 0; i < 14; i++) { const p = AL.indexOf(g[i]) * (i % 2 ? 2 : 1); sum += Math.floor(p / 36) + p % 36; }
  return AL[(36 - sum % 36) % 36] === g[14];
}
const panOk = p => /^[A-Z]{3}[PCHFATBLJG][A-Z]\d{4}[A-Z]$/.test(p);
const ifscOk = i => /^[A-Z]{4}0[A-Z0-9]{6}$/.test(i);
async function ifscInfo(i) { try { const r = await fetch('https://ifsc.razorpay.com/' + i); if (!r.ok) return null; const j = await r.json(); return { bank: j.BANK, branch: j.BRANCH, city: j.CITY, state: j.STATE }; } catch (e) { return undefined; } }
/** All automatic checks for a vendor record: [label, ok (true/false/null = pending), detail] */
function checks(v) {
  const g = String(v.gstin || ''), pan = String(v.pan || ''), out = [];
  out.push(['GSTIN format and check digit', g ? gstCheck(g) : false, g ? (gstCheck(g) ? 'Valid GSTIN' : 'Not a valid GSTIN – check every character') : 'Missing']);
  out.push(['PAN format', panOk(pan), panOk(pan) ? (PAN_TYPE[pan[3]] || '') + ' PAN' : 'Missing or wrong format']);
  out.push(['PAN matches GSTIN', g && pan ? g.slice(2, 12) === pan : false, g && pan ? (g.slice(2, 12) === pan ? 'Same PAN inside the GSTIN' : 'GSTIN has PAN ' + g.slice(2, 12)) : '']);
  const gs = GST_STATES[g.slice(0, 2)];
  out.push(['GSTIN state matches address', gs && v.state ? gs.toLowerCase() === String(v.state).toLowerCase() : false, gs ? 'GSTIN state: ' + gs + (v.state ? ' · address: ' + v.state : '') : '']);
  out.push(['Pincode exists', v.pinOk === true ? true : v.pinOk === false ? false : null, v.city ? v.city + ', ' + (v.state || '') : '']);
  out.push(['IFSC is a real bank branch', v.bank && v.bank.ifscOk === true ? true : v.bank && v.bank.ifscOk === false ? false : null, v.bank && v.bank.bankName ? v.bank.bankName + ' · ' + (v.bank.branch || '') : '']);
  out.push(['Bank account entered twice the same', !!(v.bank && v.bank.acct && v.bank.acctOk), v.bank && v.bank.acct ? 'XXXX' + String(v.bank.acct).slice(-4) : 'Missing']);
  return out;
}
const DOCS = [['GST', 'GST registration certificate'], ['PAN', 'PAN card'], ['BANK', 'Cancelled cheque / bank proof'], ['ADDR', 'Address proof (shop / factory)'], ['AGR', 'Signed vendor agreement']];
const VST = { Draft: '#6b7280', Submitted: '#b54708', Verified: '#0c9b76', Rejected: '#d92d20', Blocked: '#d92d20' };
P.vendorStatusColor = VST;

/* ---------- who may do what ---------- */
const canOnboard = () => P.canAssign() || P.has(['vendor_coord']);
const isSuper = () => P.has(['superadmin']) || (P.S && P.S.owner);
const canVerify = () => P.has(['superadmin', 'director', 'gm', 'admin_head', 'ops_manager', 'ops_mgr', 'ops_srm', 'ops_gm', 'ops_sgm', 'ops_avp', 'ops_vp', 'ops_svp', 'fin_head', 'fin_manager', 'fin_mgr']);
P.canVendors = () => !P.hht && (canOnboard() || canVerify());   // never on the HHT app

/* ---------- screens ---------- */
let VS = { q: '', docs: {} };
function listHtml() {
  const L = S.vendors.filter(v => !VS.q || (v.name + ' ' + (v.code || '') + ' ' + (v.gstin || '') + ' ' + (v.city || '')).toLowerCase().includes(VS.q.toLowerCase()));
  const n = s => S.vendors.filter(v => (v.status || 'Draft') === s).length;
  return '<div class="ph"><div><h1>Vendors</h1><p>' + n('Verified') + ' verified · ' + n('Submitted') + ' waiting for check · ' + n('Draft') + ' draft' + (n('Rejected') ? ' · ' + n('Rejected') + ' rejected' : '') + '</p></div>' + (canOnboard() ? '<button class="btn p sm" type="button" data-v="new">+ Onboard vendor</button>' : '') + '</div>' +
    '<input class="in" id="vq" placeholder="Search name, code, GSTIN, city" value="' + esc(VS.q) + '" style="margin-bottom:12px">' +
    (L.length ? L.map(v => '<button type="button" class="pk" data-vopen="' + esc(v._id) + '"><div class="t"><b>' + esc(v.name) + '</b><span class="st" style="--c:' + (VST[v.status || 'Draft']) + '">' + esc(v.status || 'Draft') + '</span></div><div class="m">' + esc([v.code, v.gstin, v.city].filter(Boolean).join(' · ')) + '</div><div class="m">' + (v.uid ? 'Login: ' + esc(v.username) : 'No login yet') + (v.status === 'Submitted' && v.createdBy !== S.me && canVerify() ? ' · <b style="color:var(--warn)">Needs your check</b>' : '') + '</div></button>').join('')
      : '<div class="card mute">No vendors yet. Tap + Onboard vendor.</div>');
}
function formHtml(v) {
  v = v || {}; const b = v.bank || {}, ro = v.status === 'Verified';
  const I = (n, l, val, extra) => '<label class="f">' + l + '<input name="' + n + '" value="' + esc(val || '') + '"' + (extra || '') + (ro ? ' readonly' : '') + '></label>';
  return '<form class="card" id="vof"><h2>' + (v._id ? 'Vendor details' : 'Onboard a vendor') + '</h2><p class="mute small">All fields marked * are mandatory. Checks run as you type.</p>' +
    I('name', 'Legal name (as on GST) *', v.name, ' required') + I('trade', 'Trade name', v.trade) +
    '<div class="row">' + I('gstin', 'GSTIN *', v.gstin, ' required maxlength="15" autocapitalize="characters"') + I('pan', 'PAN *', v.pan, ' required maxlength="10" autocapitalize="characters"') + '</div>' +
    '<div class="row">' + I('contact', 'Contact person *', v.contact, ' required') + I('phone', 'Mobile *', v.phone, ' required type="tel" inputmode="tel" maxlength="13"') + '</div>' + I('email', 'Email', v.email, ' type="email"') +
    '<label class="f">Pickup address *<textarea name="address" required' + (ro ? ' readonly' : '') + '>' + esc(v.address || '') + '</textarea></label>' +
    '<div class="row">' + I('pin', 'Pincode *', v.pin, ' required inputmode="numeric" maxlength="6"') + I('city', 'City *', v.city, ' required') + I('state', 'State *', v.state, ' required') + '</div>' +
    '<h3 style="margin:10px 0 8px">Bank (for payments)</h3>' +
    '<div class="row">' + I('holder', 'Account holder name *', b.holder || v.name, ' required') + I('ifsc', 'IFSC *', b.ifsc, ' required maxlength="11" autocapitalize="characters"') + '</div>' +
    '<div class="row">' + I('acct', 'Account number *', b.acct, ' required inputmode="numeric" maxlength="18" autocomplete="off"') + I('acct2', 'Re-enter account number *', b.acct, ' required inputmode="numeric" maxlength="18" autocomplete="off"') + '</div>' +
    '<p class="small" id="vbank">' + (b.bankName ? esc(b.bankName + ' · ' + (b.branch || '')) : '') + '</p>' +
    '<div id="vchk" class="card" style="background:var(--soft);border:0">' + checksHtml(Object.assign({}, v)) + '</div>' +
    '<p class="err" id="voe"></p>' + (ro ? '' : '<div class="row"><button class="btn" type="button" data-v="back">Cancel</button><button class="btn p">' + (v._id ? 'Save details' : 'Save and add documents') + '</button></div>') + '</form>';
}
function checksHtml(v) { return '<h3 style="margin:0 0 8px">Automatic checks</h3>' + checks(v).map(([l, ok, d]) => '<div style="display:flex;gap:8px;padding:4px 0;font-size:.88rem"><span style="width:20px;font-weight:800;color:' + (ok === true ? 'var(--in)' : ok === false ? 'var(--bad)' : 'var(--mute)') + '">' + (ok === true ? '✓' : ok === false ? '✗' : '…') + '</span><span style="flex:1"><b>' + esc(l) + '</b>' + (d ? '<br><span class="mute small">' + esc(d) + '</span>' : '') + '</span></div>').join(''); }
function detailHtml(v) {
  const ds = v.docs || {}, mine = v.createdBy === S.me && !isSuper(), self = v.createdBy === S.me, allUp = DOCS.every(([k]) => ds[k] && ds[k].s !== 'Rejected'), allOk = DOCS.every(([k]) => ds[k] && ds[k].s === 'Verified'), auto = checks(v).every(c => c[1] !== false), pend = checks(v).filter(c => c[1] === null).length;
  let h = '<button class="btn sm" type="button" data-v="back">← Vendors</button><div class="ph" style="margin-top:12px"><div><h1>' + esc(v.name) + '</h1><p>' + esc([v.code, v.gstin].filter(Boolean).join(' · ')) + '</p></div><span class="st" style="--c:' + VST[v.status || 'Draft'] + '">' + esc(v.status || 'Draft') + '</span></div>';
  if (v.status === 'Rejected' && v.rejectWhy) h += '<div class="card" style="border-color:var(--bad)"><b style="color:var(--bad)">Rejected:</b> ' + esc(v.rejectWhy) + (v.verifiedByName ? ' – ' + esc(v.verifiedByName) : '') + '</div>';
  /* documents */
  h += '<div class="card"><h2>Documents <span class="mute small">(all mandatory)</span></h2>' + DOCS.map(([k, l]) => { const d = ds[k];
    return '<div style="display:flex;gap:10px;align-items:center;padding:10px 0;border-top:1px solid var(--line);flex-wrap:wrap"><div style="flex:1 1 180px"><b>' + esc(l) + '</b><div class="small mute">' + (d ? esc(d.name || '') + ' · ' + esc(fdt(d.at)) + (d.note ? ' · ' + esc(d.note) : '') : 'Not uploaded') + '</div></div>' +
      '<span class="st" style="--c:' + (!d ? '#6b7280' : d.s === 'Verified' ? '#0c9b76' : d.s === 'Rejected' ? '#d92d20' : '#b54708') + '">' + esc(d ? d.s : 'Missing') + '</span>' +
      (d ? '<button class="btn sm" type="button" data-v="view" data-k="' + k + '">View</button>' : '') +
      (v.status !== 'Verified' && (canOnboard() || canVerify()) ? '<button class="btn sm" type="button" data-v="up" data-k="' + k + '">' + (d ? 'Replace' : 'Upload') + '</button>' : '') +
      (d && d.s === 'Uploaded' && canVerify() && !mine ? '<button class="btn sm" type="button" data-v="dok" data-k="' + k + '" style="color:var(--in)">✓ Verified</button><button class="btn sm d" type="button" data-v="dno" data-k="' + k + '">✗</button>' : '') + '</div>'; }).join('') +
    '<p class="small mute" style="margin:8px 0 0">Photo or PDF, up to 700 KB each. The checker opens each document and compares it with the details and checks below.</p></div>';
  h += '<div class="card">' + checksHtml(v) + '</div>';
  /* submit / verify */
  if (v.status === 'Draft' || v.status === 'Rejected') h += '<div class="card"><button class="btn p full" type="button" data-v="submit"' + (allUp ? '' : ' disabled') + '>' + (allUp ? 'Send for verification' : 'Upload all 5 documents to send for verification') + '</button></div>';
  if (v.status === 'Submitted') h += canVerify() && !mine ? '<div class="card"><h2>Verify vendor</h2><p class="mute small">' + (self ? 'You onboarded this vendor. As Super admin you may approve it yourself – it is recorded as self-approved.' : 'You are the checker. Approve only after opening every document and matching it with the details.') + (pend ? ' ' + pend + ' automatic check' + (pend > 1 ? 's' : '') + ' could not run – confirm ' + (pend > 1 ? 'them' : 'it') + ' from the documents.' : '') + '</p><div class="row"><button class="btn d" type="button" data-v="reject">Reject</button><button class="btn p" type="button" data-v="approve"' + (allOk && auto ? '' : ' disabled') + '>' + (allOk && auto ? 'Approve vendor' : !auto ? 'Fix failed checks first' : 'Verify all documents first') + '</button></div></div>'
    : '<div class="card mute">Waiting for a checker (operations manager, admin or finance head) – ' + (mine ? 'someone other than you' : 'not you') + ' must verify.</div>';
  if (v.status === 'Verified') h += credHtml(v);
  return h + '<details class="card"><summary style="cursor:pointer;font-weight:700">Vendor details</summary>' + formHtml(v) + '</details>' +
    (v.status === 'Verified' && canVerify() ? '<div class="card"><button class="btn d sm" type="button" data-v="block">Block vendor</button> <span class="small mute">Blocked vendors cannot be picked for pickups or log in.</span></div>' : '');
}
function credHtml(v) {
  if (v.uid) return '<div class="card"><h2>Vendor login</h2><div class="kv"><span>Vendor code</span><b>' + esc(v.code) + '</b><span>Username</span><b>' + esc(v.username) + '</b><span>Created</span><b>' + esc(fdt(v.loginAt)) + '</b><span>Web address</span><b>naveen5531.github.io/vendor</b></div>' +
    '<p class="small mute">The password was shown once when the login was made. If the vendor lost it, make a new login – the old one stops working.</p>' + (canVerify() || canOnboard() ? '<button class="btn sm" type="button" data-v="cred">Make a new login</button>' : '') + '</div>';
  const u = 'v' + String(v.code || '').replace(/\D/g, ''), pw = genPw();
  return '<div class="card"><h2>Vendor login</h2><p class="mute small">Made automatically – change the username or password if you want (manual option).</p><form id="cf"><div class="row"><label class="f">Username<input name="u" value="' + esc(u) + '" autocapitalize="none" required pattern="[a-z0-9._-]{4,30}"></label><label class="f">Password<input name="p" value="' + esc(pw) + '" required minlength="8"></label></div><p class="err" id="cfe"></p><button class="btn p full">Create vendor login</button></form></div>';
}
function genPw() { const a = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789', r = new Uint32Array(10); crypto.getRandomValues(r); return [...r].map(x => a[x % a.length]).join('').replace(/^(.{4})(.{3})/, '$1@$2'); }

/* Short vendor list for pickup executives (pvlist): only what a pickup needs – never bank details or documents.
   Kept in step from the staff Vendors screen whenever a vendor changes. */
let pvSig = {};
P.syncVendorList = () => { if (!P.canVendors()) return;
  S.vendors.forEach(v => { const d = { name: v.name || '', code: v.code || '', gstin: v.gstin || '', phone: v.phone || '', address: v.address || '', pin: v.pin || '', city: v.city || '', state: v.state || '', status: v.status || 'Draft', uid: v.uid || '' }, h = JSON.stringify(d);
    if (pvSig[v._id] === h) return; pvSig[v._id] = h; fs.collection('pvlist').doc(v._id).set(Object.assign(d, { updatedAt: Date.now() })).catch(() => { delete pvSig[v._id]; }); }); };
P.vendorsView = () => { if (VS.open === 'new') return '<button class="btn sm" type="button" data-v="back">← Vendors</button><div style="margin-top:12px">' + formHtml(null) + '</div>';
  const v = VS.open && S.vendors.find(x => x._id === VS.open); return v ? detailHtml(v) : listHtml(); };
P.vendorsReset = () => { VS.open = null; };

/* ---------- live checks while typing ---------- */
let chkT;
document.addEventListener('input', e => { const f = e.target.form; if (!f || f.id !== 'vof') return; if (e.target.name === 'q') return;
  if (['gstin', 'pan', 'ifsc'].includes(e.target.name)) { const p = e.target.selectionStart; e.target.value = e.target.value.toUpperCase().replace(/\s/g, ''); try { e.target.setSelectionRange(p, p); } catch (x) {} }
  if (e.target.name === 'gstin' && e.target.value.length === 15 && !f.pan.value) f.pan.value = e.target.value.slice(2, 12);
  clearTimeout(chkT); chkT = setTimeout(() => liveCheck(f), 250); });
document.addEventListener('input', e => { if (e.target.id === 'vq') { VS.q = e.target.value; const pos = e.target.selectionStart; P.renderNow(); const q = $('#vq'); if (q) { q.focus(); try { q.setSelectionRange(pos, pos); } catch (x) {} } } });
async function liveCheck(f) {
  const v = readForm(f);
  if (/^\d{6}$/.test(v.pin) && f.dataset.pin !== v.pin) { f.dataset.pin = v.pin; const i = await pinInfo(v.pin); f.dataset.pinOk = i ? '1' : '0'; if (i) { if (!f.city.value) f.city.value = i.city; if (!f.state.value) f.state.value = i.state; } }
  if (ifscOk(v.bank.ifsc) && f.dataset.ifsc !== v.bank.ifsc) { f.dataset.ifsc = v.bank.ifsc; $('#vbank').textContent = 'Checking IFSC…'; const i = await ifscInfo(v.bank.ifsc); f.dataset.ifscOk = i ? '1' : i === null ? '0' : ''; f.dataset.bank = i ? JSON.stringify(i) : ''; $('#vbank').textContent = i ? i.bank + ' · ' + i.branch + ', ' + i.city : i === null ? 'IFSC not found in the bank list.' : 'Could not reach the bank list – will check on save.'; }
  $('#vchk').innerHTML = checksHtml(readForm(f));
}
function readForm(f) {
  const g = n => (f[n] ? f[n].value : '').trim(), bk = f.dataset.bank ? JSON.parse(f.dataset.bank) : null;
  return { name: g('name'), trade: g('trade'), gstin: g('gstin').toUpperCase(), pan: g('pan').toUpperCase(), contact: g('contact'), phone: g('phone'), email: g('email'), address: g('address'), pin: g('pin'), city: g('city'), state: g('state'),
    pinOk: f.dataset.pinOk === '1' ? true : f.dataset.pinOk === '0' ? false : null,
    bank: { holder: g('holder'), ifsc: g('ifsc').toUpperCase(), acct: g('acct').replace(/\s/g, ''), acctOk: !!g('acct') && g('acct').replace(/\s/g, '') === g('acct2').replace(/\s/g, ''), ifscOk: f.dataset.ifscOk === '1' ? true : f.dataset.ifscOk === '0' ? false : null, bankName: bk ? bk.bank : '', branch: bk ? bk.branch : '' } };
}

/* ---------- actions ---------- */
document.addEventListener('submit', async e => {
  const f = e.target;
  if (f.id === 'vof') { e.preventDefault(); e.stopImmediatePropagation(); const er = $('#voe');
    await liveCheck(f); const v = readForm(f);
    if (!/^[6-9]\d{9}$/.test(v.phone.replace(/^\+?91/, ''))) { er.textContent = 'Enter a valid 10-digit mobile number.'; return; }
    if (!/^\d{6}$/.test(v.pin)) { er.textContent = 'Pincode must be 6 digits.'; return; }
    if (!v.bank.acctOk) { er.textContent = 'The two bank account numbers do not match.'; return; }
    if (S.vendors.some(x => x.gstin === v.gstin && x._id !== VS.open)) { er.textContent = 'A vendor with this GSTIN already exists.'; return; }
    const bad = checks(v).filter(c => c[1] === false).map(c => c[0]); if (bad.length && !confirm('These checks failed:\n• ' + bad.join('\n• ') + '\n\nSave anyway as a draft? It cannot be approved until they pass.')) return;
    const now = Date.now();
    try {
      if (VS.open && VS.open !== 'new') { await fs.collection('pvendors').doc(VS.open).update(Object.assign(v, { updatedAt: now, updatedBy: S.me })); toast('Vendor details saved.'); }
      else { const code = await vendorCode(); const r = fs.collection('pvendors').doc(); await r.set(Object.assign(v, { code, status: 'Draft', docs: {}, createdAt: now, createdBy: S.me, createdByName: S.name, updatedAt: now })); VS.open = r.id; toast('Vendor ' + code + ' saved. Now upload the 5 documents.'); }
      P.renderNow(true);
    } catch (x) { er.textContent = 'Could not save (' + (x.code || 'error') + ').'; }
    return; }
  if (f.id === 'cf') { e.preventDefault(); e.stopImmediatePropagation(); await makeLogin(f); }
}, true);

async function vendorCode() {          // V + 5 digits, claimed once so it never repeats
  for (let i = 0; i < 10; i++) { const c = 'V' + (Math.floor(Math.random() * 90000) + 10000), ref = fs.doc('ticketids/VEN-' + c);
    try { const ok = await fs.runTransaction(async t => { const s = await t.get(ref); if (s.exists) return false; t.set(ref, { claimedBy: S.me, at: Date.now(), kind: 'vendor' }); return true; }); if (ok) return c; } catch (e) { if (e.code === 'permission-denied') break; } }
  return 'V' + Date.now().toString().slice(-6);
}

document.addEventListener('click', async e => {
  const o = e.target.closest('[data-vopen]'); if (o) { VS.open = o.dataset.vopen; P.renderNow(true); scrollTo(0, 0); return; }
  const a = e.target.closest('[data-v]'); if (!a) return; const act = a.dataset.v, k = a.dataset.k, v = S.vendors.find(x => x._id === VS.open), now = Date.now();
  if (act === 'new') { VS.open = 'new'; P.renderNow(true); return; }
  if (act === 'back') { VS.open = null; P.renderNow(true); return; }
  if (!v) return;
  const upd = async (patch, msg) => { try { await fs.collection('pvendors').doc(v._id).update(Object.assign(patch, { updatedAt: Date.now() })); if (msg) toast(msg); } catch (x) { toast('Could not save (' + (x.code || 'error') + ').', true); } };
  if (act === 'up') { pickDoc(v, k); return; }
  if (act === 'view') { try { const d = await fs.doc('pvdocs/' + v._id + '_' + k).get(); if (!d.exists) { toast('Document not found.', true); return; } showDoc(d.data()); } catch (x) { toast('Could not open (' + (x.code || 'error') + ').', true); } return; }
  if (act === 'dok') { await upd({ ['docs.' + k + '.s']: 'Verified', ['docs.' + k + '.by']: S.name, ['docs.' + k + '.vat']: now }, 'Document verified.'); return; }
  if (act === 'dno') { const why = prompt('What is wrong with this document?'); if (!why) return; await upd({ ['docs.' + k + '.s']: 'Rejected', ['docs.' + k + '.note']: why.slice(0, 160), ['docs.' + k + '.by']: S.name, status: v.status === 'Submitted' ? 'Rejected' : v.status, rejectWhy: 'Document: ' + why.slice(0, 160) }, 'Document rejected. The vendor goes back for correction.'); return; }
  if (act === 'submit') { await upd({ status: 'Submitted', submittedAt: now, submittedBy: S.name, rejectWhy: '' }, 'Sent for verification.'); return; }
  if (act === 'approve') { const self = v.createdBy === S.me; if (self && !isSuper()) { toast('The person who onboarded cannot verify.', true); return; }
    if (!confirm('Approve ' + v.name + '? You confirm you checked all 5 documents.' + (self ? '\n\nYou onboarded this vendor – this is recorded as self-approved by Super admin.' : ''))) return;
    await upd({ status: 'Verified', verifiedAt: now, verifiedBy: S.me, verifiedByName: S.name + (self ? ' (self-approved, Super admin)' : ''), selfApproved: self, rejectWhy: '' }, 'Vendor verified. Now create the vendor login.'); return; }
  if (act === 'reject') { const why = prompt('Why is this vendor rejected?'); if (!why) return; await upd({ status: 'Rejected', rejectWhy: why.slice(0, 200), verifiedByName: S.name, rejectedAt: now }, 'Vendor rejected.'); return; }
  if (act === 'block') { const why = prompt('Why block this vendor?'); if (!why) return; await upd({ status: 'Blocked', rejectWhy: why.slice(0, 200), blockedBy: S.name, blockedAt: now, uid: '' }, 'Vendor blocked.'); return; }
  if (act === 'cred') { if (!confirm('Make a new login for ' + v.name + '? The old login stops working.')) return; await upd({ uid: '', username: '' }); return; }
});

/* documents: photo (shrunk) or PDF, up to 700 KB, stored with the vendor */
function pickDoc(v, k) {
  const i = document.createElement('input'); i.type = 'file'; i.accept = 'image/*,application/pdf';
  i.onchange = async () => { const f = i.files && i.files[0]; if (!f) return; let data = '', mime = f.type;
    if (/^image\//.test(f.type)) data = await shrink(f); else if (f.type === 'application/pdf') { if (f.size > 700000) { toast('PDF is over 700 KB. Use a photo or a smaller PDF.', true); return; } data = await new Promise(ok => { const r = new FileReader(); r.onload = () => ok(r.result); r.readAsDataURL(f); }); }
    else { toast('Use a photo or a PDF.', true); return; }
    if (!data || data.length > 950000) { toast('File is too large.', true); return; }
    const now = Date.now();
    try { await fs.doc('pvdocs/' + v._id + '_' + k).set({ vid: v._id, type: k, name: f.name.slice(0, 80), mime, data, size: data.length, at: now, by: S.me, byName: S.name, vendorUid: v.uid || '' });
      await fs.collection('pvendors').doc(v._id).update({ ['docs.' + k]: { s: 'Uploaded', name: f.name.slice(0, 80), at: now, by: S.name }, updatedAt: now }); toast('Uploaded.'); }
    catch (x) { toast('Could not upload (' + (x.code || 'error') + ').', true); } };
  i.click();
}
function shrink(f) { return new Promise(ok => { const img = new Image(), u = URL.createObjectURL(f); img.onload = () => { const m = 1500, sc = Math.min(1, m / Math.max(img.width, img.height)), c = document.createElement('canvas'); c.width = Math.round(img.width * sc); c.height = Math.round(img.height * sc); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(u); let q = .75, d = c.toDataURL('image/jpeg', q); while (d.length > 700000 && q > .3) { q -= .1; d = c.toDataURL('image/jpeg', q); } ok(d); }; img.onerror = () => ok(''); img.src = u; }); }
function showDoc(d) {
  const w = document.createElement('div'); w.className = 'cam'; w.style.background = 'rgba(0,0,0,.92)';
  w.innerHTML = '<div class="ct">' + esc(d.name || '') + '</div>' + (/pdf/.test(d.mime) ? '<iframe src="' + esc(d.data) + '" style="flex:1;border:0;background:#fff;margin:50px 0 80px"></iframe>' : '<img src="' + esc(d.data) + '" alt="" style="flex:1;object-fit:contain;max-width:100%;margin:50px 0 80px">') + '<div class="cb"><button class="btn" type="button">Close</button></div>';
  document.body.appendChild(w); w.querySelector('button').onclick = () => w.remove();
}

/* vendor login: a separate sign-in instance makes the account, so the staff member stays signed in */
async function makeLogin(f) {
  const v = S.vendors.find(x => x._id === VS.open), er = $('#cfe'); if (!v) return;
  const u = f.u.value.trim().toLowerCase(), pw = f.p.value; if (!/^[a-z0-9._-]{4,30}$/.test(u)) { er.textContent = 'Username: 4–30 letters, numbers, dot, dash.'; return; } if (pw.length < 8) { er.textContent = 'Password: at least 8 characters.'; return; }
  const btn = f.querySelector('button'); btn.disabled = true; er.textContent = 'Creating…';
  let sec = null;
  try {
    sec = firebase.initializeApp(window.MOVANA_FIREBASE_CONFIG, 'vendor-' + Date.now());
    const cr = await sec.auth().createUserWithEmailAndPassword(u + '@staff.movana.app', pw); const uid = cr.user.uid;
    await sec.auth().signOut();
    await fs.collection('pvendors').doc(v._id).update({ uid, username: u, loginAt: Date.now(), loginBy: S.name, updatedAt: Date.now() });
    const txt = 'SN Logistics vendor login\nVendor: ' + v.name + ' (' + v.code + ')\nWeb: https://naveen5531.github.io/vendor/\nUsername: ' + u + '\nPassword: ' + pw + '\nPlease change the password after the first login.';
    const box = document.createElement('div'); box.className = 'cam'; box.style.background = 'rgba(0,0,0,.6)';
    box.innerHTML = '<div class="card" style="margin:auto;max-width:420px;width:92%"><h2>Login created</h2><p class="mute small">Share it with the vendor now – the password is not shown again.</p><pre style="white-space:pre-wrap;background:var(--soft);padding:12px;border-radius:12px;font-size:.9rem">' + esc(txt) + '</pre><div class="row"><button class="btn" type="button" data-x="copy">Copy</button>' + (v.phone ? '<a class="btn p" target="_blank" rel="noopener" href="https://wa.me/' + esc(('91' + v.phone.replace(/\D/g, '').slice(-10))) + '?text=' + encodeURIComponent(txt) + '">WhatsApp</a>' : '') + '<button class="btn" type="button" data-x="close">Done</button></div></div>';
    document.body.appendChild(box); box.addEventListener('click', async ev => { const x = ev.target.closest('[data-x]'); if (!x) return; if (x.dataset.x === 'copy') { try { await navigator.clipboard.writeText(txt); toast('Copied.'); } catch (z) {} } else box.remove(); });
  } catch (x) { er.textContent = x.code === 'auth/email-already-in-use' ? 'That username is taken. Change it.' : 'Could not create the login (' + (x.code || 'error') + ').'; btn.disabled = false; }
  finally { try { sec && await sec.delete(); } catch (z) {} }
}
})();
