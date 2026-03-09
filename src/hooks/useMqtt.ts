import { useState, useEffect, useCallback, useRef } from 'react';
import { SensorReading } from '@/lib/types';
import { SENSOR_CONFIGS, getSensorStatus } from '@/lib/sensor-config';

interface MqttState {
  connected: boolean;
  readings: Record<string, SensorReading>;
  history: SensorReading[];
  alerts: Array<{ id: string; sensor: string; level: string; value: number; timestamp: Date; message: string }>;
}

// Generate realistic sensor data
const generateReading = (sensorId: string, prev?: number): number => {
  const ranges: Record<string, [number, number]> = {
    DHT22_T: [18, 38],
    DHT22_H: [40, 90],
    'MQ-4': [100, 2000],
    'MQ-135': [50, 350],
    'MQ-2': [100, 3000],
    'MQ-7': [10, 80],
  };
  const [min, max] = ranges[sensorId] || [0, 100];
  if (prev !== undefined) {
    const delta = (Math.random() - 0.5) * (max - min) * 0.05;
    return Math.max(min, Math.min(max, prev + delta));
  }
  return min + Math.random() * (max - min) * 0.6;
};

export const useMqtt = () => {
  const [state, setState] = useState<MqttState>({
    connected: false,
    readings: {},
    history: [],
    alerts: [],
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const prevValues = useRef<Record<string, number>>({});

  useEffect(() => {
    // Simulate connection after a brief delay
    const connectTimeout = setTimeout(() => {
      setState(s => ({ ...s, connected: true }));
    }, 1500);

    // Generate initial readings
    const sensorIds = Object.keys(SENSOR_CONFIGS);
    const initial: Record<string, SensorReading> = {};
    sensorIds.forEach(id => {
      const val = generateReading(id);
      prevValues.current[id] = val;
      initial[id] = {
        sensor: id,
        value: parseFloat(val.toFixed(2)),
        unit: SENSOR_CONFIGS[id].unit,
        timestamp: new Date(),
        deviceId: 'ESP32-001',
      };
    });
    setState(s => ({ ...s, readings: initial }));

    // Simulate real-time updates
    intervalRef.current = setInterval(() => {
      const sensorId = sensorIds[Math.floor(Math.random() * sensorIds.length)];
      const val = generateReading(sensorId, prevValues.current[sensorId]);
      prevValues.current[sensorId] = val;

      const reading: SensorReading = {
        sensor: sensorId,
        value: parseFloat(val.toFixed(2)),
        unit: SENSOR_CONFIGS[sensorId].unit,
        timestamp: new Date(),
        deviceId: 'ESP32-001',
      };

      setState(s => {
        const newAlerts = [...s.alerts];
        const config = SENSOR_CONFIGS[sensorId];
        if (config) {
          const status = getSensorStatus(sensorId, val);
          if (status === 'danger') {
            newAlerts.unshift({
              id: `alert-${Date.now()}`,
              sensor: sensorId,
              level: 'danger',
              value: reading.value,
              timestamp: new Date(),
              message: `${config.name}: ${reading.value} ${config.unit} excede umbral crítico (${config.thresholds.dangerHigh} ${config.unit})`,
            });
          } else if (status === 'warning') {
            newAlerts.unshift({
              id: `alert-${Date.now()}`,
              sensor: sensorId,
              level: 'warning',
              value: reading.value,
              timestamp: new Date(),
              message: `${config.name}: ${reading.value} ${config.unit} excede umbral de advertencia (${config.thresholds.warningHigh} ${config.unit})`,
            });
          }
        }

        return {
          ...s,
          readings: { ...s.readings, [sensorId]: reading },
          history: [...s.history, reading].slice(-500),
          alerts: newAlerts.slice(0, 50),
        };
      });
    }, 2000);

    return () => {
      clearTimeout(connectTimeout);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Generate historical data for charts
  const getHistoricalData = useCallback((sensorId: string, points: number = 50) => {
    const data: Array<{ time: string; value: number; timestamp: number }> = [];
    let val = generateReading(sensorId);
    const now = Date.now();
    for (let i = points; i >= 0; i--) {
      val = generateReading(sensorId, val);
      const t = new Date(now - i * 60000 * 5);
      data.push({
        time: t.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
        value: parseFloat(val.toFixed(2)),
        timestamp: t.getTime(),
      });
    }
    return data;
  }, []);

  return { ...state, getHistoricalData };
};
