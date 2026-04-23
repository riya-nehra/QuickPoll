# QuickPoll — Full Project Plan & Implementation Details

---

## 1. Project Overview

**Goal:** A lightweight, real-time polling web app.  
**Stack:** Vanilla JS + Vite · Firebase Firestore · Firebase Auth · GitHub · Vercel  
**Approach:** Single-page HTML files served as a multi-page app (MPA) via Vite.

---

## 2. Architecture Decisions

### Why Vite (not a full framework)?
- Zero boilerplate, instant dev server
- Simple multi-page support via `rollupOptions.input`
- Firebase SDK tree-shakeable via ESM imports
- Build output is static — perfect for Vercel

### Why multi-page HTML (not SPA)?
- Easier to understand for beginners
- No router library needed
- Each page is a clean, self-contained file
- Poll ID passed via URL query string (`?id=xxx`)

### Why localStorage for vote deduplication?
- No backend needed
- Works without user accounts
- Simple and fast for MVP
- Limitation: can be cleared, but sufficient for basic protection

---

## 3. Page-by-Page Implementation

### `index.html` — Homepage
- Static landing page
- Firebase Auth listener updates nav (shows "My Polls" if logged in)
- CTA buttons link to `/create.html`

### `create.html` — Create Poll
- Dynamic option inputs (2–5, add/remove)
- Calls `createPoll()` from `src/lib/polls.js`
- On success: shows shareable link + copy button
- If user is signed in, `creatorId` is attached to the poll

### `vote.html` — Voting Page
- Reads `?id=` from URL
- Fetches poll once with `getPoll()`
- Checks `localStorage` for prior vote → shows "already voted" screen
- On submit: calls `submitVote()` which uses Firestore `increment()` for atomic updates
- Sets localStorage key, redirects to results

### `results.html` — Live Results
- Reads `?id=` from URL
- Uses `listenToPoll()` which wraps Firestore `onSnapshot()`
- Re-renders bar chart on every update
- Animated CSS bars — no chart library needed
- Shows leading option with 🏆 icon
- Unsubscribes listener on page unload

### `dashboard.html` — Auth + My Polls
- Shows auth form if not logged in (Email/Password + Google)
- Shows poll list if logged in
- Uses `listenToUserPolls()` — real-time query filtered by `creatorId`
- Friendly error messages for common auth failures

---

## 4. Data Layer

### Firestore Document Structure

```
Collection: polls
Document ID: auto-generated (used as poll ID in URLs)

{
  question:   "What's the best pizza topping?",
  options: {
    option_0: { text: "Pepperoni", votes: 12 },
    option_1: { text: "Mushrooms", votes: 7  },
    option_2: { text: "Extra cheese", votes: 19 }
  },
  creatorId:  "uid_abc123" | null,
  createdAt:  Timestamp,
  totalVotes: 38
}
```

**Why a map for options instead of an array?**  
Firestore doesn't support incrementing individual array item fields. Using a map (`option_0`, `option_1`, etc.) allows targeted `increment()` updates:  
`updateDoc(ref, { 'options.option_0.votes': increment(1) })`

### Key Firestore Operations

| Operation | Method | Used in |
|-----------|--------|---------|
| Create poll | `addDoc` | `create.html` |
| Fetch poll once | `getDoc` | `vote.html` |
| Submit vote | `updateDoc` + `increment` | `vote.html` |
| Live results | `onSnapshot` | `results.html` |
| User's polls | `query` + `onSnapshot` | `dashboard.html` |

---

## 5. Authentication Flow

```
User visits dashboard.html
        │
        ▼
onAuthChange fires
        │
  ┌─────┴─────┐
  │           │
Logged in   Not logged in
  │           │
  ▼           ▼
Show polls  Show auth form
dashboard
        │
    Sign in
  (Email or Google)
        │
  onAuthChange fires again
        │
        ▼
   Show dashboard
```

---

## 6. Real-Time Update Flow

```
User A votes
     │
     ▼
submitVote() → Firestore updateDoc (atomic increment)
     │
     ▼
Firestore triggers onSnapshot listeners
     │
     ▼
All open results.html pages re-render bars
```

---

## 7. Security Rules Summary

```
polls/{pollId}:
  read:   anyone
  create: anyone (validates question + options exist)
  update: anyone (but ONLY options/totalVotes fields)
  delete: not allowed
```

This prevents:
- Someone deleting polls
- Someone overwriting the question or option text
- Someone creating malformed polls

---

## 8. Environment Variables

All Firebase config is stored in `.env` (never committed to Git).  
Vite exposes them to the browser via `import.meta.env.VITE_*`.

```
.env (local)       → npm run dev
Vercel Settings    → production deploys
```

---

## 9. Folder Reference

```
firebase-setup/
  FIREBASE_SETUP.md       Complete step-by-step Firebase config guide
  firestore.rules         Security rules — paste into Firebase console
  firestore.indexes.json  Composite index for user dashboard query

deployment-setup/
  DEPLOYMENT.md           GitHub push + Vercel import guide

docs/
  PROJECT_PLAN.md         This file — full architecture & implementation notes

src/lib/
  firebase.js             Initialises Firebase, exports db + auth
  polls.js                All poll CRUD + real-time listeners
  auth.js                 Sign in/up/out/Google helpers

src/styles/
  global.css              Design system — variables, components, utilities
```

---

## 10. MVP Limitations & Future Improvements

| Limitation | Possible Fix |
|-----------|-------------|
| LocalStorage vote guard (clearable) | Move vote tracking to Firestore with IP/device hash |
| No poll expiry | Add `expiresAt` field + rules check |
| No poll editing | Add update flow for poll creator |
| No delete | Add delete button on dashboard (restrict to creator) |
| No poll sharing image | Add OG meta tags with dynamic data |
| No rate limiting | Firebase App Check + Cloud Functions |

---

## 11. Development Checklist

### Firebase
- [ ] Project created
- [ ] Web app registered, config copied to `.env`
- [ ] Firestore enabled
- [ ] Firestore rules published
- [ ] Composite index created
- [ ] Email/Password auth enabled
- [ ] Google auth enabled

### Local Dev
- [ ] `npm install` run
- [ ] `.env` filled in from `.env.example`
- [ ] `npm run dev` runs without errors
- [ ] Can create a poll
- [ ] Can vote on a poll
- [ ] Results update in real time
- [ ] Auth sign in/up works

### Deployment
- [ ] Code pushed to GitHub
- [ ] Vercel project created and connected
- [ ] All `VITE_*` env vars added in Vercel
- [ ] Vercel domain added to Firebase Authorized Domains
- [ ] Production build works end-to-end
