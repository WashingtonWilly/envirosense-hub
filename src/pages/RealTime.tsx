import { DashboardLayout } from '@/components/DashboardLayout';
import { SensorGrid } from '@/components/SensorCards';
import { useMqtt } from '@/hooks/useMqtt';
import { SensorReading } from '@/lib/types';
import { SENSOR_CONFIGS } from '@/lib/sensor-config';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Radio } from 'lucide-react';

const RealTimePage = () => {
  const { connected, readings, history, alerts } = useMqtt();

  return (
    <DashboardLayout alertCount={alerts.length} connected={connected}>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
            <Radio className="h-5 w-5 text-primary" />
            Tiempo Real
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Datos en vivo de los sensores conectados</p>
        </div>

        <SensorGrid readings={readings} />

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Feed en Vivo</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[400px]">
              <div className="divide-y divide-border">
                {history.slice().reverse().slice(0, 50).map((r, i) => {
                  const config = SENSOR_CONFIGS[r.sensor];
                  return (
                    <div key={i} className="flex items-center justify-between px-4 py-2.5 hover:bg-muted/50 text-sm transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-2 rounded-full bg-primary" />
                        <span className="font-medium text-card-foreground">{config?.name || r.sensor}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-mono text-card-foreground">{r.value.toFixed(2)} {r.unit}</span>
                        <span className="text-xs text-muted-foreground w-20 text-right">
                          {r.timestamp.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default RealTimePage;
