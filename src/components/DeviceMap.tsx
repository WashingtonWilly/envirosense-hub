import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { DEVICES } from '@/lib/sensor-config';

// Fix default marker icons
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = defaultIcon;

export function DeviceMap() {
  return (
    <MapContainer
      center={[4.711, -74.0721]}
      zoom={6}
      className="h-full w-full"
      style={{ minHeight: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {DEVICES.map(device => (
        <Marker key={device.id} position={[device.location.lat, device.location.lng]}>
          <Popup>
            <div className="text-sm">
              <p className="font-bold">{device.name}</p>
              <p className="text-xs">{device.id}</p>
              <p className="text-xs">{device.locationName}</p>
              <p className="text-xs mt-1">
                Estado: <span className={device.status === 'online' ? 'text-green-600' : 'text-red-600'}>
                  {device.status}
                </span>
              </p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
