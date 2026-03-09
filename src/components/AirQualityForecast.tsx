import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Cloud, Sun, CloudRain, CloudSun, CloudDrizzle, Wind, BarChart3 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { generateForecast, type AqiLevel } from '@/lib/forecastUtils';
import type { HistoryEntry } from '@/lib/firestore-types';

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

const METRIC_OPTIONS = [
  { value: 'temp', label: 'Temperatura', unit: '°C', stroke: 'hsl(var(--sensor-temp))' },
  { value: 'hum', label: 'Humedad', unit: '%', stroke: 'hsl(var(--sensor-humidity))' },
  { value: 'co', label: 'CO', unit: 'ppm', stroke: 'hsl(var(--sensor-co))' },
  { value: 'ch4', label: 'Metano (CH₄)', unit: 'ppm', stroke: 'hsl(var(--sensor-methane))' },
  { value: 'c3h8', label: 'Propano (C₃H₈)', unit: 'ppm', stroke: 'hsl(var(--sensor-propane))' },
] as const;

type MetricKey = typeof METRIC_OPTIONS[number]['value'];

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

interface AirQualityForecastProps {
  history?: HistoryEntry[];
}

export function AirQualityForecast({ history }: AirQualityForecastProps) {
  const [selectedMetric, setSelectedMetric] = useState<MetricKey>('temp');

  const forecast = useMemo(() => {
    const lastEntry = history && history.length > 0 ? history[history.length - 1] : null;
    return generateForecast(lastEntry);
  }, [history]);

  const activeOption = METRIC_OPTIONS.find(m => m.value === selectedMetric)!;

  const chartData = useMemo(() =>
    forecast.hourly.map(h => ({
      time: `${String(h.hour).padStart(2, '0')}:00`,
      value: h[selectedMetric as keyof typeof h] as number,
    })),
  [forecast, selectedMetric]);

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

        <div className="px-5 py-4 space-y-4">
          {/* Metric selector */}
          <Select value={selectedMetric} onValueChange={(v) => setSelectedMetric(v as MetricKey)}>
            <SelectTrigger className="w-full h-9 text-sm bg-secondary/30 border-border/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {METRIC_OPTIONS.map(m => (
                <SelectItem key={m.value} value={m.value}>{m.label} ({m.unit})</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* AQI timeline */}
          <div className="space-y-1">
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">Variación AQI</span>
            <div className="flex gap-[1.5px] rounded-md overflow-hidden h-4">
              {forecast.hourly.map((h, i) => (
                <div key={i} className={`flex-1 ${AQI_COLORS[h.aqi]}`} title={`${String(i).padStart(2, '0')}:00 → AQI ${h.aqiValue}`} />
              ))}
            </div>
            <TimeAxis />
          </div>

          {/* Single enlarged chart */}
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                <defs>
                  <linearGradient id="forecast-main-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={activeOption.stroke} stopOpacity={0.25} />
                    <stop offset="100%" stopColor={activeOption.stroke} stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" strokeOpacity={0.5} />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false}
                  axisLine={false}
                  interval={5}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false}
                  axisLine={false}
                  width={40}
                  domain={['auto', 'auto']}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                    padding: '8px 12px',
                    color: 'hsl(var(--foreground))',
                    boxShadow: '0 4px 12px hsl(var(--foreground) / 0.08)',
                  }}
                  formatter={(value: number) => [`${value.toFixed(1)} ${activeOption.unit}`, activeOption.label]}
                  labelFormatter={(l) => `${l}`}
                  cursor={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1, strokeDasharray: '3 3' }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={activeOption.stroke}
                  strokeWidth={2}
                  fill="url(#forecast-main-grad)"
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 2, stroke: 'hsl(var(--card))', fill: activeOption.stroke }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
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
