// auth.js
// Google Sign-In + профіль користувача (нікнейм, історія матчів) у Realtime Database.

import { auth, db } from './firebase-config.js';
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
  ref,
  get,
  set,
  update,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const provider = new GoogleAuthProvider();

export function signInWithGoogle() {
  return signInWithPopup(auth, provider);
}

export function signOutUser() {
  return signOut(auth);
}

/**
 * Підписка на зміну стану авторизації.
 * callback(user | null) викликається одразу і при кожній зміні.
 */
export function watchAuthState(callback) {
  return onAuthStateChanged(auth, callback);
}

/**
 * Гарантує, що в базі є профіль для щойно залогіненого користувача.
 * Якщо профілю ще нема — створює з нікнеймом за замовчуванням (ім'я з Google).
 */
export async function ensureUserProfile(user) {
  const userRef = ref(db, `users/${user.uid}`);
  const snapshot = await get(userRef);

  if (!snapshot.exists()) {
    const defaultNickname = user.displayName || `Commander-${user.uid.slice(0, 5)}`;
    await set(userRef, {
      nickname: defaultNickname,
      email: user.email || '',
      createdAt: Date.now(),
      stats: { wins: 0, losses: 0 },
      matchHistory: {},
    });
  }

  const finalSnapshot = await get(userRef);
  return finalSnapshot.val();
}

export async function updateNickname(uid, nickname) {
  await update(ref(db, `users/${uid}`), { nickname });
}

/**
 * Історія матчів, відсортована від найновіших.
 * TODO(крок 8-9): реальні записи додаватимуться після завершення боїв.
 */
export async function getMatchHistory(uid) {
  const snapshot = await get(ref(db, `users/${uid}/matchHistory`));
  if (!snapshot.exists()) return [];

  const data = snapshot.val();
  return Object.entries(data)
    .map(([id, match]) => ({ id, ...match }))
    .sort((a, b) => (b.date || 0) - (a.date || 0));
}
