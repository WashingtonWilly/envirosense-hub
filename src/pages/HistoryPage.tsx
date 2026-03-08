import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useMqtt } from '@/hooks/useMqtt';
import { SENSOR_CONFIGS } from '@/lib/sensor-config';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Download, History } from 'lucide-react';

const chartColors: Record<string, string> = {
  DHT22_T: 'hsl(15, 85%, 55%)',
  DHT22_H: 'hsl(200, 85%, 50%)',
  'MQ-4': 'hsl(30, 85%, 55%)',
  'MQ-135': 'hsl(170, 60%, 45%)',
  'MQ-2': 'hsl(280, 60%, 55%)',
  'MQ-7': 'hsl(350, 70%, 50%)',
};

const HistoryPage = () => {
  const { connected, alerts, getHistoricalData } = useMqtt();
  const [selectedSensor, setSelectedSensor] = useState('DHT22_T');
  const [points, setPoints] = useState(50);

  const data = useMemo(() => getHistoricalData(selectedSensor, points), [selectedSensor, points, getHistoricalData]);
  const config = SENSOR_CONFIGS[selectedSensor];
  const color = chartColors[selectedSensor] || 'hsl(var(--primary))';

  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedSensor}_data.json`;
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
    a.download = `${selectedSensor}_data.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout alertCount={alerts.length} connected={connected}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              Historial
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Exploración de datos históricos</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExportJSON}>
              <Download className="h-3.5 w-3.5 mr-1.5" /> JSON
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportCSV}>
              <Download className="h-3.5 w-3.5 mr-1.5" /> CSV
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Select value={selectedSensor} onValueChange={setSelectedSensor}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(SENSOR_CONFIGS).map(([id, cfg]) => (
                <SelectItem key={id} value={id}>{cfg.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={String(points)} onValueChange={(v) => setPoints(Number(v))}>
            <SelectTrigger className="w-[140px]">
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

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">
              {config?.name} ({config?.unit})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] md:h-[450px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="histGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={color} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="time" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    formatter={(value: number) => [`${value.toFixed(2)} ${config?.unit}`, config?.name]}
                  />
                  <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2} fill="url(#histGradient)" dot={false} activeDot={{ r: 4 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default HistoryPage;
