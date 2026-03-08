import { collection, doc, setDoc, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from './firebase';

const SEED_DEVICES = [
  // Riobamba
  { id: 'DEV-001', name: 'Sensor Plaza Maldonado', city: 'Riobamba', lat: -1.6710, lng: -78.6482, status: 'online' },
  { id: 'DEV-002', name: 'Sensor Parque Sucre', city: 'Riobamba', lat: -1.6625, lng: -78.6530, status: 'online' },
  { id: 'DEV-003', name: 'Sensor Av. Daniel León Borja', city: 'Riobamba', lat: -1.6580, lng: -78.6510, status: 'warning' },
  { id: 'DEV-004', name: 'Sensor Estación del Tren', city: 'Riobamba', lat: -1.6700, lng: -78.6470, status: 'online' },
  { id: 'DEV-005', name: 'Sensor Terminal Terrestre', city: 'Riobamba', lat: -1.6550, lng: -78.6600, status: 'offline' },
  { id: 'DEV-006', name: 'Sensor ESPOCH Campus', city: 'Riobamba', lat: -1.6570, lng: -78.6770, status: 'online' },
  { id: 'DEV-007', name: 'Sensor UNACH', city: 'Riobamba', lat: -1.6430, lng: -78.6480, status: 'online' },
  // Quito
  { id: 'DEV-008', name: 'Sensor Plaza Grande', city: 'Quito', lat: -0.2200, lng: -78.5125, status: 'online' },
  { id: 'DEV-009', name: 'Sensor Parque La Carolina', city: 'Quito', lat: -0.1826, lng: -78.4843, status: 'online' },
  { id: 'DEV-010', name: 'Sensor Mitad del Mundo', city: 'Quito', lat: -0.0022, lng: -78.4558, status: 'online' },
  { id: 'DEV-011', name: 'Sensor Mariscal', city: 'Quito', lat: -0.2050, lng: -78.4930, status: 'offline' },
  { id: 'DEV-012', name: 'Sensor Cumbayá', city: 'Quito', lat: -0.1960, lng: -78.4380, status: 'online' },
  // Cuenca
  { id: 'DEV-013', name: 'Sensor Parque Calderón', city: 'Cuenca', lat: -2.8974, lng: -79.0045, status: 'online' },
  { id: 'DEV-014', name: 'Sensor Río Tomebamba', city: 'Cuenca', lat: -2.9030, lng: -79.0100, status: 'online' },
  { id: 'DEV-015', name: 'Sensor Turi Mirador', city: 'Cuenca', lat: -2.9200, lng: -79.0050, status: 'online' },
  { id: 'DEV-016', name: 'Sensor Terminal Terrestre Cuenca', city: 'Cuenca', lat: -2.8850, lng: -78.9850, status: 'warning' },
];

function randomReading() {
  return {
    temperature: 15 + Math.random() * 15,       // 15-30 °C
    humidity: 40 + Math.random() * 50,           // 40-90 %
    methane: Math.random() * 500,                // 0-500 ppm
    propane: Math.random() * 300,                // 0-300 ppm
    co: Math.random() * 50,                      // 0-50 ppm
    air_quality: 20 + Math.random() * 180,       // 20-200 AQI
  };
}

const SEED_ALERTS = [
  { deviceId: 'DEV-005', type: 'offline', value: 0 },
  { deviceId: 'DEV-003', type: 'out_of_range', value: 850 },
  { deviceId: 'DEV-011', type: 'disconnected', value: 0 },
  { deviceId: 'DEV-016', type: 'low_battery', value: 12 },
];

export async function seedFirestore() {
  const results = { devices: 0, readings: 0, alerts: 0, errors: [] as string[] };

  // 1. Seed devices
  for (const dev of SEED_DEVICES) {
    try {
      await setDoc(doc(db, 'devices', dev.id), {
        name: dev.name,
        city: dev.city,
        lat: dev.lat,
        lng: dev.lng,
        status: dev.status,
        lastSeen: serverTimestamp(),
      });
      results.devices++;

      // 2. Add 10 readings per device
      const readingsCol = collection(db, 'devices', dev.id, 'readings');
      for (let i = 0; i < 10; i++) {
        const minutesAgo = (10 - i) * 5; // every 5 min
        await addDoc(readingsCol, {
          ...randomReading(),
          timestamp: Timestamp.fromDate(new Date(Date.now() - minutesAgo * 60000)),
        });
        results.readings++;
      }
    } catch (err: any) {
      results.errors.push(`Device ${dev.id}: ${err.message}`);
    }
  }

  // 3. Seed alerts
  for (const alert of SEED_ALERTS) {
    try {
      await addDoc(collection(db, 'alerts'), {
        deviceId: alert.deviceId,
        type: alert.type,
        value: alert.value,
        timestamp: serverTimestamp(),
      });
      results.alerts++;
    } catch (err: any) {
      results.errors.push(`Alert ${alert.deviceId}: ${err.message}`);
    }
  }

  return results;
}
