import { Card, CardContent } from '@/components/ui/card';
import { SENSOR_CONFIGS, getSensorStatus } from '@/lib/sensor-config';
import { SensorReading } from '@/lib/types';
import { Thermometer, Droplets, Flame, Wind, FlaskConical, Skull, TrendingUp, TrendingDown, Minus } from 'lucide-react';

const iconMap: Record<string, React.ElementType> = {
  Thermometer, Droplets, Flame, Wind, FlaskConical, Skull,
};

const statusStyles = {
  normal: 'border-border',
  warning: 'border-warning/40 bg-warning/5',
  danger: 'border-destructive/40 bg-destructive/5 animate-pulse',
};

const statusDotStyles = {
  normal: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-destructive',
};

const colorMap: Record<string, string> = {
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
}

export function SensorCard({ reading, previousValue }: SensorCardProps) {
  const config = SENSOR_CONFIGS[reading.sensor];
  if (!config) return null;

  const status = getSensorStatus(reading.sensor, reading.value);
  const Icon = iconMap[config.icon] || Thermometer;
  const colorClass = colorMap[config.color] || 'text-primary';

  const trend = previousValue !== undefined
    ? reading.value > previousValue ? 'up' : reading.value < previousValue ? 'down' : 'stable'
    : 'stable';

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;

  return (
    <Card className={`transition-all duration-300 ${statusStyles[status]} animate-slide-in`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className={`rounded-lg p-2 bg-muted ${colorClass}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex items-center gap-1.5">
            <TrendIcon className={`h-3.5 w-3.5 ${trend === 'up' ? 'text-destructive' : trend === 'down' ? 'text-success' : 'text-muted-foreground'}`} />
            <div className={`h-2 w-2 rounded-full ${statusDotStyles[status]}`} />
          </div>
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1">{config.name}</p>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold font-mono text-card-foreground">
              {reading.value.toFixed(reading.unit === '°C' || reading.unit === '%' ? 1 : 0)}
            </span>
            <span className="text-sm text-muted-foreground">{config.unit}</span>
          </div>
        </div>
        <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
          <span>{reading.deviceId}</span>
          <span>{reading.timestamp.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 md:gap-4">
      {Object.values(readings).map((reading) => (
        <SensorCard key={reading.sensor} reading={reading} />
      ))}
    </div>
  );
}
