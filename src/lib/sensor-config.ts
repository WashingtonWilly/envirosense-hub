import { SensorConfig, SensorStatus } from './types';

// ── Poultry/swine house thresholds ─────────────────────────
// Each sensor now supports bidirectional ranges (low/high) where applicable.

export interface SensorThresholds {
  /** Values below this trigger warning (optional, for temp/hum) */
  warningLow?: number;
  /** Values above this trigger warning */
  warningHigh: number;
  /** Values below this trigger danger/alert (optional) */
  dangerLow?: number;
  /** Values above this trigger danger/alert */
  dangerHigh: number;
}

export interface PoultryConfig extends Omit<SensorConfig, 'thresholds'> {
  thresholds: SensorThresholds;
}

export const SENSOR_CONFIGS: Record<string, PoultryConfig> = {
  DHT22_T: {
    id: 'DHT22_T',
    name: 'Temperatura',
    unit: '°C',
    icon: 'Thermometer',
    color: 'sensor-temp',
    thresholds: { warningLow: 15, warningHigh: 28, dangerLow: 10, dangerHigh: 32 },
  },
  DHT22_H: {
    id: 'DHT22_H',
    name: 'Humedad',
    unit: '%',
    icon: 'Droplets',
    color: 'sensor-humidity',
    thresholds: { warningLow: 40, warningHigh: 75, dangerLow: 25, dangerHigh: 85 },
  },
  'MQ-4': {
    id: 'MQ-4',
    name: 'Metano (CH₄)',
    unit: 'ppm',
    icon: 'Flame',
    color: 'sensor-methane',
    thresholds: { warningHigh: 250, dangerHigh: 400 },
  },
  'MQ-135': {
    id: 'MQ-135',
    name: 'Calidad del Aire',
    unit: 'AQI',
    icon: 'Wind',
    color: 'sensor-air',
    thresholds: { warningHigh: 100, dangerHigh: 200 },
  },
  'MQ-2': {
    id: 'MQ-2',
    name: 'Propano (C₃H₈)',
    unit: 'ppm',
    icon: 'FlaskConical',
    color: 'sensor-propane',
    thresholds: { warningHigh: 100, dangerHigh: 200 },
  },
  'MQ-7': {
    id: 'MQ-7',
    name: 'Monóxido de Carbono',
    unit: 'ppm',
    icon: 'Skull',
    color: 'sensor-co',
    thresholds: { warningHigh: 15, dangerHigh: 30 },
  },
};

/**
 * Evaluates a single sensor reading against poultry-house thresholds.
 * Supports bidirectional ranges (too low / too high).
 */
export function getSensorStatus(sensorId: string, value: number): SensorStatus {
  const config = SENSOR_CONFIGS[sensorId];
  if (!config) return 'normal';

  const { warningLow, warningHigh, dangerLow, dangerHigh } = config.thresholds;

  // Check danger first (highest priority)
  if (value >= dangerHigh) return 'danger';
  if (dangerLow !== undefined && value <= dangerLow) return 'danger';

  // Check warning
  if (value >= warningHigh) return 'warning';
  if (warningLow !== undefined && value <= warningLow) return 'warning';

  return 'normal';
}

/**
 * Individual metric evaluation result
 */
export interface MetricEvaluation {
  sensorId: string;
  value: number;
  status: SensorStatus;
  label: string;
}

/**
 * Evaluates all device metrics and determines the global device status.
 * - If ANY metric is 'danger' → device is 'warning' (maps to Firestore 'warning' status which shows red alert)
 * - If ANY metric is 'warning' → device is 'warning'
 * - If ALL metrics are 'normal' → device is 'online'
 */
export function evaluateDeviceStatus(data: {
  temp?: number;
  hum?: number;
  co?: number;
  ch4?: number;
  c3h8?: number;
  aqi?: number;
}): { globalStatus: 'online' | 'warning'; metrics: MetricEvaluation[]; hasCritical: boolean } {
  const fieldToSensor: Record<string, string> = {
    temp: 'DHT22_T',
    hum: 'DHT22_H',
    co: 'MQ-7',
    ch4: 'MQ-4',
    c3h8: 'MQ-2',
    aqi: 'MQ-135',
  };

  const metrics: MetricEvaluation[] = [];
  let hasWarning = false;
  let hasDanger = false;

  for (const [field, sensorId] of Object.entries(fieldToSensor)) {
    const value = data[field as keyof typeof data];
    if (value === undefined || value === null) continue;

    const status = getSensorStatus(sensorId, value);
    const config = SENSOR_CONFIGS[sensorId];
    metrics.push({
      sensorId,
      value,
      status,
      label: config?.name || field,
    });

    if (status === 'danger') hasDanger = true;
    if (status === 'warning') hasWarning = true;
  }

  const globalStatus: 'online' | 'warning' = hasDanger || hasWarning ? 'warning' : 'online';

  return { globalStatus, metrics, hasCritical: hasDanger };
}

// ── Legacy static devices (kept for compatibility) ─────────
export const DEVICES = [
  {
    id: 'ESP32-001',
    name: 'Galpón Central',
    location: { lat: -1.6697, lng: -78.6510 },
    locationName: 'Riobamba, Ecuador',
    status: 'online' as const,
    lastReading: new Date(),
    sensors: ['DHT22_T', 'DHT22_H', 'MQ-4', 'MQ-135', 'MQ-2', 'MQ-7'],
  },
  {
    id: 'ESP32-002',
    name: 'Galpón Norte',
    location: { lat: -0.1807, lng: -78.4678 },
    locationName: 'Quito, Ecuador',
    status: 'online' as const,
    lastReading: new Date(Date.now() - 300000),
    sensors: ['DHT22_T', 'DHT22_H', 'MQ-135'],
  },
  {
    id: 'ESP32-003',
    name: 'Galpón Sur',
    location: { lat: -2.9001, lng: -79.0059 },
    locationName: 'Cuenca, Ecuador',
    status: 'offline' as const,
    lastReading: new Date(Date.now() - 3600000),
    sensors: ['DHT22_T', 'DHT22_H', 'MQ-7'],
  },
];
