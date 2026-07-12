import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import type { User } from "firebase/auth";
import type { UserRole } from "../types";

/**
 * Records/refreshes the signed-in user's profile. Split into create-vs-update because
 * firestore.rules only allows a user to self-assign the "viewer" role (and null playerId) on
 * first creation — on every later sign-in we must NOT touch `role`/`playerId`, or we'd stomp
 * whatever the admin set them to (and the write would be rejected by rules for exactly that
 * reason).
 */
export async function upsertUserProfile(user: User): Promise<void> {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  const profileFields = {
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    lastSignInAt: serverTimestamp(),
  };
  if (snap.exists()) {
    await updateDoc(ref, profileFields);
  } else {
    await setDoc(ref, {
      ...profileFields,
      role: "viewer",
      playerId: null,
      createdAt: serverTimestamp(),
    });
  }
}

export async function setUserRole(uid: string, role: UserRole): Promise<void> {
  await updateDoc(doc(db, "users", uid), { role });
}

/** Admin-only: link (or unlink) any account to a player profile at any time. */
export async function setUserPlayerId(uid: string, playerId: string | null): Promise<void> {
  await updateDoc(doc(db, "users", uid), { playerId });
}

/** Self-service, one-time only — firestore.rules reject this once playerId is already set. */
export async function claimPlayerProfile(uid: string, playerId: string): Promise<void> {
  await updateDoc(doc(db, "users", uid), { playerId });
}
