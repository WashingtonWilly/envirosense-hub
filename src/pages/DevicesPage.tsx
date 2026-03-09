import { DashboardLayout } from '@/components/DashboardLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DeviceFormDialog } from '@/components/DeviceFormDialog';
import { Cpu, Search, Plus, Loader2, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { useState } from 'react';
import { usePaginatedDevices } from '@/hooks/useFirestoreDevices';
import { DeviceListItem } from '@/components/DeviceListItem';
import type { FirestoreDevice } from '@/lib/firestore-types';
import { toast } from 'sonner';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { logActivity } from '@/lib/audit-utils';

const DevicesPage = () => {
  const { hasRole } = useAuth();
  const canManage = hasRole(['super_admin', 'admin']);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'offline' | 'warning'>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDevice, setEditDevice] = useState<FirestoreDevice | null>(null);

  const {
    devices, loading, currentPage, totalPages, totalCount, isSearching,
    goToNextPage, goToPrevPage,
    updateDevice, deleteDevice,
  } = usePaginatedDevices({ statusFilter, searchQuery: search });

  const openAdd = () => { setEditDevice(null); setDialogOpen(true); };

  const openEdit = (d: FirestoreDevice) => { setEditDevice(d); setDialogOpen(true); };

  const handleSave = async (data: Omit<FirestoreDevice, 'id'>) => {
    // Uses setDoc if a custom ID was provided via the form's deviceId field
    // The DeviceFormDialog handles the deviceId internally — here we just call addDevice
    const { addDevice } = await import('@/lib/firestore-service');
    await addDevice(data);
  };

  const handleUpdate = async (id: string, data: Partial<FirestoreDevice>) => {
    await updateDevice(id, data);
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

          {canManage && (
            <Button size="sm" onClick={openAdd} className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-1.5" /> Agregar
            </Button>
          )}
        </div>

        {/* Device Form Dialog */}
        <DeviceFormDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          editDevice={editDevice}
          onSave={handleSave}
          onUpdate={handleUpdate}
        />

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
              <Button variant="outline" size="sm" onClick={goToPrevPage} disabled={currentPage <= 1} className="h-8 border-border">
                <ChevronLeft className="h-4 w-4" />
                <span className="hidden sm:inline ml-1">Anterior</span>
              </Button>
              <div className="px-3 py-1 text-sm font-medium text-foreground">{currentPage}</div>
              <Button variant="outline" size="sm" onClick={goToNextPage} disabled={currentPage >= totalPages} className="h-8 border-border">
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
