import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { SENSOR_CONFIGS } from '@/lib/sensor-config';

const chartColors: Record<string, string> = {
  DHT22_T: 'hsl(15, 85%, 55%)',
  DHT22_H: 'hsl(200, 85%, 50%)',
  'MQ-4': 'hsl(30, 85%, 55%)',
  'MQ-135': 'hsl(170, 60%, 45%)',
  'MQ-2': 'hsl(280, 60%, 55%)',
  'MQ-7': 'hsl(350, 70%, 50%)',
};

interface HistoricalChartsProps {
  getHistoricalData: (sensorId: string, points?: number) => Array<{ time: string; value: number; timestamp: number }>;
}

export function HistoricalCharts({ getHistoricalData }: HistoricalChartsProps) {
  const tempData = getHistoricalData('DHT22_T', 30);
  const humData = getHistoricalData('DHT22_H', 30);
  const gasData = getHistoricalData('MQ-135', 30);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Datos Históricos</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="temperature" className="space-y-4">
          <TabsList className="bg-muted">
            <TabsTrigger value="temperature">Temperatura</TabsTrigger>
            <TabsTrigger value="humidity">Humedad</TabsTrigger>
            <TabsTrigger value="gas">Gases</TabsTrigger>
          </TabsList>

          <TabsContent value="temperature">
            <ChartArea data={tempData} color={chartColors.DHT22_T} unit="°C" label="Temperatura" />
          </TabsContent>
          <TabsContent value="humidity">
            <ChartArea data={humData} color={chartColors.DHT22_H} unit="%" label="Humedad" />
          </TabsContent>
          <TabsContent value="gas">
            <ChartArea data={gasData} color={chartColors['MQ-135']} unit="ppm" label="Calidad del Aire" />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function ChartArea({ data, color, unit, label }: { data: Array<{ time: string; value: number }>; color: string; unit: string; label: string }) {
  return (
    <div className="h-[250px] md:h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id={`gradient-${label}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="time"
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              fontSize: '12px',
            }}
            formatter={(value: number) => [`${value.toFixed(2)} ${unit}`, label]}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            fill={`url(#gradient-${label})`}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
