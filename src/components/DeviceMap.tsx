import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { useTheme } from '@/hooks/useTheme';
import { useEffect, useRef, useMemo } from 'react';
import type { FirestoreDevice } from '@/lib/firestore-types';

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

const highlightedIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [35, 57],
  iconAnchor: [17, 57],
  popupAnchor: [1, -48],
  shadowSize: [57, 57],
  className: 'highlighted-marker',
});

const TILE_URLS = {
  light: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
  dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
};

interface DeviceMapProps {
  devices: FirestoreDevice[];
  selectedDeviceId?: string | null;
  onMarkerClick?: (deviceId: string) => void;
}

function FlyToDevice({ device }: { device: FirestoreDevice | undefined }) {
  const map = useMap();
  useEffect(() => {
    if (device) {
      map.flyTo([device.lat, device.lng], 15, { duration: 1.2 });
    }
  }, [device, map]);
  return null;
}

export function DeviceMap({ devices, selectedDeviceId, onMarkerClick }: DeviceMapProps) {
  const { theme } = useTheme();
  const tileUrl = TILE_URLS[theme];
  const markerRefs = useRef<Record<string, L.Marker>>({}); 

  const selectedDevice = useMemo(
    () => (selectedDeviceId ? devices.find(d => d.id === selectedDeviceId) : undefined),
    [devices, selectedDeviceId]
  );

  // Open popup of selected device
  useEffect(() => {
    if (selectedDeviceId && markerRefs.current[selectedDeviceId]) {
      setTimeout(() => {
        markerRefs.current[selectedDeviceId]?.openPopup();
      }, 1300);
    }
  }, [selectedDeviceId, devices]);

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
      <FlyToDevice device={selectedDevice} />
      <MarkerClusterGroup
        chunkedLoading
        maxClusterRadius={50}
        spiderfyOnMaxZoom
        showCoverageOnHover={false}
      >
        {devices.map(device => (
          <Marker
            key={device.id}
            position={[device.lat, device.lng]}
            icon={device.id === selectedDeviceId ? highlightedIcon : defaultIcon}
            ref={(ref) => {
              if (ref && device.id) markerRefs.current[device.id] = ref;
            }}
            eventHandlers={{
              click: () => {
                if (device.id && onMarkerClick) onMarkerClick(device.id);
              },
            }}
          >
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
                  Última lectura: {device.lastSeen?.toLocaleString?.('es-EC') ?? '—'}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MarkerClusterGroup>
    </MapContainer>
  );
}
