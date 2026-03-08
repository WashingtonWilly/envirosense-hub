import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Wifi, WifiOff, AlertTriangle, Loader2, Search, ArrowUpDown, Clock } from 'lucide-react';
import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useFirestoreDevices } from '@/hooks/useFirestore';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import type { FirestoreDevice } from '@/lib/firestore-types';

type SortKey = 'name' | 'city' | 'status' | 'lastSeen';

const MapPage = () => {
  const [MapComponent, setMapComponent] = useState<React.ComponentType<any> | null>(null);
  const { devices, loading } = useFirestoreDevices();
  const [searchParams, setSearchParams] = useSearchParams();

  const [searchQuery, setSearchQuery] = useState('');
  const [cityFilter, setCityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'offline' | 'warning'>('all');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);

  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Load map component
  useEffect(() => {
    import('@/components/DeviceMap').then(mod => setMapComponent(() => mod.DeviceMap));
  }, []);

  // Handle URL param for deviceId
  useEffect(() => {
    const deviceId = searchParams.get('deviceId');
    if (deviceId && devices.length > 0) {
      const found = devices.find(d => d.id === deviceId);
      if (found) {
        setSelectedDeviceId(deviceId);
        // Clear param after use
        searchParams.delete('deviceId');
        setSearchParams(searchParams, { replace: true });
      }
    }
  }, [searchParams, devices, setSearchParams]);

  // Derived data
  const cities = useMemo(() => [...new Set(devices.map(d => d.city))].sort(), [devices]);

  const filtered = useMemo(() => {
    let result = devices;
    if (cityFilter !== 'all') result = result.filter(d => d.city === cityFilter);
    if (statusFilter !== 'all') result = result.filter(d => d.status === statusFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(d =>
        d.name.toLowerCase().includes(q) ||
        (d.id ?? '').toLowerCase().includes(q) ||
        d.city.toLowerCase().includes(q)
      );
    }
    // Sort
    result = [...result].sort((a, b) => {
      switch (sortKey) {
        case 'name': return a.name.localeCompare(b.name);
        case 'city': return a.city.localeCompare(b.city);
        case 'status': return a.status.localeCompare(b.status);
        case 'lastSeen': return (b.lastSeen?.getTime?.() ?? 0) - (a.lastSeen?.getTime?.() ?? 0);
        default: return 0;
      }
    });
    return result;
  }, [devices, cityFilter, statusFilter, searchQuery, sortKey]);

  // Scroll card into view when selected
  useEffect(() => {
    if (selectedDeviceId && cardRefs.current[selectedDeviceId]) {
      cardRefs.current[selectedDeviceId]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [selectedDeviceId]);

  const handleMarkerClick = useCallback((deviceId: string) => {
    setSelectedDeviceId(deviceId);
  }, []);

  const handleCardClick = useCallback((deviceId: string) => {
    setSelectedDeviceId(deviceId);
  }, []);

  const statusIcon = (status: string) => {
    if (status === 'online') return <Wifi className="h-4 w-4 text-success" />;
    if (status === 'warning') return <AlertTriangle className="h-4 w-4 text-warning" />;
    return <WifiOff className="h-4 w-4 text-destructive" />;
  };

  const statusCounts = useMemo(() => ({
    online: devices.filter(d => d.status === 'online').length,
    warning: devices.filter(d => d.status === 'warning').length,
    offline: devices.filter(d => d.status === 'offline').length,
  }), [devices]);

  return (
    <DashboardLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="rounded-xl p-2 bg-primary/10">
            <MapPin className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold font-display text-foreground">Mapa de Sensores</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Ubicación geográfica de todos los dispositivos</p>
          </div>
        </div>

        {/* Filters bar */}
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative flex-1 min-w-[200px] max-w-[320px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, ID o ciudad..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 bg-secondary/50 border-border h-9 text-sm"
            />
          </div>
          <Select value={cityFilter} onValueChange={setCityFilter}>
            <SelectTrigger className="w-[160px] bg-secondary/50 border-border h-9 text-sm">
              <SelectValue placeholder="Ciudad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las ciudades</SelectItem>
              {cities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
            <SelectTrigger className="w-[140px] bg-secondary/50 border-border h-9 text-sm">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="online">Online ({statusCounts.online})</SelectItem>
              <SelectItem value="warning">Warning ({statusCounts.warning})</SelectItem>
              <SelectItem value="offline">Offline ({statusCounts.offline})</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
            <SelectTrigger className="w-[160px] bg-secondary/50 border-border h-9 text-sm">
              <ArrowUpDown className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
              <SelectValue placeholder="Ordenar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Nombre</SelectItem>
              <SelectItem value="city">Ciudad</SelectItem>
              <SelectItem value="status">Estado</SelectItem>
              <SelectItem value="lastSeen">Última conexión</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary/50 border border-border text-xs text-muted-foreground">
            {filtered.length} dispositivos
          </div>
        </div>

        {/* Map + cards layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Map */}
          <Card className="lg:col-span-2 bg-card border-border overflow-hidden">
            <CardContent className="p-0">
              <div className="h-[calc(100vh-16rem)] min-h-[300px] md:h-[550px]">
                {MapComponent ? (
                  <MapComponent
                    devices={filtered}
                    selectedDeviceId={selectedDeviceId}
                    onMarkerClick={handleMarkerClick}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm gap-2">
                    <div className="h-8 w-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
                    <span className="text-xs">Cargando mapa...</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Device cards sidebar */}
          <div className="lg:col-span-1">
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-2 max-h-[550px] overflow-y-auto pr-1 scrollbar-thin">
                {filtered.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">No se encontraron dispositivos.</p>
                )}
                {filtered.map((device) => (
                  <DeviceCard
                    key={device.id}
                    device={device}
                    isSelected={device.id === selectedDeviceId}
                    onClick={() => device.id && handleCardClick(device.id)}
                    ref={(el) => { if (device.id) cardRefs.current[device.id] = el; }}
                    statusIcon={statusIcon}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

// Extracted card component for performance
import React from 'react';

interface DeviceCardProps {
  device: FirestoreDevice;
  isSelected: boolean;
  onClick: () => void;
  statusIcon: (status: string) => React.ReactNode;
}

const DeviceCard = React.forwardRef<HTMLDivElement, DeviceCardProps>(
  ({ device, isSelected, onClick, statusIcon }, ref) => (
    <Card
      ref={ref}
      onClick={onClick}
      className={`cursor-pointer transition-all duration-200 border ${
        isSelected
          ? 'border-primary bg-primary/5 ring-1 ring-primary/30 shadow-md'
          : 'border-border bg-card hover:border-primary/20'
      }`}
    >
      <CardContent className="p-3">
        <div className="flex items-center gap-3">
          <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${
            device.status === 'online' ? 'bg-success/10' : device.status === 'warning' ? 'bg-warning/10' : 'bg-destructive/10'
          }`}>
            {statusIcon(device.status)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-semibold text-sm text-card-foreground truncate">{device.name}</h3>
              <Badge className={`text-[10px] shrink-0 ${
                device.status === 'online' ? 'bg-success/15 text-success border-success/20'
                : device.status === 'warning' ? 'bg-warning/15 text-warning border-warning/20'
                : 'bg-destructive/15 text-destructive border-destructive/20'
              }`}>
                {device.status}
              </Badge>
            </div>
            <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {device.city}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {device.lastSeen instanceof Date
                  ? formatDistanceToNow(device.lastSeen, { addSuffix: true, locale: es })
                  : '—'}
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground/60 font-mono mt-0.5">{device.id}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
);
DeviceCard.displayName = 'DeviceCard';

export default MapPage;
