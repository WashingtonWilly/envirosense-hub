import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, XCircle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

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
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-warning" />
          Alertas Recientes
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[250px] md:h-[300px]">
          {alerts.length === 0 ? (
            <div className="flex items-center justify-center h-full p-6 text-sm text-muted-foreground">
              Sin alertas activas
            </div>
          ) : (
            <div className="divide-y divide-border">
              {alerts.slice(0, 20).map((alert) => (
                <div key={alert.id} className="flex items-start gap-3 p-3 hover:bg-muted/50 transition-colors">
                  {alert.level === 'danger' ? (
                    <XCircle className="h-4 w-4 mt-0.5 shrink-0 text-destructive" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-warning" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-card-foreground leading-relaxed">{alert.message}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {alert.timestamp.toLocaleTimeString('es-CO')}
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
