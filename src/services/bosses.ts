import {
  addDoc,
  collection,
  deleteDoc,
  deleteField,
  doc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import type { BossInput } from "../types";

const bossesRef = collection(db, "bosses");

export async function createBoss(input: BossInput) {
  // Firestore rejects explicit `undefined` field values, so drop imageUrl entirely
  // rather than writing it as undefined (e.g. if "Remove image" was clicked before saving).
  const { imageUrl, ...rest } = input;
  return addDoc(bossesRef, {
    ...rest,
    ...(imageUrl ? { imageUrl } : {}),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateBoss(id: string, input: BossInput) {
  // updateDoc merges top-level fields, so an absent imageUrl wouldn't actually clear
  // a previously-set one — deleteField() is required to remove it.
  return updateDoc(doc(db, "bosses", id), {
    ...input,
    imageUrl: input.imageUrl ?? deleteField(),
    updatedAt: serverTimestamp(),
  });
}

export async function deleteBoss(id: string) {
  return deleteDoc(doc(db, "bosses", id));
}
