import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Lock,
  ShieldCheck,
  Video,
  VideoOff,
  Settings,
  Loader2,
  Wifi,
  WifiOff,
  Save,
  Plus,
  Trash2,
  Camera,
} from 'lucide-react';
import { updateDevice } from '@/lib/firestore-service';
import { useToast } from '@/hooks/use-toast';
import type { CameraEntry } from '@/lib/firestore-types';

const MAX_CAMERAS = 4;

interface CameraStreamProps {
  deviceId: string;
  deviceStatus: 'online' | 'offline' | 'warning';
  cameraUrl?: string;
  cameras?: CameraEntry[];
}

export function CameraStream({
  deviceId,
  deviceStatus,
  cameraUrl,
  cameras = [],
}: CameraStreamProps) {
  const { userProfile } = useAuth();
  const role = userProfile?.role ?? 'user';

  // Migrate legacy single cameraUrl into cameras array
  const effectiveCameras: CameraEntry[] =
    cameras.length > 0
      ? cameras
      : cameraUrl
        ? [{ id: 'legacy', name: 'Cámara Principal', url: cameraUrl }]
        : [];

  if (role === 'super_admin') {
    return <SuperAdminView deviceStatus={deviceStatus} cameraCount={effectiveCameras.length} />;
  }

  if (role === 'admin') {
    return (
      <AdminView
        deviceId={deviceId}
        deviceStatus={deviceStatus}
        cameras={effectiveCameras}
      />
    );
  }

  return (
    <UserView
      deviceStatus={deviceStatus}
      cameras={effectiveCameras}
    />
  );
}

/* ───────── Super Admin: Privacy-first status card ───────── */

function SuperAdminView({
  deviceStatus,
  cameraCount,
}: {
  deviceStatus: 'online' | 'offline' | 'warning';
  cameraCount: number;
}) {
  const isOnline = deviceStatus === 'online';

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3 border-b border-border/50">
        <div className="flex items-center gap-2.5">
          <div className="rounded-lg p-1.5 bg-primary/10">
            <ShieldCheck className="h-4 w-4 text-primary" />
          </div>
          <CardTitle className="text-sm font-semibold font-display">
            Cámaras de Vigilancia
          </CardTitle>
          <Badge variant="secondary" className="ml-auto text-[10px]">
            {cameraCount} configurada{cameraCount !== 1 ? 's' : ''}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <AspectRatio ratio={16 / 9}>
          <div className="flex flex-col items-center justify-center h-full rounded-lg bg-secondary/30 border border-border gap-4">
            <div className="flex items-center gap-3">
              {isOnline ? (
                <Wifi className="h-5 w-5 text-success" />
              ) : (
                <WifiOff className="h-5 w-5 text-destructive" />
              )}
              <span className="text-sm font-medium text-foreground">
                Estado de Conexión:
              </span>
              <Badge
                variant="outline"
                className={
                  isOnline
                    ? 'border-success/30 text-success bg-success/10'
                    : 'border-destructive/30 text-destructive bg-destructive/10'
                }
              >
                {isOnline ? 'Online' : 'Offline'}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground max-w-sm text-center">
              <Lock className="h-4 w-4 shrink-0" />
              <p className="text-xs leading-relaxed">
                Por políticas de privacidad, el Super Administrador no tiene
                acceso a las transmisiones de video en vivo de los clientes.
              </p>
            </div>
          </div>
        </AspectRatio>
      </CardContent>
    </Card>
  );
}

/* ───────── Admin: Quad-view + config modal ───────── */

function AdminView({
  deviceId,
  deviceStatus,
  cameras,
}: {
  deviceId: string;
  deviceStatus: 'online' | 'offline' | 'warning';
  cameras: CameraEntry[];
}) {
  const [configOpen, setConfigOpen] = useState(false);

  const slots = Array.from({ length: MAX_CAMERAS }, (_, i) => cameras[i] ?? null);

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg p-1.5 bg-primary/10">
              <Video className="h-4 w-4 text-primary" />
            </div>
            <CardTitle className="text-sm font-semibold font-display">
              Cámaras en Vivo
            </CardTitle>
            <Badge variant="secondary" className="text-[10px]">
              {cameras.length}/{MAX_CAMERAS}
            </Badge>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setConfigOpen(true)}
            className="bg-secondary/50 border-border text-muted-foreground hover:text-foreground"
          >
            <Settings className="h-3.5 w-3.5 mr-1.5" />
            Configurar Cámaras
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {slots.map((cam, idx) =>
            cam ? (
              <SingleCamera
                key={cam.id}
                camera={cam}
                deviceStatus={deviceStatus}
              />
            ) : (
              <AdminPlaceholder key={`empty-${idx}`} />
            )
          )}
        </div>
      </CardContent>

      <CameraConfigDialog
        open={configOpen}
        onOpenChange={setConfigOpen}
        deviceId={deviceId}
        cameras={cameras}
      />
    </Card>
  );
}

/* ───────── Admin placeholder slot (dashed) ───────── */

function AdminPlaceholder() {
  return (
    <AspectRatio ratio={16 / 9}>
      <div className="flex flex-col items-center justify-center h-full rounded-lg border-2 border-dashed border-border bg-secondary/10 gap-2">
        <Camera className="h-6 w-6 text-muted-foreground/50" />
        <p className="text-xs text-muted-foreground/60">Slot disponible</p>
      </div>
    </AspectRatio>
  );
}

/* ───────── User: Quad-view read-only ───────── */

