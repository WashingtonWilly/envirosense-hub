import { DashboardLayout } from '@/components/DashboardLayout';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Cpu, Search, MapPin, Wifi, WifiOff, AlertTriangle, Plus, Pencil, Trash2, Eye, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useFirestoreDevices } from '@/hooks/useFirestore';
import type { FirestoreDevice } from '@/lib/firestore-types';
import { toast } from 'sonner';

const DevicesPage = () => {
  const [search, setSearch] = useState('');
  const { devices, loading, addDevice, updateDevice, deleteDevice } = useFirestoreDevices();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDevice, setEditDevice] = useState<FirestoreDevice | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formCity, setFormCity] = useState('');
  const [formLat, setFormLat] = useState('');
  const [formLng, setFormLng] = useState('');
  const [formStatus, setFormStatus] = useState<'online' | 'offline' | 'warning'>('online');
  const [saving, setSaving] = useState(false);

  const resetForm = () => {
    setFormName('');
    setFormCity('');
    setFormLat('');
    setFormLng('');
    setFormStatus('online');
    setEditDevice(null);
  };

  const openAdd = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (d: FirestoreDevice) => {
    setEditDevice(d);
    setFormName(d.name);
    setFormCity(d.city);
    setFormLat(String(d.lat));
    setFormLng(String(d.lng));
    setFormStatus(d.status);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editDevice && editDevice.id) {
        await updateDevice(editDevice.id, {
          name: formName,
          city: formCity,
          lat: parseFloat(formLat) || 0,
          lng: parseFloat(formLng) || 0,
          status: formStatus,
        });
        toast.success('Dispositivo actualizado');
      } else {
        await addDevice({
          name: formName,
          city: formCity,
          lat: parseFloat(formLat) || 0,
          lng: parseFloat(formLng) || 0,
          status: formStatus,
          lastSeen: new Date(),
        });
        toast.success('Dispositivo creado');
      }
      setDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving device:', error);
      toast.error('Error al guardar dispositivo');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDevice(id);
      toast.success('Dispositivo eliminado');
    } catch (error) {
      console.error('Error deleting device:', error);
      toast.error('Error al eliminar dispositivo');
    }
  };

  const filtered = devices.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    (d.id || '').toLowerCase().includes(search.toLowerCase()) ||
    d.city.toLowerCase().includes(search.toLowerCase())
  );

  const statusIcon = (status: string) => {
    if (status === 'online') return <Wifi className="h-5 w-5 text-success" />;
    if (status === 'warning') return <AlertTriangle className="h-5 w-5 text-warning" />;
    return <WifiOff className="h-5 w-5 text-destructive" />;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl p-2 bg-primary/10">
              <Cpu className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold font-display text-foreground">Dispositivos</h1>
              <p className="text-xs text-muted-foreground mt-0.5">Gestión de sensores urbanos</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-success/10 border border-success/20">
              <div className="h-2 w-2 rounded-full bg-success" />
              <span className="text-[11px] font-semibold text-success">{devices.filter(d => d.status === 'online').length} Online</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-destructive/10 border border-destructive/20">
              <div className="h-2 w-2 rounded-full bg-destructive" />
              <span className="text-[11px] font-semibold text-destructive">{devices.filter(d => d.status === 'offline').length} Offline</span>
            </div>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" onClick={openAdd} className="bg-primary text-primary-foreground hover:bg-primary/90">
                  <Plus className="h-4 w-4 mr-1.5" /> Agregar
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border">
                <DialogHeader>
                  <DialogTitle className="font-display">{editDevice ? 'Editar Dispositivo' : 'Nuevo Dispositivo'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">Nombre</Label>
                    <Input value={formName} onChange={e => setFormName(e.target.value)} placeholder="Nombre del dispositivo" className="bg-secondary/50 border-border" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">Ciudad</Label>
                    <Input value={formCity} onChange={e => setFormCity(e.target.value)} placeholder="Riobamba" className="bg-secondary/50 border-border" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wider">Latitud</Label>
                      <Input value={formLat} onChange={e => setFormLat(e.target.value)} placeholder="-1.6635" className="bg-secondary/50 border-border font-mono" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wider">Longitud</Label>
                      <Input value={formLng} onChange={e => setFormLng(e.target.value)} placeholder="-78.6546" className="bg-secondary/50 border-border font-mono" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">Estado</Label>
                    <Select value={formStatus} onValueChange={(v: any) => setFormStatus(v)}>
                      <SelectTrigger className="bg-secondary/50 border-border"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="online">Online</SelectItem>
                        <SelectItem value="offline">Offline</SelectItem>
                        <SelectItem value="warning">Advertencia</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline" className="border-border">Cancelar</Button>
                  </DialogClose>
                  <Button onClick={handleSave} disabled={!formName.trim() || saving} className="bg-primary text-primary-foreground">
                    {saving && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
                    {editDevice ? 'Guardar Cambios' : 'Crear Dispositivo'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, ID o ciudad..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10 bg-secondary/50 border-border"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Cpu className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">No hay dispositivos registrados</p>
            <p className="text-xs text-muted-foreground mt-1">Agrega tu primer dispositivo con el botón "Agregar"</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {filtered.map((device, i) => (
              <Card key={device.id} className="bg-card border-border hover:border-primary/20 transition-all duration-300 animate-slide-in group" style={{ animationDelay: `${i * 40}ms` }}>
                <CardContent className="p-4 md:p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className={`h-12 w-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 ${device.status === 'online' ? 'bg-success/10' : device.status === 'warning' ? 'bg-warning/10' : 'bg-destructive/10'}`}>
                        {statusIcon(device.status)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-card-foreground font-display">{device.name}</h3>
                        <p className="text-xs text-muted-foreground font-mono mt-0.5">{device.id}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-primary/50" />
                        <span>{device.city}</span>
                      </div>
                      <Badge className={`text-[10px] font-semibold ${device.status === 'online' ? 'bg-success/15 text-success border-success/20' : device.status === 'warning' ? 'bg-warning/15 text-warning border-warning/20' : 'bg-destructive/15 text-destructive border-destructive/20'}`}>
                        {device.status}
                      </Badge>
                      <div className="flex items-center gap-1">
                        <Link to={`/devices/${device.id}`}>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-primary" title="Ver detalle">
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground" onClick={() => openEdit(device)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive" onClick={() => device.id && handleDelete(device.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DevicesPage;
