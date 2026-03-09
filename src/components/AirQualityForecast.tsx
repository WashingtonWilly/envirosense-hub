import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Cloud, Sun, CloudRain, CloudSun, CloudDrizzle, Wind, BarChart3 } from 'lucide-react';
import { generateForecast, type DayForecast, type AqiLevel } from '@/lib/forecastUtils';
import type { HistoryEntry } from '@/lib/firestore-types';

// ── AQI color scale (semáforo) ──────────────────────────────
const AQI_COLORS: Record<AqiLevel, string> = {
  good:       'bg-success',
  moderate:   'bg-warning',
  unhealthy1: 'bg-sensor-methane',
  unhealthy2: 'bg-destructive',
  hazardous:  'bg-sensor-propane',
};

const WEATHER_ICONS: Record<string, React.ReactNode> = {
  sunny:        <Sun className="h-7 w-7 text-primary" />,
  cloudy:       <Cloud className="h-7 w-7 text-muted-foreground" />,
  partlyCloudy: <CloudSun className="h-7 w-7 text-muted-foreground" />,
  drizzle:      <CloudDrizzle className="h-7 w-7 text-muted-foreground" />,
  rainy:        <CloudRain className="h-7 w-7 text-muted-foreground" />,
  windy:        <Wind className="h-7 w-7 text-muted-foreground" />,
};

// ── Mini bar row ────────────────────────────────────────────
function MiniBarRow({ values, max, colorClass }: { values: number[]; max: number; colorClass: string }) {
  return (
    <div className="flex items-end gap-[2px] h-8">
      {values.map((v, i) => {
        const pct = Math.max(8, (v / max) * 100);
        return (
          <div
            key={i}
            className={`flex-1 rounded-sm ${colorClass} transition-all`}
            style={{ height: `${pct}%` }}
          />
        );
      })}
    </div>
  );
}

// ── Day column ──────────────────────────────────────────────
function DayColumn({ day, isFirst }: { day: DayForecast; isFirst: boolean }) {
  const maxTemp = day.high + 4;
  const maxHum = 100;
  const maxCo = 80;
  const maxCh4 = Math.max(400, ...day.hourly.map(h => h.ch4));
  const maxC3h8 = Math.max(100, ...day.hourly.map(h => h.c3h8));

  return (
    <div className={`min-w-[130px] flex-1 flex flex-col gap-3 px-3 py-4 ${!isFirst ? 'border-l border-border/60' : ''}`}>
      {/* Header */}
      <div className="flex flex-col items-center gap-1.5 text-center">
        <span className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground">
          {day.label}{' '}
          <span className="font-normal text-muted-foreground/70">{day.date}</span>
        </span>
        {WEATHER_ICONS[day.weather] ?? WEATHER_ICONS.cloudy}
        <div className="flex items-baseline gap-1">
          <span className="text-sm font-bold text-foreground">{day.high}°</span>
          <span className="text-[11px] text-muted-foreground">/</span>
          <span className="text-xs text-muted-foreground">{day.low}°</span>
        </div>
      </div>

      {/* AQI color blocks */}
      <div className="space-y-1">
        <span className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground/70">Variación AQI</span>
        <div className="flex gap-[1.5px] rounded-md overflow-hidden">
          {day.hourly.map((h, i) => (
            <div key={i} className={`flex-1 h-3 ${AQI_COLORS[h.aqi]}`} />
          ))}
        </div>
      </div>

      {/* Mini charts */}
      <div className="space-y-2.5 mt-1">
        <div className="space-y-0.5">
          <span className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground/70">Temp °C</span>
          <MiniBarRow values={day.hourly.map(h => h.temp)} max={maxTemp} colorClass="bg-sensor-temp/80" />
        </div>
        <div className="space-y-0.5">
          <span className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground/70">Humedad %</span>
          <MiniBarRow values={day.hourly.map(h => h.hum)} max={maxHum} colorClass="bg-sensor-humidity/70" />
        </div>
        <div className="space-y-0.5">
          <span className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground/70">CO ppm</span>
          <MiniBarRow values={day.hourly.map(h => h.co)} max={maxCo} colorClass="bg-sensor-co/60" />
        </div>
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

  return (
    <Card className="bg-card border-border overflow-hidden">
      <CardHeader className="pb-3 border-b border-border/50">
        <div className="flex items-center gap-2.5">
          <div className="rounded-lg p-1.5 bg-sensor-air/10">
            <BarChart3 className="h-4 w-4 text-sensor-air" />
          </div>
          <CardTitle className="text-sm font-semibold font-display">Análisis y Pronóstico</CardTitle>
          <span className="ml-auto text-[10px] font-mono text-muted-foreground uppercase tracking-wider">5 días</span>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="w-full">
          <div className="flex min-w-[650px]">
            {forecast.map((day, i) => (
              <DayColumn key={day.date} day={day} isFirst={i === 0} />
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

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
