import { AreaChart, Area, ResponsiveContainer } from 'recharts';

interface HistoryEntry {
  temp?: number;
  hum?: number;
  co?: number;
  ch4?: number;
  c3h8?: number;
  aqi?: number;
  timestamp?: number;
}

interface MetricSparklineProps {
  data: HistoryEntry[];
  dataKey: keyof Omit<HistoryEntry, 'timestamp'>;
  color?: string;
  height?: number;
  isWarning?: boolean;
}

export function MetricSparkline({ 
  data, 
  dataKey, 
  color = 'hsl(var(--primary))', 
  height = 48,
  isWarning = false 
}: MetricSparklineProps) {
  // Handle empty or insufficient data
  if (!data || data.length < 2) {
    return (
      <div 
        className="w-full flex items-center justify-center" 
        style={{ height }}
      >
        <div className="w-full border-t border-dashed border-muted-foreground/30" />
        <span className="absolute text-[9px] text-muted-foreground/50 bg-card px-2">
          Sin historial
        </span>
      </div>
    );
  }

  // Transform data for Recharts
  const chartData = data.map((entry, index) => ({
    index,
    value: entry[dataKey] ?? 0,
  }));

  // Determine color based on warning state
  const strokeColor = isWarning ? 'hsl(var(--warning))' : color;
  const gradientId = `sparkline-gradient-${dataKey}-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart 
          data={chartData} 
          margin={{ top: 2, right: 0, left: 0, bottom: 2 }}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={strokeColor} stopOpacity={0.3} />
              <stop offset="100%" stopColor={strokeColor} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={strokeColor}
            strokeWidth={1.5}
            fill={`url(#${gradientId})`}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
