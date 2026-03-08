// Smart City mock data for Riobamba and future cities

export interface City {
  id: string;
  name: string;
  country: string;
  latitude: number;
  longitude: number;
  totalDevices: number;
  createdAt: Date;
}

export interface SmartDevice {
  id: string;
  name: string;
  sensorType: string;
  cityId: string;
  cityName: string;
  country: string;
  latitude: number;
  longitude: number;
  status: 'online' | 'offline' | 'warning';
  lastReading: Date;
  batteryLevel: number;
  installedAt: Date;
}

export interface SmartAlert {
  id: string;
  deviceId: string;
  deviceName: string;
  alertType: 'offline' | 'out_of_range' | 'disconnected' | 'low_battery';
  message: string;
  severity: 'low' | 'medium' | 'high';
  status: 'active' | 'resolved';
  createdAt: Date;
  cityName: string;
}

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'admin' | 'user';
  city: string;
  createdAt: Date;
  avatar?: string;
}

export const SENSOR_TYPES = [
  'Temperatura',
  'Humedad',
  'Calidad del Aire',
  'Ruido Ambiental',
  'Luminosidad',
  'CO₂',
  'Presión Atmosférica',
  'Velocidad del Viento',
  'Lluvia',
  'UV',
] as const;

export const CITIES: City[] = [
  {
    id: 'city-001',
    name: 'Riobamba',
    country: 'Ecuador',
    latitude: -1.6635,
    longitude: -78.6546,
    totalDevices: 12,
    createdAt: new Date('2024-01-15'),
  },
  {
    id: 'city-002',
    name: 'Quito',
    country: 'Ecuador',
    latitude: -0.1807,
    longitude: -78.4678,
    totalDevices: 5,
    createdAt: new Date('2024-06-01'),
  },
  {
    id: 'city-003',
    name: 'Guayaquil',
    country: 'Ecuador',
    latitude: -2.1894,
    longitude: -79.8891,
    totalDevices: 3,
    createdAt: new Date('2025-01-10'),
  },
];

