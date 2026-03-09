import type { HistoryEntry } from './firestore-types';
import type { DayForecast } from './forecastUtils';

export interface MergedPoint {
  time: string;
  historico: number | null;
  prediccion: number | null;
  isNow?: boolean;
}

type FieldKey = 'temp' | 'hum' | 'co' | 'ch4' | 'c3h8' | 'aqi';

/**
 * Merges real history data with forecast predictions into a unified timeline
 * for Recharts, with an "AHORA" pivot point connecting both series.
 */
export function mergeHistoryWithForecast(
  history: HistoryEntry[],
  forecast: DayForecast,
  field: FieldKey,
): MergedPoint[] {
  const points: MergedPoint[] = [];

  // 1. Historical points
  for (const entry of history) {
    const ts = new Date(entry.timestamp);
    points.push({
      time: ts.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' }),
      historico: entry[field] ?? null,
      prediccion: null,
    });
  }

  // 2. "AHORA" bridge point — last historical value connects to first prediction
  const lastHist = history.length > 0 ? history[history.length - 1] : null;
  const lastValue = lastHist ? (lastHist[field] ?? 0) : 0;

  points.push({
    time: 'AHORA',
    historico: lastValue,
    prediccion: lastValue,
    isNow: true,
  });

  // 3. Forecast points (tomorrow's 24 hours)
  for (const h of forecast.hourly) {
    const value = field === 'aqi' ? h.aqiValue : h[field as keyof typeof h] as number;
    points.push({
      time: `${String(h.hour).padStart(2, '0')}:00`,
      historico: null,
      prediccion: value ?? null,
    });
  }

  return points;
}
