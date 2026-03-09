export interface SensorReading {
  sensor: string;
  value: number;
  unit: string;
  timestamp: Date;
  deviceId: string;
}

export interface SensorConfig {
  id: string;
  name: string;
  unit: string;
  icon: string;
  color: string;
  thresholds: {
    warning?: number;
    danger?: number;
    warningLow?: number;
    warningHigh?: number;
    dangerLow?: number;
    dangerHigh?: number;
  };
}

export interface Device {
  id: string;
  name: string;
  location: { lat: number; lng: number };
  locationName: string;
  status: 'online' | 'offline' | 'warning';
  lastReading: Date;
  sensors: string[];
}

export interface Alert {
  id: string;
  sensor: string;
  deviceId: string;
  level: 'warning' | 'danger';
  value: number;
  threshold: number;
  timestamp: Date;
  message: string;
}

export type SensorStatus = 'normal' | 'warning' | 'danger';

export type TimeRange = '1h' | '6h' | '24h' | '7d' | '30d';
