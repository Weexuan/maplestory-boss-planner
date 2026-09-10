import { deleteDoc, doc, serverTimestamp, setDoc, Timestamp } from "firebase/firestore";
import { db } from "../firebase";

/** One doc per (party, schedule week), same pattern as clears — a new week simply has no
 *  doc yet, which reads as "unscheduled". */
function scheduleDocId(weekId: string, partyId: string) {
  return `${weekId}_${partyId}`;
}

export async function setSchedule(weekId: string, partyId: string, scheduledAt: Date): Promise<void> {
  const id = scheduleDocId(weekId, partyId);
  await setDoc(
    doc(db, "schedules", id),
    { weekId, partyId, scheduledAt: Timestamp.fromDate(scheduledAt), updatedAt: serverTimestamp() },
    { merge: true }
  );
}

export async function clearSchedule(weekId: string, partyId: string): Promise<void> {
  await deleteDoc(doc(db, "schedules", scheduleDocId(weekId, partyId)));
}
