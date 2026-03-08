import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';

const chartColors: Record<string, string> = {
  DHT22_T: 'hsl(12, 90%, 58%)',
  DHT22_H: 'hsl(205, 90%, 55%)',
  'MQ-4': 'hsl(32, 90%, 55%)',
  'MQ-135': 'hsl(168, 65%, 48%)',
  'MQ-2': 'hsl(275, 65%, 60%)',
  'MQ-7': 'hsl(348, 75%, 55%)',
};

interface HistoricalChartsProps {
  getHistoricalData: (sensorId: string, points?: number) => Array<{ time: string; value: number; timestamp: number }>;
}

export function HistoricalCharts({ getHistoricalData }: HistoricalChartsProps) {
  const tempData = getHistoricalData('DHT22_T', 30);
  const humData = getHistoricalData('DHT22_H', 30);

  // Combine gas data for multi-line chart
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
            <SensorAreaChart data={tempData} color={chartColors.DHT22_T} unit="°C" label="Temperatura" />
          </TabsContent>
          <TabsContent value="humidity">
            <SensorAreaChart data={humData} color={chartColors.DHT22_H} unit="%" label="Humedad" />
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
            formatter={(value: number) => [`${value.toFixed(2)} ${unit}`, label]}
            labelStyle={{ color: 'hsl(215 12% 50%)', fontSize: '11px', marginBottom: '4px' }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2.5}
            fill={`url(#grad-${label})`}
            dot={false}
            activeDot={{ r: 5, strokeWidth: 2, stroke: 'hsl(225 22% 11%)', fill: color }}
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
              <stop offset="0%" stopColor="hsl(168, 65%, 48%)" stopOpacity={0.2} />
              <stop offset="100%" stopColor="hsl(168, 65%, 48%)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="grad-co" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(348, 75%, 55%)" stopOpacity={0.2} />
              <stop offset="100%" stopColor="hsl(348, 75%, 55%)" stopOpacity={0} />
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
            labelStyle={{ color: 'hsl(215 12% 50%)', fontSize: '11px' }}
          />
          <Area type="monotone" dataKey="Calidad Aire" stroke="hsl(168, 65%, 48%)" strokeWidth={2} fill="url(#grad-air)" dot={false} activeDot={{ r: 4 }} />
          <Area type="monotone" dataKey="CO" stroke="hsl(348, 75%, 55%)" strokeWidth={2} fill="url(#grad-co)" dot={false} activeDot={{ r: 4 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
