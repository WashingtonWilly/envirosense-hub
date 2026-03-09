import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { SENSOR_CONFIGS, getSensorStatus } from '@/lib/sensor-config';
import type { SensorStatus } from '@/lib/types';
import type { HistoryEntry } from '@/lib/firestore-types';
import { Thermometer, Droplets, Flame, Wind, FlaskConical, Skull, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { MetricSparkline } from './MetricSparkline';

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

const sensorColorMap: Record<string, string> = {
  'sensor-temp': 'hsl(12, 90%, 56%)',
  'sensor-humidity': 'hsl(205, 89%, 53%)',
  'sensor-methane': 'hsl(32, 89%, 52%)',
  'sensor-air': 'hsl(168, 63%, 45%)',
  'sensor-propane': 'hsl(275, 63%, 57%)',
  'sensor-co': 'hsl(348, 73%, 52%)',
};

// Map sensorId to history dataKey
const sensorToHistoryKey: Record<string, keyof Omit<HistoryEntry, 'timestamp'>> = {
  'DHT22_T': 'temp',
  'DHT22_H': 'hum',
  'MQ-7': 'co',
  'MQ-4': 'ch4',
  'MQ-2': 'c3h8',
  'MQ-135': 'aqi',
};

interface MetricCardProps {
  sensorId: string;
  value: number;
  unit: string;
  timestamp: Date;
  previousValue?: number;
  history?: HistoryEntry[];
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
        <Skeleton className="h-12 w-full rounded" />
      </CardContent>
    </Card>
  );
}

export function MetricCard({ sensorId, value, unit, timestamp, previousValue, history, delay = 0 }: MetricCardProps) {
  const config = SENSOR_CONFIGS[sensorId];
  if (!config) return null;

  const status = getSensorStatus(sensorId, value) as SensorStatus;
  const Icon = iconMap[config.icon] || Thermometer;
  const bgClass = sensorBgMap[config.color] || 'bg-primary/10 text-primary';
  const chartColor = sensorColorMap[config.color] || 'hsl(var(--primary))';
  const historyKey = sensorToHistoryKey[sensorId] || 'temp';

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

  // Safely handle timestamp - may be Firestore Timestamp, Date, number, or invalid
  const safeTimestamp = timestamp instanceof Date && !isNaN(timestamp.getTime())
    ? timestamp
    : typeof timestamp === 'number'
    ? new Date(timestamp)
    : (timestamp as any)?.toDate?.() instanceof Date
    ? (timestamp as any).toDate()
    : null;

  const relativeTime = safeTimestamp
    ? formatDistanceToNow(safeTimestamp, { addSuffix: true, locale: es })
    : 'Sin fecha';

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

        {/* Footer separator + Sparkline */}
        <div className="mt-3 pt-2 border-t border-border/40">
          <div className="opacity-60 group-hover:opacity-100 transition-opacity">
            <MetricSparkline
              data={history || []}
              dataKey={historyKey}
              color={chartColor}
              height={48}
              isWarning={isWarning || isDanger}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
