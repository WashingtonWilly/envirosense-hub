import { DashboardLayout } from '@/components/DashboardLayout';
import { KpiCard } from '@/components/KpiCards';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useFirestoreDevices, useFirestoreAlerts } from '@/hooks/useFirestore';
import { LayoutDashboard, Cpu, Building2, AlertTriangle, Wifi, WifiOff, MapPin, Shield, CheckCircle2, XCircle, Clock, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useEffect, useState, useMemo } from 'react';

const PIE_COLORS = [
  'hsl(var(--success))',
  'hsl(var(--destructive))',
  'hsl(var(--warning))',
];

const Index = () => {
  const { devices, loading: devicesLoading } = useFirestoreDevices();
  const { alerts, loading: alertsLoading } = useFirestoreAlerts();
  const [MapComponent, setMapComponent] = useState<React.ComponentType | null>(null);

  useEffect(() => {
    import('@/components/DeviceMap').then(mod => setMapComponent(() => mod.DeviceMap));
  }, []);

  const stats = useMemo(() => {
    const total = devices.length;
    const online = devices.filter(d => d.status === 'online').length;
    const offline = devices.filter(d => d.status === 'offline').length;
    const warning = devices.filter(d => d.status === 'warning').length;
    const cities = [...new Set(devices.map(d => d.city))];
    const devicesByCity = cities.map(city => ({
      city,
      count: devices.filter(d => d.city === city).length,
      online: devices.filter(d => d.city === city && d.status === 'online').length,
    }));
    return { total, online, offline, warning, activeAlerts: alerts.length, citiesCount: cities.length, devicesByCity };
  }, [devices, alerts]);

  const statusData = [
    { name: 'Online', value: stats.online },
    { name: 'Offline', value: stats.offline },
    { name: 'Advertencia', value: stats.warning },
  ];

  const loading = devicesLoading || alertsLoading;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="rounded-xl p-2 bg-primary/10">
            <LayoutDashboard className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold font-display text-foreground">Dashboard</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Monitoreo urbano inteligente en tiempo real</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              <KpiCard title="Dispositivos Totales" value={stats.total} icon={Cpu} variant="default" delay={0} subtitle={`${stats.online} activos`} />
              <KpiCard title="Ciudades" value={stats.citiesCount} icon={Building2} variant="success" delay={50} subtitle="Monitoreadas" />
              <KpiCard title="Online" value={stats.online} icon={Wifi} variant="success" delay={100} subtitle={stats.total > 0 ? `${((stats.online / stats.total) * 100).toFixed(0)}% del total` : '0%'} />
              <KpiCard title="Offline" value={stats.offline} icon={WifiOff} variant={stats.offline > 0 ? 'danger' : 'default'} delay={150} subtitle="Sin conexión" />
              <KpiCard title="Alertas" value={stats.activeAlerts} icon={AlertTriangle} variant={stats.activeAlerts > 3 ? 'danger' : stats.activeAlerts > 0 ? 'warning' : 'default'} delay={200} subtitle="Registradas" />
            </div>

            {/* Map + Alerts row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card className="lg:col-span-2 bg-card border-border overflow-hidden">
                <CardHeader className="pb-3 border-b border-border/50">
                  <div className="flex items-center gap-2.5">
                    <div className="rounded-lg p-1.5 bg-primary/10">
                      <MapPin className="h-4 w-4 text-primary" />
                    </div>
                    <CardTitle className="text-sm font-semibold font-display">Mapa de Sensores</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="h-[350px]">
                    {MapComponent ? <MapComponent /> : (
                      <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm gap-2">
                        <div className="h-8 w-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
                        <span className="text-xs">Cargando mapa...</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Alerts panel */}
              <Card className="bg-card border-border">
                <CardHeader className="pb-3 border-b border-border/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="rounded-lg p-1.5 bg-warning/10">
                        <Shield className="h-4 w-4 text-warning" />
                      </div>
                      <CardTitle className="text-sm font-semibold font-display">Alertas Recientes</CardTitle>
                    </div>
                    <Badge className="bg-destructive/15 text-destructive border-destructive/20 text-[10px]">
                      {alerts.length}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[300px]">
                    {alerts.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                        <div className="rounded-full p-3 bg-success/10 mb-3">
                          <CheckCircle2 className="h-6 w-6 text-success" />
                        </div>
                        <p className="text-sm font-medium text-card-foreground">Todo en orden</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-border/50">
                        {alerts.slice(0, 10).map(alert => (
                          <div key={alert.id} className="flex items-start gap-3 px-4 py-3 hover:bg-secondary/30 transition-colors border-l-2 border-l-warning">
                            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-warning" />
                            <div className="min-w-0 flex-1">
                              <p className="text-[12px] text-card-foreground leading-relaxed">
                                {alert.type}: {alert.value}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] text-muted-foreground font-mono">{alert.deviceId}</span>
                                <span className="text-[10px] text-muted-foreground">•</span>
                                <span className="text-[10px] text-muted-foreground">{alert.timestamp.toLocaleString('es-EC')}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            {/* Charts row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-card border-border">
                <CardHeader className="pb-3 border-b border-border/50">
                  <CardTitle className="text-sm font-semibold font-display">Dispositivos por Ciudad</CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats.devicesByCity} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
                        <XAxis dataKey="city" tick={{ fontSize: 11, fill: 'hsl(var(--chart-text))' }} tickLine={false} axisLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--chart-text))' }} tickLine={false} axisLine={false} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--chart-tooltip-bg))',
                            border: '1px solid hsl(var(--chart-tooltip-border))',
                            borderRadius: '10px',
                            fontSize: '12px',
                            color: 'hsl(var(--chart-tooltip-text))',
                          }}
                        />
                        <Bar dataKey="count" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} name="Total" />
                        <Bar dataKey="online" fill="hsl(var(--success))" radius={[6, 6, 0, 0]} name="Online" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader className="pb-3 border-b border-border/50">
                  <CardTitle className="text-sm font-semibold font-display">Estado de Dispositivos</CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="h-[250px] flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                          {statusData.map((_, i) => (
                            <Cell key={i} fill={PIE_COLORS[i]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--chart-tooltip-bg))',
                            border: '1px solid hsl(var(--chart-tooltip-border))',
                            borderRadius: '10px',
                            fontSize: '12px',
                            color: 'hsl(var(--chart-tooltip-text))',
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Index;
