import { SensorConfig } from './types';

export const SENSOR_CONFIGS: Record<string, SensorConfig> = {
  DHT22_T: {
    id: 'DHT22_T',
    name: 'Temperatura',
    unit: '°C',
    icon: 'Thermometer',
    color: 'sensor-temp',
    thresholds: { warning: 35, danger: 45 },
  },
  DHT22_H: {
    id: 'DHT22_H',
    name: 'Humedad',
    unit: '%',
    icon: 'Droplets',
    color: 'sensor-humidity',
    thresholds: { warning: 80, danger: 95 },
  },
  'MQ-4': {
    id: 'MQ-4',
    name: 'Metano (CH₄)',
    unit: 'ppm',
    icon: 'Flame',
    color: 'sensor-methane',
    thresholds: { warning: 1000, danger: 5000 },
  },
  'MQ-135': {
    id: 'MQ-135',
    name: 'Calidad del Aire',
    unit: 'ppm',
    icon: 'Wind',
    color: 'sensor-air',
    thresholds: { warning: 200, danger: 400 },
  },
  'MQ-2': {
    id: 'MQ-2',
    name: 'Propano (C₃H₈)',
    unit: 'ppm',
    icon: 'FlaskConical',
    color: 'sensor-propane',
    thresholds: { warning: 2000, danger: 5000 },
  },
  'MQ-7': {
    id: 'MQ-7',
    name: 'Monóxido de Carbono',
    unit: 'ppm',
    icon: 'Skull',
    color: 'sensor-co',
    thresholds: { warning: 50, danger: 100 },
  },
};

export const getSensorStatus = (sensorId: string, value: number) => {
  const config = SENSOR_CONFIGS[sensorId];
  if (!config) return 'normal';
  if (value >= config.thresholds.danger) return 'danger';
  if (value >= config.thresholds.warning) return 'warning';
  return 'normal';
};

export const DEVICES = [
  {
    id: 'ESP32-001',
    name: 'Estación Central',
    location: { lat: 4.711, lng: -74.0721 },
    locationName: 'Bogotá, Colombia',
    status: 'online' as const,
    lastReading: new Date(),
    sensors: ['DHT22_T', 'DHT22_H', 'MQ-4', 'MQ-135', 'MQ-2', 'MQ-7'],
  },
  {
    id: 'ESP32-002',
    name: 'Estación Norte',
    location: { lat: 6.2442, lng: -75.5812 },
    locationName: 'Medellín, Colombia',
    status: 'online' as const,
    lastReading: new Date(Date.now() - 300000),
    sensors: ['DHT22_T', 'DHT22_H', 'MQ-135'],
  },
  {
    id: 'ESP32-003',
    name: 'Estación Sur',
    location: { lat: 3.4516, lng: -76.532 },
    locationName: 'Cali, Colombia',
    status: 'offline' as const,
    lastReading: new Date(Date.now() - 3600000),
    sensors: ['DHT22_T', 'DHT22_H', 'MQ-7'],
  },
];
