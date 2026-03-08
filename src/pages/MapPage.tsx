import { DashboardLayout } from '@/components/DashboardLayout';
import { SMART_DEVICES, CITIES, SENSOR_TYPES } from '@/lib/smart-city-data';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Wifi, WifiOff, AlertTriangle } from 'lucide-react';
import { useEffect, useState } from 'react';

const MapPage = () => {
  const [MapComponent, setMapComponent] = useState<React.ComponentType | null>(null);
  const [cityFilter, setCityFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    import('@/components/DeviceMap').then(mod => setMapComponent(() => mod.DeviceMap));
  }, []);

  const filtered = SMART_DEVICES.filter(d => {
    if (cityFilter !== 'all' && d.cityId !== cityFilter) return false;
    if (typeFilter !== 'all' && d.sensorType !== typeFilter) return false;
    return true;
  });

  const statusIcon = (status: string) => {
    if (status === 'online') return <Wifi className="h-4 w-4 text-success" />;
    if (status === 'warning') return <AlertTriangle className="h-4 w-4 text-warning" />;
    return <WifiOff className="h-4 w-4 text-destructive" />;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="rounded-xl p-2 bg-primary/10">
            <MapPin className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold font-display text-foreground">Mapa de Sensores</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Ubicación geográfica de todos los dispositivos</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <Select value={cityFilter} onValueChange={setCityFilter}>
            <SelectTrigger className="w-[180px] bg-secondary/50 border-border">
              <SelectValue placeholder="Ciudad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las ciudades</SelectItem>
              {CITIES.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[200px] bg-secondary/50 border-border">
              <SelectValue placeholder="Tipo de sensor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tipos</SelectItem>
              {SENSOR_TYPES.map(t => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary/50 border border-border text-xs text-muted-foreground">
            {filtered.length} dispositivos
          </div>
        </div>

        <Card className="bg-card border-border overflow-hidden">
          <CardContent className="p-0">
            <div className="h-[450px] md:h-[550px]">
              {MapComponent ? <MapComponent /> : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm gap-2">
                  <div className="h-8 w-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
                  <span className="text-xs">Cargando mapa...</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Device list */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((device, i) => (
            <Card key={device.id} className="bg-card border-border hover:border-primary/20 transition-all duration-300 animate-slide-in" style={{ animationDelay: `${i * 60}ms` }}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${device.status === 'online' ? 'bg-success/10' : device.status === 'warning' ? 'bg-warning/10' : 'bg-destructive/10'}`}>
                      {statusIcon(device.status)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-card-foreground">{device.name}</h3>
                      <p className="text-[10px] text-muted-foreground font-mono">{device.id}</p>
                    </div>
                  </div>
                  <Badge className={`text-[10px] ${device.status === 'online' ? 'bg-success/15 text-success border-success/20' : device.status === 'warning' ? 'bg-warning/15 text-warning border-warning/20' : 'bg-destructive/15 text-destructive border-destructive/20'}`}>
                    {device.status}
                  </Badge>
                </div>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3 w-3" />
                    <span>{device.cityName}, {device.country}</span>
                  </div>
                  <div>🔧 {device.sensorType}</div>
                  <div>🔋 {device.batteryLevel}%</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default MapPage;
