import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { useTheme } from '@/hooks/useTheme';
import { useEffect, useRef, useMemo, useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import type { FirestoreDevice } from '@/lib/firestore-types';

// ─── Default blue marker ───
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

// ─── AQI Color Scale ───
const AQI_LEVELS = [
  { max: 50, color: '#00e400', label: 'Bueno' },
  { max: 100, color: '#ffff00', label: 'Moderado' },
  { max: 150, color: '#ff7e00', label: 'Dañino (sensibles)' },
  { max: 200, color: '#ff0000', label: 'Dañino' },
  { max: 300, color: '#8f3f97', label: 'Muy dañino' },
  { max: Infinity, color: '#7e0023', label: 'Peligroso' },
] as const;

function getAqiColor(aqi: number): string {
  for (const level of AQI_LEVELS) {
    if (aqi <= level.max) return level.color;
  }
  return '#7e0023';
}

/** Simulates an AQI value when not available from Firestore */
function getDeviceAqi(device: FirestoreDevice): number {
  if (device.air_quality != null) return device.air_quality;
  // Deterministic fallback based on device id hash
  const hash = (device.id ?? device.name).split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  if (device.status === 'offline') return 180 + (hash % 120); // 180-300
  if (device.status === 'warning') return 80 + (hash % 70); // 80-150
  return 20 + (hash % 60); // 20-80
}

const HEATMAP_SIZE = 70; // px

function createHeatIcon(color: string): L.DivIcon {
  return L.divIcon({
    className: '', // no default leaflet styles
    iconSize: [HEATMAP_SIZE, HEATMAP_SIZE],
    iconAnchor: [HEATMAP_SIZE / 2, HEATMAP_SIZE / 2],
    html: `<div style="
      width:${HEATMAP_SIZE}px;
      height:${HEATMAP_SIZE}px;
      border-radius:50%;
      background:radial-gradient(circle, ${color}cc 0%, ${color}00 70%);
      filter:blur(16px);
      opacity:0.55;
      pointer-events:none;
    "></div>`,
  });
}

// ─── Sub-components ───
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

function MobileTouchHandler() {
  const map = useMap();
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isMobile) {
      map.scrollWheelZoom.disable();
      const container = map.getContainer();
      container.style.touchAction = 'pan-y';
      container.setAttribute('data-mobile-map', 'true');
    } else {
      map.scrollWheelZoom.enable();
      const container = map.getContainer();
      container.style.touchAction = '';
      container.removeAttribute('data-mobile-map');
    }
  }, [map, isMobile]);

  return null;
}

/** Floating AQI legend rendered as a Leaflet control */
function AqiLegend({ visible }: { visible: boolean }) {
  const map = useMap();

  useEffect(() => {
    if (!visible) return;

    const legend = new L.Control({ position: 'bottomright' });

    legend.onAdd = () => {
      const div = L.DomUtil.create('div');
      div.innerHTML = `
        <div style="
          background:rgba(15,15,20,0.88);
          backdrop-filter:blur(12px);
          border-radius:10px;
          padding:10px 12px;
          font-family:'Inter',sans-serif;
          font-size:11px;
          color:#e2e2e2;
          line-height:1.6;
          box-shadow:0 4px 20px rgba(0,0,0,0.4);
          border:1px solid rgba(255,255,255,0.08);
          min-width:130px;
        ">
          <div style="font-weight:700;margin-bottom:6px;font-size:11px;letter-spacing:0.3px;opacity:0.7;">
            CALIDAD DEL AIRE
          </div>
          ${AQI_LEVELS.map(l => `
            <div style="display:flex;align-items:center;gap:7px;margin-bottom:2px;">
              <span style="
                width:12px;height:12px;border-radius:50%;
                background:${l.color};
                display:inline-block;flex-shrink:0;
                box-shadow:0 0 6px ${l.color}88;
              "></span>
              <span>${l.max === Infinity ? '301+' : `0–${l.max}`}</span>
              <span style="opacity:0.6;margin-left:auto;">${l.label}</span>
            </div>
          `).join('')}
        </div>
      `;
      L.DomEvent.disableClickPropagation(div);
      return div;
    };

    legend.addTo(map);
    return () => { legend.remove(); };
  }, [map, visible]);

  return null;
}