export const SMART_DEVICES: SmartDevice[] = [
  // Riobamba devices
  { id: 'DEV-001', name: 'Sensor Plaza Maldonado', sensorType: 'Temperatura', cityId: 'city-001', cityName: 'Riobamba', country: 'Ecuador', latitude: -1.6710, longitude: -78.6482, status: 'online', lastReading: new Date(), batteryLevel: 92, installedAt: new Date('2024-02-10') },
  { id: 'DEV-002', name: 'Sensor Parque Sucre', sensorType: 'Calidad del Aire', cityId: 'city-001', cityName: 'Riobamba', country: 'Ecuador', latitude: -1.6625, longitude: -78.6530, status: 'online', lastReading: new Date(), batteryLevel: 87, installedAt: new Date('2024-02-15') },
  { id: 'DEV-003', name: 'Sensor Av. Daniel León Borja', sensorType: 'Ruido Ambiental', cityId: 'city-001', cityName: 'Riobamba', country: 'Ecuador', latitude: -1.6580, longitude: -78.6510, status: 'warning', lastReading: new Date(Date.now() - 600000), batteryLevel: 23, installedAt: new Date('2024-03-01') },
  { id: 'DEV-004', name: 'Sensor Estación del Tren', sensorType: 'Humedad', cityId: 'city-001', cityName: 'Riobamba', country: 'Ecuador', latitude: -1.6700, longitude: -78.6470, status: 'online', lastReading: new Date(), batteryLevel: 76, installedAt: new Date('2024-03-20') },
  { id: 'DEV-005', name: 'Sensor Terminal Terrestre', sensorType: 'CO₂', cityId: 'city-001', cityName: 'Riobamba', country: 'Ecuador', latitude: -1.6550, longitude: -78.6600, status: 'offline', lastReading: new Date(Date.now() - 7200000), batteryLevel: 5, installedAt: new Date('2024-04-01') },
  { id: 'DEV-006', name: 'Sensor ESPOCH Campus', sensorType: 'Temperatura', cityId: 'city-001', cityName: 'Riobamba', country: 'Ecuador', latitude: -1.6570, longitude: -78.6770, status: 'online', lastReading: new Date(), batteryLevel: 95, installedAt: new Date('2024-04-15') },
  { id: 'DEV-007', name: 'Sensor UNACH', sensorType: 'Calidad del Aire', cityId: 'city-001', cityName: 'Riobamba', country: 'Ecuador', latitude: -1.6430, longitude: -78.6480, status: 'online', lastReading: new Date(), batteryLevel: 81, installedAt: new Date('2024-05-01') },
  { id: 'DEV-008', name: 'Sensor Parque Ecológico', sensorType: 'Luminosidad', cityId: 'city-001', cityName: 'Riobamba', country: 'Ecuador', latitude: -1.6750, longitude: -78.6400, status: 'online', lastReading: new Date(), batteryLevel: 68, installedAt: new Date('2024-05-20') },
  { id: 'DEV-009', name: 'Sensor Mercado La Merced', sensorType: 'Humedad', cityId: 'city-001', cityName: 'Riobamba', country: 'Ecuador', latitude: -1.6660, longitude: -78.6490, status: 'online', lastReading: new Date(), batteryLevel: 54, installedAt: new Date('2024-06-10') },
  { id: 'DEV-010', name: 'Sensor Hospital General', sensorType: 'Calidad del Aire', cityId: 'city-001', cityName: 'Riobamba', country: 'Ecuador', latitude: -1.6600, longitude: -78.6550, status: 'online', lastReading: new Date(), batteryLevel: 90, installedAt: new Date('2024-07-01') },
  { id: 'DEV-011', name: 'Sensor Chimborazo Base', sensorType: 'Presión Atmosférica', cityId: 'city-001', cityName: 'Riobamba', country: 'Ecuador', latitude: -1.4700, longitude: -78.8170, status: 'online', lastReading: new Date(), batteryLevel: 99, installedAt: new Date('2024-08-01') },
  { id: 'DEV-012', name: 'Sensor Zona Industrial', sensorType: 'CO₂', cityId: 'city-001', cityName: 'Riobamba', country: 'Ecuador', latitude: -1.6800, longitude: -78.6350, status: 'warning', lastReading: new Date(Date.now() - 300000), batteryLevel: 34, installedAt: new Date('2024-09-01') },
  // Quito devices
  { id: 'DEV-013', name: 'Sensor Plaza Grande', sensorType: 'Temperatura', cityId: 'city-002', cityName: 'Quito', country: 'Ecuador', latitude: -0.2200, longitude: -78.5125, status: 'online', lastReading: new Date(), batteryLevel: 88, installedAt: new Date('2024-07-01') },
  { id: 'DEV-014', name: 'Sensor Parque La Carolina', sensorType: 'Calidad del Aire', cityId: 'city-002', cityName: 'Quito', country: 'Ecuador', latitude: -0.1826, longitude: -78.4843, status: 'online', lastReading: new Date(), batteryLevel: 72, installedAt: new Date('2024-07-15') },
  { id: 'DEV-015', name: 'Sensor Mitad del Mundo', sensorType: 'UV', cityId: 'city-002', cityName: 'Quito', country: 'Ecuador', latitude: -0.0022, longitude: -78.4558, status: 'online', lastReading: new Date(), batteryLevel: 65, installedAt: new Date('2024-08-01') },
  { id: 'DEV-016', name: 'Sensor Mariscal', sensorType: 'Ruido Ambiental', cityId: 'city-002', cityName: 'Quito', country: 'Ecuador', latitude: -0.2050, longitude: -78.4930, status: 'offline', lastReading: new Date(Date.now() - 3600000), batteryLevel: 0, installedAt: new Date('2024-08-15') },
  { id: 'DEV-017', name: 'Sensor Cumbayá', sensorType: 'Humedad', cityId: 'city-002', cityName: 'Quito', country: 'Ecuador', latitude: -0.1960, longitude: -78.4380, status: 'online', lastReading: new Date(), batteryLevel: 55, installedAt: new Date('2024-09-01') },
  // Guayaquil devices
  { id: 'DEV-018', name: 'Sensor Malecón 2000', sensorType: 'Temperatura', cityId: 'city-003', cityName: 'Guayaquil', country: 'Ecuador', latitude: -2.1894, longitude: -79.8831, status: 'online', lastReading: new Date(), batteryLevel: 78, installedAt: new Date('2025-01-15') },
  { id: 'DEV-019', name: 'Sensor Parque Seminario', sensorType: 'Humedad', cityId: 'city-003', cityName: 'Guayaquil', country: 'Ecuador', latitude: -2.1933, longitude: -79.8838, status: 'online', lastReading: new Date(), batteryLevel: 83, installedAt: new Date('2025-02-01') },
  { id: 'DEV-020', name: 'Sensor Cerro Santa Ana', sensorType: 'Velocidad del Viento', cityId: 'city-003', cityName: 'Guayaquil', country: 'Ecuador', latitude: -2.1870, longitude: -79.8790, status: 'online', lastReading: new Date(), batteryLevel: 91, installedAt: new Date('2025-02-15') },
];

