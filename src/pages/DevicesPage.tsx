import { DashboardLayout } from '@/components/DashboardLayout';
import { useMqtt } from '@/hooks/useMqtt';
import { DEVICES } from '@/lib/sensor-config';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Cpu, Search, MapPin, Clock, Wifi, WifiOff } from 'lucide-react';
import { useState } from 'react';

const DevicesPage = () => {
  const { connected, alerts } = useMqtt();
  const [search, setSearch] = useState('');

  const filtered = DEVICES.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.id.toLowerCase().includes(search.toLowerCase()) ||
    d.locationName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout alertCount={alerts.length} connected={connected}>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
            <Cpu className="h-5 w-5 text-primary" />
            Dispositivos
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Gestión de prototipos IoT registrados</p>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar dispositivo..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="grid gap-4">
          {filtered.map(device => (
            <Card key={device.id} className="animate-slide-in">
              <CardContent className="p-4 md:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${device.status === 'online' ? 'bg-success/10' : 'bg-destructive/10'}`}>
                      {device.status === 'online' ? (
                        <Wifi className="h-5 w-5 text-success" />
                      ) : (
                        <WifiOff className="h-5 w-5 text-destructive" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-card-foreground">{device.name}</h3>
                      <p className="text-xs text-muted-foreground font-mono">{device.id}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {device.locationName}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {device.lastReading.toLocaleString('es-CO')}
                    </div>
                    <Badge variant={device.status === 'online' ? 'default' : 'destructive'} className={device.status === 'online' ? 'bg-success text-success-foreground' : ''}>
                      {device.status}
                    </Badge>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {device.sensors.map(s => (
                    <Badge key={s} variant="secondary" className="text-[10px] font-mono">
                      {s}
                    </Badge>
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

export default DevicesPage;
