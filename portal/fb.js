// Movana portal on Firebase: staff log in with username + password (Firebase Authentication),
// data lives in Cloud Firestore and is protected by firestore.rules on Google's servers.
// This file gives the portal the same small data / user / download interface it had on claude.ai.
(function () {
  const CFG = window.MOVANA_FIREBASE_CONFIG;
  const DOMAIN = 'staff.movana.app'; // a username like "ravi" signs in as ravi@staff.movana.app
  const toEmail = u => { u = String(u || '').trim().toLowerCase(); return u.includes('@') ? u : u.replace(/[^a-z0-9._-]/g, '') + '@' + DOMAIN; };
  const toUser = email => String(email || '').endsWith('@' + DOMAIN) ? email.slice(0, -DOMAIN.length - 1) : email;
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const COLORS = ['#b8862b', '#1f6f5c', '#6b4fa3', '#a5452f', '#2f5fa5', '#7a6a2a', '#3d7a2f', '#8a3b6b'];
  const avatar = (name, id) => { const ini = String(name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('') || '?'; let h = 0; for (const c of String(id || name)) h = (h * 31 + c.charCodeAt(0)) >>> 0; const bg = COLORS[h % COLORS.length]; return 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" fill="' + bg + '"/><text x="32" y="41" font-family="Arial,sans-serif" font-size="26" font-weight="700" fill="#fff" text-anchor="middle">' + ini + '</text></svg>'); };

  // ---------- login screen ----------
  const css = document.createElement('style');
  css.textContent = '#fbGate{position:fixed;inset:0;z-index:100;background:#0b0b0c;color:#f2efe7;display:grid;place-items:center;padding:24px max(16px,env(safe-area-inset-right,0px)) 24px max(16px,env(safe-area-inset-left,0px));overflow:auto;font-family:"Plus Jakarta Sans",system-ui,sans-serif}' +
    '#fbGate .box{width:100%;max-width:380px;display:grid;gap:14px}#fbGate .mk{width:56px;height:56px;border-radius:16px;background:#b8862b;display:grid;place-items:center}#fbGate h1{font:600 1.7rem Fraunces,Georgia,serif;margin:6px 0 0}#fbGate p{margin:0;color:#a9a59a;font-size:.92rem;line-height:1.5}' +
    '#fbGate label{display:grid;gap:6px;font-size:.8rem;font-weight:600;color:#a9a59a}#fbGate input{font:500 1rem inherit;font-family:inherit;padding:13px 14px;border-radius:12px;border:1px solid #3a3426;background:#151517;color:#f2efe7;width:100%;box-sizing:border-box}#fbGate input:focus{outline:2px solid #b8862b;outline-offset:1px}' +
    '#fbGate button{font:700 1rem inherit;font-family:inherit;padding:14px;border-radius:999px;border:0;background:#b8862b;color:#fff;cursor:pointer}#fbGate button[disabled]{opacity:.6}#fbGate .link{background:none;color:#d4a64a;padding:4px;font-weight:600;font-size:.86rem}#fbGate .err{color:#ff8d7a;min-height:1.2em;font-size:.88rem}#fbGate .ok{color:#7fd6a0}#fbGate .gbtn{display:flex;align-items:center;justify-content:center;gap:10px;background:#fff;color:#1f1f1f;border:1px solid #dadce0}#fbGate code{background:#1d1d20;padding:2px 6px;border-radius:6px;color:#f2efe7}';
  document.head.appendChild(css);
  const gate = document.createElement('div'); gate.id = 'fbGate'; gate.hidden = true;
  document.addEventListener('DOMContentLoaded', () => document.body.appendChild(gate));
  if (document.body) document.body.appendChild(gate);
  const MARK = '<div class="mk"><svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7h11v9H3z"/><path d="M14 10h4l3 3v3h-7"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/></svg></div>';
  function showGate(html) { gate.innerHTML = '<div class="box">' + MARK + html + '</div>'; gate.hidden = false; const f = gate.querySelector('input'); if (f) setTimeout(() => f.focus(), 50); }

  if (!CFG || !window.firebase) {
    window.claude = { use: async () => null };
    showGate('<h1>Almost ready</h1><p>The portal is waiting for its Firebase connection. Paste the <code>firebaseConfig</code> from the Firebase console into <code>portal/firebase-config.js</code> in the GitHub repository.</p>');
    return;
  }

  const app = firebase.initializeApp(CFG);
  const auth = firebase.auth();
  const fs = firebase.firestore();
  try { fs.settings({ ignoreUndefinedProperties: true, merge: true }); } catch (e) {}
  try { fs.enablePersistence({ synchronizeTabs: true }).catch(() => {}); } catch (e) {}

  function loginScreen(msg) {
    if (!msg && typeof GMSG === 'string' && GMSG) msg = GMSG;
    showGate('<h1>Staff login</h1><p>Movana Logistics control tower</p><form id="fbLogin" style="display:grid;gap:12px"><label>Username<input id="fbU" autocomplete="username" autocapitalize="none" spellcheck="false" required></label><label>Password<input id="fbP" type="password" autocomplete="current-password" required></label><div class="err" id="fbErr" role="alert">' + esc(msg || '') + '</div><button type="submit" id="fbGo">Sign in</button></form><button type="button" id="fbGoogle" class="gbtn"><svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>Sign in with Google</button><button class="link" type="button" id="fbForgot">Forgot password?</button>');
  }
  function setupScreen() {
    showGate('<h1>Create the admin login</h1><p>First time here. This account becomes the owner and Super admin of the portal. Choose a strong password you do not use anywhere else.</p><form id="fbSetup" style="display:grid;gap:12px"><label>Your name<input id="fbN" autocomplete="name" required></label><label>Username<input id="fbU" value="admin" autocomplete="username" autocapitalize="none" spellcheck="false" required></label><label>Password (8+ characters)<input id="fbP" type="password" autocomplete="new-password" required></label><label>Password again<input id="fbP2" type="password" autocomplete="new-password" required></label><div class="err" id="fbErr" role="alert"></div><button type="submit" id="fbGo">Create admin and open portal</button></form>');
  }
  const authMsg = e => ({ 'auth/invalid-credential': 'Wrong username or password.', 'auth/wrong-password': 'Wrong username or password.', 'auth/user-not-found': 'Wrong username or password.', 'auth/invalid-email': 'That username has characters that are not allowed.', 'auth/too-many-requests': 'Too many tries. Wait a few minutes and try again.', 'auth/network-request-failed': 'No internet connection.', 'auth/weak-password': 'Use at least 8 characters.', 'auth/email-already-in-use': 'That username is already taken.', 'auth/user-disabled': 'This login is switched off. Ask your administrator.' })[e && e.code] || ('Could not sign in (' + ((e && e.code) || 'error') + ').');

  gate.addEventListener('submit', async e => {
    e.preventDefault();
    const err = gate.querySelector('#fbErr'), go = gate.querySelector('#fbGo'); err.textContent = ''; GMSG = '';
    const u = gate.querySelector('#fbU').value, p = gate.querySelector('#fbP').value;
    if (e.target.id === 'fbLogin') {
      go.disabled = true;
      try { await auth.signInWithEmailAndPassword(toEmail(u), p); } catch (x) { err.textContent = authMsg(x); go.disabled = false; }
    } else if (e.target.id === 'fbSetup') {
      const n = gate.querySelector('#fbN').value.trim(), p2 = gate.querySelector('#fbP2').value;
      if (!n) { err.textContent = 'Enter your name.'; return; }
      if (p.length < 8) { err.textContent = 'Use at least 8 characters.'; return; }
      if (p !== p2) { err.textContent = 'The two passwords do not match.'; return; }
      go.disabled = true; go.textContent = 'Setting up…';
      try {
        SETUP = { name: n, username: toUser(toEmail(u)) };
        await auth.createUserWithEmailAndPassword(toEmail(u), p);
      } catch (x) { SETUP = null; err.textContent = authMsg(x); go.disabled = false; go.textContent = 'Create admin and open portal'; }
    }
  });
  let GPEND = false, GMSG = '';
  const gprov = () => { const p = new firebase.auth.GoogleAuthProvider(); p.setCustomParameters({ prompt: 'select_account' }); return p; };
  gate.addEventListener('click', async e => {
    const gb = e.target.closest && e.target.closest('#fbGoogle');
    if (gb) {
      const err = gate.querySelector('#fbErr'); err.className = 'err'; err.textContent = ''; gb.disabled = true; GPEND = true; GMSG = '';
      try {
        const r = await auth.signInWithPopup(gprov());
        if (r.additionalUserInfo && r.additionalUserInfo.isNewUser) {
          // this Google account is not linked to any portal login: remove the empty login again
          const em = r.user.email; try { await r.user.delete(); } catch (x) { try { await auth.signOut(); } catch (y) {} }
          GPEND = false; GMSG = em + ' is not linked to a portal login. Sign in with your username once, then open My access › Sign in with Google › Link.'; loginScreen(); return;
        }
        GPEND = false; window.__fbOnUser(r.user);
      } catch (x) { GPEND = false; gb.disabled = false; if (!['auth/popup-closed-by-user', 'auth/cancelled-popup-request'].includes(x && x.code)) err.textContent = x && x.code === 'auth/popup-blocked' ? 'Allow pop-ups for this site, then try again.' : authMsg(x); }
      return;
    }
    if (e.target.id !== 'fbForgot') return;
    const u = gate.querySelector('#fbU').value.trim(), err = gate.querySelector('#fbErr');
    if (!u.includes('@')) { err.textContent = 'Ask your administrator to set a new password for you. (Logins that use a real email address can reset by email.)'; return; }
    try { await auth.sendPasswordResetEmail(u); err.className = 'err ok'; err.textContent = 'Reset link sent to ' + u + '.'; } catch (x) { err.textContent = authMsg(x); }
  });

  let SETUP = null;
  async function firstRun(user) {
    const b = fs.batch();
    b.set(fs.doc('settings/owner'), { uid: user.uid, at: Date.now() });
    b.set(fs.doc('public/setup'), { done: true, at: Date.now() });
    b.set(fs.doc('members/' + user.uid), { role: 'superadmin', status: 'Active', staff: '', owner: true, createdAt: Date.now(), updatedAt: Date.now(), addedBy: user.uid });
    b.set(fs.doc('users/' + user.uid), { name: SETUP.name, username: SETUP.username, createdAt: Date.now() });
    await b.commit();
    SETUP = null;
  }

  const ME = { user: null, member: null, profile: null, owner: null };
  const signedIn = new Promise(resolve => {
    let started = false;
    auth.onAuthStateChanged(async user => {
      if (!user) {
        if (started) { location.reload(); return; }
        let setupDone = true; try { setupDone = (await fs.doc('public/setup').get()).exists; } catch (e) {}
        setupDone ? loginScreen() : setupScreen();
        return;
      }
      if (started || GPEND) return;
      onUser(user);
    });
    async function onUser(user) {
      if (started) return;
      try {
        if (SETUP) await firstRun(user);
        ME.user = user;
        const [m, p, o] = await Promise.all([fs.doc('members/' + user.uid).get(), fs.doc('users/' + user.uid).get(), fs.doc('settings/owner').get().catch(() => null)]);
        ME.member = m.exists ? m.data() : null; ME.profile = p.exists ? p.data() : {}; ME.owner = o && o.exists ? o.data().uid : null;
        started = true; gate.hidden = true; resolve(user);
      } catch (e) { loginScreen('Signed in, but the data could not load: ' + (e.code || e.message)); }
    }
    window.__fbOnUser = onUser;
  });

  // ---------- data ----------
  // writes the security rules refuse come back as permission-denied; the portal expects "invalid_argument"
  function denied(e) { if (e && e.code === 'permission-denied') { const x = new Error('Not allowed'); x.code = 'invalid_argument'; throw x; } throw e; }
  function wrapDoc(ref) {
    return {
      id: ref.id, path: ref.path,
      get: () => ref.get(), set: d => ref.set(d).catch(denied), update: d => ref.update(d).catch(denied), delete: () => ref.delete().catch(denied),
      onSnapshot: (n, e) => ref.onSnapshot(n, e),
      // one-time claim used for unique ticket ids
      acquire: async o => { try { const ok = await fs.runTransaction(async t => { const s = await t.get(ref); if (s.exists) return false; t.set(ref, { claimedBy: o.holder, at: Date.now() }); return true; }); return { acquired: ok }; } catch (e) { return { acquired: false }; } }
    };
  }
  function wrapQuery(q) {
    return { orderBy: (f, d) => wrapQuery(q.orderBy(f, d)), limit: n => wrapQuery(q.limit(n)), where: (f, op, v) => wrapQuery(q.where(f, op === '==' ? '==' : op, v)), get: () => q.get(), onSnapshot: (n, e) => q.onSnapshot(n, err => { if (e) e({ code: err && err.code === 'permission-denied' ? 'invalid_argument' : (err && err.code) }); }) };
  }
  const db = { collection: k => { const c = fs.collection(k); return Object.assign(wrapQuery(c), { path: k, doc: id => wrapDoc(id ? c.doc(id) : c.doc()) }); }, doc: p => wrapDoc(fs.doc(p)) };

  // ---------- people ----------
  const profCache = {};
  const ADMIN_ROLES = ['superadmin', 'admin_head'];
  const user = {
    me: async () => ({ id: ME.user.uid, name: (ME.profile && ME.profile.name) || toUser(ME.user.email), avatarUrl: avatar((ME.profile && ME.profile.name) || ME.user.email, ME.user.uid), color: '', email: ME.user.email, isMe: true }),
    id: async () => ME.user.uid,
    isOwner: async () => ME.owner === ME.user.uid,
    canEdit: async () => ME.owner === ME.user.uid || !!(ME.member && ME.member.status !== 'Suspended' && ADMIN_ROLES.includes(ME.member.role)),
    can: async () => true,
    profiles: async ids => {
      const out = {};
      await Promise.all([].concat(ids).map(async id => {
        if (!profCache[id]) { try { const s = await fs.doc('users/' + id).get(); profCache[id] = s.exists ? s.data() : {}; } catch (e) { profCache[id] = {}; } }
        const p = profCache[id]; const name = p.name ? p.name + (p.username ? ' (@' + p.username + ')' : '') : '';
        out[id] = { id, name, avatarUrl: avatar(p.name || '?', id), color: '', email: null, isMe: id === ME.user.uid, guest: false };
      }));
      return out;
    },
    search: async q => {
      try { const s = await fs.collection('users').get(); q = String(q || '').toLowerCase();
        return s.docs.map(d => { profCache[d.id] = d.data(); return { id: d.id, name: (d.data().name || '') + (d.data().username ? ' (@' + d.data().username + ')' : ''), avatarUrl: avatar(d.data().name, d.id), isMe: d.id === ME.user.uid }; }).filter(p => p.name && (!q || p.name.toLowerCase().includes(q))).slice(0, 8);
      } catch (e) { return []; }
    }
  };
  const downloads = { save: async ({ filename, data }) => { const blob = data instanceof Blob ? data : new Blob([data]); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 4000); return { status: 'saved' }; } };
  window.claude = { use: async n => { await signedIn; return { db, user, downloads }[n] || null; } };

  // ---------- staff accounts, password, sign out (used by the portal screens) ----------
  window.MOVANA_FB = {
    domain: DOMAIN, toEmail, toUser,
    async createStaff(name, username, password) {
      // a second Firebase app creates the login without signing the admin out
      const sec = firebase.initializeApp(CFG, 'staff-' + Date.now());
      try {
        const cred = await sec.auth().createUserWithEmailAndPassword(toEmail(username), password);
        const uid = cred.user.uid;
        await fs.doc('users/' + uid).set({ name, username: toUser(toEmail(username)), createdAt: Date.now(), createdBy: ME.user.uid });
        profCache[uid] = { name, username: toUser(toEmail(username)) };
        await sec.auth().signOut();
        return uid;
      } finally { try { await sec.delete(); } catch (e) {} }
    },
    async changePassword(oldPw, newPw) {
      const cred = firebase.auth.EmailAuthProvider.credential(ME.user.email, oldPw);
      await ME.user.reauthenticateWithCredential(cred);
      await ME.user.updatePassword(newPw);
    },
    signOut: () => auth.signOut(),
    /** Google account linked to this login (signs in to the same account, same role) */
    googleEmail: () => { const g = ME.user && (ME.user.providerData || []).find(p => p && p.providerId === 'google.com'); return g ? g.email : ''; },
    async linkGoogle() { await ME.user.linkWithPopup(gprov()); try { await ME.user.reload(); } catch (e) {} return (ME.user.providerData || []).find(p => p && p.providerId === 'google.com').email; },
    async unlinkGoogle() { await ME.user.unlink('google.com'); },
    /** Load a data file exported from the old claude.ai portal: { collection: { docId: data } } */
    async importData(obj) {
      const ops = []; Object.keys(obj || {}).forEach(c => { if (!/^[a-z]+$/.test(c) || ['members', 'roles', 'users', 'public'].includes(c)) return; Object.keys(obj[c] || {}).forEach(id => { if (id !== 'owner') ops.push([c, id, obj[c][id]]); }); });
      for (let i = 0; i < ops.length; i += 400) { const bb = fs.batch(); ops.slice(i, i + 400).forEach(([c, id, d]) => bb.set(fs.collection(c).doc(id), d)); await bb.commit(); }
      return ops.length;
    },
    authMsg,
    username: () => ME.user && toUser(ME.user.email)
  };
})();
