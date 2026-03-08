import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { SENSOR_CONFIGS, getSensorStatus } from '@/lib/sensor-config';
import type { SensorStatus } from '@/lib/types';
import { Thermometer, Droplets, Flame, Wind, FlaskConical, Skull, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

const iconMap: Record<string, React.ElementType> = {
  Thermometer, Droplets, Flame, Wind, FlaskConical, Skull,
};

const sensorBgMap: Record<string, string> = {
  'sensor-temp': 'bg-sensor-temp/10 text-sensor-temp',
  'sensor-humidity': 'bg-sensor-humidity/10 text-sensor-humidity',
  'sensor-methane': 'bg-sensor-methane/10 text-sensor-methane',
  'sensor-air': 'bg-sensor-air/10 text-sensor-air',
  'sensor-propane': 'bg-sensor-propane/10 text-sensor-propane',
  'sensor-co': 'bg-sensor-co/10 text-sensor-co',
};

const sensorTextMap: Record<string, string> = {
  'sensor-temp': 'text-sensor-temp',
  'sensor-humidity': 'text-sensor-humidity',
  'sensor-methane': 'text-sensor-methane',
  'sensor-air': 'text-sensor-air',
  'sensor-propane': 'text-sensor-propane',
  'sensor-co': 'text-sensor-co',
};

interface MetricCardProps {
  sensorId: string;
  value: number;
  unit: string;
  timestamp: Date;
  previousValue?: number;
  sparklineData?: number[];
  delay?: number;
}

export function MetricCardSkeleton() {
  return (
    <Card className="border-border bg-card overflow-hidden">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <Skeleton className="h-3 w-20" />
        <div className="flex items-baseline gap-2">
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-4 w-8" />
        </div>
        <div className="pt-2 border-t border-border/50 flex justify-between">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-12" />
        </div>
        <Skeleton className="h-8 w-full rounded" />
      </CardContent>
    </Card>
  );
}

export function MetricCard({ sensorId, value, unit, timestamp, previousValue, sparklineData, delay = 0 }: MetricCardProps) {
  const config = SENSOR_CONFIGS[sensorId];
  if (!config) return null;

  const status = getSensorStatus(sensorId, value) as SensorStatus;
  const Icon = iconMap[config.icon] || Thermometer;
  const bgClass = sensorBgMap[config.color] || 'bg-primary/10 text-primary';
  const textClass = sensorTextMap[config.color] || 'text-primary';

  const isNormal = status === 'normal';
  const isWarning = status === 'warning';
  const isDanger = status === 'danger';

  const statusLabel = isNormal ? 'NORMAL' : isWarning ? 'ADVERTENCIA' : 'ALERTA';
  const statusBadgeClass = isNormal
    ? 'bg-success/15 text-success border-success/25'
    : isWarning
    ? 'bg-warning/15 text-warning border-warning/25'
    : 'bg-destructive/15 text-destructive border-destructive/25 animate-pulse';

  const borderClass = isNormal
    ? 'border-border hover:border-success/30'
    : isWarning
    ? 'border-warning/30 shadow-[0_0_15px_-5px_hsl(var(--warning)/0.2)]'
    : 'border-destructive/30 shadow-[0_0_20px_-5px_hsl(var(--destructive)/0.3)]';

  const trend = previousValue !== undefined
    ? value > previousValue ? 'up' : value < previousValue ? 'down' : 'stable'
    : 'stable';

  const relativeTime = formatDistanceToNow(timestamp, { addSuffix: true, locale: es });

  // Sparkline
  const sparkPoints = sparklineData && sparklineData.length >= 2
    ? sparklineData.slice(-20)
    : Array.from({ length: 8 }, () => value + (Math.random() - 0.5) * value * 0.08);
  const sparkMin = Math.min(...sparkPoints);
  const sparkMax = Math.max(...sparkPoints);
  const sparkRange = sparkMax - sparkMin || 1;
  const sparkPath = sparkPoints.map((v, i) => {
    const x = (i / (sparkPoints.length - 1)) * 100;
    const y = 30 - ((v - sparkMin) / sparkRange) * 24;
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');
  // Fill area path
  const fillPath = sparkPath + ` L 100 32 L 0 32 Z`;

  return (
    <Card
      className={`${borderClass} bg-card transition-all duration-300 group animate-scale-in overflow-hidden`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <CardContent className="p-4 relative">
        {/* Header row */}
        <div className="flex items-start justify-between mb-3">
          <div className={`rounded-xl p-2.5 ${bgClass} transition-transform group-hover:scale-110`}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex flex-col items-end gap-1">
            {/* Status badge */}
            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${statusBadgeClass}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${isNormal ? 'bg-success' : isWarning ? 'bg-warning' : 'bg-destructive'}`} />
              {statusLabel}
            </span>
            {/* Trend arrow */}
            {trend !== 'stable' && (
              <div className={`flex items-center gap-0.5 text-[11px] font-semibold ${trend === 'up' ? 'text-sensor-temp' : 'text-sensor-humidity'}`}>
                {trend === 'up' ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
              </div>
            )}
          </div>
        </div>

        {/* Sensor name */}
        <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground mb-1">{config.name}</p>

        {/* Value */}
        <div className="flex items-baseline gap-1.5">
          <span className="text-3xl font-bold font-mono tracking-tight text-card-foreground">
            {value.toFixed(unit === '°C' || unit === '%' ? 1 : 0)}
          </span>
          <span className="text-sm font-medium text-muted-foreground">{unit}</span>
        </div>

        {/* Relative timestamp */}
        <p className="text-[10px] text-muted-foreground/70 mt-1 font-mono">
          🕐 {relativeTime}
        </p>

        {/* Footer separator */}
        <div className="mt-3 pt-2 border-t border-border/40">
          {/* Sparkline chart */}
          <svg className="w-full h-9 opacity-40 group-hover:opacity-60 transition-opacity" viewBox="0 0 100 32" preserveAspectRatio="none">
            <defs>
              <linearGradient id={`spark-fill-${sensorId}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="currentColor" stopOpacity="0.3" />
                <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={fillPath} fill={`url(#spark-fill-${sensorId})`} className={textClass} />
            <path d={sparkPath} fill="none" stroke="currentColor" strokeWidth="1.5" className={textClass} />
          </svg>
        </div>
      </CardContent>
    </Card>
  );
}
