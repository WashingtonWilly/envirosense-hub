import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Zap, Play, Pause, RefreshCw, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { onDevicesSnapshot } from '@/lib/firestore-service';
import type { FirestoreDevice } from '@/lib/firestore-types';
import { logActivity } from '@/lib/audit-utils';
import { useAuth } from '@/contexts/AuthContext';

interface SimulatedPayload {
  temp: number;
  hum: number;
  co: number;
  ch4: number;
  c3h8: number;
  aqi: number;
  status: 'online' | 'warning';
}

function generateRandomPayload(): SimulatedPayload {
  const temp = parseFloat((Math.random() * (35 - 10) + 10).toFixed(1));
  const hum = parseFloat((Math.random() * (90 - 30) + 30).toFixed(1));
  const co = parseFloat((Math.random() * 50).toFixed(1));
  const ch4 = Math.floor(Math.random() * (500 - 100) + 100);
  const c3h8 = Math.floor(Math.random() * (600 - 100) + 100);
  const aqi = Math.floor(Math.random() * 301);
  const status: 'online' | 'warning' = aqi > 150 ? 'warning' : 'online';

  return { temp, hum, co, ch4, c3h8, aqi, status };
}

async function injectToFirestore(deviceId: string, payload: SimulatedPayload) {
  const deviceRef = doc(db, 'devices', deviceId);
  const snap = await getDoc(deviceRef);
  const existing = snap.exists() ? snap.data() : {};

  const historyEntry = {
    temp: payload.temp,
    hum: payload.hum,
    co: payload.co,
    ch4: payload.ch4,
    c3h8: payload.c3h8,
    aqi: payload.aqi,
    timestamp: Date.now(),
  };

  let history: any[] = Array.isArray(existing.history) ? existing.history : [];
  history.push(historyEntry);
  if (history.length > 20) history = history.slice(-20);

  await updateDoc(deviceRef, {
    temp: payload.temp,
    hum: payload.hum,
    co: payload.co,
    ch4: payload.ch4,
    c3h8: payload.c3h8,
    aqi: payload.aqi,
    air_quality: payload.aqi,
    status: payload.status,
    history,
    last_updated: serverTimestamp(),
    lastSeen: serverTimestamp(),
  });
}

