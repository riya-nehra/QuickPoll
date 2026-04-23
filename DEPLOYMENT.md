# Deployment Guide — GitHub + Vercel

---

## Part 1 — GitHub Setup

### 1. Create a new GitHub repository

1. Go to https://github.com/new
2. Repository name: `quickpoll`
3. Set visibility to **Public** or **Private**
4. Leave all other options unchecked
5. Click **Create repository**

### 2. Push your code

Open a terminal in the project root and run:

```bash
git init
git add .
git commit -m "initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/quickpoll.git
git push -u origin main
```

> ⚠️ Make sure `.env` is in `.gitignore` — never commit your real API keys.

---

## Part 2 — Vercel Deployment

### 1. Connect to Vercel

1. Go to https://vercel.com and sign in (use your GitHub account)
2. Click **Add New → Project**
3. Import your `quickpoll` GitHub repository
4. Vercel will auto-detect it as a Vite project

### 2. Configure build settings

Vercel should auto-fill these, but verify:

| Setting | Value |
|---------|-------|
| Framework Preset | Other (or Vite) |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | `npm install` |

### 3. Add Environment Variables

In Vercel's **Environment Variables** section during import (or later in Settings → Environment Variables), add each key from your `.env.example`:

```
VITE_FIREBASE_API_KEY          = <your value>
VITE_FIREBASE_AUTH_DOMAIN      = <your value>
VITE_FIREBASE_PROJECT_ID       = <your value>
VITE_FIREBASE_STORAGE_BUCKET   = <your value>
VITE_FIREBASE_MESSAGING_SENDER_ID = <your value>
VITE_FIREBASE_APP_ID           = <your value>
```

Set all three environments: **Production**, **Preview**, **Development**.

### 4. Deploy

Click **Deploy**. Vercel will build and give you a URL like `quickpoll.vercel.app`.

### 5. Add your Vercel domain to Firebase Auth

1. Firebase Console → **Authentication → Settings → Authorized domains**
2. Click **Add domain**
3. Add your Vercel URL, e.g. `quickpoll.vercel.app`

---

## Part 3 — Auto-deploy on Git push

Once connected, every push to `main` will auto-deploy. Every PR gets a preview URL.

```bash
# Normal workflow after initial setup
git add .
git commit -m "your message"
git push
# Vercel auto-deploys in ~30 seconds
```

---

## Checklist

- [ ] `.env` is in `.gitignore` ✓
- [ ] Environment variables added to Vercel ✓  
- [ ] Firebase Authorized Domains includes Vercel URL ✓
- [ ] Firestore rules published ✓
- [ ] Firebase Auth methods enabled (Email + Google) ✓
