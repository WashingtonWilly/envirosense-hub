// Firestore data model types

export interface CameraEntry {
  id: string;
  name: string;
  url: string;
}

export interface HistoryEntry {
  temp: number;
  hum: number;
  co: number;
  ch4: number;
  c3h8: number;
  aqi: number;
  timestamp: number;
}

export interface FirestoreDevice {
  id?: string; // Firestore doc ID
  name: string;
  city: string;
  lat: number;
  lng: number;
  status: 'online' | 'offline' | 'warning';
  lastSeen: Date;
  air_quality?: number; // Latest AQI value for heatmap
  // New telemetry fields
  temp?: number;
  hum?: number;
  co?: number;
  ch4?: number;
  c3h8?: number;
  aqi?: number;
  last_updated?: Date;
  history?: HistoryEntry[];
  cameraUrl?: string;
}

export interface FirestoreReading {
  id?: string;
  temperature: number;
  humidity: number;
  methane: number;
  propane: number;
  co: number;
  air_quality: number;
  timestamp: Date;
}

export interface FirestoreAlert {
  id?: string;
  deviceId: string;
  type: 'offline' | 'out_of_range' | 'disconnected' | 'low_battery';
  value: number;
  timestamp: Date;
}
