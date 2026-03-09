import { useEffect, useState } from 'react';
import { collection, query, limit, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { ClipboardList } from 'lucide-react';
import { format } from 'date-fns';

interface AuditLog {
  id: string;
  userId: string;
  userEmail?: string;
  userName?: string;
  action: string;
  details: string;
  targetId?: string;
  timestamp: Date;
}

function toDate(val: any): Date {
  if (val instanceof Timestamp) return val.toDate();
  if (val instanceof Date) return val;
  if (typeof val === 'string' || typeof val === 'number') return new Date(val);
  return new Date();
}

const ACTION_STYLES: Record<string, { className: string }> = {
  DELETE: { className: 'bg-destructive/15 text-destructive border-destructive/20' },
  UPDATE: { className: 'bg-primary/15 text-primary border-primary/20' },
  CREATE: { className: 'bg-success/15 text-success border-success/20' },
  LOGIN: { className: 'bg-muted text-muted-foreground border-border' },
  SIMULATE: { className: 'bg-warning/15 text-warning border-warning/20' },
};

function getActionStyle(action: string) {
  const key = Object.keys(ACTION_STYLES).find((k) => action.toUpperCase().includes(k));
  return key ? ACTION_STYLES[key].className : 'bg-muted text-muted-foreground border-border';
}

export function AuditLogsViewer() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TEMP: no orderBy() to avoid index-related query failures while debugging
    const q = query(collection(db, 'audit_logs'), limit(100));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const next = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            userId: data.userId,
            userEmail: data.userEmail,
            userName: data.userName,
            action: data.action,
            details: data.details,
            targetId: data.targetId,
            timestamp: toDate(data.timestamp),
          } as AuditLog;
        });
        console.log('Logs recibidos:', next);
        setLogs(next);
        setLoading(false);
      },
      (err) => {
        console.error('Audit logs listener error:', err);
        setLoading(false);
      },
    );
    return unsub;
  }, []);

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3 border-b border-border/50">
        <div className="flex items-center gap-2.5">
          <div className="rounded-lg p-1.5 bg-primary/10">
            <ClipboardList className="h-4 w-4 text-primary" />
          </div>
          <CardTitle className="text-sm font-semibold font-display">Registro de Actividad</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-3 items-start">
                <Skeleton className="h-4 w-32 shrink-0" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 flex-1" />
              </div>
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <ClipboardList className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No hay eventos registrados recientemente</p>
          </div>
        ) : (
          <ScrollArea className="w-full">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border/50 text-muted-foreground">
                    <th className="text-left py-2 pr-4 font-medium whitespace-nowrap">Fecha y Hora</th>
                    <th className="text-left py-2 pr-4 font-medium whitespace-nowrap">Usuario</th>
                    <th className="text-left py-2 pr-4 font-medium whitespace-nowrap">Acción</th>
                    <th className="text-left py-2 font-medium">Detalles</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-b border-border/30 last:border-0">
                      <td className="py-2.5 pr-4 whitespace-nowrap font-mono text-muted-foreground">
                        {format(log.timestamp, 'dd/MM/yyyy HH:mm:ss')}
                      </td>
                      <td className="py-2.5 pr-4 whitespace-nowrap text-card-foreground">
                        {log.userName || log.userEmail || log.userId}
                      </td>
                      <td className="py-2.5 pr-4 whitespace-nowrap">
                        <Badge variant="outline" className={`text-[10px] font-semibold ${getActionStyle(log.action)}`}>
                          {log.action}
                        </Badge>
                      </td>
                      <td className="py-2.5 text-muted-foreground max-w-xs truncate">{log.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
