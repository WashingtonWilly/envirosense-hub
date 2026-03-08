import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useMqtt } from '@/hooks/useMqtt';
import { SENSOR_CONFIGS } from '@/lib/sensor-config';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Download, History, FileJson, FileSpreadsheet } from 'lucide-react';

const chartColors: Record<string, string> = {
  DHT22_T: 'hsl(12, 90%, 58%)',
  DHT22_H: 'hsl(205, 90%, 55%)',
  'MQ-4': 'hsl(32, 90%, 55%)',
  'MQ-135': 'hsl(168, 65%, 48%)',
  'MQ-2': 'hsl(275, 65%, 60%)',
  'MQ-7': 'hsl(348, 75%, 55%)',
};

const HistoryPage = () => {
  const { connected, alerts, getHistoricalData } = useMqtt();
  const [selectedSensor, setSelectedSensor] = useState('DHT22_T');
  const [points, setPoints] = useState(50);

  const data = useMemo(() => getHistoricalData(selectedSensor, points), [selectedSensor, points, getHistoricalData]);
  const config = SENSOR_CONFIGS[selectedSensor];
  const color = chartColors[selectedSensor] || 'hsl(42, 100%, 55%)';

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
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl p-2 bg-primary/10">
              <History className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold font-display text-foreground">Historial</h1>
              <p className="text-xs text-muted-foreground mt-0.5">Exploración y análisis de datos históricos</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleExportJSON}
              className="bg-secondary/50 border-border hover:bg-secondary text-muted-foreground hover:text-foreground"
            >
              <FileJson className="h-3.5 w-3.5 mr-1.5" /> JSON
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleExportCSV}
              className="bg-secondary/50 border-border hover:bg-secondary text-muted-foreground hover:text-foreground"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 mr-1.5" /> CSV
            </Button>
          </div>
        </div>

        {/* Filters */}
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

        {/* Chart */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3 border-b border-border/50">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold font-display">
                {config?.name}
              </CardTitle>
              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                {config?.unit}
              </span>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-[350px] md:h-[480px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <defs>
                    <linearGradient id="histGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={color} stopOpacity={0.25} />
                      <stop offset="100%" stopColor={color} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(225 18% 18%)" vertical={false} />
                  <XAxis dataKey="time" tick={{ fontSize: 10, fill: 'hsl(215 12% 50%)' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: 'hsl(215 12% 50%)' }} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(225 22% 11%)',
                      border: '1px solid hsl(225 18% 22%)',
                      borderRadius: '10px',
                      fontSize: '12px',
                      padding: '8px 12px',
                      color: 'hsl(210 20% 92%)',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                    }}
                    formatter={(value: number) => [`${value.toFixed(2)} ${config?.unit}`, config?.name]}
                    labelStyle={{ color: 'hsl(215 12% 50%)', fontSize: '11px' }}
                  />
                  <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2.5} fill="url(#histGradient)" dot={false} activeDot={{ r: 5, strokeWidth: 2, stroke: 'hsl(225 22% 11%)', fill: color }} />
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
