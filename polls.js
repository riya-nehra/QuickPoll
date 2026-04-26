// src/lib/polls.js
// All Firestore read/write operations for polls

import {
  collection, doc, addDoc, getDoc, getDocs, updateDoc,
  increment, onSnapshot, query, where, orderBy, serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase.js';

// ── Create a new poll ─────────────────────────────────────────────────────────
export async function createPoll({ question, options, creatorId = null, creatorName = null }) {
  const optionMap = {};
  options.forEach((text, i) => {
    optionMap[`option_${i}`] = { text, votes: 0 };
  });

  const pollData = {
    question,
    options: optionMap,
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
