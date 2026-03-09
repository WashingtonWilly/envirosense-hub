import type { HistoryEntry } from './firestore-types';

// ── AQI thresholds ──────────────────────────────────────────
export type AqiLevel = 'good' | 'moderate' | 'unhealthy1' | 'unhealthy2' | 'hazardous';

export function getAqiLevel(aqi: number): AqiLevel {
  if (aqi < 50) return 'good';
  if (aqi < 100) return 'moderate';
  if (aqi < 150) return 'unhealthy1';
  if (aqi < 200) return 'unhealthy2';
  return 'hazardous';
}

// ── Types ───────────────────────────────────────────────────
export interface HourlyBlock {
  hour: number;
  aqi: AqiLevel;
  aqiValue: number;
  temp: number;
  hum: number;
  co: number;
  ch4: number;
  c3h8: number;
}

export interface DayForecast {
  label: string;
  date: string;
  weather: string;
  high: number;
  low: number;
  hourly: HourlyBlock[];
}

// ── Defaults when no real data ──────────────────────────────
const DEFAULTS = { temp: 15, hum: 55, co: 10, aqi: 30 };

const WEEK_DAYS = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];

// ── Helpers ─────────────────────────────────────────────────

/** Sinusoidal temperature variation: coldest at 5 AM, warmest at 2 PM */
function tempAtHour(baseTemp: number, hour: number): number {
  // sin peaks at hour=14 (2 PM), troughs at hour=5 (5 AM)
  const variation = Math.sin((hour - 5) * (Math.PI / 12)) * 5;
  return Math.round((baseTemp + variation) * 10) / 10;
}

/** Dual-peak pollution multiplier for rush hours (7-9 AM, 18-20 PM) */
function pollutionMultiplier(hour: number): number {
  const morningPeak = Math.exp(-0.5 * ((hour - 8) / 1.2) ** 2); // gaussian ~7-9
  const eveningPeak = Math.exp(-0.5 * ((hour - 19) / 1.2) ** 2); // gaussian ~18-20
  const peak = Math.max(morningPeak, eveningPeak);
  // 0-40% increase during peaks + small noise
  return 1 + peak * (0.2 + Math.random() * 0.2) + (Math.random() - 0.5) * 0.05;
}

/** Humidity inverse-correlates loosely with temperature */
function humAtHour(baseHum: number, hour: number): number {
  const variation = -Math.sin((hour - 5) * (Math.PI / 12)) * 8;
  const noise = (Math.random() - 0.5) * 4;
  return Math.round(Math.max(10, Math.min(100, baseHum + variation + noise)));
}

/** Pick a weather icon based on day index (deterministic-ish) */
function weatherForDay(dayIndex: number, baseTemp: number): string {
  if (baseTemp > 28) return dayIndex % 3 === 0 ? 'partlyCloudy' : 'sunny';
  if (baseTemp < 14) return dayIndex % 2 === 0 ? 'cloudy' : 'drizzle';
  const options = ['sunny', 'partlyCloudy', 'cloudy', 'partlyCloudy', 'sunny'];
  return options[dayIndex % options.length];
}

// ── Main generator ──────────────────────────────────────────

/**
 * Generates a 5-day hourly forecast extrapolated from the last real sensor reading.
 * If `lastEntry` is null/undefined, falls back to safe defaults.
 */
export function generateForecast(lastEntry?: HistoryEntry | null): DayForecast[] {
  const base = {
    temp: lastEntry?.temp ?? DEFAULTS.temp,
    hum: lastEntry?.hum ?? DEFAULTS.hum,
    co: lastEntry?.co ?? DEFAULTS.co,
    aqi: lastEntry?.aqi ?? DEFAULTS.aqi,
  };

  const today = new Date();

  return Array.from({ length: 5 }, (_, dayIdx) => {
    const d = new Date(today);
    d.setDate(d.getDate() + dayIdx);

    // Small daily drift (±2°C per day, random walk)
    const dayDrift = (Math.random() - 0.5) * 2 * (dayIdx + 1) * 0.3;
    const dayBaseTemp = base.temp + dayDrift;

    const hourly: HourlyBlock[] = Array.from({ length: 24 }, (_, hour) => {
      const temp = tempAtHour(dayBaseTemp, hour);
      const hum = humAtHour(base.hum, hour);
      const coVal = Math.round(Math.max(0, base.co * pollutionMultiplier(hour)));
      const aqiVal = Math.round(Math.max(0, base.aqi * pollutionMultiplier(hour)));

      return {
        hour,
        temp,
        hum,
        co: coVal,
        aqiValue: aqiVal,
        aqi: getAqiLevel(aqiVal),
      };
    });

    const temps = hourly.map(h => h.temp);
    const high = Math.round(Math.max(...temps));
    const low = Math.round(Math.min(...temps));

    return {
      label: dayIdx === 0 ? 'HOY' : WEEK_DAYS[d.getDay()],
      date: `${d.getDate()}/${d.getMonth() + 1}`,
      weather: weatherForDay(dayIdx, dayBaseTemp),
      high,
      low,
      hourly,
    };
  });
}
