import { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { AppRole } from '@/contexts/AuthContext';

export interface FirestoreUser {
  uid: string;
  name: string;
  email: string;
  role: AppRole;
  city: string;
  isActive: boolean;
  createdAt: any;
}

export function useFirestoreUsers() {
  const [users, setUsers] = useState<FirestoreUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'users'), (snap) => {
      const list = snap.docs.map((d) => {
        const data = d.data();
        return {
          uid: d.id,
          name: data.name || 'Sin nombre',
          email: data.email || '',
          role: (data.role || data.rol || 'user') as AppRole,
          city: data.city || 'Riobamba',
          isActive: data.isActive !== false, // default true
          createdAt: data.createdAt,
        } satisfies FirestoreUser;
      });
      setUsers(list);
      setLoading(false);
    });
    return unsub;
  }, []);

  async function updateRole(uid: string, newRole: AppRole) {
    await updateDoc(doc(db, 'users', uid), { role: newRole, rol: newRole });
  }

  async function toggleActive(uid: string, isActive: boolean) {
    await updateDoc(doc(db, 'users', uid), { isActive });
  }

  return { users, loading, updateRole, toggleActive };
}
