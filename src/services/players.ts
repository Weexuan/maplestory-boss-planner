import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import type { PlayerInput } from "../types";

const playersRef = collection(db, "players");

export async function createPlayer(input: PlayerInput) {
  return addDoc(playersRef, {
    ...input,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updatePlayer(id: string, input: PlayerInput) {
  return updateDoc(doc(db, "players", id), {
    ...input,
    updatedAt: serverTimestamp(),
  });
}

export async function deletePlayer(id: string) {
  return deleteDoc(doc(db, "players", id));
}
