import { useState, useMemo, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useParams, Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MetricCard, MetricCardSkeleton } from '@/components/MetricCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from 'recharts';
import { ArrowLeft, Cpu, Wifi, WifiOff, AlertTriangle, MapPin, FileJson, FileSpreadsheet, Radio, Loader2 } from 'lucide-react';
import { generateForecast } from '@/lib/forecastUtils';
import { mergeHistoryWithForecast } from '@/lib/mergeChartData';
import { onDeviceSnapshot, onReadingsSnapshot } from '@/lib/firestore-service';
import type { FirestoreDevice, FirestoreReading } from '@/lib/firestore-types';
import { saveAsJSON } from '@/lib/exportUtils';
import { AirQualityForecast } from '@/components/AirQualityForecast';

// Maps new device fields to SENSOR_CONFIGS sensor IDs
const FIELD_TO_SENSOR: Record<string, string> = {
  temp: 'DHT22_T',
  hum: 'DHT22_H',
  ch4: 'MQ-4',
  aqi: 'MQ-135',
  c3h8: 'MQ-2',
  co: 'MQ-7',
};

// Maps legacy reading fields to SENSOR_CONFIGS sensor IDs
const READING_FIELD_TO_SENSOR: Record<string, string> = {
  temperature: 'DHT22_T',
  humidity: 'DHT22_H',
  methane: 'MQ-4',
  air_quality: 'MQ-135',
  propane: 'MQ-2',
  co: 'MQ-7',
};

const METRIC_FIELDS = [
  { key: 'temp', readingKey: 'temperature', name: 'Temperatura', unit: '°C', color: 'hsl(12, 90%, 56%)' },
  { key: 'hum', readingKey: 'humidity', name: 'Humedad', unit: '%', color: 'hsl(205, 89%, 53%)' },
  { key: 'ch4', readingKey: 'methane', name: 'Metano (CH₄)', unit: 'ppm', color: 'hsl(32, 89%, 52%)' },
  { key: 'c3h8', readingKey: 'propane', name: 'Propano (C₃H₈)', unit: 'ppm', color: 'hsl(275, 63%, 57%)' },
  { key: 'co', readingKey: 'co', name: 'CO', unit: 'ppm', color: 'hsl(348, 73%, 52%)' },
  { key: 'aqi', readingKey: 'air_quality', name: 'Calidad del Aire', unit: 'AQI', color: 'hsl(168, 63%, 45%)' },
] as const;

