/* ===== Company set-up for the website, portal, SN People, SN Mail, SN Pickup and the vendor portal =====
   To use these pages for another company, change the values below (and put that company's logo files in brand/).
   Every page swaps the default names, logos and web address for these values as it shows them, so nothing
   else needs editing. For SN Logistics itself the values are the defaults and nothing changes.
   (The Punch app has its own copy of these settings in app/src/main/assets/brand.js in the Punch repository.) */
window.BRAND = Object.assign({
  company: 'SN Logistics',           // company name
  tagline: 'Speed & Trust',
  portalName: 'SN Control Tower',    // the staff portal (portal/)
  peopleName: 'SN People',           // HR self-service site (hr/)
  pickupName: 'SN Pickup',           // pickup / driver app (pickup/)
  mailName: 'SN Mail',               // internal mail (mail/)
  mailDomain: 'snlogistics',         // company mail IDs look like name@snlogistics
  site: 'https://naveen5531.github.io', // where these pages, the APKs and the version files are hosted
  logo: '',                          // wide logo file, e.g. 'brand/acme-logo.png' (blank = keep the SN logo files)
  mark: ''                           // square icon file, e.g. 'brand/acme-mark.png'
}, window.BRAND_OVERRIDE || {});

(function () {
  var B = window.BRAND, D = 'https://naveen5531.github.io';
  var map = [['SN Control Tower', B.portalName], ['SN Logistics', B.company], ['SN LOGISTICS', String(B.company).toUpperCase()], ['SN People', B.peopleName],
    ['SN Pickup', B.pickupName], ['SN Mail', B.mailName], ['Speed & Trust', B.tagline], ['@snlogistics', '@' + B.mailDomain], ['naveen5531.github.io', String(B.site).replace(/^https?:\/\//, '')]]
    .filter(function (p) { return p[1] && p[1] !== p[0]; }).sort(function (a, b) { return b[0].length - a[0].length; });
  var logo = B.logo, mark = B.mark;
  if (!map.length && !logo && !mark) return; // nothing to change for SN Logistics itself
  var swap = function (t) { if (!t) return t; for (var i = 0; i < map.length; i++) if (t.indexOf(map[i][0]) >= 0) t = t.split(map[i][0]).join(map[i][1]); return t; };
  var rel = function (f) { try { return new URL(f, B.site.replace(/\/?$/, '/')).href; } catch (e) { return f; } };
  var ATTR = ['title', 'placeholder', 'aria-label', 'alt', 'value', 'content'];
  var seen = new WeakMap(); // node → text already swapped (never swap the same text twice)
  var txt = function (x) { var v = x.nodeValue; if (seen.get(x) === v) return; var w = swap(v); if (w !== v) x.nodeValue = w; seen.set(x, w); };
  function fixEl(el) {
    if (el.nodeType !== 1 || el.tagName === 'SCRIPT' || el.tagName === 'STYLE') return;
    var done = seen.get(el) || {};
    for (var i = 0; i < ATTR.length; i++) { var a = el.getAttribute && el.getAttribute(ATTR[i]); if (a && done[ATTR[i]] !== a) { var b = swap(a); if (b !== a) el.setAttribute(ATTR[i], b); done[ATTR[i]] = b; } }
    seen.set(el, done);
    if (el.tagName === 'IMG') { var s = el.getAttribute('src') || ''; if (logo && /sn-logo/i.test(s)) el.setAttribute('src', rel(logo)); else if (mark && /sn-(mark|icon|apple)/i.test(s)) el.setAttribute('src', rel(mark)); }
    if (el.tagName === 'A') { var h = el.getAttribute('href') || ''; if (h.indexOf(D) === 0 && B.site !== D) el.setAttribute('href', B.site + h.slice(D.length)); }
  }
  function walk(n) {
    if (n.nodeType === 3) { txt(n); return; }
    if (n.nodeType !== 1) return; fixEl(n);
    var it = document.createTreeWalker(n, 5, null), x; // elements and text
    while ((x = it.nextNode())) { if (x.nodeType === 3) { var p = x.parentNode; if (p && (p.tagName === 'SCRIPT' || p.tagName === 'STYLE')) continue; txt(x); } else fixEl(x); }
  }
  var lastT = '';
  function all() { if (document.title && document.title !== lastT) { lastT = swap(document.title); document.title = lastT; } if (document.body) walk(document.body); }
  var mo = new MutationObserver(function (L) { for (var i = 0; i < L.length; i++) { var r = L[i]; if (r.type === 'characterData') walk(r.target); else if (r.target && r.target.tagName === 'TITLE') all(); else for (var j = 0; j < r.addedNodes.length; j++) walk(r.addedNodes[j]); } });
  var start = function () { all(); mo.observe(document.documentElement, { childList: true, subtree: true, characterData: true }); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
