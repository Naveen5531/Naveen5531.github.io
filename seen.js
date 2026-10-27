/* SN "seen" store – shared by the portal, SN HR, SN Mail and SN Pickup.
   Each person has one document seen/{uid} = { key: time last opened }. Opening a screen marks it read,
   and every other open app and device clears that count straight away (live listener).
   A copy is kept on the device so counts stay right offline or before the server answers. */
(function () {
  let uid = null, M = {}, unsub = null, fns = [], pend = {}, timer = null;
  const num = v => (typeof v === 'number' ? v : v && v.toMillis ? v.toMillis() : +v || 0);
  const save = () => { try { localStorage.setItem('sn.seen.' + uid, JSON.stringify(M)); } catch (e) {} };
  const fire = () => fns.forEach(f => { try { f(); } catch (e) {} });
  const db = () => { try { return window.firebase && firebase.firestore ? firebase.firestore() : null; } catch (e) { return null; } };
  function flush() {
    timer = null; const d = db(), p = pend; pend = {};
    if (d && uid && Object.keys(p).length) d.collection('seen').doc(uid).set(p, { merge: true }).catch(() => {});
  }
  const S = {
    start(u) {
      if (!u || u === uid) return; if (unsub) { try { unsub(); } catch (e) {} unsub = null; }
      uid = u; M = {}; try { M = JSON.parse(localStorage.getItem('sn.seen.' + uid) || '{}') || {}; } catch (e) {}
      const me = uid; let n = 0; (function sub() {
        if (me !== uid) return; const d = db();
        if (!d) { if (++n < 80) setTimeout(sub, 250); return; }
        unsub = d.collection('seen').doc(uid).onSnapshot(s => {
          const r = s.exists ? s.data() : {}; let ch = false;
          Object.keys(r).forEach(k => { if (num(r[k]) > num(M[k])) { M[k] = num(r[k]); ch = true; } });
          if (ch) { save(); fire(); }
        }, () => {});
      })();
      fire();
    },
    at: k => num(M[k]),
    /** Mark a screen read now (written to the server at most every 1.5 s). */
    mark(k) { if (!k) return; const t = Date.now(); M[k] = t; pend[k] = t; save(); if (!timer) timer = setTimeout(flush, 1500); },
    /** How many items arrived or changed after the screen was last opened. */
    count(list, k, tf) { const a = num(M[k]); return (list || []).filter(x => num(tf ? tf(x) : (x.updatedAt || x.createdAt || x.at)) > a).length; },
    on(f) { fns.push(f); }
  };
  window.SNSeen = S;
  /* start by itself once Firebase is ready and someone is signed in */
  let tries = 0; (function wait() {
    try { if (window.firebase && firebase.apps && firebase.apps.length && firebase.auth) { firebase.auth().onAuthStateChanged(u => { if (u) S.start(u.uid); }); return; } } catch (e) {}
    if (++tries < 120) setTimeout(wait, 250);
  })();
})();
