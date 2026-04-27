# Firebase Integration — Setup Guide

This folder documents every step required to configure Firebase for QuickPoll.

---

## Step 1 — Create a Firebase Project

1. Go to https://console.firebase.google.com
2. Click **Add project**
3. Name it `quickpoll` (or anything you prefer)
4. Disable Google Analytics if you don't need it
5. Click **Create project**

---

## Step 2 — Register a Web App

1. In your project console, click the **</>** (Web) icon
2. App nickname: `quickpoll-web`
3. Leave "Firebase Hosting" unchecked (we use Vercel)
4. Click **Register app**
5. You will see a `firebaseConfig` object — copy all values into your `.env` file:

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

---

## Step 3 — Enable Firestore

1. In the left sidebar: **Build → Firestore Database**
2. Click **Create database**
3. Select **Start in production mode** (rules set below)
4. Choose your nearest region (e.g. `us-central1`)
5. Click **Enable**

---

## Step 4 — Set Firestore Security Rules

Go to **Firestore → Rules** tab and paste:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /polls/{pollId} {
      // Anyone can read a poll
      allow read: true;

      // Anyone can create a poll (creatorId may be null for anonymous)
      allow create: if request.resource.data.question is string
                    && request.resource.data.question.size() > 0
                    && request.resource.data.options is map
                    && request.resource.data.options.size() >= 2
                    && request.resource.data.pollType in ['poll', 'quiz']
                    && (
                      request.resource.data.pollType == 'poll'
                      || (
                        request.resource.data.correctOptionKey is string
                        && request.resource.data.correctOptionKey in request.resource.data.options.keys()
                      )
                    );

      // Only vote count updates are allowed without auth
      allow update: if request.resource.data.diff(resource.data).affectedKeys()
                       .hasOnly(['options', 'totalVotes']);
    }
  }
}
```

Click **Publish**.

---

## Step 5 — Enable Authentication

1. In the left sidebar: **Build → Authentication**
2. Click **Get started**
3. Under **Sign-in method**, enable:
   - **Email/Password** — toggle on, click Save
   - **Google** — toggle on, set your support email, click Save

---

## Step 6 — Set Authorised Domains (for Google Sign-In)

1. In Authentication → **Settings → Authorized domains**
2. Your `localhost` is already there
3. After deploying to Vercel, add your Vercel domain (e.g. `quickpoll.vercel.app`)

---

## Step 7 — Create Firestore Index (optional)

The app now sorts a signed-in user's polls in the browser, so the dashboard can
work without a composite Firestore index. You only need this index if you want
Firestore itself to handle the `creatorId + createdAt` ordering:

- Collection: `polls`
- Fields: `creatorId ASC`, `createdAt DESC`

---

## Firestore Data Model

```
polls/
  {pollId}/
    question:   string
    options:    {
      option_0: { text: string, votes: number }
      option_1: { text: string, votes: number }
      ...up to option_4
    }
    creatorId:  string | null
    creatorName:string | null
    pollType:   "poll" | "quiz"
    correctOptionKey: string | null
    category:   string
    tags:       string[]
    expiresAt:  Timestamp | null
    createdAt:  Timestamp
    totalVotes: number
```

---

## Quick Reference — Files that use Firebase

| File | What it does |
|------|-------------|
| `src/lib/firebase.js` | Initialises Firebase app, exports `db` and `auth` |
| `src/lib/polls.js`    | All Firestore CRUD + real-time listener |
| `src/lib/auth.js`     | Sign in/up/out helpers, Google OAuth |
