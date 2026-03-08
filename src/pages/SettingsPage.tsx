import { DashboardLayout } from '@/components/DashboardLayout';
import { useMqtt } from '@/hooks/useMqtt';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Settings, Wifi, Bell, Shield, Server } from 'lucide-react';

const SettingsPage = () => {
  const { connected, alerts } = useMqtt();

  return (
    <DashboardLayout alertCount={alerts.length} connected={connected}>
      <div className="space-y-6 max-w-2xl">
        <div className="flex items-center gap-3">
          <div className="rounded-xl p-2 bg-primary/10">
            <Settings className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold font-display text-foreground">Configuración</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Opciones del sistema de monitoreo</p>
          </div>
        </div>

        {/* MQTT Config */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3 border-b border-border/50">
            <div className="flex items-center gap-2.5">
              <div className="rounded-lg p-1.5 bg-info/10">
                <Wifi className="h-4 w-4 text-info" />
              </div>
              <CardTitle className="text-sm font-semibold font-display">Conexión MQTT</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Broker URL</Label>
              <Input defaultValue="wss://broker.hivemq.com:8884/mqtt" className="font-mono text-sm bg-secondary/50 border-border" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Topic</Label>
              <Input defaultValue="gato1" className="font-mono text-sm bg-secondary/50 border-border" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Puerto</Label>
                <Input defaultValue="8884" className="font-mono text-sm bg-secondary/50 border-border" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Protocolo</Label>
                <Input defaultValue="WSS" className="font-mono text-sm bg-secondary/50 border-border" readOnly />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3 border-b border-border/50">
            <div className="flex items-center gap-2.5">
              <div className="rounded-lg p-1.5 bg-warning/10">
                <Bell className="h-4 w-4 text-warning" />
              </div>
              <CardTitle className="text-sm font-semibold font-display">Notificaciones y Alertas</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-4 space-y-1">
            {[
              { title: 'Alertas de temperatura', desc: 'Notificar cuando la temperatura exceda umbrales configurados', defaultOn: true },
              { title: 'Alertas de gases tóxicos', desc: 'Notificar concentraciones peligrosas de CO, CH₄, C₃H₈', defaultOn: true },
              { title: 'Calidad del aire', desc: 'Notificar cuando el índice AQI exceda niveles aceptables', defaultOn: true },
              { title: 'Desconexión de dispositivos', desc: 'Alertar cuando un dispositivo IoT pierda conexión', defaultOn: true },
            ].map((item, i) => (
              <div key={i}>
                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium text-card-foreground">{item.title}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{item.desc}</p>
                  </div>
                  <Switch defaultChecked={item.defaultOn} />
                </div>
                {i < 3 && <Separator className="bg-border/50" />}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* System */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3 border-b border-border/50">
            <div className="flex items-center gap-2.5">
              <div className="rounded-lg p-1.5 bg-primary/10">
                <Server className="h-4 w-4 text-primary" />
              </div>
              <CardTitle className="text-sm font-semibold font-display">Sistema</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 rounded-lg bg-secondary/30 border border-border">
                <p className="text-muted-foreground mb-1">Versión</p>
                <p className="font-mono font-semibold text-card-foreground">v1.0.0</p>
              </div>
              <div className="p-3 rounded-lg bg-secondary/30 border border-border">
                <p className="text-muted-foreground mb-1">Framework</p>
                <p className="font-mono font-semibold text-card-foreground">React + Vite</p>
              </div>
              <div className="p-3 rounded-lg bg-secondary/30 border border-border">
                <p className="text-muted-foreground mb-1">Protocolo</p>
                <p className="font-mono font-semibold text-card-foreground">MQTT v5.0</p>
              </div>
              <div className="p-3 rounded-lg bg-secondary/30 border border-border">
                <p className="text-muted-foreground mb-1">Transporte</p>
                <p className="font-mono font-semibold text-card-foreground">WebSocket (WSS)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default SettingsPage;
