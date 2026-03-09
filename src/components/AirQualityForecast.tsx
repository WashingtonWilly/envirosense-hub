import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Cloud, Sun, CloudRain, CloudSun, CloudDrizzle, Wind, BarChart3 } from 'lucide-react';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
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

// ── Metric sparkline configs ────────────────────────────────
const METRIC_ROWS = [
  { label: 'Temp °C', key: 'temp' as const, stroke: 'hsl(var(--sensor-temp))', id: 'temp', unit: '°C' },
  { label: 'Humedad %', key: 'hum' as const, stroke: 'hsl(var(--sensor-humidity))', id: 'hum', unit: '%' },
  { label: 'CO ppm', key: 'co' as const, stroke: 'hsl(var(--sensor-co))', id: 'co', unit: 'ppm' },
  { label: 'CH₄ ppm', key: 'ch4' as const, stroke: 'hsl(var(--sensor-methane))', id: 'ch4', unit: 'ppm' },
  { label: 'C₃H₈ ppm', key: 'c3h8' as const, stroke: 'hsl(var(--sensor-propane))', id: 'c3h8', unit: 'ppm' },
];

// ── Mini area sparkline row ─────────────────────────────────
function MiniAreaRow({ label, data, stroke, gradientId, unit }: {
  label: string;
  data: { time: string; value: number }[];
  stroke: string;
  gradientId: string;
  unit: string;
}) {
  return (
    <div className="space-y-0.5">
      <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">{label}</span>
      <div className="h-16 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} syncId="forecastCharts" margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={stroke} stopOpacity={0.3} />
                <stop offset="100%" stopColor={stroke} stopOpacity={0.03} />
              </linearGradient>
            </defs>
            <XAxis dataKey="time" hide />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '11px',
                padding: '6px 10px',
                color: 'hsl(var(--foreground))',
                boxShadow: '0 4px 12px hsl(var(--foreground) / 0.08)',
              }}
              formatter={(value: number) => [`${value.toFixed(1)} ${unit}`, label]}
              labelFormatter={(l) => `${l}`}
              cursor={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1, strokeDasharray: '3 3' }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={stroke}
              strokeWidth={1.8}
              fill={`url(#${gradientId})`}
              dot={false}
              activeDot={{ r: 3, strokeWidth: 1.5, stroke: 'hsl(var(--card))', fill: stroke }}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
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

  // Pre-build chart data arrays for each metric
  const metricData = useMemo(() => {
    const result: Record<string, { hour: number; value: number }[]> = {};
    for (const m of METRIC_ROWS) {
      result[m.key] = forecast.hourly.map(h => ({
        hour: h.hour,
        value: m.key === 'temp' ? h.temp : m.key === 'hum' ? h.hum : m.key === 'co' ? h.co : m.key === 'ch4' ? h.ch4 : h.c3h8,
      }));
    }
    return result;
  }, [forecast]);

  return (
    <Card className="bg-card border-border overflow-hidden">
      <CardHeader className="pb-3 border-b border-border/50">
        <div className="flex items-center gap-2.5">
          <div className="rounded-lg p-1.5 bg-sensor-air/10">
            <BarChart3 className="h-4 w-4 text-sensor-air" />
          </div>
          <CardTitle className="text-sm font-semibold font-display">Análisis Detallado y Pronóstico: Mañana</CardTitle>
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
            <span className="text-lg font-bold text-foreground">{forecast.high}°C</span>
            <span className="text-sm text-muted-foreground">/</span>
            <span className="text-sm text-muted-foreground">{forecast.low}°C</span>
          </div>
        </div>

        {/* Content */}
        <div className="px-5 py-4 space-y-4">
          {/* AQI timeline (kept as-is) */}
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

          {/* Metric area sparklines */}
          {METRIC_ROWS.map(m => (
            <MiniAreaRow
              key={m.id}
              label={m.label}
              data={metricData[m.key]}
              stroke={m.stroke}
              gradientId={`forecast-grad-${m.id}`}
            />
          ))}

          {/* Shared bottom time axis */}
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
