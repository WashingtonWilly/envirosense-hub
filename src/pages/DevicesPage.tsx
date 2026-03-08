import { DashboardLayout } from '@/components/DashboardLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Cpu, Search, Plus, Pencil, Loader2, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { useState } from 'react';
import { usePaginatedDevices } from '@/hooks/useFirestoreDevices';
import { DeviceListItem } from '@/components/DeviceListItem';
import type { FirestoreDevice } from '@/lib/firestore-types';
import { toast } from 'sonner';

const DevicesPage = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'offline' | 'warning'>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDevice, setEditDevice] = useState<FirestoreDevice | null>(null);

  const {
    devices, loading, currentPage, totalPages, totalCount, isSearching,
    goToNextPage, goToPrevPage, goToFirstPage,
    addDevice, updateDevice, deleteDevice,
  } = usePaginatedDevices({ statusFilter, searchQuery: search });

  // Form state
  const [formName, setFormName] = useState('');
  const [formCity, setFormCity] = useState('');
  const [formLat, setFormLat] = useState('');
  const [formLng, setFormLng] = useState('');
  const [formStatus, setFormStatus] = useState<'online' | 'offline' | 'warning'>('online');
  const [saving, setSaving] = useState(false);

  const resetForm = () => {
    setFormName(''); setFormCity(''); setFormLat(''); setFormLng('');
    setFormStatus('online'); setEditDevice(null);
  };

  const openAdd = () => { resetForm(); setDialogOpen(true); };

  const openEdit = (d: FirestoreDevice) => {
    setEditDevice(d); setFormName(d.name); setFormCity(d.city);
    setFormLat(String(d.lat)); setFormLng(String(d.lng));
    setFormStatus(d.status); setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editDevice?.id) {
        await updateDevice(editDevice.id, {
          name: formName, city: formCity,
          lat: parseFloat(formLat) || 0, lng: parseFloat(formLng) || 0,
          status: formStatus,
        });
        toast.success('Dispositivo actualizado');
      } else {
        await addDevice({
          name: formName, city: formCity,
          lat: parseFloat(formLat) || 0, lng: parseFloat(formLng) || 0,
          status: formStatus, lastSeen: new Date(),
        });
        toast.success('Dispositivo creado');
      }
      setDialogOpen(false); resetForm();
    } catch (error) {
      console.error('Error saving device:', error);
      toast.error('Error al guardar dispositivo');
    } finally { setSaving(false); }
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

  const onlineCount = devices.filter(d => d.status === 'online').length;
  const offlineCount = devices.filter(d => d.status === 'offline').length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl p-2 bg-primary/10">
              <Cpu className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold font-display text-foreground">Dispositivos</h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                {totalCount} dispositivo{totalCount !== 1 ? 's' : ''} registrado{totalCount !== 1 ? 's' : ''}
              </p>
            </div>
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

        {/* Search + Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, ID o ciudad..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 bg-secondary/50 border-border"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
              <SelectTrigger className="w-[140px] bg-secondary/50 border-border">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="online">Online</SelectItem>
                <SelectItem value="offline">Offline</SelectItem>
                <SelectItem value="warning">Advertencia</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Device List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : devices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Cpu className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">
              {search ? 'No se encontraron dispositivos' : 'No hay dispositivos registrados'}
            </p>
            {!search && <p className="text-xs text-muted-foreground mt-1">Agrega tu primer dispositivo con el botón "Agregar"</p>}
          </div>
        ) : (
          <div className="grid gap-3">
            {devices.map((device, i) => (
              <DeviceListItem
                key={device.id}
                device={device}
                index={i}
                onEdit={openEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {!isSearching && totalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-muted-foreground">
              Página {currentPage} de {totalPages} · {totalCount} dispositivos
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={goToPrevPage}
                disabled={currentPage <= 1}
                className="h-8 border-border"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="hidden sm:inline ml-1">Anterior</span>
              </Button>
              <div className="px-3 py-1 text-sm font-medium text-foreground">
                {currentPage}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={goToNextPage}
                disabled={currentPage >= totalPages}
                className="h-8 border-border"
              >
                <span className="hidden sm:inline mr-1">Siguiente</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DevicesPage;
