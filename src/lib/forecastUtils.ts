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
const DEFAULTS = { temp: 15, hum: 55, co: 10, ch4: 200, c3h8: 50, aqi: 30 };

const WEEK_DAYS = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];

// ── Helpers ─────────────────────────────────────────────────

/** Sinusoidal temperature variation: coldest at 5 AM, warmest at 2 PM */
function tempAtHour(baseTemp: number, hour: number): number {
  const variation = Math.sin((hour - 5) * (Math.PI / 12)) * 5;
  return Math.round((baseTemp + variation) * 10) / 10;
}

/** Dual-peak pollution multiplier for rush hours (7-9 AM, 18-20 PM) */
function pollutionMultiplier(hour: number): number {
  const morningPeak = Math.exp(-0.5 * ((hour - 8) / 1.2) ** 2);
  const eveningPeak = Math.exp(-0.5 * ((hour - 19) / 1.2) ** 2);
  const peak = Math.max(morningPeak, eveningPeak);
  return 1 + peak * (0.2 + Math.random() * 0.2) + (Math.random() - 0.5) * 0.05;
}

/** Humidity inverse-correlates loosely with temperature */
function humAtHour(baseHum: number, hour: number): number {
  const variation = -Math.sin((hour - 5) * (Math.PI / 12)) * 8;
  const noise = (Math.random() - 0.5) * 4;
  return Math.round(Math.max(10, Math.min(100, baseHum + variation + noise)));
}

/** Pick a weather icon based on temperature */
function weatherForTemp(baseTemp: number): string {
  if (baseTemp > 28) return 'sunny';
  if (baseTemp < 14) return 'cloudy';
  return 'partlyCloudy';
}

// ── Main generator (tomorrow only) ─────────────────────────

/**
 * Generates a single-day (tomorrow) hourly forecast extrapolated from the last real sensor reading.
 */
export function generateForecast(lastEntry?: HistoryEntry | null): DayForecast {
  const base = {
    temp: lastEntry?.temp ?? DEFAULTS.temp,
    hum: lastEntry?.hum ?? DEFAULTS.hum,
    co: lastEntry?.co ?? DEFAULTS.co,
    ch4: lastEntry?.ch4 ?? DEFAULTS.ch4,
    c3h8: lastEntry?.c3h8 ?? DEFAULTS.c3h8,
    aqi: lastEntry?.aqi ?? DEFAULTS.aqi,
  };

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const dayDrift = (Math.random() - 0.5) * 1.5;
  const dayBaseTemp = base.temp + dayDrift;

  const hourly: HourlyBlock[] = Array.from({ length: 24 }, (_, hour) => {
    const temp = tempAtHour(dayBaseTemp, hour);
    const hum = humAtHour(base.hum, hour);
    const coVal = Math.round(Math.max(0, base.co * pollutionMultiplier(hour)));
    const ch4Val = Math.round(Math.max(0, base.ch4 * pollutionMultiplier(hour)));
    const c3h8Val = Math.round(Math.max(0, base.c3h8 * pollutionMultiplier(hour)));
    const aqiVal = Math.round(Math.max(0, base.aqi * pollutionMultiplier(hour)));

    return { hour, temp, hum, co: coVal, ch4: ch4Val, c3h8: c3h8Val, aqiValue: aqiVal, aqi: getAqiLevel(aqiVal) };
  });

  const temps = hourly.map(h => h.temp);

  return {
    label: WEEK_DAYS[tomorrow.getDay()],
    date: `${tomorrow.getDate()}/${tomorrow.getMonth() + 1}`,
    weather: weatherForTemp(dayBaseTemp),
    high: Math.round(Math.max(...temps)),
    low: Math.round(Math.min(...temps)),
    hourly,
  };
}