function UserView({
  deviceStatus,
  cameras,
}: {
  deviceStatus: 'online' | 'offline' | 'warning';
  cameras: CameraEntry[];
}) {
  if (cameras.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardHeader className="pb-3 border-b border-border/50">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg p-1.5 bg-primary/10">
              <Video className="h-4 w-4 text-primary" />
            </div>
            <CardTitle className="text-sm font-semibold font-display">
              Cámaras en Vivo
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <AspectRatio ratio={16 / 9}>
            <div className="flex flex-col items-center justify-center h-full rounded-lg bg-secondary/30 border border-border gap-3">
              <VideoOff className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Cámara no configurada en esta ubicación
              </p>
            </div>
          </AspectRatio>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3 border-b border-border/50">
        <div className="flex items-center gap-2.5">
          <div className="rounded-lg p-1.5 bg-primary/10">
            <Video className="h-4 w-4 text-primary" />
          </div>
          <CardTitle className="text-sm font-semibold font-display">
            Cámaras en Vivo
          </CardTitle>
          <Badge variant="secondary" className="text-[10px]">
            {cameras.length} cámara{cameras.length !== 1 ? 's' : ''}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cameras.map((cam) => (
            <SingleCamera
              key={cam.id}
              camera={cam}
              deviceStatus={deviceStatus}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/* ───────── Single camera player (independent render) ───────── */

function SingleCamera({
  camera,
  deviceStatus,
}: {
  camera: CameraEntry;
  deviceStatus: 'online' | 'offline' | 'warning';
}) {
  const [hasError, setHasError] = useState(false);

  return (
    <div className="relative">
      <AspectRatio ratio={16 / 9}>
        <div className="relative w-full h-full rounded-lg overflow-hidden bg-secondary/30 border border-border">
          {hasError ? (
            <div className="flex flex-col items-center justify-center h-full gap-2">
              <VideoOff className="h-6 w-6 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Error de conexión</p>
            </div>
          ) : (
            /* eslint-disable-next-line jsx-a11y/media-has-caption */
            <video
              className="w-full h-full object-cover"
              autoPlay
              muted
              playsInline
              onError={() => setHasError(true)}
            >
              <source src={camera.url} />
            </video>
          )}

          {/* Camera name overlay */}
          <div className="absolute top-2 left-2">
            <Badge variant="secondary" className="text-[10px] bg-background/70 backdrop-blur-sm">
              {camera.name}
            </Badge>
          </div>

          {/* Live/Off badge */}
          <div className="absolute top-2 right-2">
            <Badge
              variant="outline"
              className={
                deviceStatus === 'online'
                  ? 'border-success/30 text-success bg-success/10 text-[10px]'
                  : 'border-destructive/30 text-destructive bg-destructive/10 text-[10px]'
              }
            >
              <div className="h-1.5 w-1.5 rounded-full bg-current mr-1 animate-pulse" />
              {deviceStatus === 'online' ? 'LIVE' : 'OFF'}
            </Badge>
          </div>
        </div>
      </AspectRatio>
    </div>
  );
}

/* ───────── Camera config dialog (Admin only) ───────── */

function CameraConfigDialog({
  open,
  onOpenChange,
  deviceId,
  cameras,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  deviceId: string;
  cameras: CameraEntry[];
}) {
  const { toast } = useToast();
  const [entries, setEntries] = useState<CameraEntry[]>(() =>
    cameras.length > 0 ? [...cameras] : []
  );
  const [isSaving, setIsSaving] = useState(false);

  const addEntry = () => {
    if (entries.length >= MAX_CAMERAS) return;
    setEntries((prev) => [
      ...prev,
      { id: crypto.randomUUID(), name: `Cámara ${prev.length + 1}`, url: '' },
    ]);
  };

  const updateEntry = (id: string, field: 'name' | 'url', value: string) => {
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, [field]: value } : e))
    );
  };

  const removeEntry = (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const handleSave = async () => {
    const valid = entries.filter((e) => e.url.trim());
    setIsSaving(true);
    try {
      await updateDevice(deviceId, {
        cameras: valid.map((e) => ({ id: e.id, name: e.name.trim() || 'Sin nombre', url: e.url.trim() })),
      } as any);
      toast({ title: 'Cámaras guardadas', description: `${valid.length} cámara(s) configurada(s).` });
      onOpenChange(false);
    } catch {
      toast({ title: 'Error', description: 'No se pudieron guardar las cámaras.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Configurar Cámaras
          </DialogTitle>
          <DialogDescription>
            Agrega hasta {MAX_CAMERAS} URLs de transmisión local para este dispositivo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 max-h-[50vh] overflow-y-auto py-2">
          {entries.map((entry, idx) => (
            <div
              key={entry.id}
              className="rounded-lg border border-border bg-secondary/20 p-3 space-y-2"
            >
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium">Cámara {idx + 1}</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeEntry(entry.id)}
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
              <Input
                placeholder="Nombre (ej. Cámara Frontal)"
                value={entry.name}
                onChange={(e) => updateEntry(entry.id, 'name', e.target.value)}
                className="text-sm"
              />
              <Input
                placeholder="URL (ej. ws://192.168.1.100/stream)"
                value={entry.url}
                onChange={(e) => updateEntry(entry.id, 'url', e.target.value)}
                className="text-sm font-mono"
              />
            </div>
          ))}

          {entries.length < MAX_CAMERAS && (
            <Button
              variant="outline"
              size="sm"
              onClick={addEntry}
              className="w-full border-dashed"
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Agregar Cámara ({entries.length}/{MAX_CAMERAS})
            </Button>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Save className="h-3.5 w-3.5 mr-1.5" />}
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
