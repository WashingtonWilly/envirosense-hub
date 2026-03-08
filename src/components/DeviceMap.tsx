import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useFirestoreDevices } from '@/hooks/useFirestore';
import { useTheme } from '@/hooks/useTheme';

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

const TILE_URLS = {
  light: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
  dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
};

export function DeviceMap() {
  const { theme } = useTheme();
  const { devices } = useFirestoreDevices();
  const tileUrl = TILE_URLS[theme];

  return (
    <MapContainer
      center={[-1.6635, -78.6546]}
      zoom={7}
      className="h-full w-full"
      style={{ minHeight: '100%' }}
    >
      <TileLayer
        key={theme}
        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        url={tileUrl}
      />
      {devices.map(device => (
        <Marker key={device.id} position={[device.lat, device.lng]}>
          <Popup>
            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', lineHeight: '1.5' }}>
              <p style={{ fontWeight: 700, marginBottom: '4px', fontFamily: 'Space Grotesk, sans-serif' }}>{device.name}</p>
              <p style={{ fontSize: '11px', fontFamily: 'JetBrains Mono, monospace', opacity: 0.6 }}>{device.id}</p>
              <p style={{ fontSize: '11px', opacity: 0.7, marginTop: '4px' }}>📍 {device.city}</p>
              <p style={{ fontSize: '11px', marginTop: '6px' }}>
                Estado:{' '}
                <span style={{ fontWeight: 600, color: device.status === 'online' ? 'hsl(155 65% 45%)' : device.status === 'warning' ? 'hsl(38 95% 50%)' : 'hsl(0 72% 51%)' }}>
                  ● {device.status === 'online' ? 'Online' : device.status === 'warning' ? 'Advertencia' : 'Offline'}
                </span>
              </p>
              <p style={{ fontSize: '10px', opacity: 0.5, marginTop: '4px' }}>
                Última lectura: {device.lastSeen.toLocaleString('es-EC')}
              </p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
