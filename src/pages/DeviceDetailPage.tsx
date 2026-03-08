import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useMqtt } from '@/hooks/useMqtt';
import { SENSOR_CONFIGS } from '@/lib/sensor-config';
import { SMART_DEVICES } from '@/lib/smart-city-data';
import { SensorGrid } from '@/components/SensorCards';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowLeft, Cpu, Wifi, WifiOff, AlertTriangle, MapPin, FileJson, FileSpreadsheet, Zap, Radio } from 'lucide-react';

const chartHslColors: Record<string, string> = {
  DHT22_T: 'hsl(12, 90%, 56%)',
  DHT22_H: 'hsl(205, 89%, 53%)',
  'MQ-4': 'hsl(32, 89%, 52%)',
  'MQ-135': 'hsl(168, 63%, 45%)',
  'MQ-2': 'hsl(275, 63%, 57%)',
  'MQ-7': 'hsl(348, 73%, 52%)',
};

const DeviceDetailPage = () => {
  const { deviceId } = useParams<{ deviceId: string }>();
  const { connected, readings, history, getHistoricalData } = useMqtt();
  const [selectedSensor, setSelectedSensor] = useState('DHT22_T');
  const [points, setPoints] = useState(50);

  const device = SMART_DEVICES.find(d => d.id === deviceId);

  const data = useMemo(() => getHistoricalData(selectedSensor, points), [selectedSensor, points, getHistoricalData]);
  const config = SENSOR_CONFIGS[selectedSensor];
  const color = chartHslColors[selectedSensor] || 'hsl(42, 100%, 52%)';

  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${deviceId}_${selectedSensor}_data.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    const header = 'time,value\n';
    const rows = data.map(d => `${d.time},${d.value}`).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${deviceId}_${selectedSensor}_data.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Filter device-specific readings from live feed
  const deviceHistory = history.filter(r => r.deviceId === (device?.id || 'ESP32-001'));

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
                  <span>{device.cityName}</span>
                </div>
                <span>•</span>
                <span>{device.sensorType}</span>
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

        {/* Live sensor cards */}
        <SensorGrid readings={readings} />

        {/* Chart controls */}
        <div className="flex flex-wrap gap-3">
          <Select value={selectedSensor} onValueChange={setSelectedSensor}>
            <SelectTrigger className="w-[200px] bg-secondary/50 border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(SENSOR_CONFIGS).map(([id, cfg]) => (
                <SelectItem key={id} value={id}>{cfg.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={String(points)} onValueChange={(v) => setPoints(Number(v))}>
            <SelectTrigger className="w-[150px] bg-secondary/50 border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="20">Última hora</SelectItem>
              <SelectItem value="50">6 horas</SelectItem>
              <SelectItem value="100">24 horas</SelectItem>
              <SelectItem value="200">7 días</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Historical chart */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3 border-b border-border/50">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold font-display">{config?.name} — Historial</CardTitle>
              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">{config?.unit}</span>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-[350px] md:h-[420px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <defs>
                    <linearGradient id="detailGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={color} stopOpacity={0.25} />
                      <stop offset="100%" stopColor={color} stopOpacity={0.02} />
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
                    formatter={(value: number) => [`${value.toFixed(2)} ${config?.unit}`, config?.name]}
                  />
                  <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2.5} fill="url(#detailGradient)" dot={false} activeDot={{ r: 5, strokeWidth: 2, stroke: 'hsl(var(--card))', fill: color }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Live feed */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3 border-b border-border/50">
            <div className="flex items-center gap-2.5">
              <div className="rounded-lg p-1.5 bg-success/10">
                <Radio className="h-4 w-4 text-success" />
              </div>
              <CardTitle className="text-sm font-semibold font-display">Feed en Vivo</CardTitle>
              <div className="h-1.5 w-1.5 rounded-full bg-success animate-pulse-glow ml-1" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[300px]">
              <div className="divide-y divide-border/50">
                {deviceHistory.slice().reverse().slice(0, 30).map((r, i) => {
                  const sConfig = SENSOR_CONFIGS[r.sensor];
                  return (
                    <div key={i} className="flex items-center justify-between px-4 py-3 hover:bg-secondary/30 text-sm transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-2 rounded-full bg-primary/60" />
                        <span className="font-medium text-card-foreground text-[13px]">{sConfig?.name || r.sensor}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-mono text-[13px] font-semibold text-card-foreground tabular-nums">
                          {r.value.toFixed(2)} <span className="text-muted-foreground font-normal">{r.unit}</span>
                        </span>
                        <span className="text-[11px] text-muted-foreground font-mono w-20 text-right tabular-nums">
                          {r.timestamp.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default DeviceDetailPage;
