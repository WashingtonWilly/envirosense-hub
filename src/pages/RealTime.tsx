import { DashboardLayout } from '@/components/DashboardLayout';
import { SensorGrid } from '@/components/SensorCards';
import { useMqtt } from '@/hooks/useMqtt';
import { SENSOR_CONFIGS } from '@/lib/sensor-config';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Radio, Zap } from 'lucide-react';

const RealTimePage = () => {
  const { connected, readings, history, alerts } = useMqtt();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="rounded-xl p-2 bg-primary/10">
            <Radio className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold font-display text-foreground">Tiempo Real</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Datos en vivo de los sensores conectados</p>
          </div>
        </div>

        <SensorGrid readings={readings} />

        <Card className="bg-card border-border">
          <CardHeader className="pb-3 border-b border-border/50">
            <div className="flex items-center gap-2.5">
              <div className="rounded-lg p-1.5 bg-success/10">
                <Zap className="h-4 w-4 text-success" />
              </div>
              <CardTitle className="text-sm font-semibold font-display">Feed en Vivo</CardTitle>
              <div className="h-1.5 w-1.5 rounded-full bg-success animate-pulse-glow ml-1" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[450px]">
              <div className="divide-y divide-border/50">
                {history.slice().reverse().slice(0, 50).map((r, i) => {
                  const config = SENSOR_CONFIGS[r.sensor];
                  return (
                    <div key={i} className="flex items-center justify-between px-4 py-3 hover:bg-secondary/30 text-sm transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-2 rounded-full bg-primary/60" />
                        <span className="font-medium text-card-foreground text-[13px]">{config?.name || r.sensor}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-mono text-[13px] font-semibold text-card-foreground tabular-nums">{r.value.toFixed(2)} <span className="text-muted-foreground font-normal">{r.unit}</span></span>
                        <span className="text-[11px] text-muted-foreground font-mono w-20 text-right tabular-nums">
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
