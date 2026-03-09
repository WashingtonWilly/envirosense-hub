import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Cloud, Sun, CloudRain, CloudSun, CloudDrizzle, Wind, BarChart3 } from 'lucide-react';
import { generateForecast, type AqiLevel } from '@/lib/forecastUtils';
import type { HistoryEntry } from '@/lib/firestore-types';

// ── AQI color scale ─────────────────────────────────────────
const AQI_COLORS: Record<AqiLevel, string> = {
  good:       'bg-success',
  moderate:   'bg-warning',
  unhealthy1: 'bg-sensor-methane',
  unhealthy2: 'bg-destructive',
  hazardous:  'bg-sensor-propane',
};

const WEATHER_ICONS: Record<string, React.ReactNode> = {
  sunny:        <Sun className="h-8 w-8 text-primary" />,
  cloudy:       <Cloud className="h-8 w-8 text-muted-foreground" />,
  partlyCloudy: <CloudSun className="h-8 w-8 text-muted-foreground" />,
  drizzle:      <CloudDrizzle className="h-8 w-8 text-muted-foreground" />,
  rainy:        <CloudRain className="h-8 w-8 text-muted-foreground" />,
  windy:        <Wind className="h-8 w-8 text-muted-foreground" />,
};

const TIME_LABELS = [
  { idx: 0, label: '00:00' },
  { idx: 6, label: '06:00' },
  { idx: 12, label: '12:00' },
  { idx: 18, label: '18:00' },
  { idx: 23, label: '23:00' },
];

// ── Time axis ───────────────────────────────────────────────
function TimeAxis() {
  return (
    <div className="relative h-4 mt-1">
      {TIME_LABELS.map(({ idx, label }) => (
        <span
          key={idx}
          className="absolute text-[9px] font-mono text-muted-foreground/60 -translate-x-1/2"
          style={{ left: `${(idx / 23) * 100}%` }}
        >
          {label}
        </span>
      ))}
    </div>
  );
}

// ── Mini bar row (full width) ───────────────────────────────
function MiniBarRow({ label, values, max, colorClass }: { label: string; values: number[]; max: number; colorClass: string }) {
  return (
    <div className="space-y-1">
      <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">{label}</span>
      <div className="flex items-end gap-[2px] h-10">
        {values.map((v, i) => {
          const pct = Math.max(6, (v / max) * 100);
          return (
            <div
              key={i}
              className={`flex-1 rounded-sm ${colorClass} transition-all`}
              style={{ height: `${pct}%` }}
              title={`${String(i).padStart(2, '0')}:00 → ${v}`}
            />
          );
        })}
      </div>
    </div>
  );
}

// ── Main component ──────────────────────────────────────────
interface AirQualityForecastProps {
  history?: HistoryEntry[];
}

export function AirQualityForecast({ history }: AirQualityForecastProps) {
  const forecast = useMemo(() => {
    const lastEntry = history && history.length > 0 ? history[history.length - 1] : null;
    return generateForecast(lastEntry);
  }, [history]);

  const maxTemp = forecast.high + 4;
  const maxCo = Math.max(80, ...forecast.hourly.map(h => h.co));
  const maxCh4 = Math.max(400, ...forecast.hourly.map(h => h.ch4));
  const maxC3h8 = Math.max(100, ...forecast.hourly.map(h => h.c3h8));

  return (
    <Card className="bg-card border-border overflow-hidden">
      <CardHeader className="pb-3 border-b border-border/50">
        <div className="flex items-center gap-2.5">
          <div className="rounded-lg p-1.5 bg-sensor-air/10">
            <BarChart3 className="h-4 w-4 text-sensor-air" />
          </div>
          <CardTitle className="text-sm font-semibold font-display">Pronóstico Detallado para Mañana</CardTitle>
          <span className="ml-auto text-[10px] font-mono text-muted-foreground uppercase tracking-wider">24 h</span>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Day header */}
        <div className="flex flex-col items-center gap-1.5 py-5 border-b border-border/40">
          <span className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">
            {forecast.label}{' '}
            <span className="font-normal text-muted-foreground/70">{forecast.date}</span>
          </span>
          {WEATHER_ICONS[forecast.weather] ?? WEATHER_ICONS.cloudy}
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-bold text-foreground">{forecast.high}°</span>
            <span className="text-sm text-muted-foreground">/</span>
            <span className="text-sm text-muted-foreground">{forecast.low}°</span>
          </div>
        </div>

        {/* Content */}
        <div className="px-5 py-4 space-y-5">
          {/* AQI timeline */}
          <div className="space-y-1">
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">Variación AQI</span>
            <div className="flex gap-[1.5px] rounded-md overflow-hidden h-4">
              {forecast.hourly.map((h, i) => (
                <div
                  key={i}
                  className={`flex-1 ${AQI_COLORS[h.aqi]}`}
                  title={`${String(i).padStart(2, '0')}:00 → AQI ${h.aqiValue}`}
                />
              ))}
            </div>
            <TimeAxis />
          </div>

          {/* Metric rows */}
          <MiniBarRow label="Temp °C" values={forecast.hourly.map(h => h.temp)} max={maxTemp} colorClass="bg-sensor-temp/80" />
          <MiniBarRow label="Humedad %" values={forecast.hourly.map(h => h.hum)} max={100} colorClass="bg-sensor-humidity/70" />
          <MiniBarRow label="CO ppm" values={forecast.hourly.map(h => h.co)} max={maxCo} colorClass="bg-sensor-co/60" />
          <MiniBarRow label="CH₄ ppm" values={forecast.hourly.map(h => h.ch4)} max={maxCh4} colorClass="bg-sensor-methane/70" />
          <MiniBarRow label="C₃H₈ ppm" values={forecast.hourly.map(h => h.c3h8)} max={maxC3h8} colorClass="bg-sensor-propane/60" />

          {/* Shared time axis for metrics */}
          <TimeAxis />
        </div>

        {/* AQI Legend */}
        <div className="flex items-center justify-center gap-3 px-4 py-2.5 border-t border-border/40 bg-secondary/20">
          {([
            ['good', 'Bueno'],
            ['moderate', 'Moderado'],
            ['unhealthy1', 'Insalubre L.'],
            ['unhealthy2', 'Insalubre'],
            ['hazardous', 'Peligroso'],
          ] as [AqiLevel, string][]).map(([level, label]) => (
            <div key={level} className="flex items-center gap-1.5">
              <div className={`h-2.5 w-2.5 rounded-[3px] ${AQI_COLORS[level]}`} />
              <span className="text-[9px] text-muted-foreground font-medium">{label}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
