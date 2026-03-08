import { DashboardLayout } from '@/components/DashboardLayout';
import { useMqtt } from '@/hooks/useMqtt';
import { DEVICES } from '@/lib/sensor-config';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Cpu, Search, MapPin, Clock, Wifi, WifiOff, ChevronRight, Signal } from 'lucide-react';
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl p-2 bg-primary/10">
              <Cpu className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold font-display text-foreground">Dispositivos</h1>
              <p className="text-xs text-muted-foreground mt-0.5">Gestión de prototipos IoT registrados</p>
            </div>
          </div>
          
          {/* Stats */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-success/10 border border-success/20">
              <div className="h-2 w-2 rounded-full bg-success" />
              <span className="text-[11px] font-semibold text-success">{DEVICES.filter(d => d.status === 'online').length} Online</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-destructive/10 border border-destructive/20">
              <div className="h-2 w-2 rounded-full bg-destructive" />
              <span className="text-[11px] font-semibold text-destructive">{DEVICES.filter(d => d.status === 'offline').length} Offline</span>
            </div>
          </div>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, ID o ubicación..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10 bg-secondary/50 border-border"
          />
        </div>

        <div className="grid gap-3">
          {filtered.map((device, i) => (
            <Card 
              key={device.id} 
              className="bg-card border-border hover:border-primary/20 transition-all duration-300 animate-slide-in group cursor-pointer"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <CardContent className="p-4 md:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className={`h-12 w-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 ${device.status === 'online' ? 'bg-success/10 glow-success' : 'bg-destructive/10'}`}>
                      {device.status === 'online' ? (
                        <Wifi className="h-5 w-5 text-success" />
                      ) : (
                        <WifiOff className="h-5 w-5 text-destructive" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-card-foreground font-display">{device.name}</h3>
                      <p className="text-xs text-muted-foreground font-mono mt-0.5">{device.id}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-primary/50" />
                      <span>{device.locationName}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-primary/50" />
                      <span className="font-mono tabular-nums">{device.lastReading.toLocaleString('es-CO')}</span>
                    </div>
                    <Badge 
                      className={`text-[10px] font-semibold ${device.status === 'online' ? 'bg-success/15 text-success border-success/20' : 'bg-destructive/15 text-destructive border-destructive/20'}`}
                    >
                      {device.status}
                    </Badge>
                    <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary transition-colors hidden sm:block" />
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-border/50 flex flex-wrap gap-1.5">
                  {device.sensors.map(s => (
                    <Badge key={s} variant="secondary" className="text-[10px] font-mono bg-secondary/50 text-muted-foreground border-border">
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
