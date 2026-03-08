import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Zap, Play, Pause, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface SimulatedPayload {
  temp: number;
  hum: number;
  co: number;
  ch4: number;
  c3h8: number;
  aqi: number;
  status: 'online' | 'warning';
  timestamp: number;
}

const MOCK_DEVICES = [
  { id: 'device-001', name: 'Dispositivo 1 - Centro' },
  { id: 'device-002', name: 'Dispositivo 2 - Norte' },
  { id: 'device-003', name: 'Dispositivo 3 - Sur' },
];

function generateRandomPayload(): SimulatedPayload {
  const temp = parseFloat((Math.random() * (35 - 10) + 10).toFixed(1));
  const hum = parseFloat((Math.random() * (90 - 30) + 30).toFixed(1));
  const co = parseFloat((Math.random() * 50).toFixed(1));
  const ch4 = Math.floor(Math.random() * (500 - 100) + 100);
  const c3h8 = Math.floor(Math.random() * (600 - 100) + 100);
  const aqi = Math.floor(Math.random() * 301);
  const status: 'online' | 'warning' = aqi > 150 ? 'warning' : 'online';

  return { temp, hum, co, ch4, c3h8, aqi, status, timestamp: Date.now() };
}

export function TelemetrySimulator() {
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [autoMode, setAutoMode] = useState(false);
  const [lastPayload, setLastPayload] = useState<SimulatedPayload | null>(null);
  const [injectionCount, setInjectionCount] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const handleGenerate = () => {
    if (!selectedDevice) {
      toast.error('Selecciona un dispositivo primero');
      return;
    }

    const payload = generateRandomPayload();
    setLastPayload(payload);
    setInjectionCount(prev => prev + 1);

    console.log(`[TelemetrySimulator] Dispositivo: ${selectedDevice}`, payload);
    toast.success(`Datos generados para ${selectedDevice}`, {
      description: `AQI: ${payload.aqi} | Status: ${payload.status}`,
    });
  };

  useEffect(() => {
    if (autoMode && selectedDevice) {
      intervalRef.current = setInterval(() => {
        const payload = generateRandomPayload();
        setLastPayload(payload);
        setInjectionCount(prev => prev + 1);

        console.log(`[TelemetrySimulator][AUTO] Dispositivo: ${selectedDevice}`, payload);
        toast.success('Datos inyectados (auto)', {
          description: `AQI: ${payload.aqi} | Status: ${payload.status}`,
          duration: 2000,
        });
      }, 5000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [autoMode, selectedDevice]);

  const handleAutoModeToggle = (checked: boolean) => {
    if (checked && !selectedDevice) {
      toast.error('Selecciona un dispositivo primero');
      return;
    }
    setAutoMode(checked);
    if (checked) {
      toast.info('Simulación automática activada (cada 5s)');
    } else {
      toast.info('Simulación automática desactivada');
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
              {MOCK_DEVICES.map(device => (
                <SelectItem key={device.id} value={device.id}>
                  {device.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <Button
            onClick={handleGenerate}
            disabled={!selectedDevice}
            variant="outline"
            className="flex-1 border-primary/30 hover:bg-primary/10 hover:text-primary"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Generar Datos Aleatorios
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
