/* SN Logistics – payslip: the same A4 salary slip as the Punch app (layout, letterhead, wording and print), built from Punch data. */
(function () {
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const f2 = v => (+v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fN = v => (+v || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });
const fd = k => new Date(k + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
const _a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'], _b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
const _two = n => n < 20 ? _a[n] : _b[Math.floor(n / 10)] + (n % 10 ? ' ' + _a[n % 10] : '');
const _three = n => n > 99 ? _a[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + _two(n % 100) : '') : _two(n);
function inWords(n) { n = Math.round(n); if (n < 0) return 'Minus ' + inWords(-n); if (n === 0) return 'Zero';
  const cr = Math.floor(n / 1e7), l = Math.floor(n % 1e7 / 1e5), t = Math.floor(n % 1e5 / 1e3), r = n % 1000, p = [];
  if (cr) p.push(inWords(cr) + ' Crore'); if (l) p.push(_two(l) + ' Lakh'); if (t) p.push(_two(t) + ' Thousand'); if (r) p.push(_three(r)); return p.join(' '); }
function tenureYM(j) { if (!j) return '—'; const a = new Date(j + 'T00:00:00'), n = new Date(); if (isNaN(a) || a > n) return '0 yr 0 mo';
  let m = (n.getFullYear() - a.getFullYear()) * 12 + n.getMonth() - a.getMonth(); if (n.getDate() < a.getDate()) m--; m = Math.max(0, m); return Math.floor(m / 12) + ' yr ' + (m % 12) + ' mo'; }
const fyName = mo => { const [y, m] = mo.split('-').map(Number), s = m >= 4 ? y : y - 1; return 'FY ' + s + '-' + String(s + 1).slice(2); };
const GR = { F: 'Frontline', S: 'Supervisor', M: 'Manager', G: 'General Manager' };
const gradeName = g => { g = String(g || ''); const m = g.match(/^([FSMG])[1-4]$/i); return m ? g.toUpperCase() + ' · ' + GR[m[1].toUpperCase()] : g; };
function ensureCss() { if (document.getElementById('payslipCss')) return; const s = document.createElement('style'); s.id = 'payslipCss'; s.textContent = `.slip{background:#fff;color:#1b2430;min-width:0;border:1px solid #d9dfe6;border-radius:10px;padding:12px;font-size:11px;-webkit-print-color-adjust:exact;print-color-adjust:exact;margin-bottom:14px;overflow-x:auto}
.slip .band{background:#f5f6f8;padding:12px;text-align:center}
.slip .band img{display:block;max-height:44px;max-width:60%;object-fit:contain;margin:0 0 8px 0}
.slip .band b{display:block;font-size:20px}
.slip .band .ttl{font-size:14px;margin-top:8px}
.slip table{width:100%;border-collapse:collapse}
.slip .emp{margin:12px 0;border-bottom:1.5px solid #9aa0a6}
.slip .emp td{padding:5px 3px;vertical-align:top}
.slip .emp td.l{width:24%}.slip .emp td.v{width:26%;font-weight:700}
.slip .st th,.slip .st td{border:1px solid #9aa0a6;padding:6px}
.slip .st .h1 th{font-size:14px;padding:8px}
.slip .st th{text-align:center}
.slip .r{text-align:right;font-variant-numeric:tabular-nums}
.slip .st tr.b td{font-weight:800}
.slip .wd2{margin:10px 0 0}
.slip .ft{margin-top:10px;color:#6a7686}
.slip .xp{margin-top:12px}
.slip .xp td.f{color:#4b5563;font-size:.92em}
.slip .st td.y{color:#4b5563}.slip .st td.ys{font-weight:400;color:#6a7686;font-size:.85em;text-align:center}.slip .lb th{font-size:.9em}
.slip.a4{width:794px;min-height:1123px;padding:45px;font-size:13px;box-sizing:border-box;margin:0 auto 14px}
.slip .lh{display:flex;align-items:center;gap:14px;padding:2px 0 10px}.slip .lh img{width:58px;height:58px;object-fit:contain;flex:none;border-radius:12px}
.slip .lht{display:flex;flex-direction:column;gap:1px;min-width:0}.slip .lht b{font-family:Georgia,'Times New Roman',serif;font-size:22px;color:var(--bc,#0f6e56);letter-spacing:.2px}.slip .lht span{font-size:11px;color:#4b5563}
.slip .lhbar{height:4px;border-radius:2px;background:linear-gradient(90deg,var(--bc,#0f6e56),color-mix(in srgb,var(--bc,#0f6e56) 25%,#fff));margin-bottom:10px}
.slip .dt{text-align:center;font-weight:800;font-size:15px;letter-spacing:.3px;padding:6px 0;margin-bottom:4px;border-bottom:1px solid #d6dae0;text-transform:uppercase}

@media print{.slip .xp th,.slip .xp td{padding:2.5px 5px!important;font-size:8pt}.slip .at th,.slip .at td{padding:2px 5px!important;font-size:8pt}.slip .emp td{padding:2.5px 3px}.slip .band{padding-top:4px;padding-bottom:4px}.slip .xp{margin-top:5px!important}.slip .wd2,.slip .ft{margin-top:5px!important;margin-bottom:0}.slip .st td,.slip .st th{padding-top:2.5px!important;padding-bottom:2.5px!important}.slip .emp{margin:6px 0!important}}` +
  '\n#slipPrintHost{display:none}@media print{body.printing-slip>*:not(#slipPrintHost){display:none!important}body.printing-slip #slipPrintHost{display:block!important}body.printing-slip{background:#fff!important;margin:0!important;padding:0!important}' +
  '#slipPrintHost .slip{border:0;border-radius:0;padding:12mm 12mm 0;width:auto;max-width:none;margin:0;font-size:9pt;min-height:0;box-sizing:border-box}#slipPrintHost .slip .st tr{break-inside:avoid}#slipPrintHost .slip .xp{break-inside:avoid}}' +
  '\n.slipwrapW{overflow:auto;-webkit-overflow-scrolling:touch}.slipwrapW .slip.a4{max-width:none}' +
  '.slip{font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",Roboto,system-ui,sans-serif;line-height:1.4;font-variant-numeric:tabular-nums;text-align:left}.slip th{text-transform:none;letter-spacing:normal;font-size:inherit;color:#1b2430;background:none;font-weight:500}.slip th,.slip td{white-space:normal;border-bottom:0;vertical-align:middle}.slip .emp td{vertical-align:top}.slip .st .h1 th{font-weight:500}.slip tr.b td{font-weight:800}';
  document.head.appendChild(s); }
/**
 * d = { company:{name}, emp:{name,eid,desg,grade,cat,join,loc}, month:'YYYY-MM', employee:true|false,
 *       earn:[[label, amount]], ded:[[label, amount]], gross, tded, net, payDays, baseDays, worked, wo, hol, lop,
 *       ytd:{label: amount}, leave:{PL,SL,CL,LOP,'Comp off'} | null }
 * leave: [[label, balance]] in Punch's order (PL, SL, CL, ML, PT, MR, BL, LOP, Comp off)
 * (same rows, order and wording as Punch's calcPay)
 */
function html(d) {
  const q = d.emp || {}, [y, m] = d.month.split('-').map(Number), st = new Date(y, m - 1, 1), en = new Date(y, m, 0), emp = d.employee !== false;
  const ord = x => { const n = x.getDate(), t = n % 10, h = n % 100; return n + (t === 1 && h !== 11 ? 'st' : t === 2 && h !== 12 ? 'nd' : t === 3 && h !== 13 ? 'rd' : 'th'); }, mn = x => x.toLocaleDateString('en-US', { month: 'long' });
  const dur = `${ord(st)} ${mn(st)}, ${st.getFullYear()} to ${ord(en)} ${mn(en)}, ${en.getFullYear()}`;
  const keep = a => { const f = a.filter(r => +r[1] !== 0); return f.length ? f : a.slice(0, 1); };
  const earn = keep(d.earn), ded = keep(d.ded), Y = d.ytd || {}, yv = l => Y[l] !== undefined ? f2(Y[l]) : '', n = Math.max(earn.length, ded.length);
  const cell = (r, i) => r[i] ? `<td>${esc(r[i][0])}</td><td class="r">${f2(r[i][1])}</td><td class="r y">${yv(r[i][0])}</td>` : '<td></td><td></td><td></td>';
  const rows = Array.from({ length: n }, (_, i) => `<tr>${cell(earn, i)}${cell(ded, i)}</tr>`).join('');
  const jd = q.join ? new Date(q.join + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-') : 'N.A';
  const pr = (a, b, c, e) => `<tr><td class="l">${a}</td><td class="v">: ${b}</td><td class="l">${c}</td><td class="v">${e === '' ? '' : ': ' + e}</td></tr>`;
  const netNum = +d.net || 0, lh = window.OfferLetter && OfferLetter.lh ? OfferLetter.lh(true, d.company) : `<div class="band"><b>${esc((d.company || {}).name || 'Company')}</b></div>`;
  const lv = d.leave && d.leave.length ? (() => { const cells = d.leave;
    return `<table class="st xp lb"><thead><tr class="h1"><th colspan="${cells.length}">Leave balance as on ${fd(new Date().toISOString().slice(0, 10))}</th></tr><tr>${cells.map(c => `<th>${c[0]}</th>`).join('')}</tr></thead><tbody><tr>${cells.map(c => `<td class="r" style="text-align:center">${fN(c[1])}</td>`).join('')}</tr></tbody></table>`; })() : '';
  return `<div class="slip a4">${lh}<div class="dt">Salary Slip for the Month of ${mn(en)} ${en.getFullYear()}</div>
<table class="emp">${pr('Employee Name', esc(q.name).toUpperCase(), 'Employee ID', esc(q.eid))}${pr('Designation', esc(q.desg), 'Date of Joining', jd)}${q.grade || q.cat ? pr('Grade', esc(gradeName(q.grade) || 'N.A'), 'Category', esc(q.cat || 'N.A')) : ''}${pr('Duration', dur, 'Current Office location', esc(q.loc) || 'N.A')}${emp ? pr('Tenure', q.join ? tenureYM(q.join) : 'N.A', '', '') : pr('Total Days (basis)', d.baseDays, 'Paid Days (PD)', fN(d.payDays)) + pr('Days Worked', fN(d.worked), 'Week off / Paid holiday', fN((+d.wo || 0) + (+d.hol || 0))) + pr('LOP Days', fN(d.lop), 'Tenure', q.join ? tenureYM(q.join) : 'N.A')}</table>
<table class="st"><thead><tr class="h1"><th colspan="3">Earnings</th><th colspan="3">Deductions</th></tr><tr><th>Description</th><th>Amount</th><th>YTD</th><th>Description</th><th>Amount</th><th>YTD</th></tr></thead><tbody>${rows}
<tr class="b"><td>Gross Earnings</td><td class="r">${f2(d.gross)}</td><td class="r y">${yv('Gross pay')}</td><td>Gross Deductions</td><td class="r">${f2(d.tded)}</td><td class="r y">${yv('Total deductions')}</td></tr>
<tr class="b"><td>Net Pay</td><td class="r">${f2(d.net)}</td><td class="r y">${yv('Net pay (take home)')}</td><td colspan="3" class="ys">YTD = ${fyName(d.month)}, April to ${mn(en)}</td></tr></tbody></table>
<p class="wd2"><b>In words :</b> ${inWords(Math.floor(netNum))} Rupees${Math.round(netNum * 100) % 100 ? ' and ' + _two(Math.round(netNum * 100) % 100) + ' Paise' : ''} Only.</p>
${lv}<p class="ft">** This is a system generated payslip, hence signature not required.</p></div>`;
}
window.Payslip = {
  html(d) { ensureCss(); return '<div class="slipwrapW">' + html(d) + '</div>'; },
  print(d) { ensureCss(); let h = document.getElementById('slipPrintHost'); if (!h) { h = document.createElement('div'); h.id = 'slipPrintHost'; document.body.appendChild(h); }
    h.innerHTML = html(d); document.body.classList.add('printing-slip');
    let pg = document.getElementById('slipPage'); if (!pg) { pg = document.createElement('style'); pg.id = 'slipPage'; document.head.appendChild(pg); } pg.textContent = '@page{size:A4;margin:0}';
    const t0 = document.title; document.title = 'Payslip-' + d.month;
    const done = () => { document.body.classList.remove('printing-slip'); h.innerHTML = ''; pg.textContent = ''; document.title = t0; removeEventListener('afterprint', done); }; addEventListener('afterprint', done); setTimeout(() => window.print(), 50); }
};
})();
