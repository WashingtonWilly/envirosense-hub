import { DashboardLayout } from '@/components/DashboardLayout';
import { useMqtt } from '@/hooks/useMqtt';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Settings } from 'lucide-react';

const SettingsPage = () => {
  const { connected, alerts } = useMqtt();

  return (
    <DashboardLayout alertCount={alerts.length} connected={connected}>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            Configuración
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Opciones del sistema de monitoreo</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Conexión MQTT</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Broker URL</Label>
              <Input defaultValue="wss://broker.hivemq.com:8884/mqtt" />
            </div>
            <div className="space-y-2">
              <Label>Topic</Label>
              <Input defaultValue="gato1" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notificaciones</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-card-foreground">Alertas de temperatura</p>
                <p className="text-xs text-muted-foreground">Notificar cuando la temperatura exceda umbrales</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-card-foreground">Alertas de gases</p>
                <p className="text-xs text-muted-foreground">Notificar concentraciones peligrosas de gas</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-card-foreground">Desconexión de dispositivos</p>
                <p className="text-xs text-muted-foreground">Alertar cuando un dispositivo se desconecte</p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default SettingsPage;
