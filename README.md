# Movana Logistics

- Website: https://naveen5531.github.io
- Staff portal: https://naveen5531.github.io/portal/
- Android app: https://naveen5531.github.io/Movana.apk

## Files

| File | What it is |
|---|---|
| `index.html` | The public website. Contact details: search for `const SITE`. |
| `Movana.apk` | Android app (opens the staff portal). |
| `portal/index.html` | The staff portal. |
| `portal/firebase-config.js` | Connection to your Firebase project. Paste your `firebaseConfig` here. |
| `firestore.rules` | Security rules. Paste into Firebase console → Firestore Database → Rules → Publish. |

## Switching the portal on (one time)

1. console.firebase.google.com → **Create a project** → name it `movana`.
2. **Build → Authentication → Get started → Email/Password → Enable → Save.**
3. **Build → Firestore Database → Create database** → location **asia-south1 (Mumbai)** → start in **production mode**.
4. **Firestore Database → Rules** → replace everything with the contents of `firestore.rules` → **Publish**.
5. **Project settings (gear) → Your apps → Web (</>)** → register "Movana portal" → copy the `firebaseConfig` values into `portal/firebase-config.js`:

   ```js
   window.MOVANA_FIREBASE_CONFIG = {
     apiKey: "…",
     authDomain: "….firebaseapp.com",
     projectId: "…",
     storageBucket: "…",
     messagingSenderId: "…",
     appId: "…"
   };
   ```
6. **Authentication → Settings → Authorized domains** → add `naveen5531.github.io`.
7. Open https://naveen5531.github.io/portal/ – the first screen creates the **admin** login. Do this straight away: the first person to open it becomes the owner.
8. In the portal open **My access → Bring across old data** and choose `movana-data.json` (sent privately, not stored here) to copy in the data from the old portal.

## Staff logins

Admin › Roles & access › People & roles › **Add a staff login** creates a username and a temporary password.
Staff change their password in **My access**. A forgotten password: remove the person and add them again with a new username,
or delete the user in Firebase console → Authentication and add them again. Logins that use a real email address as the username can use "Forgot password?".
