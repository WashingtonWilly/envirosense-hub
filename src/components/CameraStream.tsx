import { useState } from 'react';
import { useAuth, AppRole } from '@/contexts/AuthContext';
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
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
} from 'lucide-react';
import { updateDevice } from '@/lib/firestore-service';
import { useToast } from '@/hooks/use-toast';

interface CameraStreamProps {
  deviceId: string;
  deviceStatus: 'online' | 'offline' | 'warning';
  cameraUrl?: string;
}

/**
 * Role-based camera stream component.
 * - super_admin: privacy-first status card only
 * - admin: video player + config form
 * - user: video player (read-only)
 */
export function CameraStream({
  deviceId,
  deviceStatus,
  cameraUrl,
}: CameraStreamProps) {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const role = userProfile?.role ?? 'user';

  if (role === 'super_admin') {
    return <SuperAdminView deviceStatus={deviceStatus} />;
  }

  if (role === 'admin') {
    return (
      <AdminView
        deviceId={deviceId}
        deviceStatus={deviceStatus}
        cameraUrl={cameraUrl}
      />
    );
  }

  return (
    <UserView
      deviceStatus={deviceStatus}
      cameraUrl={cameraUrl}
    />
  );
}

/* ───────── Super Admin: Privacy-first status card ───────── */

function SuperAdminView({
  deviceStatus,
}: {
  deviceStatus: 'online' | 'offline' | 'warning';
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
            Cámara de Vigilancia
          </CardTitle>
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
                Estado de Conexión de Cámara:
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
                Por políticas de privacidad, el Super Administrador
                no tiene acceso a las transmisiones de video en vivo
                de los clientes.
              </p>
            </div>
          </div>
        </AspectRatio>
      </CardContent>
    </Card>
  );
}

/* ───────── Admin: Video player + config ───────── */

function AdminView({
  deviceId,
  deviceStatus,
  cameraUrl,
}: {
  deviceId: string;
  deviceStatus: 'online' | 'offline' | 'warning';
  cameraUrl?: string;
}) {
  const { toast } = useToast();
  const [configOpen, setConfigOpen] = useState(false);
  const [urlInput, setUrlInput] = useState(cameraUrl ?? '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveUrl = async () => {
    const trimmed = urlInput.trim();
    if (!trimmed) {
      toast({
        title: 'URL requerida',
        description: 'Ingresa la URL del stream de la cámara.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      await updateDevice(deviceId, { cameraUrl: trimmed } as Record<string, string>);
      toast({
        title: 'URL guardada',
        description: 'La configuración de cámara se actualizó.',
      });
      setConfigOpen(false);
    } catch (err) {
      toast({
        title: 'Error',
        description: 'No se pudo guardar la URL. Intente de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg p-1.5 bg-primary/10">
              <Video className="h-4 w-4 text-primary" />
            </div>
            <CardTitle className="text-sm font-semibold font-display">
              Cámara en Vivo
            </CardTitle>
          </div>
          <Collapsible open={configOpen} onOpenChange={setConfigOpen}>
            <CollapsibleTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="bg-secondary/50 border-border text-muted-foreground hover:text-foreground"
              >
                <Settings className="h-3.5 w-3.5 mr-1.5" />
                Configurar Red de Cámara
              </Button>
            </CollapsibleTrigger>
          </Collapsible>
        </div>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        <Collapsible open={configOpen} onOpenChange={setConfigOpen}>
          <CollapsibleContent>
            <div className="rounded-lg border border-border bg-secondary/20 p-4 space-y-3 mb-4">
              <Label
                htmlFor="camera-url"
                className="text-xs font-medium text-foreground"
              >
                URL del Stream Local
              </Label>
              <div className="flex gap-2">
                <Input
                  id="camera-url"
                  placeholder="ws://192.168.1.100/stream"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="text-sm font-mono"
                />
                <Button
                  size="sm"
                  onClick={handleSaveUrl}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Save className="h-3.5 w-3.5 mr-1" />
                  )}
                  Guardar
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Ej: ws://192.168.1.100/stream o
                http://192.168.1.100:8080/video
              </p>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <VideoPlaceholder
          cameraUrl={cameraUrl}
          deviceStatus={deviceStatus}
        />
      </CardContent>
    </Card>
  );
}

/* ───────── User: Read-only video player ───────── */

function UserView({
  deviceStatus,
  cameraUrl,
}: {
  deviceStatus: 'online' | 'offline' | 'warning';
  cameraUrl?: string;
}) {
  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3 border-b border-border/50">
        <div className="flex items-center gap-2.5">
          <div className="rounded-lg p-1.5 bg-primary/10">
            <Video className="h-4 w-4 text-primary" />
          </div>
          <CardTitle className="text-sm font-semibold font-display">
            Cámara en Vivo
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <VideoPlaceholder
          cameraUrl={cameraUrl}
          deviceStatus={deviceStatus}
        />
      </CardContent>
    </Card>
  );
}

/* ───────── Shared video placeholder ───────── */

function VideoPlaceholder({
  cameraUrl,
  deviceStatus,
}: {
  cameraUrl?: string;
  deviceStatus: 'online' | 'offline' | 'warning';
}) {
  if (!cameraUrl) {
    return (
      <AspectRatio ratio={16 / 9}>
        <div className="flex flex-col items-center justify-center h-full rounded-lg bg-secondary/30 border border-border gap-3">
          <VideoOff className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Cámara no configurada en esta ubicación
          </p>
        </div>
      </AspectRatio>
    );
  }

  return (
    <AspectRatio ratio={16 / 9}>
      <div className="relative w-full h-full rounded-lg overflow-hidden bg-secondary/30 border border-border">
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <video
          className="w-full h-full object-cover"
          autoPlay
          muted
          playsInline
        >
          <source src={cameraUrl} />
          Tu navegador no soporta el reproductor de video.
        </video>
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
  );
}
