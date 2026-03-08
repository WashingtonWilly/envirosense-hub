// Firestore data model types

export interface FirestoreDevice {
  id?: string; // Firestore doc ID
  name: string;
  city: string;
  lat: number;
  lng: number;
  status: 'online' | 'offline' | 'warning';
  lastSeen: Date;
  air_quality?: number; // Latest AQI value for heatmap
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
