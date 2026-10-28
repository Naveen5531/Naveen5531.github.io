/* SN Logistics portal – offer letter: the same letter, logo and print layout as the Punch app (copied from Punch so both match). */
(function () {
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fN = v => { const n = Math.round((+v || 0) * 100) / 100; return String(n); };
const money = v => (+v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const R2 = v => Math.round((+v || 0) * 100) / 100;
let COMPANY = {};
const CO = () => Object.assign({ name: 'SN Logistics', addr: '', sig: '', sigD: 'HR Manager', ref: 'HR/OFFER', jur: '', ret: '58', col: '#2459a5', logo: 'sn', web: '', phone: '', cin: '' }, COMPANY);
const lvCfg = () => ({ PL: { r: 1.75 }, SL: { r: 1.25 }, CL: { r: 1.25 } });
function mlSvg(){return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><defs><linearGradient id="gd" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f3d27a"/><stop offset=".55" stop-color="#d4a640"/><stop offset="1" stop-color="#a87a1e"/></linearGradient><linearGradient id="bk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#26262b"/><stop offset="1" stop-color="#0d0d10"/></linearGradient></defs><rect x="3" y="3" width="114" height="114" rx="28" fill="url(#bk)"/><rect x="6.5" y="6.5" width="107" height="107" rx="25" fill="none" stroke="url(#gd)" stroke-opacity=".55" stroke-width="1.5"/><path d="M27 86 V35 L50 62 L73 35 V86 H91" fill="none" stroke="url(#gd)" stroke-width="9.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M88 76.5 L100 86 L88 95.5 Z" fill="url(#gd)" stroke="url(#gd)" stroke-width="3" stroke-linejoin="round"/><circle cx="27" cy="86" r="7.5" fill="#0d0d10" stroke="url(#gd)" stroke-width="4"/></svg>`}
/** SN Logistics logo (brand/sn-logo-120h.png next to the portal folder) – used on every letterhead. */
const SN_LOGO = (() => { try { return new URL('../brand/sn-logo-120h.png', (document.currentScript || {}).src || location.href).href; } catch (e) { return '../brand/sn-logo-120h.png'; } })();
const logoUri = () => SN_LOGO;
const __lh = (short) => { const c = CO(), col = /^#[0-9a-f]{6}$/i.test(c.col) ? c.col : '#0f6e56', ct = [c.phone && 'Tel: ' + esc(c.phone), c.web && esc(c.web)].filter(Boolean).join(' · ');
  // the logo carries the company name, so the letterhead shows the logo with the address on the right
  return `<div class="lh" style="--bc:${col}"><img class="snlh" src="${logoUri()}" alt="${esc(c.name)} – Speed & Trust"><div class="lht" style="margin-left:auto;text-align:right">${short ? '' : `${c.addr ? `<span>${esc(c.addr)}</span>` : ''}${ct ? `<span>${ct}</span>` : ''}${c.cin ? `<span>CIN: ${esc(c.cin)}</span>` : ''}`}</div></div><div class="lhbar" style="--bc:${col}"></div>`; };
/** Salary breakup on the letter, worked out the same way as Punch's payslip. */
function ctc(e){const b=+e.basic||0,h=+e.hra||0,c=+e.conv||0,sp=+e.spl||0,gross=R2(b+h+c+sp),pfE=Math.round(b*(+e.pfPct||0)/100),pfR=pfE,gr=e.grat?R2(b*0.0481):0,
  m=R2(gross+pfR+gr),pt=+e.pt||0,net=R2(gross-pfE-pt);return{b,h,c,sp,gross,pfE,pfR,gr,m,pt,net,y:R2(m*12)}}
function letter(e){const c=CO(),k=ctc(e),n=new Date(),first=String(e.name||'').split(/\s+/)[0],today=n.toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'}),lv=(()=>{try{return lvCfg()}catch(x){return null}})();
  const co=esc(c.name)||'the Company',ref=`${esc(c.ref)}/${n.getFullYear()}/${esc(e.eid)}`,jd=e.join?new Date(e.join+'T00:00:00').toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'}):'—';
  const P=4,row=(l,m,b)=>`<tr${b?' class="b"':''}><td>${l}</td><td class="r">${money(m)}</td><td class="r">${money(m*12)}</td></tr>`;
  const foot=p=>`<div class="lf"><span>${esc(c.name)}${c.cin?' · CIN '+esc(c.cin):''}</span><span>Employee's initials: ________</span><span>Page ${p} of ${P}</span></div>`;
  const sign=`<div class="sgb"><p>Yours sincerely,<br>For <b>${co}</b></p><div class="sl"></div><p><b>${esc(c.sig)||'Authorised Signatory'}</b><br>${esc(c.sigD)}</p></div>`;
  const pn=fN(e.pnotice===undefined||e.pnotice===''?15:e.pnotice),nt=fN(e.notice||0),pr=fN(e.prob||0),jur=c.jur?`the courts at ${esc(c.jur)}`:'the courts having jurisdiction over the registered office of the Company';
  const lvTxt=lv?`privilege leave of ${fN(lv.PL.r)} day, sick leave of ${fN(lv.SL.r)} day and casual leave of ${fN(lv.CL.r)} day credited for every month of service`:'leave as per the leave policy of the Company';
  const T=[
   ['Appointment','Your appointment is on a full-time basis. You will devote your whole working time and attention to the work of the Company and will not take up any other employment, business or paid assignment, directly or indirectly, without written permission.'],
   ['Probation and confirmation',`You will be on probation for ${pr} month${pr==='1'?'':'s'} from your date of joining. The Company may extend the probation if your performance or conduct is not found satisfactory. You will be treated as confirmed only when you receive a written letter of confirmation.`],
   ['Notice and separation',`During probation, either party may end the employment by giving ${pn} days' written notice. After confirmation, the notice period is ${nt} days. The Company may pay or recover salary in lieu of notice. Leave balance cannot be adjusted against the notice period without approval.`],
   ['Termination for cause','The Company may end your employment without notice or salary in lieu of notice for misconduct, dishonesty, breach of these terms or the Code of Conduct, unauthorised absence, or if any information given by you is found to be false.'],
   ['Unauthorised absence','If you remain absent for 8 or more consecutive days without approval or intimation, you will be treated as having left the services of the Company on your own accord.'],
   ['Working hours and attendance',`Your working hours are ${fN(e.hrs||9)} hours a day, ${fN(e.wdays||6)} days a week, with weekly offs as per the roster. Shift timings may change as per business needs. Attendance is recorded through the Punch app; marking attendance for another person or from a place other than your workplace is a serious offence.`],
   ['Leave and holidays',`You are entitled to ${lvTxt}, and to paid holidays as per the Company holiday list. Work on a holiday earns a compensatory off. Leave must be applied for and approved in advance, except in an emergency.`],
   ['Salary and deductions','Your salary is paid monthly by bank transfer and is pro-rated for the days paid. Provident Fund, professional tax, income tax and any other deduction required by law will be made from your salary. Your salary details are confidential and must not be discussed with other employees.'],
   ['Transfer and deputation','Your services may be transferred to any location, department, branch, or associate company of the Company, as per business needs, without any change in your total compensation.'],
   ['Medical fitness and retirement',`This appointment is subject to your being medically fit. You will retire from the services of the Company on reaching the age of ${esc(c.ret||'58')} years.`],
   ['Company property','Any property, equipment, ID card, uniform, phone, documents or data given to you remains the property of the Company and must be returned in good condition on separation. The value of any item not returned may be recovered from your dues.'],
   ['Change in personal details','You must inform HR in writing within 7 days of any change in your address, contact number, bank account, marital status or other personal details.'],
   ['Governing law',`This employment is governed by the laws of India. Any dispute will be subject to the exclusive jurisdiction of ${jur}.`]];
  const C=[
   ['Integrity','Act honestly and fairly in all your work. Do not falsify any record, bill, attendance, expense claim or report.'],
   ['Confidentiality','Keep all information about the Company, its business, customers, vendors, pricing, employees and systems strictly confidential, during and after your employment. Do not share it with anyone outside the Company or post it on social media.'],
   ['Conflict of interest','Do not take part in any activity, business or relationship that conflicts with the interests of the Company. Inform your manager in writing about any relative or close associate who works for a vendor, transporter, competitor or customer you deal with.'],
   ['Gifts and bribery','Do not offer, give, ask for or accept any bribe, commission, cash, gift or favour from any vendor, transporter, customer or official in connection with your work. Report any such offer to your manager or HR at once.'],
   ['Respect at the workplace','Treat every colleague, vendor and customer with respect. Harassment of any kind, including sexual harassment, bullying, discrimination, abusive language or violence, will not be tolerated and will be dealt with as per the law and Company policy.'],
   ['Safety','Follow all safety rules, wear the protective equipment given to you and report any accident, injury or unsafe condition immediately. Do not operate any vehicle or equipment you are not authorised to use.'],
   ['Alcohol, drugs and tobacco','Coming to work under the influence of alcohol or drugs, or having them on Company premises or in Company vehicles, is strictly prohibited. Smoking and tobacco are allowed only in marked areas.'],
   ['Use of IT and data','Use Company systems, email, apps and devices only for work. Do not install unapproved software, share passwords or copy Company data to personal devices or accounts.'],
   ['Public communication','Do not speak to the media or make public statements on behalf of the Company without written approval.'],
   ['Reporting concerns','Report any breach of this Code that you see to your manager or HR. You will not face any action for raising a concern in good faith.']];
  const docs=['Signed copy of this letter and its annexure','Relieving letter and last 3 months\' payslips from your previous employer (if any)','Educational and experience certificates (original for verification, with copies)','PAN card and Aadhaar card','Bank account details with a cancelled cheque','UAN number (if any) for Provident Fund transfer','4 passport-size photographs','Medical fitness certificate, if asked'];
  const lst=(A,start)=>`<ol class="trm" start="${start||1}">${A.map(([h,t])=>`<li><b>${h}.</b> ${t}</li>`).join('')}</ol>`;
  return `<div class="pg">${__lh()}
<div class="olh"><span><b>Ref:</b> ${ref}</span><span><b>Date:</b> ${today}</span></div>
<div class="conf">Private &amp; Confidential</div>
<p class="to">To,<br><b>${esc(e.name)}</b>${e.addr?'<br>'+esc(e.addr):''}${e.mob?'<br>Mobile: '+esc(e.mob):''}${e.email?'<br>Email: '+esc(e.email):''}</p>
<p class="sub2"><b>Subject: Letter of Offer – ${esc(e.desg)}</b></p>
<p>Dear ${esc(first)},</p>
<p>With reference to your application and the subsequent interviews you had with us, we are pleased to offer you employment with <b>${co}</b> on the terms and conditions set out in this letter.</p>
<table class="kd"><tr><td>Designation</td><td>${esc(e.desg)}${e.grade?` (Grade ${esc(e.grade)})`:''}</td></tr>${e.cat?`<tr><td>Department</td><td>${esc(e.cat)}</td></tr>`:''}${e.loc?`<tr><td>Place of work</td><td>${esc(e.loc)}</td></tr>`:''}<tr><td>Date of joining</td><td>${jd}</td></tr>${e.mgr?`<tr><td>Reporting to</td><td>${esc(e.mgr)}</td></tr>`:''}<tr><td>Annual CTC</td><td><b>₹${money(k.y)}</b> (details in Annexure A)</td></tr><tr><td>Probation</td><td>${pr} month${pr==='1'?'':'s'}</td></tr><tr><td>Notice period</td><td>${pn} days during probation, ${nt} days after confirmation</td></tr></table>
<p>The Terms and Conditions of Employment (page 2), the Code of Conduct and Ethics (page 3) and the Compensation Structure (Annexure A, page 4) form part of this letter. Please read them carefully.</p>
<p>This offer is valid only if you accept it by signing the duplicate copy of all pages and report for duty on <b>${jd}</b>. If you do not join on this date, this offer will stand withdrawn unless the date is changed in writing.</p>
<p>Please bring the documents listed on page 3 on your date of joining. We welcome you to ${co} and look forward to a long and rewarding association with you.</p>
${sign}${foot(1)}</div>
<div class="pg pb">${__lh()}
<div class="anx">Terms and Conditions of Employment</div>
${lst(T)}${foot(2)}</div>
<div class="pg pb">${__lh()}
<div class="anx">Code of Conduct and Ethics</div>
<p>As an employee of ${co}, you are expected to follow this Code at all times. Any breach will lead to disciplinary action, up to and including termination of employment, and legal action where required.</p>
${lst(C)}
<div class="anx" style="font-size:14px;margin-top:12px">Documents to submit on joining</div>
<ol class="trm dl">${docs.map(d=>`<li>${d}</li>`).join('')}</ol>${foot(3)}</div>
<div class="pg pb">${__lh()}
<div class="anx">Annexure A – Compensation Structure</div>
<table class="kd"><tr><td>Name</td><td>${esc(e.name)}</td></tr><tr><td>Employee ID</td><td>${esc(e.eid)}</td></tr><tr><td>Designation</td><td>${esc(e.desg)}${e.grade?` (Grade ${esc(e.grade)})`:''}</td></tr><tr><td>Effective from</td><td>${jd}</td></tr></table>
<table class="st oct"><thead><tr><th>Component</th><th>Per month (₹)</th><th>Per annum (₹)</th></tr></thead><tbody>
<tr class="h2"><td colspan="3">A. Earnings</td></tr>${row('Basic salary',k.b)}${k.h?row('House rent allowance',k.h):''}${k.c?row('Conveyance allowance',k.c):''}${k.sp?row('Special allowance',k.sp):''}${row('Gross salary (A)',k.gross,1)}
<tr class="h2"><td colspan="3">B. Employer contributions</td></tr>${k.pfR?row(`Provident Fund (${fN(e.pfPct)}% of Basic)`,k.pfR):''}${k.gr?row('Gratuity (4.81% of Basic)',k.gr):''}${row('Total (B)',k.pfR+k.gr,1)}
<tr class="ctc"><td>Cost to company (A + B)</td><td class="r">${money(k.m)}</td><td class="r">${money(k.y)}</td></tr>
<tr class="h2"><td colspan="3">C. Deductions from gross salary</td></tr>${k.pfE?row(`Employee Provident Fund (${fN(e.pfPct)}% of Basic)`,k.pfE):''}${k.pt?row('Professional tax',k.pt):''}${row('Estimated take-home (A − C)',k.net,1)}</tbody></table>
<p class="nt">Notes: Gratuity is payable as per the Payment of Gratuity Act, 1972 on completion of eligible service. Professional tax is as per the state slab and may vary in some months. Income tax (TDS) is deducted as applicable and is not shown above. Salary is pro-rated for the days paid in a month. The compensation is confidential.</p>
<div class="dec"><b>Declaration and acceptance by the employee</b><br>I have read and understood this letter, the Terms and Conditions of Employment, the Code of Conduct and Ethics and the Compensation Structure. I accept this offer on these terms and confirm that the information I have given to the Company is true. I will join on ${jd}.</div>
<div class="sg"><div>${sign}</div><div class="sgb"><p><b>Accepted by</b></p><div class="sl"></div><p><b>${esc(e.name)}</b><br>Date: ______________ &nbsp; Place: ______________</p></div></div>
${foot(4)}</div>`}
const CSS = `
.slip .lh{display:flex;align-items:center;gap:14px;padding:2px 0 10px}.slip .lh img{width:58px;height:58px;object-fit:contain;flex:none;border-radius:12px}
.slip .lht{display:flex;flex-direction:column;gap:1px;min-width:0}.slip .lht b{font-family:Georgia,'Times New Roman',serif;font-size:22px;color:var(--bc,#0f6e56);letter-spacing:.2px}.slip .lht span{font-size:11px;color:#4b5563}
.slip .lhbar{height:4px;border-radius:2px;background:linear-gradient(90deg,var(--bc,#0f6e56),color-mix(in srgb,var(--bc,#0f6e56) 25%,#fff));margin-bottom:10px}
.slip .dt{text-align:center;font-weight:800;font-size:15px;letter-spacing:.3px;padding:6px 0;margin-bottom:4px;border-bottom:1px solid #d6dae0;text-transform:uppercase}
/* offer letter */
.slip.off{font-family:Georgia,'Times New Roman',serif;font-size:13px;line-height:1.5;color:#1f2933;padding:0!important;min-height:0!important;background:transparent!important;border:0!important;box-shadow:none!important}
.slip.off .pg{background:#fff;width:794px;min-height:1123px;padding:48px 56px 70px;box-sizing:border-box;position:relative;margin:0 0 16px;border:1px solid #e3e6ea;border-radius:6px}
.slip.off p{margin:8px 0}.slip.off .olh{display:flex;justify-content:space-between;margin:4px 0 0;font-size:12.5px}
.slip.off .conf{text-align:right;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#9a3412;font-weight:700;margin:6px 0 0}
.slip.off .to{margin-top:6px}.slip.off .sub2{margin:12px 0 10px;text-decoration:underline;text-underline-offset:3px}
.slip.off .kd{width:100%;border-collapse:collapse;margin:8px 0 10px}.slip.off .kd td{padding:5px 8px;border:1px solid #d6dae0}.slip.off .kd td:first-child{width:32%;background:#f6f7f9;font-weight:700}
.slip.off .trm{margin:6px 0;padding-left:20px}.slip.off .trm li{margin:4px 0}
.slip.off .anx{text-align:center;font-weight:800;font-size:16px;text-decoration:underline;text-underline-offset:4px;margin:8px 0 10px}
.slip.off .oct{margin:10px 0;font-family:system-ui,Arial,sans-serif}.slip.off .oct th{background:var(--bc2,#eef1f4)}.slip.off .oct tr.h2 td{font-weight:800;background:#f6f7f9}.slip.off .oct tr.ctc td{font-weight:800;background:#e7f3ee;font-size:1.05em}
.slip.off .nt{font-size:11px;color:#4b5563;line-height:1.45}.slip.off .dec{border:1px solid #d6dae0;background:#f6f7f9;padding:10px 12px;margin:12px 0 4px;font-size:12px;line-height:1.5}.slip.off .trm.dl li{margin:2px 0}
.slip.off .sg{display:flex;gap:36px;margin-top:18px}.slip.off .sg>div{flex:1}.slip.off .sl{border-bottom:1px solid #333;height:44px;margin:4px 0 6px;width:80%}
.slip.off .lf{position:absolute;left:56px;right:56px;bottom:26px;display:flex;justify-content:space-between;gap:12px;font-size:10px;color:#6a7686;border-top:1px solid #d6dae0;padding-top:6px;font-family:system-ui,Arial,sans-serif}
@media print{.slip:not(.off) .lh{padding-bottom:5px;gap:10px}.slip:not(.off) .lh img{width:38px;height:38px;border-radius:8px}.slip:not(.off) .lht b{font-size:14pt}.slip:not(.off) .lht span{font-size:7.5pt}.slip:not(.off) .lhbar{height:3px;margin-bottom:5px}.slip:not(.off) .dt{font-size:10.5pt;padding:3px 0}}
@media print{.slip.off .trm li{margin:3px 0}.slip.off .anx{margin:4px 0 8px}.slip.off{font-size:10pt;line-height:1.42;width:auto!important;max-width:none!important}.slip.off .pg{width:auto;min-height:268mm;padding:0 0 14mm;margin:0;border:0;border-radius:0}.slip.off .pg.pb{break-before:page;page-break-before:always}.slip.off .lf{left:0;right:0;bottom:0}.slip.off p{margin:5px 0}.slip.off .sl{height:34px}}
`;
function ensureCss() { if (document.getElementById('offerCss')) return; const s = document.createElement('style'); s.id = 'offerCss'; s.textContent = CSS + '.slip .lh img.snlh{width:auto!important;height:62px!important;max-width:60%;border-radius:0!important;object-fit:contain}.slip .lhbar{background:linear-gradient(90deg,#2459a5,#e8731c)!important}@media print{.slip .lh img.snlh{height:46px!important}}\n.slip.off table{width:100%;border-collapse:collapse;font-size:inherit}.slip.off table th,.slip.off table td{padding:4px 8px!important;height:auto!important;line-height:1.35;white-space:normal!important;text-transform:none!important;letter-spacing:0!important;font-size:inherit!important;border:1px solid #d6dae0;text-align:left;vertical-align:top;background:none}' +
    '.slip.off .st th{background:#eef1f4!important;font-weight:700}.slip.off .r{text-align:right!important;font-variant-numeric:tabular-nums}.slip.off .kd td:first-child{background:#f6f7f9!important}.slip.off .oct tr.h2 td{background:#f6f7f9!important}.slip.off .oct tr.ctc td{background:#e7f3ee!important}' +
    '\n.offer-view{overflow-x:auto;background:#eef1f4;padding:12px;border-radius:14px}.offer-view .slip.off{width:794px;margin:0 auto}' +
    '\n@media print{html,body{margin:0!important;padding:0!important;background:#fff!important}body.printing-offer>*:not(#offerPrint){display:none!important}#offerPrint{display:block!important}' +
    '#offerPrint .slip.off{width:210mm!important;margin:0!important;font-size:10pt;line-height:1.42}' +
    '#offerPrint .slip.off .pg{width:210mm!important;height:296mm!important;min-height:0!important;padding:14mm 16mm 20mm!important;margin:0!important;border:0!important;border-radius:0!important;box-sizing:border-box;overflow:hidden;position:relative;break-before:auto!important;page-break-before:auto!important;break-after:page;page-break-after:always}' +
    '#offerPrint .slip.off .pg:last-child{break-after:auto;page-break-after:auto}#offerPrint .slip.off .lf{left:16mm!important;right:16mm!important;bottom:8mm!important}}'; document.head.appendChild(s); }
/** CTC letter: released before joining – compensation only. The full offer letter follows once the employee joins. */
function ctcLetter(e,issued){const c=CO(),k=ctc(e),n=issued?new Date(issued):new Date(),first=String(e.name||'').split(/\s+/)[0],dt=n.toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'});
  const co=esc(c.name)||'the Company',ref=`${esc(c.ref).replace(/OFFER/i,'CTC')}/${n.getFullYear()}/${esc(e.eid)}`,jd=e.join?new Date(e.join+'T00:00:00').toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'}):'—';
  const row=(l,m,b)=>`<tr${b?' class="b"':''}><td>${l}</td><td class="r">${money(m)}</td><td class="r">${money(m*12)}</td></tr>`;
  const sign=`<div class="sgb"><p>Yours sincerely,<br>For <b>${co}</b></p><div class="sl"></div><p><b>${esc(c.sig)||'Authorised Signatory'}</b><br>${esc(c.sigD)}</p></div>`;
  return `<div class="pg">${__lh()}
<div class="olh"><span><b>Ref:</b> ${ref}</span><span><b>Date:</b> ${dt}</span></div>
<div class="conf">Private &amp; Confidential</div>
<p class="to">To,<br><b>${esc(e.name)}</b>${e.addr?'<br>'+esc(e.addr):''}${e.mob?'<br>Mobile: '+esc(e.mob):''}</p>
<p class="sub2"><b>Subject: Compensation (CTC) – ${esc(e.desg||'')}</b></p>
<p>Dear ${esc(first)},</p>
<p>Further to our discussions, we are pleased to confirm the compensation offered to you for the position of <b>${esc(e.desg||'')}</b>${e.grade?` (Grade ${esc(e.grade)})`:''} with <b>${co}</b>. Your annual Cost to Company (CTC) will be <b>₹${money(k.y)}</b>, with your expected date of joining on <b>${jd}</b>.</p>
<table class="st oct"><thead><tr><th>Component</th><th>Per month (₹)</th><th>Per annum (₹)</th></tr></thead><tbody>
<tr class="h2"><td colspan="3">A. Earnings</td></tr>${row('Basic salary',k.b)}${k.h?row('House rent allowance',k.h):''}${k.c?row('Conveyance allowance',k.c):''}${k.sp?row('Special allowance',k.sp):''}${row('Gross salary (A)',k.gross,1)}
<tr class="h2"><td colspan="3">B. Employer contributions</td></tr>${k.pfR?row(`Provident Fund (${fN(e.pfPct)}% of Basic)`,k.pfR):''}${k.gr?row('Gratuity (4.81% of Basic)',k.gr):''}${row('Total (B)',k.pfR+k.gr,1)}
<tr class="ctc"><td>Cost to company (A + B)</td><td class="r">${money(k.m)}</td><td class="r">${money(k.y)}</td></tr>
<tr class="h2"><td colspan="3">C. Deductions from gross salary</td></tr>${k.pfE?row(`Employee Provident Fund (${fN(e.pfPct)}% of Basic)`,k.pfE):''}${k.pt?row('Professional tax',k.pt):''}${row('Estimated take-home (A − C)',k.net,1)}</tbody></table>
<p class="nt">Income tax (TDS) is deducted as applicable. Salary is pro-rated for the days paid in a month. This compensation is confidential.</p>
<p>Your offer letter, with the full terms and conditions of employment, will be issued on the day you join. Please accept this compensation in SN People › My documents.</p>
<div class="sg"><div>${sign}</div><div class="sgb"><p><b>Accepted by</b></p><div class="sl"></div><p><b>${esc(e.name)}</b><br>Date: ______________</p></div></div>
<div class="lf"><span>${esc(c.name)}${c.cin?' · CIN '+esc(c.cin):''}</span><span>CTC letter</span><span>Page 1 of 1</span></div></div>`;}
/** Hike list in order, with the factor before and after each one. */
function hikeSteps(hikes){let f=1;return (hikes||[]).filter(h=>+h.p&&h.f).slice().sort((a,b)=>a.f<b.f?-1:1).map(h=>{const b=f;f=f*(1+(+h.p)/100);return{p:+h.p,f:h.f,before:b,after:f}})}
function scaled(e,x){return Object.assign({},e,{basic:R2((+e.basic||0)*x),hra:R2((+e.hra||0)*x),conv:R2((+e.conv||0)*x),spl:R2((+e.spl||0)*x)})}
function revLetter(e,h,issued){const c=CO(),n=issued?new Date(issued):new Date(),first=String(e.name||'').split(/\s+/)[0],dt=n.toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'});
  const co=esc(c.name)||'the Company',ref=`${esc(c.ref).replace(/OFFER/i,'REV')}/${n.getFullYear()}/${esc(e.eid)}/${esc(h.f.replace('-',''))}`,ef=new Date(h.f+'-01T00:00:00').toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'});
  const r=ctc(scaled(e,h.after)),row=(l,b,bold)=>`<tr${bold?' class="b"':''}><td>${l}</td><td class="r">${money(b)}</td><td class="r">${money(b*12)}</td></tr>`;
  const sign=`<div class="sgb"><p>Yours sincerely,<br>For <b>${co}</b></p><div class="sl"></div><p><b>${esc(c.sig)||'Authorised Signatory'}</b><br>${esc(c.sigD)}</p></div>`;
  return `<div class="pg">${__lh()}
<div class="olh"><span><b>Ref:</b> ${ref}</span><span><b>Date:</b> ${dt}</span></div>
<div class="conf">Private &amp; Confidential</div>
<p class="to">To,<br><b>${esc(e.name)}</b><br>${esc(e.desg||'')}${e.eid?' · Employee ID '+esc(e.eid):''}</p>
<p class="sub2"><b>Subject: Revision in Compensation</b></p>
<p>Dear ${esc(first)},</p>
<p><b>Congratulations!</b> In recognition of your contribution and performance, we are pleased to inform you that your compensation has been revised with effect from <b>${ef}</b>.</p>
<p>Your revised annual Cost to Company (CTC) is <b>₹${money(r.y)}</b>. The revised salary structure is given below.</p>
<table class="st oct"><tr><th>Component</th><th class="r">Per month (₹)</th><th class="r">Per year (₹)</th></tr>
${row('Basic',r.b)}${r.h?row('HRA',r.h):''}${r.c?row('Conveyance',r.c):''}${r.sp?row('Special allowance',r.sp):''}${row('Gross salary',r.gross,1)}${row('PF – employer',r.pfR)}${r.gr?row('Gratuity',r.gr):''}<tr class="ctc"><td>Cost to company (CTC)</td><td class="r">${money(r.m)}</td><td class="r">${money(r.y)}</td></tr>${row('Less: PF – employee',-r.pfE)}${row('Less: Professional tax',-r.pt)}${row('Take-home (approx.)',r.net,1)}</table>
<p class="nt">Take-home is before VPF, ESI, other deductions and income tax, which are deducted as applicable.</p>
<p>All other terms and conditions of your employment remain unchanged. This letter is confidential and its contents should not be shared.</p>
<p>We appreciate your efforts and look forward to your continued contribution to ${co}.</p>
${sign}<div class="lf"><span>${esc(c.name)}${c.cin?' · CIN '+esc(c.cin):''}</span><span>Revision letter</span><span>Page 1 of 1</span></div></div>`;}
/** Promotion letter: new designation from a month; if pay goes up, the new salary structure (no %). pr = {f, desg, grade, p, after} */
function promoLetter(e,pr,issued){const c=CO(),n=issued?new Date(issued):new Date(),first=String(e.name||'').split(/\s+/)[0],dt=n.toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'});
  const co=esc(c.name)||'the Company',ref=`${esc(c.ref).replace(/OFFER/i,'PROMO')}/${n.getFullYear()}/${esc(e.eid)}/${esc(String(pr.f||'').replace('-',''))}`,ef=pr.f?new Date(pr.f+'-01T00:00:00').toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'}):'—';
  const r=ctc(scaled(e,+pr.after||1)),row=(l,b,bold)=>`<tr${bold?' class="b"':''}><td>${l}</td><td class="r">${money(b)}</td><td class="r">${money(b*12)}</td></tr>`,pay=+pr.p>0;
  const sign=`<div class="sgb"><p>Yours sincerely,<br>For <b>${co}</b></p><div class="sl"></div><p><b>${esc(c.sig)||'Authorised Signatory'}</b><br>${esc(c.sigD)}</p></div>`;
  return `<div class="pg">${__lh()}
<div class="olh"><span><b>Ref:</b> ${ref}</span><span><b>Date:</b> ${dt}</span></div>
<div class="conf">Private &amp; Confidential</div>
<p class="to">To,<br><b>${esc(e.name)}</b><br>${esc(pr.prevDesg||e.desg||'')}${e.eid?' · Employee ID '+esc(e.eid):''}</p>
<p class="sub2"><b>Subject: Promotion – ${esc(pr.desg)}</b></p>
<p>Dear ${esc(first)},</p>
<p><b>Congratulations!</b> In recognition of your performance, dedication and contribution to ${co}, we are delighted to promote you to the position of <b>${esc(pr.desg)}</b>${pr.grade?` (Grade ${esc(pr.grade)})`:''} with effect from <b>${ef}</b>.</p>
${pay?`<p>With this promotion your compensation is revised. Your new annual Cost to Company (CTC) is <b>₹${money(r.y)}</b>, as set out below.</p>
<table class="st oct"><tr><th>Component</th><th class="r">Per month (₹)</th><th class="r">Per year (₹)</th></tr>
${row('Basic',r.b)}${r.h?row('HRA',r.h):''}${r.c?row('Conveyance',r.c):''}${r.sp?row('Special allowance',r.sp):''}${row('Gross salary',r.gross,1)}${row('PF – employer',r.pfR)}${r.gr?row('Gratuity',r.gr):''}<tr class="ctc"><td>Cost to company (CTC)</td><td class="r">${money(r.m)}</td><td class="r">${money(r.y)}</td></tr>${row('Less: PF – employee',-r.pfE)}${row('Less: Professional tax',-r.pt)}${row('Take-home (approx.)',r.net,1)}</table>
<p class="nt">Take-home is before VPF, ESI, other deductions and income tax, which are deducted as applicable.</p>`:'<p>Your present compensation remains unchanged.</p>'}
<p>In your new role you will take on wider responsibilities, which your reporting manager will explain. All other terms and conditions of your employment remain unchanged. This letter is confidential.</p>
<p>We are confident you will continue to excel and we wish you every success in your new role.</p>
${sign}<div class="lf"><span>${esc(c.name)}${c.cin?' · CIN '+esc(c.cin):''}</span><span>Promotion letter</span><span>Page 1 of 1</span></div></div>`;}
/** Any letter attached to an SN Mail, by kind – so SN Mail and the Punch app open new kinds without an update. */
function attInner(o,x){if(x.kind==='rev'){const r=(o.revs||[]).find(z=>z.f===x.f);return r?revLetter(o,r,r.at):''}if(x.kind==='promo'){const r=(o.promos||[]).find(z=>z.f===x.f);return r?promoLetter(o,r,r.at):''}if(x.kind==='ctc')return ctcLetter(o,o.ctcAt);if(x.kind==='offer')return letter(o);return ''}
function printDoc(inner,title){let p=document.getElementById('offerPrint');if(!p){p=document.createElement('div');p.id='offerPrint';p.style.display='none';document.body.appendChild(p)}
  p.innerHTML='<div class="slip off">'+inner+'</div>';document.body.classList.add('printing-offer');
  let pg=document.getElementById('offerPage');if(!pg){pg=document.createElement('style');pg.id='offerPage';document.head.appendChild(pg)}pg.textContent='@page{size:A4;margin:0}';
  const t0=document.title;document.title=title;const done=()=>{document.body.classList.remove('printing-offer');p.innerHTML='';pg.textContent='';document.title=t0;removeEventListener('afterprint',done)};addEventListener('afterprint',done);setTimeout(()=>window.print(),50)}
/* Fit to screen: A4 pages (794 px wide) are shrunk to the width of the box they sit in, so the whole page shows on a phone. Print is unaffected. */
function fitAll(){document.querySelectorAll('.slip.off').forEach(el=>{if(el.closest('#offerPrint'))return;const box=el.parentElement;if(!box)return;el.style.zoom='';
  const cs=getComputedStyle(box),w=box.clientWidth-parseFloat(cs.paddingLeft||0)-parseFloat(cs.paddingRight||0),nat=el.scrollWidth;if(w>0&&nat>w+1)el.style.zoom=String(Math.floor(w/nat*1000)/1000)})}
let fitQ=0;const fitSoon=()=>{if(fitQ)return;fitQ=requestAnimationFrame(()=>{fitQ=0;fitAll()})};
const fitStart=()=>{try{new MutationObserver(fitSoon).observe(document.body,{childList:true,subtree:true});addEventListener('resize',fitSoon);fitSoon()}catch(e){}};
if(typeof document!=='undefined'&&document.addEventListener){if(document.body)fitStart();else document.addEventListener('DOMContentLoaded',fitStart)}
window.OfferLetter = {
  fit: fitAll,
  hikeSteps,
  promoHtml(e, pr, company, issued) { COMPANY = company || {}; ensureCss(); return '<div class="slip off">' + promoLetter(e, pr, issued) + '</div>'; },
  promoPrint(e, pr, company, issued) { COMPANY = company || {}; ensureCss(); printDoc(promoLetter(e, pr, issued), 'Promotion letter - ' + (e.name || '')); },
  attHtml(o, x, company) { COMPANY = company || {}; ensureCss(); const h = attInner(o, x); return h ? '<div class="slip off">' + h + '</div>' : ''; },
  attPrint(o, x, company) { COMPANY = company || {}; ensureCss(); const h = attInner(o, x); if (h) printDoc(h, String(x.name || 'Letter').replace(/\.pdf$/i, '')); },
  ctcHtml(e, company, issued) { COMPANY = company || {}; ensureCss(); return '<div class="slip off">' + ctcLetter(e, issued) + '</div>'; },
  ctcPrint(e, company, issued) { COMPANY = company || {}; ensureCss(); printDoc(ctcLetter(e, issued), 'CTC letter - ' + (e.name || '')); },
  revHtml(e, h, company, issued) { COMPANY = company || {}; ensureCss(); return '<div class="slip off">' + revLetter(e, h, issued) + '</div>'; },
  revPrint(e, h, company, issued) { COMPANY = company || {}; ensureCss(); printDoc(revLetter(e, h, issued), 'Salary revision letter - ' + (e.name || '')); },
  ctc,
  lh(short, company) { COMPANY = company || {}; ensureCss(); return __lh(short); },
  html(e, company) { COMPANY = company || {}; ensureCss(); return '<div class="slip off">' + letter(e) + '</div>'; },
  print(e, company) { COMPANY = company || {}; ensureCss(); let p = document.getElementById('offerPrint'); if (!p) { p = document.createElement('div'); p.id = 'offerPrint'; p.style.display = 'none'; document.body.appendChild(p); }
    p.innerHTML = '<div class="slip off">' + letter(e) + '</div>'; document.body.classList.add('printing-offer');
    // A4 with no browser margins while the letter prints, so Chrome adds no page header/footer (URL, date, title)
    let pg = document.getElementById('offerPage'); if (!pg) { pg = document.createElement('style'); pg.id = 'offerPage'; document.head.appendChild(pg); } pg.textContent = '@page{size:A4;margin:0}';
    const t0 = document.title; document.title = 'Offer letter - ' + (e.name || '');
    const done = () => { document.body.classList.remove('printing-offer'); p.innerHTML = ''; pg.textContent = ''; document.title = t0; removeEventListener('afterprint', done); }; addEventListener('afterprint', done); setTimeout(() => window.print(), 50); }
};
})();
