import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  where,
} from 'firebase/firestore';
import { db } from './firebase';
import type { FirestoreDevice, FirestoreReading, FirestoreAlert } from './firestore-types';

// ─── Helpers ───
function toDate(val: any): Date {
  if (val instanceof Timestamp) return val.toDate();
  if (val instanceof Date) return val;
  if (typeof val === 'string' || typeof val === 'number') return new Date(val);
  return new Date();
}

// ─── DEVICES ───
const devicesCol = () => collection(db, 'devices');

export async function getDevices(): Promise<FirestoreDevice[]> {
  const snap = await getDocs(devicesCol());
  return snap.docs.map(d => ({ id: d.id, ...d.data(), lastSeen: toDate(d.data().lastSeen) } as FirestoreDevice));
}

export function onDevicesSnapshot(cb: (devices: FirestoreDevice[]) => void) {
  return onSnapshot(devicesCol(), snap => {
    cb(snap.docs.map(d => ({ id: d.id, ...d.data(), lastSeen: toDate(d.data().lastSeen) } as FirestoreDevice)));
  });
}

export async function addDevice(device: Omit<FirestoreDevice, 'id'>): Promise<string> {
  const docRef = await addDoc(devicesCol(), { ...device, lastSeen: serverTimestamp() });
  return docRef.id;
}

export async function updateDevice(id: string, data: Partial<FirestoreDevice>): Promise<void> {
  await updateDoc(doc(db, 'devices', id), data as any);
}

export async function deleteDevice(id: string): Promise<void> {
  await deleteDoc(doc(db, 'devices', id));
}

export async function getDevice(id: string): Promise<FirestoreDevice | null> {
  const snap = await getDoc(doc(db, 'devices', id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data(), lastSeen: toDate(snap.data().lastSeen) } as FirestoreDevice;
}

/** Real-time listener for a single device document */
export function onDeviceSnapshot(id: string, cb: (device: FirestoreDevice | null) => void) {
  return onSnapshot(doc(db, 'devices', id), (snap) => {
    if (!snap.exists()) { cb(null); return; }
    cb({ id: snap.id, ...snap.data(), lastSeen: toDate(snap.data().lastSeen) } as FirestoreDevice);
  });
}

// ─── READINGS (subcollection: devices/{deviceId}/readings) ───
export async function getReadings(deviceId: string, maxCount = 100): Promise<FirestoreReading[]> {
  const col = collection(db, 'devices', deviceId, 'readings');
  const q = query(col, orderBy('timestamp', 'desc'), limit(maxCount));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data(), timestamp: toDate(d.data().timestamp) } as FirestoreReading));
}

export function onReadingsSnapshot(deviceId: string, maxCount: number, cb: (readings: FirestoreReading[]) => void) {
  const col = collection(db, 'devices', deviceId, 'readings');
  const q = query(col, orderBy('timestamp', 'desc'), limit(maxCount));
  return onSnapshot(q, snap => {
    cb(snap.docs.map(d => ({ id: d.id, ...d.data(), timestamp: toDate(d.data().timestamp) } as FirestoreReading)));
  });
}

export async function addReading(deviceId: string, reading: Omit<FirestoreReading, 'id'>): Promise<string> {
  const col = collection(db, 'devices', deviceId, 'readings');
  const docRef = await addDoc(col, { ...reading, timestamp: serverTimestamp() });
  return docRef.id;
}

// ─── ALERTS ───
const alertsCol = () => collection(db, 'alerts');

export async function getAlerts(maxCount = 100): Promise<FirestoreAlert[]> {
  const q = query(alertsCol(), orderBy('timestamp', 'desc'), limit(maxCount));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data(), timestamp: toDate(d.data().timestamp) } as FirestoreAlert));
}

export function onAlertsSnapshot(cb: (alerts: FirestoreAlert[]) => void) {
  return onSnapshot(query(alertsCol(), orderBy('timestamp', 'desc')), snap => {
    cb(snap.docs.map(d => ({ id: d.id, ...d.data(), timestamp: toDate(d.data().timestamp) } as FirestoreAlert)));
  });
}

export async function addAlert(alert: Omit<FirestoreAlert, 'id'>): Promise<string> {
  const docRef = await addDoc(alertsCol(), { ...alert, timestamp: serverTimestamp() });
  return docRef.id;
}

export async function deleteAlert(id: string): Promise<void> {
  await deleteDoc(doc(db, 'alerts', id));
}
