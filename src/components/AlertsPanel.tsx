import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, XCircle, Shield, CheckCircle2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

interface AlertEntry {
  id: string;
  sensor: string;
  level: string;
  value: number;
  timestamp: Date;
  message: string;
}

interface AlertsPanelProps {
  alerts: AlertEntry[];
}

export function AlertsPanel({ alerts }: AlertsPanelProps) {
  const dangerCount = alerts.filter(a => a.level === 'danger').length;
  const warningCount = alerts.filter(a => a.level === 'warning').length;

  return (
    <Card className="bg-card border-border animate-slide-in">
      <CardHeader className="pb-3 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg p-1.5 bg-warning/10">
              <Shield className="h-4 w-4 text-warning" />
            </div>
            <CardTitle className="text-sm font-semibold font-display">Alertas</CardTitle>
          </div>
          <div className="flex items-center gap-1.5">
            {dangerCount > 0 && (
              <Badge className="bg-destructive/15 text-destructive border-destructive/20 text-[10px] px-1.5 py-0">
                {dangerCount} crítica{dangerCount > 1 ? 's' : ''}
              </Badge>
            )}
            {warningCount > 0 && (
              <Badge className="bg-warning/15 text-warning border-warning/20 text-[10px] px-1.5 py-0">
                {warningCount}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[260px] md:h-[320px]">
          {alerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <div className="rounded-full p-3 bg-success/10 mb-3">
                <CheckCircle2 className="h-6 w-6 text-success" />
              </div>
              <p className="text-sm font-medium text-card-foreground">Todo en orden</p>
              <p className="text-xs text-muted-foreground mt-1">Sin alertas activas</p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {alerts.slice(0, 25).map((alert) => (
                <div 
                  key={alert.id} 
                  className={`flex items-start gap-3 px-4 py-3 transition-colors hover:bg-secondary/30 ${
                    alert.level === 'danger' ? 'border-l-2 border-l-destructive' : 'border-l-2 border-l-warning'
                  }`}
                >
                  {alert.level === 'danger' ? (
                    <XCircle className="h-4 w-4 mt-0.5 shrink-0 text-destructive" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-warning" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] text-card-foreground leading-relaxed">{alert.message}</p>
                    <p className="text-[10px] text-muted-foreground mt-1 font-mono">
                      {alert.timestamp.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
