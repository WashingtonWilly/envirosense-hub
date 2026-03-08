import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon, Thermometer, Droplets, Activity, Cpu, AlertTriangle, Wifi, TrendingUp, TrendingDown } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: { direction: 'up' | 'down'; value: string };
  variant?: 'default' | 'success' | 'warning' | 'danger';
  delay?: number;
}

const variantConfig = {
  default: {
    card: 'bg-card border-border hover:border-primary/20',
    icon: 'bg-primary/10 text-primary',
    glow: '',
  },
  success: {
    card: 'bg-card border-success/15 hover:border-success/30',
    icon: 'bg-success/10 text-success',
    glow: 'glow-success',
  },
  warning: {
    card: 'bg-card border-warning/15 hover:border-warning/30',
    icon: 'bg-warning/10 text-warning',
    glow: 'glow-warning',
  },
  danger: {
    card: 'bg-card border-destructive/15 hover:border-destructive/30',
    icon: 'bg-destructive/10 text-destructive',
    glow: 'glow-danger',
  },
};

export function KpiCard({ title, value, subtitle, icon: Icon, trend, variant = 'default', delay = 0 }: KpiCardProps) {
  const config = variantConfig[variant];

  return (
    <Card className={`${config.card} ${config.glow} transition-all duration-300 animate-slide-in group`}
          style={{ animationDelay: `${delay}ms` }}>
      <CardContent className="p-4 md:p-5">
        <div className="flex items-start justify-between mb-3">
          <div className={`rounded-xl p-2.5 ${config.icon} transition-transform group-hover:scale-110`}>
            <Icon className="h-5 w-5" />
          </div>
          {trend && (
            <div className={`flex items-center gap-1 text-[11px] font-medium ${trend.direction === 'up' ? 'text-success' : 'text-destructive'}`}>
              {trend.direction === 'up' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {trend.value}
            </div>
          )}
        </div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-1">{title}</p>
        <p className="text-2xl font-bold font-display tracking-tight text-card-foreground value-transition">{value}</p>
        {subtitle && (
          <p className="text-[11px] text-muted-foreground mt-1">{subtitle}</p>
        )}
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
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      <KpiCard
        title="Temperatura"
        value={`${avgTemp.toFixed(1)}°C`}
        subtitle="Promedio actual"
        icon={Thermometer}
        variant={avgTemp > 35 ? 'warning' : 'default'}
        trend={{ direction: 'up', value: '+0.3°' }}
        delay={0}
      />
      <KpiCard
        title="Humedad"
        value={`${avgHumidity.toFixed(1)}%`}
        subtitle="Promedio actual"
        icon={Droplets}
        trend={{ direction: 'down', value: '-1.2%' }}
        delay={50}
      />
      <KpiCard
        title="Calidad Aire"
        value={`${airQuality.toFixed(0)} ppm`}
        subtitle="MQ-135"
        icon={Activity}
        variant={airQuality > 400 ? 'danger' : airQuality > 200 ? 'warning' : 'default'}
        delay={100}
      />
      <KpiCard
        title="Dispositivos"
        value={`${activeDevices}/3`}
        subtitle="Activos"
        icon={Cpu}
        variant="success"
        delay={150}
      />
      <KpiCard
        title="Alertas"
        value={totalAlerts}
        subtitle="Pendientes"
        icon={AlertTriangle}
        variant={totalAlerts > 5 ? 'danger' : totalAlerts > 0 ? 'warning' : 'default'}
        delay={200}
      />
      <KpiCard
        title="Broker MQTT"
        value={connected ? 'Online' : 'Offline'}
        subtitle="broker.hivemq.com"
        icon={Wifi}
        variant={connected ? 'success' : 'danger'}
        delay={250}
      />
    </div>
  );
}
