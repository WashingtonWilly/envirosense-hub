import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Wifi, WifiOff, AlertTriangle, Pencil, Trash2, Eye, Clock, MapPinned } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import type { FirestoreDevice } from '@/lib/firestore-types';
import { useAuth } from '@/contexts/AuthContext';

interface DeviceListItemProps {
  device: FirestoreDevice;
  index: number;
  onEdit: (device: FirestoreDevice) => void;
  onDelete: (id: string) => void;
}

const statusIcon = (status: string) => {
  if (status === 'online') return <Wifi className="h-5 w-5 text-success" />;
  if (status === 'warning') return <AlertTriangle className="h-5 w-5 text-warning" />;
  return <WifiOff className="h-5 w-5 text-destructive" />;
};

export function DeviceListItem({ device, index, onEdit, onDelete }: DeviceListItemProps) {
  const { hasRole } = useAuth();
  const canManage = hasRole(['super_admin', 'admin']);
  return (
    <Card className="bg-card border-border hover:border-primary/20 transition-all duration-300 animate-slide-in group" style={{ animationDelay: `${index * 40}ms` }}>
      <CardContent className="p-4 md:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Top: Icon + Name + Status badge (mobile stacked) */}
          <div className="flex items-center gap-3 min-w-0">
            <div className={`h-10 w-10 sm:h-12 sm:w-12 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${device.status === 'online' ? 'bg-success/10' : device.status === 'warning' ? 'bg-warning/10' : 'bg-destructive/10'}`}>
              {statusIcon(device.status)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-card-foreground font-display truncate">{device.name}</h3>
                <Badge className={`text-[10px] font-semibold shrink-0 sm:hidden ${device.status === 'online' ? 'bg-success/15 text-success border-success/20' : device.status === 'warning' ? 'bg-warning/15 text-warning border-warning/20' : 'bg-destructive/15 text-destructive border-destructive/20'}`}>
                  {device.status}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground font-mono mt-0.5 truncate">{device.id}</p>
            </div>
          </div>

          {/* Middle: Meta info */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground pl-[52px] sm:pl-0">
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-primary/50" />
              <span>{device.city}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-muted-foreground/70" />
              <span title={device.lastSeen instanceof Date ? device.lastSeen.toLocaleString() : ''}>
                {device.lastSeen instanceof Date
                  ? formatDistanceToNow(device.lastSeen, { addSuffix: true, locale: es })
                  : '—'}
              </span>
            </div>
            <Badge className={`hidden sm:inline-flex text-[10px] font-semibold ${device.status === 'online' ? 'bg-success/15 text-success border-success/20' : device.status === 'warning' ? 'bg-warning/15 text-warning border-warning/20' : 'bg-destructive/15 text-destructive border-destructive/20'}`}>
              {device.status}
            </Badge>
          </div>

          {/* Bottom: Action buttons */}
          <div className="flex items-center gap-1 flex-wrap pl-[52px] sm:pl-0">
            <Link to={`/map?deviceId=${device.id}`}>
              <Button variant="ghost" size="sm" className="h-8 gap-1.5 px-2 text-muted-foreground hover:text-primary text-xs" title="Ver en mapa">
                <MapPinned className="h-3.5 w-3.5" />
                <span className="sm:inline">Mapa</span>
              </Button>
            </Link>
            <Link to={`/devices/${device.id}`}>
              <Button variant="ghost" size="sm" className="h-8 gap-1.5 px-2 text-muted-foreground hover:text-primary text-xs" title="Ver detalle">
                <Eye className="h-3.5 w-3.5" />
                <span className="sm:inline">Detalle</span>
              </Button>
            </Link>
            {canManage && (
              <>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground" onClick={() => onEdit(device)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive" onClick={() => device.id && onDelete(device.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
