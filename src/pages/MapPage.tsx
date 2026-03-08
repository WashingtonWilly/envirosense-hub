import { DashboardLayout } from '@/components/DashboardLayout';
import { useMqtt } from '@/hooks/useMqtt';
import { DEVICES } from '@/lib/sensor-config';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin } from 'lucide-react';
import { useEffect, useState } from 'react';

const MapPage = () => {
  const { connected, alerts } = useMqtt();
  const [MapComponent, setMapComponent] = useState<React.ComponentType | null>(null);

  useEffect(() => {
    // Dynamic import to avoid SSR issues with leaflet
    import('@/components/DeviceMap').then(mod => {
      setMapComponent(() => mod.DeviceMap);
    });
  }, []);

  return (
    <DashboardLayout alertCount={alerts.length} connected={connected}>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Mapa de Dispositivos
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Ubicación geográfica de los prototipos IoT</p>
        </div>

        <Card>
          <CardContent className="p-0 overflow-hidden rounded-lg">
            <div className="h-[500px] md:h-[600px]">
              {MapComponent ? <MapComponent /> : (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                  Cargando mapa...
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {DEVICES.map(device => (
            <Card key={device.id}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className={`h-2.5 w-2.5 rounded-full ${device.status === 'online' ? 'bg-success' : 'bg-destructive'}`} />
                  <span className="font-semibold text-sm text-card-foreground">{device.name}</span>
                </div>
                <p className="text-xs text-muted-foreground">{device.locationName}</p>
                <p className="text-[10px] text-muted-foreground mt-1 font-mono">
                  {device.location.lat.toFixed(4)}, {device.location.lng.toFixed(4)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default MapPage;
