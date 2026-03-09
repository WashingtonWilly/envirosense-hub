import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Warehouse, MapPin, Cpu, Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { useState, useMemo } from 'react';
import { useFirestoreDevices } from '@/hooks/useFirestore';

interface CityInfo {
  name: string;
  devices: number;
  online: number;
  lats: number[];
  lngs: number[];
}

const CitiesPage = () => {
  const { devices, loading } = useFirestoreDevices();

  // Derive cities from devices
  const cities = useMemo<CityInfo[]>(() => {
    const map = new Map<string, CityInfo>();
    devices.forEach(d => {
      const existing = map.get(d.city);
      if (existing) {
        existing.devices++;
        if (d.status === 'online') existing.online++;
        existing.lats.push(d.lat);
        existing.lngs.push(d.lng);
      } else {
        map.set(d.city, {
          name: d.city,
          devices: 1,
          online: d.status === 'online' ? 1 : 0,
          lats: [d.lat],
          lngs: [d.lng],
        });
      }
    });
    return Array.from(map.values());
  }, [devices]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="rounded-xl p-2 bg-primary/10">
            <Warehouse className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold font-display text-foreground">Ubicaciones</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Zonas derivadas de los dispositivos registrados</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : cities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Building2 className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">No hay ciudades aún</p>
            <p className="text-xs text-muted-foreground mt-1">Agrega dispositivos con una ciudad asignada</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cities.map((city, i) => {
              const avgLat = city.lats.reduce((a, b) => a + b, 0) / city.lats.length;
              const avgLng = city.lngs.reduce((a, b) => a + b, 0) / city.lngs.length;
              return (
                <Card key={city.name} className="bg-card border-border hover:border-primary/20 transition-all duration-300 animate-slide-in" style={{ animationDelay: `${i * 80}ms` }}>
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-card-foreground font-display text-lg">{city.name}</h3>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="p-3 rounded-lg bg-secondary/30 border border-border text-center">
                        <Cpu className="h-4 w-4 mx-auto text-primary mb-1" />
                        <p className="text-lg font-bold font-display text-card-foreground">{city.devices}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Dispositivos</p>
                      </div>
                      <div className="p-3 rounded-lg bg-success/5 border border-success/20 text-center">
                        <div className="h-4 w-4 mx-auto rounded-full bg-success/20 flex items-center justify-center mb-1">
                          <div className="h-2 w-2 rounded-full bg-success" />
                        </div>
                        <p className="text-lg font-bold font-display text-success">{city.online}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Online</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span className="font-mono">{avgLat.toFixed(4)}°, {avgLng.toFixed(4)}°</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default CitiesPage;