export const SMART_ALERTS: SmartAlert[] = [
  { id: 'ALR-001', deviceId: 'DEV-005', deviceName: 'Sensor Terminal Terrestre', alertType: 'offline', message: 'Dispositivo sin conexión desde hace 2 horas', severity: 'high', status: 'active', createdAt: new Date(Date.now() - 7200000), cityName: 'Riobamba' },
  { id: 'ALR-002', deviceId: 'DEV-003', deviceName: 'Sensor Av. Daniel León Borja', alertType: 'low_battery', message: 'Nivel de batería crítico: 23%', severity: 'medium', status: 'active', createdAt: new Date(Date.now() - 1800000), cityName: 'Riobamba' },
  { id: 'ALR-003', deviceId: 'DEV-012', deviceName: 'Sensor Zona Industrial', alertType: 'out_of_range', message: 'CO₂ excede el umbral permitido: 850 ppm', severity: 'high', status: 'active', createdAt: new Date(Date.now() - 900000), cityName: 'Riobamba' },
  { id: 'ALR-004', deviceId: 'DEV-016', deviceName: 'Sensor Mariscal', alertType: 'disconnected', message: 'Dispositivo desconectado, batería agotada', severity: 'high', status: 'active', createdAt: new Date(Date.now() - 3600000), cityName: 'Quito' },
  { id: 'ALR-005', deviceId: 'DEV-005', deviceName: 'Sensor Terminal Terrestre', alertType: 'low_battery', message: 'Nivel de batería crítico: 5%', severity: 'high', status: 'active', createdAt: new Date(Date.now() - 5400000), cityName: 'Riobamba' },
  { id: 'ALR-006', deviceId: 'DEV-009', deviceName: 'Sensor Mercado La Merced', alertType: 'out_of_range', message: 'Humedad relativa fuera de rango: 98%', severity: 'medium', status: 'resolved', createdAt: new Date(Date.now() - 86400000), cityName: 'Riobamba' },
];

export const APP_USERS: AppUser[] = [
  { id: 'USR-001', name: 'Carlos Mendoza', email: 'carlos@smartcity.ec', role: 'super_admin', city: 'Riobamba', createdAt: new Date('2024-01-01') },
  { id: 'USR-002', name: 'María García', email: 'maria@smartcity.ec', role: 'admin', city: 'Riobamba', createdAt: new Date('2024-02-15') },
  { id: 'USR-003', name: 'Luis Paredes', email: 'luis@smartcity.ec', role: 'admin', city: 'Quito', createdAt: new Date('2024-07-01') },
  { id: 'USR-004', name: 'Ana Torres', email: 'ana@smartcity.ec', role: 'user', city: 'Riobamba', createdAt: new Date('2024-03-10') },
  { id: 'USR-005', name: 'Pedro Salazar', email: 'pedro@smartcity.ec', role: 'user', city: 'Guayaquil', createdAt: new Date('2025-01-20') },
];

// Helper to get stats
export function getDeviceStats() {
  const total = SMART_DEVICES.length;
  const online = SMART_DEVICES.filter(d => d.status === 'online').length;
  const offline = SMART_DEVICES.filter(d => d.status === 'offline').length;
  const warning = SMART_DEVICES.filter(d => d.status === 'warning').length;
  const activeAlerts = SMART_ALERTS.filter(a => a.status === 'active').length;
  const citiesCount = CITIES.length;

  const devicesByCity = CITIES.map(c => ({
    city: c.name,
    count: SMART_DEVICES.filter(d => d.cityId === c.id).length,
    online: SMART_DEVICES.filter(d => d.cityId === c.id && d.status === 'online').length,
  }));

  const devicesBySensorType = SENSOR_TYPES.map(type => ({
    type,
    count: SMART_DEVICES.filter(d => d.sensorType === type).length,
  })).filter(d => d.count > 0);

  const alertsBySeverity = {
    high: SMART_ALERTS.filter(a => a.severity === 'high' && a.status === 'active').length,
    medium: SMART_ALERTS.filter(a => a.severity === 'medium' && a.status === 'active').length,
    low: SMART_ALERTS.filter(a => a.severity === 'low' && a.status === 'active').length,
  };

  return { total, online, offline, warning, activeAlerts, citiesCount, devicesByCity, devicesBySensorType, alertsBySeverity };
}
