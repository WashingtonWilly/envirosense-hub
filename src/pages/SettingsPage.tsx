import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Settings, Bell, Server, Shield } from 'lucide-react';

const SettingsPage = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-2xl">
        <div className="flex items-center gap-3">
          <div className="rounded-xl p-2 bg-primary/10">
            <Settings className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold font-display text-foreground">Configuración</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Opciones de la plataforma Smart City</p>
          </div>
        </div>

        <Card className="bg-card border-border">
          <CardHeader className="pb-3 border-b border-border/50">
            <div className="flex items-center gap-2.5">
              <div className="rounded-lg p-1.5 bg-primary/10">
                <Shield className="h-4 w-4 text-primary" />
              </div>
              <CardTitle className="text-sm font-semibold font-display">Configuración General</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Nombre de la Plataforma</Label>
              <Input defaultValue="SmartCity Ecuador" className="bg-secondary/50 border-border" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Ciudad Principal</Label>
              <Input defaultValue="Riobamba" className="bg-secondary/50 border-border" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-3 border-b border-border/50">
            <div className="flex items-center gap-2.5">
              <div className="rounded-lg p-1.5 bg-warning/10">
                <Bell className="h-4 w-4 text-warning" />
              </div>
              <CardTitle className="text-sm font-semibold font-display">Notificaciones</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-4 space-y-1">
            {[
              { title: 'Sensor fuera de línea', desc: 'Notificar cuando un sensor pierda conexión', defaultOn: true },
              { title: 'Valores fuera de rango', desc: 'Alertar cuando las lecturas excedan los umbrales', defaultOn: true },
              { title: 'Batería baja', desc: 'Notificar cuando un dispositivo tenga batería baja', defaultOn: true },
              { title: 'Nuevos dispositivos', desc: 'Notificar cuando se registre un nuevo dispositivo', defaultOn: false },
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
                <p className="font-mono font-semibold text-card-foreground">v2.0.0</p>
              </div>
              <div className="p-3 rounded-lg bg-secondary/30 border border-border">
                <p className="text-muted-foreground mb-1">Plataforma</p>
                <p className="font-mono font-semibold text-card-foreground">Smart City</p>
              </div>
              <div className="p-3 rounded-lg bg-secondary/30 border border-border">
                <p className="text-muted-foreground mb-1">Backend</p>
                <p className="font-mono font-semibold text-card-foreground">Firebase</p>
              </div>
              <div className="p-3 rounded-lg bg-secondary/30 border border-border">
                <p className="text-muted-foreground mb-1">Frontend</p>
                <p className="font-mono font-semibold text-card-foreground">React + Vite</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default SettingsPage;
