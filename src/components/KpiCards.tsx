import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon, Thermometer, Droplets, Activity, Cpu, AlertTriangle, Wifi } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: 'up' | 'down' | 'stable';
  variant?: 'default' | 'success' | 'warning' | 'danger';
}

const variantStyles = {
  default: 'bg-card',
  success: 'bg-card border-success/20',
  warning: 'bg-card border-warning/20',
  danger: 'bg-card border-destructive/20',
};

const iconVariantStyles = {
  default: 'bg-primary/10 text-primary',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  danger: 'bg-destructive/10 text-destructive',
};

export function KpiCard({ title, value, subtitle, icon: Icon, variant = 'default' }: KpiCardProps) {
  return (
    <Card className={`${variantStyles[variant]} animate-slide-in`}>
      <CardContent className="p-4 md:p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1.5">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold tracking-tight text-card-foreground">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
          <div className={`rounded-lg p-2.5 ${iconVariantStyles[variant]}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface KpiGridProps {
  avgTemp: number;
  avgHumidity: number;
  airQuality: number;
  activeDevices: number;
  totalAlerts: number;
  connected: boolean;
}

export function KpiGrid({ avgTemp, avgHumidity, airQuality, activeDevices, totalAlerts, connected }: KpiGridProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
      <KpiCard
        title="Temperatura"
        value={`${avgTemp.toFixed(1)}°C`}
        subtitle="Promedio actual"
        icon={Thermometer}
        variant={avgTemp > 35 ? 'warning' : 'default'}
      />
      <KpiCard
        title="Humedad"
        value={`${avgHumidity.toFixed(1)}%`}
        subtitle="Promedio actual"
        icon={Droplets}
      />
      <KpiCard
        title="Calidad Aire"
        value={`${airQuality.toFixed(0)}`}
        subtitle="ppm (MQ-135)"
        icon={Activity}
        variant={airQuality > 200 ? 'warning' : airQuality > 400 ? 'danger' : 'default'}
      />
      <KpiCard
        title="Dispositivos"
        value={activeDevices}
        subtitle="Activos"
        icon={Cpu}
        variant="success"
      />
      <KpiCard
        title="Alertas"
        value={totalAlerts}
        subtitle="Pendientes"
        icon={AlertTriangle}
        variant={totalAlerts > 0 ? 'warning' : 'default'}
      />
      <KpiCard
        title="Broker"
        value={connected ? 'Online' : 'Offline'}
        subtitle="broker.hivemq.com"
        icon={Wifi}
        variant={connected ? 'success' : 'danger'}
      />
    </div>
  );
}
