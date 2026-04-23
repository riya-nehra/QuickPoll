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
import { auth } from './firebase.js';

const googleProvider = new GoogleAuthProvider();

export const signUp   = (email, pw) => createUserWithEmailAndPassword(auth, email, pw);
export const signIn   = (email, pw) => signInWithEmailAndPassword(auth, email, pw);
export const googleSignIn = ()      => signInWithPopup(auth, googleProvider);
export const logOut   = ()          => signOut(auth);

export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}

export function currentUser() {
  return auth.currentUser;
}
