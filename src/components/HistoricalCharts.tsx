import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';

const chartColors: Record<string, string> = {
  DHT22_T: 'hsl(var(--sensor-temp))',
  DHT22_H: 'hsl(var(--sensor-humidity))',
  'MQ-4': 'hsl(var(--sensor-methane))',
  'MQ-135': 'hsl(var(--sensor-air))',
  'MQ-2': 'hsl(var(--sensor-propane))',
  'MQ-7': 'hsl(var(--sensor-co))',
};

// Static HSL for SVG gradients (can't use CSS vars in stops easily)
const chartHslColors: Record<string, string> = {
  DHT22_T: 'hsl(12, 90%, 56%)',
  DHT22_H: 'hsl(205, 89%, 53%)',
  'MQ-135': 'hsl(168, 63%, 45%)',
  'MQ-7': 'hsl(348, 73%, 52%)',
};

interface HistoricalChartsProps {
  getHistoricalData: (sensorId: string, points?: number) => Array<{ time: string; value: number; timestamp: number }>;
}

export function HistoricalCharts({ getHistoricalData }: HistoricalChartsProps) {
  const tempData = getHistoricalData('DHT22_T', 30);
  const humData = getHistoricalData('DHT22_H', 30);

  const mq135Data = getHistoricalData('MQ-135', 30);
  const mq7Data = getHistoricalData('MQ-7', 30);
  const gasData = mq135Data.map((d, i) => ({
    time: d.time,
    'Calidad Aire': d.value,
    'CO': mq7Data[i]?.value ?? 0,
  }));

  return (
    <Card className="bg-card border-border animate-slide-in">
      <CardHeader className="pb-3 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg p-1.5 bg-primary/10">
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            <CardTitle className="text-sm font-semibold font-display">Tendencias en Tiempo Real</CardTitle>
          </div>
          <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">últimas 2.5h</span>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <Tabs defaultValue="temperature" className="space-y-4">
          <TabsList className="bg-secondary/50 border border-border p-0.5">
            <TabsTrigger value="temperature" className="text-xs data-[state=active]:bg-card data-[state=active]:text-foreground">
              🌡️ Temperatura
            </TabsTrigger>
            <TabsTrigger value="humidity" className="text-xs data-[state=active]:bg-card data-[state=active]:text-foreground">
              💧 Humedad
            </TabsTrigger>
            <TabsTrigger value="gas" className="text-xs data-[state=active]:bg-card data-[state=active]:text-foreground">
              💨 Gases
            </TabsTrigger>
          </TabsList>

          <TabsContent value="temperature">
            <SensorAreaChart data={tempData} color={chartHslColors.DHT22_T} unit="°C" label="Temperatura" />
          </TabsContent>
          <TabsContent value="humidity">
            <SensorAreaChart data={humData} color={chartHslColors.DHT22_H} unit="%" label="Humedad" />
          </TabsContent>
          <TabsContent value="gas">
            <MultiLineChart data={gasData} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function SensorAreaChart({ data, color, unit, label }: { data: Array<{ time: string; value: number }>; color: string; unit: string; label: string }) {
  return (
    <div className="h-[260px] md:h-[320px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
          <defs>
            <linearGradient id={`grad-${label}`} x1="0" y1="0" x2="0" y2="1">
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
              boxShadow: '0 8px 32px hsl(var(--chart-tooltip-shadow) / 0.3)',
            }}
            formatter={(value: number) => [`${value.toFixed(2)} ${unit}`, label]}
            labelStyle={{ color: 'hsl(var(--chart-text))', fontSize: '11px', marginBottom: '4px' }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2.5}
            fill={`url(#grad-${label})`}
            dot={false}
            activeDot={{ r: 5, strokeWidth: 2, stroke: 'hsl(var(--card))', fill: color }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function MultiLineChart({ data }: { data: Array<Record<string, any>> }) {
  return (
    <div className="h-[260px] md:h-[320px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
          <defs>
            <linearGradient id="grad-air" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={chartHslColors['MQ-135']} stopOpacity={0.2} />
              <stop offset="100%" stopColor={chartHslColors['MQ-135']} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="grad-co" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={chartHslColors['MQ-7']} stopOpacity={0.2} />
              <stop offset="100%" stopColor={chartHslColors['MQ-7']} stopOpacity={0} />
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
              boxShadow: '0 8px 32px hsl(var(--chart-tooltip-shadow) / 0.3)',
            }}
            labelStyle={{ color: 'hsl(var(--chart-text))', fontSize: '11px' }}
          />
          <Area type="monotone" dataKey="Calidad Aire" stroke={chartHslColors['MQ-135']} strokeWidth={2} fill="url(#grad-air)" dot={false} activeDot={{ r: 4 }} />
          <Area type="monotone" dataKey="CO" stroke={chartHslColors['MQ-7']} strokeWidth={2} fill="url(#grad-co)" dot={false} activeDot={{ r: 4 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
