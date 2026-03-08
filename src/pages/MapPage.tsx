import { DashboardLayout } from '@/components/DashboardLayout';
import { useMqtt } from '@/hooks/useMqtt';
import { DEVICES } from '@/lib/sensor-config';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Wifi, WifiOff, Signal } from 'lucide-react';
import { useEffect, useState } from 'react';

const MapPage = () => {
  const { connected, alerts } = useMqtt();
  const [MapComponent, setMapComponent] = useState<React.ComponentType | null>(null);

  useEffect(() => {
    import('@/components/DeviceMap').then(mod => {
      setMapComponent(() => mod.DeviceMap);
    });
  }, []);

  return (
    <DashboardLayout alertCount={alerts.length} connected={connected}>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="rounded-xl p-2 bg-primary/10">
            <MapPin className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold font-display text-foreground">Mapa de Dispositivos</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Ubicación geográfica de los prototipos IoT</p>
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

        {/* Device cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {DEVICES.map((device, i) => (
            <Card key={device.id} className="bg-card border-border hover:border-primary/20 transition-all duration-300 animate-slide-in" style={{ animationDelay: `${i * 80}ms` }}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${device.status === 'online' ? 'bg-success/10' : 'bg-destructive/10'}`}>
                      {device.status === 'online' ? (
                        <Wifi className="h-4 w-4 text-success" />
                      ) : (
                        <WifiOff className="h-4 w-4 text-destructive" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-card-foreground">{device.name}</h3>
                      <p className="text-[10px] text-muted-foreground font-mono">{device.id}</p>
                    </div>
                  </div>
                  <Badge 
                    className={`text-[10px] ${device.status === 'online' ? 'bg-success/15 text-success border-success/20' : 'bg-destructive/15 text-destructive border-destructive/20'}`}
                  >
                    {device.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  <span>{device.locationName}</span>
                </div>
                <div className="mt-1 text-[10px] text-muted-foreground font-mono">
                  {device.location.lat.toFixed(4)}°N, {device.location.lng.toFixed(4)}°W
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {device.sensors.map(s => (
                    <span key={s} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
                      {s}
                    </span>
                  ))}
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
