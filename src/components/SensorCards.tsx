import { Card, CardContent } from '@/components/ui/card';
import { SENSOR_CONFIGS, getSensorStatus } from '@/lib/sensor-config';
import { SensorReading, SensorStatus } from '@/lib/types';
import { Thermometer, Droplets, Flame, Wind, FlaskConical, Skull, TrendingUp, TrendingDown, Minus, ArrowUpRight, ArrowDownRight } from 'lucide-react';

const iconMap: Record<string, React.ElementType> = {
  Thermometer, Droplets, Flame, Wind, FlaskConical, Skull,
};

const statusConfig: Record<SensorStatus, { border: string; bg: string; dot: string; label: string; glow: string }> = {
  normal: {
    border: 'border-border hover:border-success/30',
    bg: 'bg-card',
    dot: 'bg-success',
    label: 'Normal',
    glow: '',
  },
  warning: {
    border: 'border-warning/30',
    bg: 'bg-card',
    dot: 'bg-warning',
    label: 'Advertencia',
    glow: 'glow-warning',
  },
  danger: {
    border: 'border-destructive/30',
    bg: 'bg-card',
    dot: 'bg-destructive animate-pulse-glow',
    label: 'Peligro',
    glow: 'glow-danger',
  },
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

interface SensorCardProps {
  reading: SensorReading;
  previousValue?: number;
  delay?: number;
  sparklineData?: number[];
}

export function SensorCard({ reading, previousValue, delay = 0 }: SensorCardProps) {
  const config = SENSOR_CONFIGS[reading.sensor];
  if (!config) return null;

  const status = getSensorStatus(reading.sensor, reading.value) as SensorStatus;
  const Icon = iconMap[config.icon] || Thermometer;
  const sConf = statusConfig[status];
  const bgClass = sensorBgMap[config.color] || 'bg-primary/10 text-primary';
  const textClass = sensorTextMap[config.color] || 'text-primary';

  const trend = previousValue !== undefined
    ? reading.value > previousValue ? 'up' : reading.value < previousValue ? 'down' : 'stable'
    : 'stable';

  // Generate a fake mini sparkline data
  const sparkPoints = Array.from({ length: 8 }, (_, i) => {
    const base = reading.value + (Math.random() - 0.5) * reading.value * 0.08;
    return base;
  });
  const sparkMin = Math.min(...sparkPoints);
  const sparkMax = Math.max(...sparkPoints);
  const sparkRange = sparkMax - sparkMin || 1;
  const sparkPath = sparkPoints.map((v, i) => {
    const x = (i / (sparkPoints.length - 1)) * 100;
    const y = 30 - ((v - sparkMin) / sparkRange) * 24;
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  return (
    <Card 
      className={`${sConf.border} ${sConf.bg} ${sConf.glow} transition-all duration-300 group animate-scale-in`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <CardContent className="p-4 relative overflow-hidden">
        {/* Mini sparkline background */}
        <svg className="absolute bottom-0 left-0 w-full h-8 opacity-20" viewBox="0 0 100 32" preserveAspectRatio="none">
          <path d={sparkPath} fill="none" stroke="currentColor" strokeWidth="1.5" className={textClass} />
        </svg>

        {/* Header */}
        <div className="flex items-start justify-between mb-4 relative">
          <div className={`rounded-xl p-2.5 ${bgClass} transition-transform group-hover:scale-110`}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex flex-col items-end gap-1">
            {/* Status badge */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{sConf.label}</span>
              <div className={`h-2 w-2 rounded-full ${sConf.dot}`} />
            </div>
            {/* Trend */}
            {trend !== 'stable' && (
              <div className={`flex items-center gap-0.5 text-[11px] font-semibold ${trend === 'up' ? 'text-sensor-temp' : 'text-sensor-humidity'}`}>
                {trend === 'up' ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              </div>
            )}
          </div>
        </div>

        {/* Sensor name */}
        <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground mb-1.5 relative">{config.name}</p>

        {/* Value */}
        <div className="flex items-baseline gap-1.5 relative">
          <span className={`text-3xl font-bold font-mono tracking-tight text-card-foreground value-transition`}>
            {reading.value.toFixed(reading.unit === '°C' || reading.unit === '%' ? 1 : 0)}
          </span>
          <span className="text-sm font-medium text-muted-foreground">{config.unit}</span>
        </div>

        {/* Footer */}
        <div className="mt-3 pt-2.5 border-t border-border/50 flex items-center justify-between text-[10px] text-muted-foreground relative">
          <span className="font-mono">{reading.deviceId}</span>
          <span className="font-mono">
            {reading.timestamp.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

interface SensorGridProps {
  readings: Record<string, SensorReading>;
}

export function SensorGrid({ readings }: SensorGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
      {Object.values(readings).map((reading, i) => (
        <SensorCard key={reading.sensor} reading={reading} delay={i * 60} />
      ))}
    </div>
  );
}
