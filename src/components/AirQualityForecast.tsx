import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Cloud, Sun, CloudRain, CloudSun, CloudDrizzle, Wind, BarChart3 } from 'lucide-react';

// ── AQI color scale (semáforo) ──────────────────────────────
const AQI_COLORS = {
  good:      'bg-[hsl(155,65%,42%)]',       // green  (success token)
  moderate:  'bg-[hsl(42,100%,50%)]',        // yellow (primary token)
  unhealthy1:'bg-[hsl(32,88%,50%)]',         // orange (sensor-methane)
  unhealthy2:'bg-[hsl(0,72%,51%)]',          // red    (destructive)
  hazardous: 'bg-[hsl(275,62%,55%)]',        // purple (sensor-propane)
} as const;

type AqiLevel = keyof typeof AQI_COLORS;

// ── Mock helpers ────────────────────────────────────────────
const WEEK_DAYS = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];

const WEATHER_ICONS: Record<string, React.ReactNode> = {
  sunny:    <Sun  className="h-7 w-7 text-[hsl(var(--primary))]" />,
  cloudy:   <Cloud className="h-7 w-7 text-muted-foreground" />,
  partlyCloudy: <CloudSun className="h-7 w-7 text-[hsl(var(--chart-3))]" />,
  drizzle:  <CloudDrizzle className="h-7 w-7 text-[hsl(var(--chart-3))]" />,
  rainy:    <CloudRain className="h-7 w-7 text-[hsl(var(--chart-3))]" />,
  windy:    <Wind className="h-7 w-7 text-muted-foreground" />,
};

interface HourlyBlock { hour: number; aqi: AqiLevel; temp: number; hum: number; co: number }
interface DayForecast {
  label: string;
  date: string;
  weather: keyof typeof WEATHER_ICONS;
  high: number;
  low: number;
  hourly: HourlyBlock[];
}

function randomAqi(): AqiLevel {
  const levels: AqiLevel[] = ['good', 'good', 'good', 'moderate', 'moderate', 'unhealthy1', 'unhealthy2', 'hazardous'];
  return levels[Math.floor(Math.random() * levels.length)];
}

function generateMockForecast(): DayForecast[] {
  const today = new Date();
  const weathers: (keyof typeof WEATHER_ICONS)[] = ['sunny', 'partlyCloudy', 'cloudy', 'sunny', 'drizzle', 'rainy', 'partlyCloudy'];

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const high = 22 + Math.round(Math.random() * 10);
    const low = high - 8 - Math.round(Math.random() * 4);

    const hourly: HourlyBlock[] = Array.from({ length: 12 }, (_, h) => ({
      hour: h * 2,
      aqi: randomAqi(),
      temp: low + Math.round(Math.random() * (high - low)),
      hum: 40 + Math.round(Math.random() * 45),
      co: Math.round(Math.random() * 60),
    }));

    return {
      label: i === 0 ? 'HOY' : WEEK_DAYS[d.getDay()],
      date: `${d.getDate()}/${d.getMonth() + 1}`,
      weather: weathers[i % weathers.length],
      high,
      low,
      hourly,
    };
  });
}

// ── Mini bar row ────────────────────────────────────────────
function MiniBarRow({
  values,
  max,
  colorClass,
}: {
  values: number[];
  max: number;
  colorClass: string;
}) {
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

  return (
    <div
      className={`min-w-[130px] flex-1 flex flex-col gap-3 px-3 py-4 ${
        !isFirst ? 'border-l border-border/60' : ''
      }`}
    >
      {/* Header */}
      <div className="flex flex-col items-center gap-1.5 text-center">
        <span className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground">
          {day.label}{' '}
          <span className="font-normal text-muted-foreground/70">{day.date}</span>
        </span>
        {WEATHER_ICONS[day.weather]}
        <div className="flex items-baseline gap-1">
          <span className="text-sm font-bold text-foreground">{day.high}°</span>
          <span className="text-[11px] text-muted-foreground">/</span>
          <span className="text-xs text-muted-foreground">{day.low}°</span>
        </div>
      </div>

      {/* AQI color blocks */}
      <div className="space-y-1">
        <span className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground/70">
          Variación AQI
        </span>
        <div className="flex gap-[1.5px] rounded-md overflow-hidden">
          {day.hourly.map((h, i) => (
            <div key={i} className={`flex-1 h-3 ${AQI_COLORS[h.aqi]}`} />
          ))}
        </div>
      </div>

      {/* Mini charts */}
      <div className="space-y-2.5 mt-1">
        <div className="space-y-0.5">
          <span className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground/70">
            Temp °C
          </span>
          <MiniBarRow
            values={day.hourly.map((h) => h.temp)}
            max={maxTemp}
            colorClass="bg-[hsl(var(--sensor-temp))]/80"
          />
        </div>
        <div className="space-y-0.5">
          <span className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground/70">
            Humedad %
          </span>
          <MiniBarRow
            values={day.hourly.map((h) => h.hum)}
            max={maxHum}
            colorClass="bg-[hsl(var(--sensor-humidity))]/70"
          />
        </div>
        <div className="space-y-0.5">
          <span className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground/70">
            CO ppm
          </span>
          <MiniBarRow
            values={day.hourly.map((h) => h.co)}
            max={maxCo}
            colorClass="bg-[hsl(var(--sensor-co))]/60"
          />
        </div>
      </div>
    </div>
  );
}

// ── Main component ──────────────────────────────────────────
export function AirQualityForecast() {
  const forecast = useMemo(() => generateMockForecast(), []);

  return (
    <Card className="bg-card border-border overflow-hidden">
      <CardHeader className="pb-3 border-b border-border/50">
        <div className="flex items-center gap-2.5">
          <div className="rounded-lg p-1.5 bg-[hsl(var(--sensor-air))]/10">
            <BarChart3 className="h-4 w-4 text-[hsl(var(--sensor-air))]" />
          </div>
          <CardTitle className="text-sm font-semibold font-display">
            Análisis y Pronóstico
          </CardTitle>
          <span className="ml-auto text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
            7 días
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="w-full">
          <div className="flex min-w-[910px]">
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
