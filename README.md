# Boss Planner

A MapleStory boss-run planner: manage boss configs (name, difficulty, loot
table with icons), player profiles (with multiple characters each), and build
boss parties from those characters. Track which loot each party member can
be awarded, and link each signed-in Google account to a player profile with
admin-controlled edit permissions.

Stack: React + TypeScript + Vite, Tailwind CSS, Firebase (Auth + Firestore),
React Router. Deploys as a static site (tested on Vercel).

This repo has no secrets baked in — every deployer connects it to their own
Firebase project and sets their own admin account. Follow the steps below to
stand up your own copy.

## Access model

- **Reads are public** — anyone with the link can browse bosses, players, and
  parties without signing in.
- **Writes require Google sign-in** *and* an **editor** role. New accounts
  start as view-only.
- **One admin account** (set via `VITE_ADMIN_EMAIL`, see below) can grant/revoke
  editor access to other accounts and link any account to a player profile,
  from the in-app **Admin** page (only visible to that account).
- The first time a non-admin account signs in, it's prompted to pick which
  player profile it is. That choice can only be changed by the admin
  afterward, not by the user themselves.

## 1. Create your Firebase project

1. Go to the [Firebase console](https://console.firebase.google.com/) and
   create a new project (Google Analytics is optional, you can skip it).
2. **Add a Web app** to the project (the `</>` icon on the project overview
   page). Copy the `firebaseConfig` values shown — you'll need them in step 2.
3. **Enable Authentication**: in the console, go to *Build → Authentication →
   Sign-in method*, and enable the **Google** provider.
4. **Enable Firestore**: go to *Build → Firestore Database → Create database*.
   Start in production mode (the rules in this repo lock it down properly) and
   pick a region close to you.

## 2. Configure the app

```bash
cp .env.example .env
```

Fill in `.env` with the values from your Firebase web app config
(Project settings → General → Your apps), plus the Google account email that
should have admin rights:

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_ADMIN_EMAIL=you@gmail.com
```

## 3. Set your admin email in Firestore rules

`firestore.rules` can't read your `.env` file (Firestore rules aren't part of
the app bundle — they're deployed straight to Firebase), so the admin email
has to be set there too, separately:

Open [`firestore.rules`](firestore.rules) and replace the placeholder:

```
function isAdmin() {
  return isSignedIn() && request.auth.token.email == 'YOUR_ADMIN_EMAIL@example.com';
}
```

with the **same email** you put in `VITE_ADMIN_EMAIL`.

## 4. Deploy Firestore security rules

```bash
npm install -g firebase-tools
firebase login
firebase use --add        # pick the project you created in step 1
firebase deploy --only firestore:rules,firestore:indexes
```

(You can also paste the contents of `firestore.rules` into the console's
*Firestore Database → Rules* tab and publish it manually.)

## 5. Run locally

```bash
npm install
npm run dev
```

Open the printed local URL. Everything is browsable as a guest; sign in with
Google to see the admin-gate banner, and use the **Admin** page (only visible
to `VITE_ADMIN_EMAIL`) to grant yourself editor access and link your account
to a player profile.

## 6. Deploy to Vercel

```bash
npm install -g vercel
vercel
```

Add the same `VITE_FIREBASE_*` variables **and** `VITE_ADMIN_EMAIL` as
Environment Variables in the Vercel project settings (Settings → Environment
Variables), then redeploy (`vercel --prod`). `vercel.json` in this repo
already rewrites all routes to `index.html` so React Router's client-side
routes work correctly.

Finally, back in the Firebase console under *Authentication → Settings →
Authorized domains*, add your Vercel domain (e.g. `your-app.vercel.app`) so
Google sign-in works there too.

## Data model

- **bosses** — one document per boss *and* difficulty (e.g. "Black Mage /
  Extreme" and "Black Mage / Hard" are separate documents), each with its own
  loot table. Loot items and the boss itself can have an icon — either a real
  image you paste/drag in (stored as a resized data URI, since there's no
  file storage configured) or an external URL.
- **players** — one document per player, with an embedded array of characters
  (IGN + class).
- **parties** — a named boss party tied to one boss+difficulty, with a
  snapshot of the member characters assigned to it (and any loot they've been
  awarded). Party/boss/player display data is re-resolved against the live
  collections at render time, so renaming a boss or player updates everywhere
  it's used without having to re-edit every party.
- **users** — one document per signed-in Google account: role
  (`viewer`/`editor`) and an optional linked `playerId`. Only readable by the
  admin or by the account itself.

## Project structure

```
src/
  components/    Modal, ConfirmDialog, Navbar, Layout, ImagePicker,
                 LootAssignmentModal, CharacterPromptModal, icons/
  contexts/      AuthContext (Firebase Auth + role/admin/playerId state)
  hooks/         Firestore live-collection hooks, auth-gate helper
  pages/         Parties (home), Bosses, Players, Admin
  services/      Firestore CRUD calls per collection
  utils/         resolveParty.ts (live re-resolution), image.ts, mapleClasses.ts
  types.ts       Shared TypeScript types
  constants.ts   ADMIN_EMAIL (from VITE_ADMIN_EMAIL)
firestore.rules  Public read; editor/admin write; separate admin email — see step 3
```
