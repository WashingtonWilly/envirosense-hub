import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, XCircle, CheckCircle2, Info, Clock, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useFirestoreAlerts, useFirestoreDevices } from '@/hooks/useFirestore';
import { toast } from 'sonner';

const AlertsPage = () => {
  const { alerts, loading, deleteAlert } = useFirestoreAlerts();
  const { devices } = useFirestoreDevices();
  const [filter, setFilter] = useState('all');

  const filtered = alerts.filter(a => {
    if (filter === 'offline') return a.type === 'offline';
    if (filter === 'out_of_range') return a.type === 'out_of_range';
    if (filter === 'low_battery') return a.type === 'low_battery';
    if (filter === 'disconnected') return a.type === 'disconnected';
    return true;
  });

  const handleDelete = async (id: string) => {
    try {
      await deleteAlert(id);
      toast.success('Alerta eliminada');
    } catch (error) {
      toast.error('Error al eliminar alerta');
    }
  };

  const typeConfig: Record<string, { icon: typeof XCircle; color: string; bg: string; border: string; badge: string }> = {
    offline: { icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10', border: 'border-l-destructive', badge: 'bg-destructive/15 text-destructive border-destructive/20' },
    out_of_range: { icon: AlertTriangle, color: 'text-warning', bg: 'bg-warning/10', border: 'border-l-warning', badge: 'bg-warning/15 text-warning border-warning/20' },
    low_battery: { icon: AlertTriangle, color: 'text-warning', bg: 'bg-warning/10', border: 'border-l-warning', badge: 'bg-warning/15 text-warning border-warning/20' },
    disconnected: { icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10', border: 'border-l-destructive', badge: 'bg-destructive/15 text-destructive border-destructive/20' },
  };

  const getDeviceName = (deviceId: string) => {
    const device = devices.find(d => d.id === deviceId);
    return device?.name || deviceId;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl p-2 bg-warning/10">
              <AlertTriangle className="h-5 w-5 text-warning" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold font-display text-foreground">Alertas</h1>
              <p className="text-xs text-muted-foreground mt-0.5">Sistema de alertas automáticas</p>
            </div>
          </div>
          <Badge className="bg-destructive/15 text-destructive border-destructive/20">
            {alerts.length} alertas
          </Badge>
        </div>

        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[200px] bg-secondary/50 border-border">
            <SelectValue placeholder="Filtrar" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="offline">Offline</SelectItem>
            <SelectItem value="out_of_range">Fuera de rango</SelectItem>
            <SelectItem value="low_battery">Batería baja</SelectItem>
            <SelectItem value="disconnected">Desconectado</SelectItem>
          </SelectContent>
        </Select>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="rounded-full p-3 bg-success/10 mb-3">
              <CheckCircle2 className="h-6 w-6 text-success" />
            </div>
            <p className="text-sm font-medium text-card-foreground">No hay alertas</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {filtered.map((alert, i) => {
              const config = typeConfig[alert.type] || typeConfig.offline;
              const Icon = config.icon;
              return (
                <Card key={alert.id} className={`bg-card border-border border-l-2 ${config.border} animate-slide-in`} style={{ animationDelay: `${i * 40}ms` }}>
                  <CardContent className="p-4 md:p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className={`h-10 w-10 rounded-xl ${config.bg} flex items-center justify-center shrink-0`}>
                          <Icon className={`h-5 w-5 ${config.color}`} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-card-foreground">
                            {alert.type === 'offline' && 'Dispositivo sin conexión'}
                            {alert.type === 'out_of_range' && `Valor fuera de rango: ${alert.value}`}
                            {alert.type === 'low_battery' && `Batería baja: ${alert.value}%`}
                            {alert.type === 'disconnected' && 'Dispositivo desconectado'}
                          </p>
                          <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                            <span className="font-mono">{getDeviceName(alert.deviceId)}</span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {alert.timestamp.toLocaleString('es-EC')}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={`text-[10px] ${config.badge}`}>{alert.type}</Badge>
                        <Button size="sm" variant="outline" onClick={() => alert.id && handleDelete(alert.id)} className="text-xs border-border hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20">
                          Eliminar
                        </Button>
                      </div>
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

export default AlertsPage;
