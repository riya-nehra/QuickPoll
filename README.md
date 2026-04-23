# 📊 QuickPoll

A lightweight real-time polling app built with vanilla JS, Firebase Firestore, and deployed on Vercel.

> Create a poll → Share the link → Watch votes roll in live.

---

## Live Demo

`https://your-app.vercel.app` ← replace after deploying

---

## Features

- ✏️ **Create polls** with 2–5 options
- 🔗 **Shareable links** — unique URL per poll
- 🗳️ **Vote page** — one vote per device (localStorage guard)
- 📊 **Live results** — real-time bars powered by Firestore listeners
- 🔐 **Optional auth** — sign in with Email or Google to manage your polls
- 📱 **Mobile-friendly** — works on any screen size

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vanilla JS + Vite |
| Database | Firebase Firestore |
| Auth | Firebase Authentication |
| Hosting | Vercel |
| Version Control | GitHub |

---

## Project Structure

```
quickpoll/
├── index.html              # Homepage / landing
├── create.html             # Create a new poll
├── vote.html               # Vote on a poll (?id=xxx)
├── results.html            # Live results (?id=xxx)
├── dashboard.html          # Auth + user's polls
│
├── src/
│   ├── lib/
│   │   ├── firebase.js     # Firebase app init
│   │   ├── polls.js        # Firestore CRUD + listeners
│   │   └── auth.js         # Auth helpers
│   └── styles/
│       └── global.css      # Shared styles
│
├── firebase-setup/
│   ├── FIREBASE_SETUP.md   # Step-by-step Firebase config
│   ├── firestore.rules     # Security rules to paste in console
│   └── firestore.indexes.json
│
├── deployment-setup/
│   └── DEPLOYMENT.md       # GitHub + Vercel deploy guide
│
├── docs/
│   └── PROJECT_PLAN.md     # Full project plan & implementation notes
│
├── .env.example            # Environment variable template
├── .gitignore
├── package.json
├── vite.config.js
└── vercel.json
```

---

## Quick Start (Local Development)

### Prerequisites
- Node.js 18+
- A Firebase project (see `firebase-setup/FIREBASE_SETUP.md`)

### 1. Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/quickpoll.git
cd quickpoll
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in your Firebase config values from the Firebase console.

### 4. Run locally

```bash
npm run dev
```

Open http://localhost:5173

---

## Firebase Setup

See **`firebase-setup/FIREBASE_SETUP.md`** for the full step-by-step guide. Summary:

1. Create a Firebase project at https://console.firebase.google.com
2. Register a web app and copy config to `.env`
3. Enable **Firestore** (production mode)
4. Paste rules from `firebase-setup/firestore.rules`
5. Enable **Authentication** → Email/Password + Google

---

## Deployment

See **`deployment-setup/DEPLOYMENT.md`** for the full guide. Summary:

1. Push to GitHub
2. Import repo in Vercel
3. Add all `VITE_*` env vars in Vercel settings
4. Deploy — done!

---

## Environment Variables

| Variable | Where to find it |
|----------|-----------------|
| `VITE_FIREBASE_API_KEY` | Firebase Console → Project Settings → Your apps |
| `VITE_FIREBASE_AUTH_DOMAIN` | Same |
| `VITE_FIREBASE_PROJECT_ID` | Same |
| `VITE_FIREBASE_STORAGE_BUCKET` | Same |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Same |
| `VITE_FIREBASE_APP_ID` | Same |

> All variables must be prefixed with `VITE_` to be accessible in the browser via Vite.

---

## How Voting Works

1. User visits `/vote.html?id=POLL_ID`
2. Selects an option and clicks Submit
3. Firestore `updateDoc` increments the vote counter atomically
4. `localStorage` key `qp_voted_POLL_ID` is set to prevent duplicate votes
5. User is redirected to results page
6. Results page uses `onSnapshot` for real-time updates

---

## License

MIT
