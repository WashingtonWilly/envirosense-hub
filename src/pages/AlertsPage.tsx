import { DashboardLayout } from '@/components/DashboardLayout';
import { SMART_ALERTS } from '@/lib/smart-city-data';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, XCircle, CheckCircle2, Info, Clock, MapPin } from 'lucide-react';
import { useState } from 'react';
import type { SmartAlert } from '@/lib/smart-city-data';

const AlertsPage = () => {
  const [alerts, setAlerts] = useState<SmartAlert[]>(SMART_ALERTS);
  const [filter, setFilter] = useState('all');

  const filtered = alerts.filter(a => {
    if (filter === 'active') return a.status === 'active';
    if (filter === 'resolved') return a.status === 'resolved';
    if (filter === 'high') return a.severity === 'high';
    if (filter === 'medium') return a.severity === 'medium';
    return true;
  });

  const resolve = (id: string) => setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'resolved' as const } : a));

  const severityConfig = {
    high: { icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10', border: 'border-l-destructive', badge: 'bg-destructive/15 text-destructive border-destructive/20' },
    medium: { icon: AlertTriangle, color: 'text-warning', bg: 'bg-warning/10', border: 'border-l-warning', badge: 'bg-warning/15 text-warning border-warning/20' },
    low: { icon: Info, color: 'text-info', bg: 'bg-info/10', border: 'border-l-info', badge: 'bg-info/15 text-info border-info/20' },
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
          <div className="flex items-center gap-3">
            <Badge className="bg-destructive/15 text-destructive border-destructive/20">
              {alerts.filter(a => a.status === 'active').length} activas
            </Badge>
            <Badge className="bg-success/15 text-success border-success/20">
              {alerts.filter(a => a.status === 'resolved').length} resueltas
            </Badge>
          </div>
        </div>

        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[200px] bg-secondary/50 border-border">
            <SelectValue placeholder="Filtrar" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="active">Activas</SelectItem>
            <SelectItem value="resolved">Resueltas</SelectItem>
            <SelectItem value="high">Alta severidad</SelectItem>
            <SelectItem value="medium">Media severidad</SelectItem>
          </SelectContent>
        </Select>

        <div className="grid gap-3">
          {filtered.map((alert, i) => {
            const config = severityConfig[alert.severity];
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
                        <p className="text-sm font-medium text-card-foreground">{alert.message}</p>
                        <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                          <span className="font-mono">{alert.deviceName}</span>
                          <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{alert.cityName}</span>
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{alert.createdAt.toLocaleString('es-EC')}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={`text-[10px] ${config.badge}`}>{alert.severity}</Badge>
                      {alert.status === 'active' ? (
                        <Button size="sm" variant="outline" onClick={() => resolve(alert.id)} className="text-xs border-border hover:bg-success/10 hover:text-success hover:border-success/20">
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Resolver
                        </Button>
                      ) : (
                        <Badge className="bg-success/15 text-success border-success/20 text-[10px]">Resuelta</Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AlertsPage;
