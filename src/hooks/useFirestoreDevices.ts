import { useState, useEffect, useMemo } from 'react';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
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
  const [allDevices, setAllDevices] = useState<FirestoreDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  // Single real-time listener ordered by name (no composite index needed)
  useEffect(() => {
    const q = query(collection(db, 'devices'), orderBy('name'));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => {
        const raw = d.data() as Record<string, any>;
        return { id: d.id, ...raw, lastSeen: toDate(raw.lastSeen) } as FirestoreDevice;
      });
      setAllDevices(data);
      setLoading(false);
    }, (err) => {
      console.error('Devices snapshot error:', err);
      setLoading(false);
    });
    return unsub;
  }, []);

  // Filter by status and search (client-side)
  const filtered = useMemo(() => {
    let result = allDevices;
    if (statusFilter !== 'all') {
      result = result.filter(d => d.status === statusFilter);
    }
    if (searchQuery.trim()) {
      const lowerQ = searchQuery.toLowerCase();
      result = result.filter(d =>
        d.name.toLowerCase().includes(lowerQ) ||
        (d.id || '').toLowerCase().includes(lowerQ) ||
        d.city.toLowerCase().includes(lowerQ)
      );
    }
    return result;
  }, [allDevices, statusFilter, searchQuery]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchQuery]);

  const totalCount = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const pagedDevices = useMemo(() => {
    const start = (safeCurrentPage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, safeCurrentPage]);

  return {
    devices: pagedDevices,
    loading,
    currentPage: safeCurrentPage,
    totalPages,
    totalCount,
    isSearching: !!searchQuery.trim(),
    goToNextPage: () => { if (safeCurrentPage < totalPages) setCurrentPage(safeCurrentPage + 1); },
    goToPrevPage: () => { if (safeCurrentPage > 1) setCurrentPage(safeCurrentPage - 1); },
    goToFirstPage: () => setCurrentPage(1),
    refreshPage: () => {},
    addDevice: async (device: Omit<FirestoreDevice, 'id'>) => addDeviceFn(device),
    updateDevice: async (id: string, data: Partial<FirestoreDevice>) => updateDeviceFn(id, data),
    deleteDevice: async (id: string) => deleteDeviceFn(id),
  };
}
