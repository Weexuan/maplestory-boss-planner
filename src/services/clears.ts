import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "../firebase";

/** One doc per (party, boss week), same pattern used elsewhere — a new week simply has no
 *  doc yet, which reads as "not cleared", giving the weekly reset for free. */
function clearDocId(weekId: string, partyId: string) {
  return `${weekId}_${partyId}`;
}

export async function setCleared(weekId: string, partyId: string, cleared: boolean): Promise<void> {
  const id = clearDocId(weekId, partyId);
  await setDoc(
    doc(db, "clears", id),
    { weekId, partyId, cleared, updatedAt: serverTimestamp() },
    { merge: true }
  );
}
