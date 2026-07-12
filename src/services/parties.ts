import { addDoc, collection, deleteDoc, doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import type { PartyInput } from "../types";

const partiesRef = collection(db, "parties");

export async function createParty(input: PartyInput) {
  return addDoc(partiesRef, {
    ...input,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateParty(id: string, input: PartyInput) {
  return updateDoc(doc(db, "parties", id), {
    ...input,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteParty(id: string) {
  return deleteDoc(doc(db, "parties", id));
}
