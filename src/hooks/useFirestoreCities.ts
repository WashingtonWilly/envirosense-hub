import { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export function useFirestoreCities() {
  const [cities, setCities] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'cities'), (snap) => {
      const names = snap.docs
        .map((d) => d.data().name as string)
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b));
      setCities(names);
      setLoading(false);
    });
    return unsub;
  }, []);

  const addCity = async (name: string): Promise<void> => {
    await addDoc(collection(db, 'cities'), { name: name.trim() });
  };

  return { cities, loading, addCity };
}
