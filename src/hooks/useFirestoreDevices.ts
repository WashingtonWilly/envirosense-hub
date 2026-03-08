import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  query,
  orderBy,
  limit,
  startAfter,
  endBefore,
  limitToLast,
  where,
  getDocs,
  onSnapshot,
  getCountFromServer,
  QueryConstraint,
  DocumentSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { FirestoreDevice } from '@/lib/firestore-types';
import {
  addDevice as addDeviceFn,
  updateDevice as updateDeviceFn,
  deleteDevice as deleteDeviceFn,
} from '@/lib/firestore-service';

function toDate(val: any): Date {
  if (val instanceof Timestamp) return val.toDate();
  if (val instanceof Date) return val;
  if (typeof val === 'string' || typeof val === 'number') return new Date(val);
  return new Date();
}

const PAGE_SIZE = 10;

interface UsePaginatedDevicesOptions {
  statusFilter?: 'all' | 'online' | 'offline' | 'warning';
  searchQuery?: string;
}

export function usePaginatedDevices({ statusFilter = 'all', searchQuery = '' }: UsePaginatedDevicesOptions = {}) {
  const [devices, setDevices] = useState<FirestoreDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [firstDocs, setFirstDocs] = useState<DocumentSnapshot[]>([]);
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);
  const [searchResults, setSearchResults] = useState<FirestoreDevice[] | null>(null);
  const [searching, setSearching] = useState(false);

  const devicesCol = collection(db, 'devices');

  // Build base constraints
  const getConstraints = useCallback((): QueryConstraint[] => {
    const constraints: QueryConstraint[] = [orderBy('name')];
    if (statusFilter !== 'all') {
      constraints.unshift(where('status', '==', statusFilter));
    }
    return constraints;
  }, [statusFilter]);

  // Count total documents matching filter
  useEffect(() => {
    const constraints = getConstraints();
    const q = query(devicesCol, ...constraints);
    getCountFromServer(q).then(snap => {
      setTotalCount(snap.data().count);
    }).catch(() => {});
  }, [statusFilter]);

  // Fetch current page
  const fetchPage = useCallback(async (page: number, afterDoc?: DocumentSnapshot, beforeDoc?: DocumentSnapshot) => {
    setLoading(true);
    try {
      const constraints = getConstraints();

      let q;
      if (afterDoc) {
        q = query(devicesCol, ...constraints, startAfter(afterDoc), limit(PAGE_SIZE));
      } else if (beforeDoc) {
        q = query(devicesCol, ...constraints, endBefore(beforeDoc), limitToLast(PAGE_SIZE));
      } else {
        q = query(devicesCol, ...constraints, limit(PAGE_SIZE));
      }

      const snap = await getDocs(q);
      const data = snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
        lastSeen: toDate(d.data().lastSeen),
      } as FirestoreDevice));

      setDevices(data);
      setCurrentPage(page);

      if (snap.docs.length > 0) {
        setLastDoc(snap.docs[snap.docs.length - 1]);
        if (page === 1) {
          setFirstDocs([snap.docs[0]]);
        } else {
          setFirstDocs(prev => {
            const copy = [...prev];
            copy[page - 1] = snap.docs[0];
            return copy;
          });
        }
      }
    } catch (err) {
      console.error('Error fetching devices page:', err);
    } finally {
      setLoading(false);
    }
  }, [getConstraints]);

  // Reset to page 1 when filter changes
  useEffect(() => {
    setFirstDocs([]);
    setLastDoc(null);
    fetchPage(1);
  }, [statusFilter]);

  // Global search across all devices
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }

    setSearching(true);
    // Fetch all devices for search (Firestore doesn't support text search natively)
    const constraints: QueryConstraint[] = [orderBy('name')];
    if (statusFilter !== 'all') {
      constraints.unshift(where('status', '==', statusFilter));
    }
    const q = query(devicesCol, ...constraints);

    getDocs(q).then(snap => {
      const all = snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
        lastSeen: toDate(d.data().lastSeen),
      } as FirestoreDevice));

      const lowerQ = searchQuery.toLowerCase();
      const filtered = all.filter(d =>
        d.name.toLowerCase().includes(lowerQ) ||
        (d.id || '').toLowerCase().includes(lowerQ) ||
        d.city.toLowerCase().includes(lowerQ)
      );
      setSearchResults(filtered);
    }).catch(err => {
      console.error('Search error:', err);
    }).finally(() => {
      setSearching(false);
    });
  }, [searchQuery, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const goToNextPage = () => {
    if (currentPage < totalPages && lastDoc) {
      fetchPage(currentPage + 1, lastDoc);
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 1 && firstDocs[currentPage - 1]) {
      fetchPage(currentPage - 1, undefined, firstDocs[currentPage - 1]);
    }
  };

  const goToFirstPage = () => {
    if (currentPage !== 1) {
      fetchPage(1);
    }
  };

  return {
    devices: searchResults !== null ? searchResults : devices,
    loading: loading || searching,
    currentPage: searchResults !== null ? 1 : currentPage,
    totalPages: searchResults !== null ? 1 : totalPages,
    totalCount: searchResults !== null ? searchResults.length : totalCount,
    isSearching: searchResults !== null,
    goToNextPage,
    goToPrevPage,
    goToFirstPage,
    refreshPage: () => fetchPage(currentPage),
    addDevice: async (device: Omit<FirestoreDevice, 'id'>) => {
      const id = await addDeviceFn(device);
      await fetchPage(1);
      // Recount
      const constraints = getConstraints();
      const q = query(devicesCol, ...constraints);
      const snap = await getCountFromServer(q);
      setTotalCount(snap.data().count);
      return id;
    },
    updateDevice: async (id: string, data: Partial<FirestoreDevice>) => {
      await updateDeviceFn(id, data);
      await fetchPage(currentPage);
    },
    deleteDevice: async (id: string) => {
      await deleteDeviceFn(id);
      // Recount & refresh
      const constraints = getConstraints();
      const q = query(devicesCol, ...constraints);
      const snap = await getCountFromServer(q);
      setTotalCount(snap.data().count);
      const newTotalPages = Math.max(1, Math.ceil(snap.data().count / PAGE_SIZE));
      if (currentPage > newTotalPages) {
        fetchPage(newTotalPages);
      } else {
        fetchPage(currentPage);
      }
    },
  };
}
