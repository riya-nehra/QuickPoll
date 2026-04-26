// src/lib/auth.js
// Firebase Authentication helpers

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth, db } from './firebase.js';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';

const googleProvider = new GoogleAuthProvider();

export const signUp = (email, pw) => createUserWithEmailAndPassword(auth, email, pw);
export const signIn = (email, pw) => signInWithEmailAndPassword(auth, email, pw);
export const googleSignIn = () => signInWithPopup(auth, googleProvider);
export const logOut = () => signOut(auth);

export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}

export function currentUser() {
  return auth.currentUser;
}

function sanitizeUsername(value) {
  return (value || '')
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9._-]/g, '')
    .slice(0, 20);
}

function buildFallbackUsername(user) {
  const emailPrefix = user?.email?.split('@')[0] || '';
  const displayName = user?.displayName || '';
  const base = sanitizeUsername(displayName || emailPrefix);
  return base || `user_${user.uid.slice(0, 8)}`;
}

export function normalizeUsername(username) {
  return sanitizeUsername(username).toLowerCase();
}

export async function createUserProfile(user, username) {
  const safeUsername = sanitizeUsername(username) || buildFallbackUsername(user);
  const createdAt = user?.metadata?.creationTime
    ? new Date(user.metadata.creationTime)
    : serverTimestamp();
  const userDoc = doc(db, 'users', user.uid);
  await setDoc(
    userDoc,
    {
      uid: user.uid,
      email: user.email,
      username: safeUsername,
      usernameLower: normalizeUsername(safeUsername),
      displayName: safeUsername,
      createdAt,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
  return userDoc;
}

export async function getUserProfile(uid) {
  const userDoc = doc(db, 'users', uid);
  const snap = await getDoc(userDoc);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

export async function getUserProfileByUsername(username) {
  const normalized = normalizeUsername(username);
  if (!normalized) return null;

  const q = query(
    collection(db, 'users'),
    where('usernameLower', '==', normalized),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;

  const profile = snap.docs[0];
  return { id: profile.id, ...profile.data() };
}

export async function ensureUserProfile(user, preferredUsername = '') {
  if (!user) return null;

  const existing = await getUserProfile(user.uid);
  const requestedUsername = sanitizeUsername(preferredUsername);

  if (!existing) {
    const username = requestedUsername || buildFallbackUsername(user);
    await createUserProfile(user, username);
    return {
      uid: user.uid,
      email: user.email,
      username,
      usernameLower: normalizeUsername(username),
      displayName: username,
    };
  }

  if (existing.username && existing.usernameLower) {
    return existing;
  }

  const username = existing.username || requestedUsername || buildFallbackUsername(user);
  await createUserProfile(user, username);
  return {
    ...existing,
    username,
    usernameLower: normalizeUsername(username),
    displayName: existing.displayName || username,
  };
}

export async function resolveSignInEmail(identifier) {
  const input = (identifier || '').trim();
  if (!input) return '';
  if (input.includes('@')) return input;

  const profile = await getUserProfileByUsername(input);
  return profile?.email || input;
}
