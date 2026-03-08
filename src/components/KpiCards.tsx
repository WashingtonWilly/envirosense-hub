import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: { direction: 'up' | 'down'; value: string };
  variant?: 'default' | 'success' | 'warning' | 'danger';
  delay?: number;
}

const variantConfig = {
  default: {
    card: 'bg-card border-border hover:border-primary/20',
    icon: 'bg-primary/10 text-primary',
    glow: '',
  },
  success: {
    card: 'bg-card border-success/15 hover:border-success/30',
    icon: 'bg-success/10 text-success',
    glow: 'glow-success',
  },
  warning: {
    card: 'bg-card border-warning/15 hover:border-warning/30',
    icon: 'bg-warning/10 text-warning',
    glow: 'glow-warning',
  },
  danger: {
    card: 'bg-card border-destructive/15 hover:border-destructive/30',
    icon: 'bg-destructive/10 text-destructive',
    glow: 'glow-danger',
  },
};

export function KpiCard({ title, value, subtitle, icon: Icon, trend, variant = 'default', delay = 0 }: KpiCardProps) {
  const config = variantConfig[variant];

  return (
    <Card className={`${config.card} ${config.glow} transition-all duration-300 animate-slide-in group`}
          style={{ animationDelay: `${delay}ms` }}>
      <CardContent className="p-4 md:p-5">
        <div className="flex items-start justify-between mb-3">
          <div className={`rounded-xl p-2.5 ${config.icon} transition-transform group-hover:scale-110`}>
            <Icon className="h-5 w-5" />
          </div>
          {trend && (
            <div className={`flex items-center gap-1 text-[11px] font-medium ${trend.direction === 'up' ? 'text-success' : 'text-destructive'}`}>
              {trend.direction === 'up' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {trend.value}
            </div>
          )}
        </div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-1">{title}</p>
        <p className="text-2xl font-bold font-display tracking-tight text-card-foreground value-transition">{value}</p>
        {subtitle && (
          <p className="text-[11px] text-muted-foreground mt-1">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}
