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
        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
      {DEVICES.map(device => (
        <Marker key={device.id} position={[device.location.lat, device.location.lng]}>
          <Popup>
            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', lineHeight: '1.5', color: 'hsl(210 20% 92%)' }}>
              <p style={{ fontWeight: 700, marginBottom: '4px', fontFamily: 'Space Grotesk, sans-serif' }}>{device.name}</p>
              <p style={{ fontSize: '11px', fontFamily: 'JetBrains Mono, monospace', color: 'hsl(215 12% 50%)' }}>{device.id}</p>
              <p style={{ fontSize: '11px', color: 'hsl(215 12% 50%)', marginTop: '4px' }}>{device.locationName}</p>
              <p style={{ fontSize: '11px', marginTop: '6px' }}>
                Estado:{' '}
                <span style={{ fontWeight: 600, color: device.status === 'online' ? 'hsl(155 65% 48%)' : 'hsl(0 75% 55%)' }}>
                  {device.status === 'online' ? '● Online' : '● Offline'}
                </span>
              </p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
