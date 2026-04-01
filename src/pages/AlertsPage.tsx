import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import {
  AlertTriangle, XCircle, CheckCircle2,
  Clock, Loader2, Search, ArrowUpDown, Trash2,
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { useFirestoreAlerts, useFirestoreDevices } from '@/hooks/useFirestore';
import { toast } from 'sonner';

const AlertsPage = () => {
  const { alerts, loading, deleteAlert } = useFirestoreAlerts();
  const { devices } = useFirestoreDevices();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  const getDeviceName = (deviceId: string) => {
    const device = devices.find(d => d.id === deviceId);
    return device?.name || deviceId;
  };

  const getAlertMessage = (alert: typeof alerts[0]) => {
    if (alert.type === 'offline') return 'Dispositivo sin conexión';
    if (alert.type === 'out_of_range') return `Valor fuera de rango: ${alert.value}`;
    if (alert.type === 'low_battery') return `Batería baja: ${alert.value}%`;
    if (alert.type === 'disconnected') return 'Dispositivo desconectado';
    return alert.type;
  };

  const processed = useMemo(() => {
    let result = [...alerts];

    // Filter by type
    if (filter !== 'all') {
      result = result.filter(a => a.type === filter);
    }

    // Search by device name or alert message
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(a => {
        const name = getDeviceName(a.deviceId).toLowerCase();
        const msg = getAlertMessage(a).toLowerCase();
        return name.includes(q) || msg.includes(q) || a.type.toLowerCase().includes(q);
      });
    }

    // Sort
    result.sort((a, b) => {
      const diff = a.timestamp.getTime() - b.timestamp.getTime();
      return sortOrder === 'newest' ? -diff : diff;
    });

    return result;
  }, [alerts, filter, search, sortOrder, devices]);

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

        {/* Search, Filter & Sort Bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por dispositivo o tipo de alerta..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 bg-secondary/50 border-border"
            />
          </div>

          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-full sm:w-[200px] bg-secondary/50 border-border">
              <SelectValue placeholder="Filtrar por tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="offline">Offline</SelectItem>
              <SelectItem value="out_of_range">Fuera de rango</SelectItem>
              <SelectItem value="low_battery">Batería baja</SelectItem>
              <SelectItem value="disconnected">Desconectado</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as 'newest' | 'oldest')}>
            <SelectTrigger className="w-full sm:w-[200px] bg-secondary/50 border-border">
              <div className="flex items-center gap-2">
                <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                <SelectValue />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Más recientes</SelectItem>
              <SelectItem value="oldest">Más antiguas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : processed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="rounded-full p-3 bg-success/10 mb-3">
              <CheckCircle2 className="h-6 w-6 text-success" />
            </div>
            <p className="text-sm font-medium text-card-foreground">No hay alertas</p>
            {(search || filter !== 'all') && (
              <p className="text-xs text-muted-foreground mt-1">Intenta ajustar los filtros de búsqueda</p>
            )}
          </div>
        ) : (
          <div className="grid gap-3">
            {processed.map((alert, i) => {
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
                            {getAlertMessage(alert)}
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
