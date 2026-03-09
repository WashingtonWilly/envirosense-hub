import { forwardRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from 'recharts';
import { SENSOR_CONFIGS, getSensorStatus } from '@/lib/sensor-config';
import type { FirestoreDevice } from '@/lib/firestore-types';

const METRIC_FIELDS = [
  { key: 'temp', sensorId: 'DHT22_T', name: 'Temperatura', unit: '°C' },
  { key: 'hum', sensorId: 'DHT22_H', name: 'Humedad', unit: '%' },
  { key: 'ch4', sensorId: 'MQ-4', name: 'Metano (CH₄)', unit: 'ppm' },
  { key: 'c3h8', sensorId: 'MQ-2', name: 'Propano (C₃H₈)', unit: 'ppm' },
  { key: 'co', sensorId: 'MQ-7', name: 'CO', unit: 'ppm' },
  { key: 'aqi', sensorId: 'MQ-135', name: 'Calidad del Aire', unit: 'AQI' },
] as const;

interface ChartPoint {
  time: string;
  historico: number | null;
  prediccion: number | null;
}

interface PrintableReportProps {
  device: FirestoreDevice;
  chartData: ChartPoint[];
  fieldConfig: { key: string; name: string; unit: string };
  getMetricValue: (fieldKey: string, readingKey: string) => number;
}

function statusLabel(sensorId: string, value: number): string {
  const s = getSensorStatus(sensorId, value);
  return s === 'danger' ? 'ALERTA' : s === 'warning' ? 'ADVERTENCIA' : 'NORMAL';
}

const PrintableReport = forwardRef<HTMLDivElement, PrintableReportProps>(
  ({ device, chartData, fieldConfig, getMetricValue }, ref) => {
    const now = new Date();
    const readingKeys: Record<string, string> = {
      temp: 'temperature', hum: 'humidity', ch4: 'methane',
      c3h8: 'propane', co: 'co', aqi: 'air_quality',
    };

    return (
      <div ref={ref} className="hidden">
        <div style={{
          width: '794px', // A4 width at 96dpi
          padding: '40px 48px',
          fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
          color: '#111',
          backgroundColor: '#fff',
          lineHeight: 1.5,
        }}>
          {/* Header */}
          <div style={{ borderBottom: '2px solid #111', paddingBottom: '12px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h1 style={{ fontSize: '20px', fontWeight: 700, margin: 0, letterSpacing: '-0.3px' }}>
                  CONTROL AMBIENTAL AVÍCOLA
                </h1>
                <p style={{ fontSize: '13px', color: '#555', margin: '2px 0 0' }}>
                  GuardChicks — Sistema de Monitoreo Industrial
                </p>
              </div>
              <div style={{ textAlign: 'right', fontSize: '12px', color: '#444' }}>
                <div>Reporte generado:</div>
                <div style={{ fontWeight: 600 }}>
                  {now.toLocaleDateString('es-EC', { year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
                <div>{now.toLocaleTimeString('es-EC')}</div>
              </div>
            </div>
          </div>

          {/* Device info */}
          <div style={{ marginBottom: '24px' }}>
            <table style={{ fontSize: '13px', borderCollapse: 'collapse' }}>
              <tbody>
                <tr>
                  <td style={{ padding: '2px 16px 2px 0', fontWeight: 600, color: '#333' }}>Dispositivo:</td>
                  <td style={{ padding: '2px 0' }}>{device.name}</td>
                </tr>
                <tr>
                  <td style={{ padding: '2px 16px 2px 0', fontWeight: 600, color: '#333' }}>ID:</td>
                  <td style={{ padding: '2px 0', fontFamily: 'monospace', fontSize: '12px' }}>{device.id}</td>
                </tr>
                <tr>
                  <td style={{ padding: '2px 16px 2px 0', fontWeight: 600, color: '#333' }}>Ubicación:</td>
                  <td style={{ padding: '2px 0' }}>{device.city}</td>
                </tr>
                <tr>
                  <td style={{ padding: '2px 16px 2px 0', fontWeight: 600, color: '#333' }}>Estado:</td>
                  <td style={{ padding: '2px 0', textTransform: 'uppercase', fontWeight: 600 }}>{device.status}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Summary Table */}
          <h2 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Resumen de Condiciones Actuales
          </h2>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '13px',
            marginBottom: '32px',
          }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #111' }}>
                <th style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 700 }}>Parámetro</th>
                <th style={{ textAlign: 'right', padding: '8px 12px', fontWeight: 700 }}>Valor Actual</th>
                <th style={{ textAlign: 'center', padding: '8px 12px', fontWeight: 700 }}>Unidad</th>
                <th style={{ textAlign: 'center', padding: '8px 12px', fontWeight: 700 }}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {METRIC_FIELDS.map((f, i) => {
                const value = getMetricValue(f.key, readingKeys[f.key]);
                const status = statusLabel(f.sensorId, value);
                return (
                  <tr key={f.key} style={{ borderBottom: '1px solid #ddd' }}>
                    <td style={{ padding: '7px 12px' }}>{f.name}</td>
                    <td style={{ padding: '7px 12px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 600 }}>
                      {value.toFixed(f.key === 'hum' ? 0 : f.key === 'temp' ? 1 : 0)}
                    </td>
                    <td style={{ padding: '7px 12px', textAlign: 'center', color: '#555' }}>{f.unit}</td>
                    <td style={{
                      padding: '7px 12px',
                      textAlign: 'center',
                      fontWeight: 700,
                      fontSize: '11px',
                      letterSpacing: '0.5px',
                    }}>
                      {status}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Chart */}
          <h2 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Pronóstico: {fieldConfig.name} ({fieldConfig.unit})
          </h2>
          <div style={{ width: '100%', height: '280px', marginBottom: '24px' }}>
            {chartData.length > 1 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 8, right: 12, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ccc" vertical={false} />
                  <XAxis
                    dataKey="time"
                    tick={{ fontSize: 9, fill: '#333' }}
                    tickLine={false}
                    axisLine={{ stroke: '#999' }}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fontSize: 9, fill: '#333' }}
                    tickLine={false}
                    axisLine={{ stroke: '#999' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="historico"
                    name="Histórico"
                    stroke="#111"
                    strokeWidth={1.5}
                    dot={false}
                    connectNulls={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="prediccion"
                    name="Predicción"
                    stroke="#666"
                    strokeWidth={1.5}
                    strokeDasharray="5 5"
                    dot={false}
                    connectNulls={false}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={28}
                    wrapperStyle={{ fontSize: '10px', color: '#333' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#999', fontSize: '13px' }}>
                Sin datos de pronóstico disponibles
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{ borderTop: '1px solid #999', paddingTop: '10px', fontSize: '10px', color: '#777', display: 'flex', justifyContent: 'space-between' }}>
            <span>GuardChicks — Control Ambiental Avícola</span>
            <span>Generado automáticamente · {now.toISOString()}</span>
          </div>
        </div>
      </div>
    );
  }
);

PrintableReport.displayName = 'PrintableReport';

export default PrintableReport;
