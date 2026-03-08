import { useState, useEffect } from 'react';
import {
  onDevicesSnapshot,
  addDevice,
  updateDevice,
  deleteDevice,
  onAlertsSnapshot,
  addAlert,
  deleteAlert,
} from '@/lib/firestore-service';
import type { FirestoreDevice, FirestoreAlert } from '@/lib/firestore-types';

export function useFirestoreDevices() {
  const [devices, setDevices] = useState<FirestoreDevice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onDevicesSnapshot((data) => {
      setDevices(data);
      setLoading(false);
    });
    return unsub;
  }, []);

  return {
    devices,
    loading,
    addDevice: async (device: Omit<FirestoreDevice, 'id'>) => {
      return addDevice(device);
    },
    updateDevice: async (id: string, data: Partial<FirestoreDevice>) => {
      return updateDevice(id, data);
    },
    deleteDevice: async (id: string) => {
      return deleteDevice(id);
    },
  };
}

export function useFirestoreAlerts() {
  const [alerts, setAlerts] = useState<FirestoreAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAlertsSnapshot((data) => {
      setAlerts(data);
      setLoading(false);
    });
    return unsub;
  }, []);

  return {
    alerts,
    loading,
    addAlert: async (alert: Omit<FirestoreAlert, 'id'>) => {
      return addAlert(alert);
    },
    deleteAlert: async (id: string) => {
      return deleteAlert(id);
    },
  };
}
