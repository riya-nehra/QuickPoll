// src/lib/polls.js
// All Firestore read/write operations for polls

import {
  collection, doc, addDoc, getDoc, getDocs, updateDoc,
  increment, onSnapshot, query, where, orderBy, serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase.js';

// ── Create a new poll ─────────────────────────────────────────────────────────
export async function createPoll({ question, options, category = 'Other', timeLimit = 'none', creatorId = null, creatorName = null }) {
  const optionMap = {};
  options.forEach((text, i) => {
    optionMap[`option_${i}`] = { text, votes: 0 };
  });

  // Calculate expiration time
  let expiresAt = null;
  if (timeLimit !== 'none') {
    const now = new Date();
    const multipliers = {
      'hour': 1,
      'day': 24,
      'month': 24 * 30,
      'year': 24 * 365,
    };
    const hours = multipliers[timeLimit] || 0;
    expiresAt = new Date(now.getTime() + hours * 60 * 60 * 1000);
  }

  const pollData = {
    question,
    options: optionMap,
    category,
    timeLimit,
    expiresAt: expiresAt ? new Date(expiresAt) : null,
    creatorId,
    creatorName,
    createdAt: serverTimestamp(),
    totalVotes: 0,
  };

  const docRef = await addDoc(collection(db, 'polls'), pollData);

  return docRef.id;
}

// ── Fetch a poll once ─────────────────────────────────────────────────────────
export async function getPoll(pollId) {
  const snap = await getDoc(doc(db, 'polls', pollId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

// ── Fetch all polls ────────────────────────────────────────────────────────────
export async function getAllPolls() {
  const q = query(
    collection(db, 'polls'),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ── Listen to all polls (real-time) ───────────────────────────────────────────
export function listenToAllPolls(callback, onError) {
  const q = query(
    collection(db, 'polls'),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(
    q,
    (snap) => {
      const polls = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      callback(polls);
    },
    (error) => {
      if (onError) onError(error);
      else console.error('Failed to listen to all polls:', error);
    }
  );
}

// ── Submit a vote ─────────────────────────────────────────────────────────────
export async function submitVote(pollId, optionKey) {
  const pollRef = doc(db, 'polls', pollId);
  await updateDoc(pollRef, {
    [`options.${optionKey}.votes`]: increment(1),
    totalVotes: increment(1),
  });
}

// ── Real-time listener for results ────────────────────────────────────────────
export function listenToPoll(pollId, callback) {
  const pollRef = doc(db, 'polls', pollId);
  return onSnapshot(pollRef, (snap) => {
    if (snap.exists()) callback({ id: snap.id, ...snap.data() });
  });
}

// ── Get polls by creator ──────────────────────────────────────────────────────
export function listenToUserPolls(creatorId, callback, onError) {
  const q = query(
    collection(db, 'polls'),
    where('creatorId', '==', creatorId)
  );
  return onSnapshot(
    q,
    (snap) => {
      const polls = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => {
          const aTime = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
          const bTime = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
          return bTime - aTime;
        });
      callback(polls);
    },
    (error) => {
      if (onError) onError(error);
      else console.error('Failed to listen to user polls:', error);
    }
  );
}

// ── Get polls by category ─────────────────────────────────────────────────────
export function listenToPollsByCategory(category, callback, onError) {
  const q = query(
    collection(db, 'polls'),
    where('category', '==', category),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(
    q,
    (snap) => {
      const polls = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      callback(polls);
    },
    (error) => {
      if (onError) onError(error);
      else console.error(`Failed to listen to polls in category "${category}":`, error);
    }
  );
}

// ── Get all polls by category (non-real-time) ─────────────────────────────────
export async function getPollsByCategory(category) {
  const q = query(
    collection(db, 'polls'),
    where('category', '==', category),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ── Check if a poll is expired ─────────────────────────────────────────────────
export function isPollExpired(poll) {
  if (!poll.expiresAt) return false;
  const expiryTime = poll.expiresAt.toMillis ? poll.expiresAt.toMillis() : new Date(poll.expiresAt).getTime();
  return new Date().getTime() > expiryTime;
}

// ── Get time remaining for a poll ──────────────────────────────────────────────
export function getTimeRemaining(poll) {
  if (!poll.expiresAt) return null;
  
  const expiryTime = poll.expiresAt.toMillis ? poll.expiresAt.toMillis() : new Date(poll.expiresAt).getTime();
  const now = new Date().getTime();
  const diff = expiryTime - now;

  if (diff <= 0) return 'Expired';

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d remaining`;
  if (hours > 0) return `${hours}h remaining`;
  if (minutes > 0) return `${minutes}m remaining`;
  return `${seconds}s remaining`;
}