/** Floating toggle button for AQI layer */
function AqiToggleControl({ active, onToggle }: { active: boolean; onToggle: () => void }) {
  const map = useMap();

  useEffect(() => {
    const control = new L.Control({ position: 'topright' });

    control.onAdd = () => {
      const container = L.DomUtil.create('div');
      container.style.cssText = 'pointer-events:auto;';

      const render = (isActive: boolean) => {
        container.innerHTML = `
          <button style="
            display:flex;align-items:center;gap:6px;
            padding:7px 12px;
            border-radius:8px;
            border:1px solid ${isActive ? 'rgba(0,228,0,0.3)' : 'rgba(255,255,255,0.12)'};
            background:${isActive ? 'rgba(0,228,0,0.12)' : 'rgba(15,15,20,0.85)'};
            backdrop-filter:blur(12px);
            color:${isActive ? '#00e400' : '#a0a0a0'};
            font-family:'Inter',sans-serif;
            font-size:12px;
            font-weight:600;
            cursor:pointer;
            box-shadow:0 2px 12px rgba(0,0,0,0.3);
            transition:all 0.2s;
            line-height:1;
            white-space:nowrap;
          ">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
            Capa AQI
            <span style="
              width:8px;height:8px;border-radius:50%;
              background:${isActive ? '#00e400' : '#555'};
              box-shadow:${isActive ? '0 0 6px #00e400' : 'none'};
              display:inline-block;
            "></span>
          </button>
        `;
      };

      render(active);

      // Store current state in a closure-accessible way
      let currentActive = active;
      container.addEventListener('click', (e) => {
        e.stopPropagation();
        currentActive = !currentActive;
        render(currentActive);
        onToggle();
      });

      L.DomEvent.disableClickPropagation(container);
      return container;
    };

    control.addTo(map);
    return () => { control.remove(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);

  return null;
}

export function DeviceMap({ devices, selectedDeviceId, onMarkerClick }: DeviceMapProps) {
  const { theme } = useTheme();
  const tileUrl = TILE_URLS[theme];
  const markerRefs = useRef<Record<string, L.Marker>>({});
  const [showAqiHeatmap, setShowAqiHeatmap] = useState(true);

  const selectedDevice = useMemo(
    () => (selectedDeviceId ? devices.find(d => d.id === selectedDeviceId) : undefined),
    [devices, selectedDeviceId]
  );

  // Precompute heat icons per device
  const heatIcons = useMemo(() => {
    const map: Record<string, L.DivIcon> = {};
    for (const d of devices) {
      const aqi = getDeviceAqi(d);
      const color = getAqiColor(aqi);
      map[d.id ?? d.name] = createHeatIcon(color);
    }
    return map;
  }, [devices]);

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
      scrollWheelZoom={true}
    >
      <TileLayer
        key={theme}
        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        url={tileUrl}
      />
      <FlyToDevice device={selectedDevice} />
      <MobileTouchHandler />
      <AqiLegend visible={showAqiHeatmap} />
      <AqiToggleControl active={showAqiHeatmap} onToggle={() => setShowAqiHeatmap(v => !v)} />

      {/* Heatmap aura circles — only when toggle is ON */}
      {showAqiHeatmap && devices.map(device => (
        <Marker
          key={`heat-${device.id}`}
          position={[device.lat, device.lng]}
          icon={heatIcons[device.id ?? device.name]}
          interactive={false}
          zIndexOffset={-1000}
        />
      ))}

      <MarkerClusterGroup
        chunkedLoading
        maxClusterRadius={50}
        spiderfyOnMaxZoom
        showCoverageOnHover={false}
      >
        {devices.map(device => {
          const aqi = getDeviceAqi(device);
          return (
            <Marker
              key={device.id}
              position={[device.lat, device.lng]}
              icon={defaultIcon}
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
                    AQI:{' '}
                    <span style={{ fontWeight: 700, color: getAqiColor(aqi) }}>
                      ● {aqi.toFixed(0)}
                    </span>
                  </p>
                  <p style={{ fontSize: '11px', marginTop: '4px' }}>
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
          );
        })}
      </MarkerClusterGroup>
    </MapContainer>
  );
}
