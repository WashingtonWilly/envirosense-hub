import { useState, useEffect, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CityCombobox } from '@/components/CityCombobox';
import { Loader2, MapPin } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { FirestoreDevice } from '@/lib/firestore-types';
import { toast } from 'sonner';

async function geocodeCity(cityName: string): Promise<[number, number] | null> {
  try {
    const q = encodeURIComponent(`${cityName}, Ecuador`);
    const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`, {
      headers: { 'Accept-Language': 'es' },
    });
    const data = await res.json();
    if (data.length > 0) {
      return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
    }
  } catch (e) {
    console.warn('Geocoding failed for', cityName, e);
  }
  return null;
}

// Fix default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});


const DEFAULT_CENTER: [number, number] = [-1.6697, -78.6510];
const DEFAULT_ZOOM = 14;

interface DeviceFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editDevice: FirestoreDevice | null;
  onSave: (data: Omit<FirestoreDevice, 'id'>) => Promise<void>;
  onUpdate: (id: string, data: Partial<FirestoreDevice>) => Promise<void>;
}

function LocationPicker({ position, onSelect }: { position: [number, number] | null; onSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return position ? <Marker position={position} /> : null;
}

export function DeviceFormDialog({ open, onOpenChange, editDevice, onSave, onUpdate }: DeviceFormDialogProps) {
  const [name, setName] = useState('');
  const [deviceId, setDeviceId] = useState('');
  const [city, setCity] = useState('');
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [status, setStatus] = useState<'online' | 'offline' | 'warning'>('offline');
  const [saving, setSaving] = useState(false);
  const mapRef = useRef<L.Map | null>(null);

  const isEdit = !!editDevice;

  useEffect(() => {
    if (open) {
      if (editDevice) {
        setName(editDevice.name);
        setDeviceId(editDevice.id || '');
        setCity(editDevice.city);
        setPosition([editDevice.lat, editDevice.lng]);
        setStatus(editDevice.status);
      } else {
        setName('');
        setDeviceId('');
        setCity('');
        setPosition(null);
        setStatus('offline');
      }
    }
  }, [open, editDevice]);

  // Invalidate map size when dialog opens
  useEffect(() => {
    if (open && mapRef.current) {
      setTimeout(() => mapRef.current?.invalidateSize(), 300);
    }
  }, [open]);

  const handlePositionSelect = (lat: number, lng: number) => {
    setPosition([lat, lng]);
  };

  const handleCityChange = useCallback(async (newCity: string) => {
    setCity(newCity);
    if (!newCity.trim()) return;
    const coords = await geocodeCity(newCity);
    if (coords && mapRef.current) {
      mapRef.current.flyTo(coords, 13);
    }
  }, []);

  const isValid = name.trim() && city && position;

  const handleSave = async () => {
    if (!isValid) {
      toast.error('Completa todos los campos y selecciona una ubicación en el mapa');
      return;
    }
    setSaving(true);
    try {
      if (isEdit && editDevice?.id) {
        await onUpdate(editDevice.id, {
          name: name.trim(),
          city,
          lat: position![0],
          lng: position![1],
          status,
        });
        toast.success('Dispositivo actualizado');
      } else {
        await onSave({
          name: name.trim(),
          city,
          lat: position![0],
          lng: position![1],
          status: 'offline',
          lastSeen: new Date(),
        });
        toast.success('Dispositivo registrado correctamente');
      }
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving device:', error);
      toast.error('Error al guardar el dispositivo');
    } finally {
      setSaving(false);
    }
  };

  const mapCenter: [number, number] = editDevice ? [editDevice.lat, editDevice.lng] : DEFAULT_CENTER;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">{isEdit ? 'Editar Dispositivo' : 'Nuevo Dispositivo'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Name */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Nombre del Sensor</Label>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ej. Sensor Mercado"
              className="bg-secondary/50 border-border"
            />
          </div>

          {/* Device ID (only on create) */}
          {!isEdit && (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">ID del Dispositivo</Label>
              <Input
                value={deviceId}
                onChange={e => setDeviceId(e.target.value)}
                placeholder="Ej. DEV-015"
                className="bg-secondary/50 border-border font-mono"
              />
              <p className="text-[10px] text-muted-foreground">Opcional. Si se deja vacío, Firestore generará uno automáticamente.</p>
            </div>
          )}

          {/* City */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Ciudad</Label>
            <CityCombobox value={city} onValueChange={setCity} />
          </div>

          {/* Mini Map */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" />
              Ubicación
              {position && (
                <span className="text-[10px] font-mono text-primary ml-auto">
                  {position[0].toFixed(4)}, {position[1].toFixed(4)}
                </span>
              )}
            </Label>
            <div className="rounded-lg overflow-hidden border border-border h-[200px] relative">
              {open && (
                <MapContainer
                  center={mapCenter}
                  zoom={DEFAULT_ZOOM}
                  className="h-full w-full z-0"
                  ref={mapRef}
                  scrollWheelZoom
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <LocationPicker position={position} onSelect={handlePositionSelect} />
                </MapContainer>
              )}
              {!position && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[1000]">
                  <span className="text-xs text-muted-foreground bg-background/80 px-3 py-1.5 rounded-full backdrop-blur-sm">
                    Haz clic en el mapa para fijar la ubicación
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Status (only on edit) */}
          {isEdit && (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Estado</Label>
              <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                <SelectTrigger className="bg-secondary/50 border-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="offline">Offline</SelectItem>
                  <SelectItem value="warning">Advertencia</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" className="border-border">Cancelar</Button>
          </DialogClose>
          <Button onClick={handleSave} disabled={!isValid || saving} className="bg-primary text-primary-foreground">
            {saving && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
            {isEdit ? 'Guardar Cambios' : 'Registrar Dispositivo'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
