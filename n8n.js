/* SN Logistics → n8n. Every SN app calls snHook(event, data) after its own save succeeds.
   The n8n address lives in /n8n.json ({"base": "https://your-n8n/webhook", "on": true}); while it is empty, nothing is sent.
   Sending never blocks or breaks the app: no waiting, no popups, errors are ignored. */
(function () {
  var PATH = { pickup: 'sn-pickup', scan: 'sn-scan', enquiry: 'sn-enquiry' };
  var root = (function () { var s = document.currentScript && document.currentScript.src; return s ? s.replace(/n8n\.js.*$/, '') : '/'; })();
  var cfg = null, wait = [];
  fetch(root + 'n8n.json?t=' + Math.floor(Date.now() / 300000), { cache: 'no-store' })
    .then(function (r) { return r.ok ? r.json() : {}; }).catch(function () { return {}; })
    .then(function (c) { cfg = c || {}; var q = wait; wait = []; q.forEach(function (a) { send(a[0], a[1]); }); });
  function send(ev, data) {
    var base = String(cfg.base || '').replace(/\/+$/, '');
    if (!base || cfg.on === false || !PATH[ev]) return;
    try {
      fetch(base + '/' + PATH[ev], { method: 'POST', headers: { 'Content-Type': 'application/json' }, keepalive: true,
        body: JSON.stringify(Object.assign({ event: ev, sent_at: new Date().toISOString(), app: location.pathname.split('/')[1] || 'website' }, data)) }).catch(function () {});
    } catch (e) {}
  }
  window.snHook = function (ev, data) { if (cfg === null) wait.push([ev, data || {}]); else send(ev, data || {}); };
})();
