import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query, where, type QueryConstraint } from "firebase/firestore";
import { db } from "../firebase";

interface UseCollectionResult<T> {
  data: T[];
  loading: boolean;
  error: Error | null;
}

export function useBossesCollection<T>(): UseCollectionResult<T> {
  return useLiveCollection<T>("bosses", [orderBy("name")]);
}

export function usePlayersCollection<T>(): UseCollectionResult<T> {
  return useLiveCollection<T>("players", [orderBy("name")]);
}

export function usePartiesCollection<T>(): UseCollectionResult<T> {
  return useLiveCollection<T>("parties", [orderBy("name")]);
}

export function useClearsForWeek<T>(weekId: string): UseCollectionResult<T> {
  return useLiveCollection<T>("clears", [where("weekId", "==", weekId)], [weekId]);
}

function useLiveCollection<T>(
  path: string,
  constraints: QueryConstraint[],
  extraDeps: unknown[] = []
): UseCollectionResult<T> {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, path), ...constraints);
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setData(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as T));
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(err as Error);
        setLoading(false);
      }
    );
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, ...extraDeps]);

  return { data, loading, error };
}