export function TelemetrySimulator() {
  const { currentUser, userProfile } = useAuth();
  const [devices, setDevices] = useState<FirestoreDevice[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [autoMode, setAutoMode] = useState(false);
  const [lastPayload, setLastPayload] = useState<SimulatedPayload | null>(null);
  const [injectionCount, setInjectionCount] = useState(0);
  const [injecting, setInjecting] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Real-time device list
  useEffect(() => {
    const unsub = onDevicesSnapshot(setDevices);
    return unsub;
  }, []);

  const doInject = useCallback(async (isAuto = false) => {
    if (!selectedDevice) return;

    const payload = generateRandomPayload();
    setLastPayload(payload);
    setInjectionCount(prev => prev + 1);

    try {
      if (!isAuto) setInjecting(true);
      await injectToFirestore(selectedDevice, payload);

      const deviceName = devices.find(d => d.id === selectedDevice)?.name ?? selectedDevice;

      if (!isAuto) {
        console.log('Enviando log...');
        logActivity({
          userId: currentUser?.uid || 'system',
          userEmail: userProfile?.email || currentUser?.email || 'Super Admin',
          userName: userProfile?.name || 'Super Admin',
          action: 'SIMULACIÓN',
          details: 'Inyección manual de datos de prueba',
          targetId: selectedDevice,
        });
      }

      toast.success(isAuto ? 'Datos inyectados (auto)' : `Datos enviados a ${deviceName}`, {
        description: `AQI: ${payload.aqi} | Status: ${payload.status}`,
        duration: 2000,
      });
    } catch (err: any) {
      toast.error(`Error al inyectar: ${err.message}`);
      if (isAuto) setAutoMode(false);
    } finally {
      if (!isAuto) setInjecting(false);
    }
  }, [selectedDevice, devices]);

  // Auto simulation interval
  useEffect(() => {
    if (autoMode && selectedDevice) {
      doInject(true); // fire immediately
      intervalRef.current = setInterval(() => doInject(true), 5000);
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [autoMode, selectedDevice, doInject]);

  const handleAutoModeToggle = (checked: boolean) => {
    if (checked && !selectedDevice) {
      toast.error('Selecciona un dispositivo primero');
      return;
    }
    const deviceName = devices.find(d => d.id === selectedDevice)?.name ?? selectedDevice;
    setAutoMode(checked);
    if (checked) {
      toast.info('Simulación automática activada (cada 5s)');
      logActivity({
        userId: currentUser?.uid || '',
        userEmail: userProfile?.email || currentUser?.email || '',
        userName: userProfile?.name || '',
        action: 'SIMULATOR_STARTED',
        details: `Inició la simulación automática en: ${deviceName}`,
        targetId: selectedDevice,
      });
    } else {
      toast.info('Simulación automática desactivada');
      logActivity({
        userId: currentUser?.uid || '',
        userEmail: userProfile?.email || currentUser?.email || '',
        userName: userProfile?.name || '',
        action: 'SIMULATOR_STOPPED',
        details: `Detuvo la simulación automática en: ${deviceName}`,
        targetId: selectedDevice,
      });
    }
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg p-1.5 bg-primary/10">
              <Zap className="h-4 w-4 text-primary" />
            </div>
            <CardTitle className="text-sm font-semibold font-display">Simulador de Telemetría</CardTitle>
          </div>
          {autoMode && (
            <Badge className="bg-success/15 text-success border-success/20 text-[10px] font-semibold animate-pulse">
              <Play className="h-3 w-3 mr-1" /> En vivo
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        {/* Device Selector */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Dispositivo Destino
          </Label>
          <Select value={selectedDevice} onValueChange={setSelectedDevice}>
            <SelectTrigger className="bg-secondary/50 border-border">
              <SelectValue placeholder="Seleccionar dispositivo..." />
            </SelectTrigger>
            <SelectContent>
              {devices.map(device => (
                <SelectItem key={device.id!} value={device.id!}>
                  {device.name} — {device.city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <Button
            onClick={() => doInject(false)}
            disabled={!selectedDevice || injecting}
            variant="outline"
            className="flex-1 border-primary/30 hover:bg-primary/10 hover:text-primary"
          >
            {injecting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            {injecting ? 'Enviando...' : 'Generar Datos Aleatorios'}
          </Button>
        </div>

        {/* Auto Simulation Toggle */}
        <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-secondary/30 border border-border">
          <div className="flex items-center gap-2">
            {autoMode ? (
              <Play className="h-4 w-4 text-success" />
            ) : (
              <Pause className="h-4 w-4 text-muted-foreground" />
            )}
            <div>
              <p className="text-sm font-medium text-card-foreground">Simulación Automática</p>
              <p className="text-[11px] text-muted-foreground">Inyecta datos cada 5 segundos</p>
            </div>
          </div>
          <Switch checked={autoMode} onCheckedChange={handleAutoModeToggle} />
        </div>

        {/* Last Payload Preview */}
        {lastPayload && (
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Última Lectura Generada
            </Label>
            <div className="p-3 rounded-lg bg-secondary/50 border border-border font-mono text-xs space-y-1">
              <div className="grid grid-cols-3 gap-2">
                <span className="text-muted-foreground">temp:</span>
                <span className="text-card-foreground col-span-2">{lastPayload.temp} °C</span>
                <span className="text-muted-foreground">hum:</span>
                <span className="text-card-foreground col-span-2">{lastPayload.hum} %</span>
                <span className="text-muted-foreground">co:</span>
                <span className="text-card-foreground col-span-2">{lastPayload.co} ppm</span>
                <span className="text-muted-foreground">ch4:</span>
                <span className="text-card-foreground col-span-2">{lastPayload.ch4} ppm</span>
                <span className="text-muted-foreground">c3h8:</span>
                <span className="text-card-foreground col-span-2">{lastPayload.c3h8} ppm</span>
                <span className="text-muted-foreground">aqi:</span>
                <span className={`col-span-2 font-semibold ${lastPayload.aqi > 150 ? 'text-warning' : 'text-success'}`}>
                  {lastPayload.aqi}
                </span>
                <span className="text-muted-foreground">status:</span>
                <span className="col-span-2">
                  <Badge
                    className={`text-[10px] ${
                      lastPayload.status === 'warning'
                        ? 'bg-warning/15 text-warning border-warning/20'
                        : 'bg-success/15 text-success border-success/20'
                    }`}
                  >
                    {lastPayload.status}
                  </Badge>
                </span>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground text-right">
              Total inyecciones: {injectionCount}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
