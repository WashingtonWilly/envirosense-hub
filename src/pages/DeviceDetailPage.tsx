import { useState, useMemo, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SensorCard } from '@/components/SensorCards';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowLeft, Cpu, Wifi, WifiOff, AlertTriangle, MapPin, FileJson, FileSpreadsheet, Radio, Loader2 } from 'lucide-react';
import { getDevice, onReadingsSnapshot } from '@/lib/firestore-service';
import type { FirestoreDevice, FirestoreReading } from '@/lib/firestore-types';
import type { SensorReading } from '@/lib/types';

// Maps Firestore reading keys to SENSOR_CONFIGS sensor IDs
const FIELD_TO_SENSOR: Record<string, string> = {
  temperature: 'DHT22_T',
  humidity: 'DHT22_H',
  methane: 'MQ-4',
  air_quality: 'MQ-135',
  propane: 'MQ-2',
  co: 'MQ-7',
};

const READING_FIELDS = [
  { key: 'temperature', name: 'Temperatura', unit: '°C', color: 'hsl(12, 90%, 56%)' },
  { key: 'humidity', name: 'Humedad', unit: '%', color: 'hsl(205, 89%, 53%)' },
  { key: 'methane', name: 'Metano (CH₄)', unit: 'ppm', color: 'hsl(32, 89%, 52%)' },
  { key: 'propane', name: 'Propano', unit: 'ppm', color: 'hsl(275, 63%, 57%)' },
  { key: 'co', name: 'CO', unit: 'ppm', color: 'hsl(348, 73%, 52%)' },
  { key: 'air_quality', name: 'Calidad del Aire', unit: 'AQI', color: 'hsl(168, 63%, 45%)' },
] as const;

const DeviceDetailPage = () => {
  const { deviceId } = useParams<{ deviceId: string }>();
  const [device, setDevice] = useState<FirestoreDevice | null>(null);
  const [readings, setReadings] = useState<FirestoreReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedField, setSelectedField] = useState<string>('temperature');
  const [maxPoints, setMaxPoints] = useState(50);

  useEffect(() => {
    if (!deviceId) return;
    getDevice(deviceId).then(d => {
      setDevice(d);
      setLoading(false);
    });
  }, [deviceId]);

  useEffect(() => {
    if (!deviceId) return;
    const unsub = onReadingsSnapshot(deviceId, maxPoints, (data) => {
      setReadings(data);
    });
    return unsub;
  }, [deviceId, maxPoints]);

  const fieldConfig = READING_FIELDS.find(f => f.key === selectedField) || READING_FIELDS[0];

  const chartData = useMemo(() => {
    return [...readings].reverse().map(r => ({
      time: r.timestamp.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' }),
      value: r[selectedField as keyof FirestoreReading] as number,
    }));
  }, [readings, selectedField]);

  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify(readings, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${deviceId}_readings.json`; a.click();
    URL.revokeObjectURL(url);
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

  if (loading) {
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

        {/* Latest reading cards */}
        {latestReading && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {READING_FIELDS.map(f => (
              <Card key={f.key} className="bg-card border-border">
                <CardContent className="p-4 text-center">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{f.name}</p>
                  <p className="text-xl font-bold font-display text-card-foreground">
                    {(latestReading[f.key as keyof FirestoreReading] as number)?.toFixed(1)}
                  </p>
                  <p className="text-[10px] text-muted-foreground">{f.unit}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Chart controls */}
        <div className="flex flex-wrap gap-3">
          <Select value={selectedField} onValueChange={setSelectedField}>
            <SelectTrigger className="w-[200px] bg-secondary/50 border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {READING_FIELDS.map(f => (
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
      </div>
    </DashboardLayout>
  );
};

export default DeviceDetailPage;
