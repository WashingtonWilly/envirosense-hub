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

// ── Defaults (typical poultry house baseline) ──────────────
const DEFAULTS = { temp: 28, hum: 65, co: 5, ch4: 150, c3h8: 30, aqi: 45 };

const WEEK_DAYS = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];

// ── Helpers: smooth noise ──────────────────────────────────
function noise(amplitude = 1): number {
  return (Math.random() - 0.5) * 2 * amplitude;
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

// ── Poultry-house micro-climate curves ─────────────────────

/**
 * Temperature: greenhouse effect.
 * Coldest ~05:00, peak ~14:00 from solar gain + animal body heat.
 * Smooth sinusoidal curve shifted to peak at 14h.
 */
function tempAtHour(baseTemp: number, hour: number): number {
  // sin peaks at π/2; we want peak at hour 14 → shift by (14 - 6) = 8
  const variation = Math.sin(((hour - 2) / 24) * 2 * Math.PI - Math.PI / 2) * 4.5;
  return Math.round((baseTemp + variation + noise(0.3)) * 10) / 10;
}

/**
 * Humidity: inverse of temperature.
 * High at night (closed house, respiration) → drops midday (ventilation on).
 */
function humAtHour(baseHum: number, hour: number): number {
  const variation = -Math.sin(((hour - 2) / 24) * 2 * Math.PI - Math.PI / 2) * 12;
  return Math.round(clamp(baseHum + variation + noise(1.5), 30, 98));
}

/**
 * Heater factor: gas brooders run during cold hours (00-06, 20-23).
 * Returns 0-1 multiplier: 1 = full heat, 0 = heaters off.
 */
function heaterFactor(hour: number): number {
  // Night heating: smooth bell centred at 3 AM (width ~5h)
  const nightBell = Math.exp(-0.5 * ((hour - 3) / 3) ** 2);
  // Evening heating: smooth bell centred at 21h
  const eveningBell = Math.exp(-0.5 * ((hour - 21) / 2) ** 2);
  return clamp(Math.max(nightBell, eveningBell) + noise(0.03), 0, 1);
}

/**
 * Ventilation/extractor factor: extractors ON from ~09:00 to ~18:00.
 * Returns 0-1: 1 = full ventilation, 0 = extractors off.
 * Uses a smooth sigmoid-like curve.
 */
function ventilationFactor(hour: number): number {
  // Sigmoid ON at ~8 and OFF at ~19
  const onRamp = 1 / (1 + Math.exp(-(hour - 8.5) * 2));
  const offRamp = 1 / (1 + Math.exp((hour - 18.5) * 2));
  return clamp(onRamp * offRamp + noise(0.02), 0, 1);
}

/**
 * Methane accumulation: builds up overnight (faeces, no extractors).
 * Peak just before dawn (~06:00). Drops fast once extractors kick in.
 */
function ch4AtHour(baseCh4: number, hour: number): number {
  // Accumulation curve: peaks at 6 AM
  const accumulation = Math.exp(-0.5 * ((hour - 6) / 3.5) ** 2);
  // Ventilation suppression during the day
  const vent = ventilationFactor(hour);
  const factor = accumulation * (1 - vent * 0.85) + 0.1;
  return Math.round(Math.max(5, baseCh4 * factor + noise(8)));
}

/**
 * Propane: directly tied to gas heater operation.
 * High during heating hours, near-zero when heaters off.
 */
function c3h8AtHour(baseC3h8: number, hour: number): number {
  const heater = heaterFactor(hour);
  const value = baseC3h8 * (heater * 0.9 + 0.05) + noise(2);
  return Math.round(Math.max(0, value));
}

/**
 * CO: slight elevation from gas combustion during heating,
 * otherwise very low. Lower amplitude than propane.
 */
function coAtHour(baseCo: number, hour: number): number {
  const heater = heaterFactor(hour);
  const value = baseCo * (heater * 0.7 + 0.15) + noise(0.8);
  return Math.round(Math.max(0, value));
}

/**
 * AQI: composite driven by methane accumulation + some heater contribution.
 * Good during ventilated daytime, degrades at night.
 */
function aqiAtHour(baseAqi: number, hour: number): number {
  const ch4Effect = Math.exp(-0.5 * ((hour - 6) / 3.5) ** 2) * 0.6;
  const heaterEffect = heaterFactor(hour) * 0.3;
  const vent = ventilationFactor(hour);
  const factor = (ch4Effect + heaterEffect) * (1 - vent * 0.7) + 0.15;
  return Math.round(clamp(baseAqi * (1 + factor * 2.5) + noise(4), 10, 350));
}

/** Pick weather icon based on temperature */
function weatherForTemp(baseTemp: number): string {
  if (baseTemp > 30) return 'sunny';
  if (baseTemp < 18) return 'cloudy';
  return 'partlyCloudy';
}

// ── Main generator (tomorrow only) ─────────────────────────

/**
 * Generates a single-day (tomorrow) hourly forecast extrapolated from the
 * last real sensor reading, simulating poultry-house micro-climate behaviour.
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

  // Small day-to-day drift anchored to real data
  const dayDrift = noise(0.8);
  const dayBaseTemp = base.temp + dayDrift;

  const hourly: HourlyBlock[] = Array.from({ length: 24 }, (_, hour) => {
    const temp = tempAtHour(dayBaseTemp, hour);
    const hum = humAtHour(base.hum, hour);
    const co = coAtHour(base.co, hour);
    const ch4 = ch4AtHour(base.ch4, hour);
    const c3h8 = c3h8AtHour(base.c3h8, hour);
    const aqiValue = aqiAtHour(base.aqi, hour);

    return { hour, temp, hum, co, ch4, c3h8, aqiValue, aqi: getAqiLevel(aqiValue) };
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