const DeviceDetailPage = () => {
  const { toast } = useToast();
  const { deviceId } = useParams<{ deviceId: string }>();
  const [device, setDevice] = useState<FirestoreDevice | null>(null);
  const [readings, setReadings] = useState<FirestoreReading[]>([]);
  const [deviceLoading, setDeviceLoading] = useState(true);
  const [readingsLoading, setReadingsLoading] = useState(true);
  const [selectedField, setSelectedField] = useState<string>('temp');
  const [maxPoints, setMaxPoints] = useState(50);

  // Real-time device document listener
  useEffect(() => {
    if (!deviceId) return;
    const unsub = onDeviceSnapshot(deviceId, (d) => {
      setDevice(d);
      setDeviceLoading(false);
    });
    return unsub;
  }, [deviceId]);

  // Real-time readings listener
  useEffect(() => {
    if (!deviceId) return;
    let first = true;
    const unsub = onReadingsSnapshot(deviceId, maxPoints, (data) => {
      setReadings(data);
      if (first) { setReadingsLoading(false); first = false; }
    });
    return unsub;
  }, [deviceId, maxPoints]);

  const fieldConfig = METRIC_FIELDS.find(f => f.key === selectedField) || METRIC_FIELDS[0];

  // Chart data from device.history (already ordered oldest→newest)
  const chartData = useMemo(() => {
    const history = device?.history || [];
    return history.map((entry) => {
      // timestamp is a number (epoch ms) per HistoryEntry type
      const ts = new Date(entry.timestamp);
      
      return {
        time: ts.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' }),
        value: (entry[fieldConfig.key as keyof typeof entry] as number) || 0,
      };
    });
  }, [device?.history, fieldConfig.key]);

  const handleExportJSON = () => {
    const history = device?.history || [];
    if (history.length === 0) {
      toast({ title: 'Sin datos', description: 'No hay historial disponible para exportar.', variant: 'destructive' });
      return;
    }
    saveAsJSON(history, `lecturas_${device?.name || deviceId}`);
  };

  const handleExportCSV = () => {
    const header = 'timestamp,temperature,humidity,methane,propane,co,air_quality\n';
    const rows = readings.map(r => `${r.timestamp.toISOString()},${r.temperature},${r.humidity},${r.methane},${r.propane},${r.co},${r.air_quality}`).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${deviceId}_readings.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  // Full page loading — device not yet resolved
  if (deviceLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!device) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-[60vh] text-center">
          <Cpu className="h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-lg font-semibold text-foreground mb-2">Dispositivo no encontrado</h2>
          <Link to="/devices">
            <Button variant="outline" className="border-border">
              <ArrowLeft className="h-4 w-4 mr-2" /> Volver a Dispositivos
            </Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const statusIcon = device.status === 'online'
    ? <Wifi className="h-4 w-4 text-success" />
    : device.status === 'warning'
    ? <AlertTriangle className="h-4 w-4 text-warning" />
    : <WifiOff className="h-4 w-4 text-destructive" />;

  const latestReading = readings[0];

  // Helper to get metric value (prefer device doc, fallback to latest reading)
  const getMetricValue = (fieldKey: string, readingKey: string): number => {
    // First try device document fields
    const deviceValue = device[fieldKey as keyof FirestoreDevice];
    if (typeof deviceValue === 'number') return deviceValue;
    // Fallback to latest reading
    if (latestReading) {
      const readingValue = latestReading[readingKey as keyof FirestoreReading];
      if (typeof readingValue === 'number') return readingValue;
    }
    return 0;
  };

  // Get previous value from history or readings
  const getPreviousValue = (fieldKey: string, readingKey: string): number | undefined => {
    // Try history array first
    if (device.history && device.history.length >= 2) {
      const prev = device.history[device.history.length - 2];
      const val = prev[fieldKey as keyof typeof prev];
      if (typeof val === 'number') return val;
    }
    // Fallback to readings
    const previousReading = readings[1];
    if (previousReading) {
      const val = previousReading[readingKey as keyof FirestoreReading];
      if (typeof val === 'number') return val;
    }
    return undefined;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/devices">
              <Button variant="ghost" size="sm" className="h-9 w-9 p-0 text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className={`rounded-xl p-2.5 ${device.status === 'online' ? 'bg-success/10' : device.status === 'warning' ? 'bg-warning/10' : 'bg-destructive/10'}`}>
              <Cpu className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-bold font-display text-foreground">{device.name}</h1>
                <Badge className={`text-[10px] font-semibold ${device.status === 'online' ? 'bg-success/15 text-success border-success/20' : device.status === 'warning' ? 'bg-warning/15 text-warning border-warning/20' : 'bg-destructive/15 text-destructive border-destructive/20'}`}>
                  {statusIcon}
                  <span className="ml-1">{device.status}</span>
                </Badge>
              </div>
              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                <span className="font-mono">{device.id}</span>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  <span>{device.city}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExportJSON} className="bg-secondary/50 border-border hover:bg-secondary text-muted-foreground hover:text-foreground">
              <FileJson className="h-3.5 w-3.5 mr-1.5" /> JSON
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportCSV} className="bg-secondary/50 border-border hover:bg-secondary text-muted-foreground hover:text-foreground">
              <FileSpreadsheet className="h-3.5 w-3.5 mr-1.5" /> CSV
            </Button>
          </div>
        </div>

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          {METRIC_FIELDS.map((f, i) => {
            const sensorId = FIELD_TO_SENSOR[f.key];
            const value = getMetricValue(f.key, f.readingKey);
            const previousValue = getPreviousValue(f.key, f.readingKey);
            const timestamp = device?.last_updated || device?.lastSeen || new Date();

            return (
              <MetricCard
                key={f.key}
                sensorId={sensorId}
                value={value}
                unit={f.unit}
                timestamp={timestamp}
                previousValue={previousValue}
                history={device?.history || []}
                delay={i * 60}
              />
            );
          })}
        </div>

        {/* Chart controls */}
        <div className="flex flex-wrap gap-3">
          <Select value={selectedField} onValueChange={setSelectedField}>
            <SelectTrigger className="w-[200px] bg-secondary/50 border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {METRIC_FIELDS.map(f => (
                <SelectItem key={f.key} value={f.key}>{f.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={String(maxPoints)} onValueChange={(v) => setMaxPoints(Number(v))}>
            <SelectTrigger className="w-[150px] bg-secondary/50 border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="20">Últimas 20</SelectItem>
              <SelectItem value="50">Últimas 50</SelectItem>
              <SelectItem value="100">Últimas 100</SelectItem>
              <SelectItem value="200">Últimas 200</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Chart */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3 border-b border-border/50">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold font-display">{fieldConfig.name} — Historial</CardTitle>
              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">{fieldConfig.unit}</span>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-[350px] md:h-[420px]">
              {chartData.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                  No hay lecturas disponibles
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                    <defs>
                      <linearGradient id="detailGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={fieldConfig.color} stopOpacity={0.25} />
                        <stop offset="100%" stopColor={fieldConfig.color} stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--chart-grid))" vertical={false} />
                    <XAxis dataKey="time" tick={{ fontSize: 10, fill: 'hsl(var(--chart-text))' }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--chart-text))' }} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--chart-tooltip-bg))',
                        border: '1px solid hsl(var(--chart-tooltip-border))',
                        borderRadius: '10px',
                        fontSize: '12px',
                        padding: '8px 12px',
                        color: 'hsl(var(--chart-tooltip-text))',
                      }}
                      formatter={(value: number) => [`${value?.toFixed(2)} ${fieldConfig.unit}`, fieldConfig.name]}
                    />
                    <Area type="monotone" dataKey="value" stroke={fieldConfig.color} strokeWidth={2.5} fill="url(#detailGradient)" dot={false} activeDot={{ r: 5, strokeWidth: 2, stroke: 'hsl(var(--card))', fill: fieldConfig.color }} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Readings table */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3 border-b border-border/50">
            <div className="flex items-center gap-2.5">
              <div className="rounded-lg p-1.5 bg-success/10">
                <Radio className="h-4 w-4 text-success" />
              </div>
              <CardTitle className="text-sm font-semibold font-display">Lecturas Recientes</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[300px]">
              <div className="divide-y divide-border/50">
                {readings.slice(0, 30).map((r, i) => (
                  <div key={r.id || i} className="flex items-center justify-between px-4 py-3 hover:bg-secondary/30 text-sm transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-primary/60" />
                      <span className="text-[11px] text-muted-foreground font-mono">
                        {r.timestamp.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[12px] font-mono tabular-nums">
                      <span title="Temperatura">{r.temperature.toFixed(1)}°C</span>
                      <span title="Humedad">{r.humidity.toFixed(0)}%</span>
                      <span title="CH₄">{r.methane.toFixed(0)}</span>
                      <span title="CO">{r.co.toFixed(0)}</span>
                      <span title="AQI">{r.air_quality.toFixed(0)}</span>
                    </div>
                  </div>
                ))}
                {readings.length === 0 && (
                  <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
                    Sin lecturas disponibles
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Análisis y Pronóstico */}
        <AirQualityForecast history={device?.history} />
      </div>
    </DashboardLayout>
  );
};

export default DeviceDetailPage;
