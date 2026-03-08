import { DashboardLayout } from '@/components/DashboardLayout';
import { CITIES, SMART_DEVICES } from '@/lib/smart-city-data';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Building2, MapPin, Cpu, Plus, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import type { City } from '@/lib/smart-city-data';

const CitiesPage = () => {
  const [cities, setCities] = useState<City[]>(CITIES);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editCity, setEditCity] = useState<City | null>(null);
  const [formName, setFormName] = useState('');
  const [formCountry, setFormCountry] = useState('Ecuador');
  const [formLat, setFormLat] = useState('');
  const [formLng, setFormLng] = useState('');

  const resetForm = () => { setFormName(''); setFormCountry('Ecuador'); setFormLat(''); setFormLng(''); setEditCity(null); };

  const openAdd = () => { resetForm(); setDialogOpen(true); };
  const openEdit = (c: City) => {
    setEditCity(c); setFormName(c.name); setFormCountry(c.country);
    setFormLat(String(c.latitude)); setFormLng(String(c.longitude));
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (editCity) {
      setCities(prev => prev.map(c => c.id === editCity.id ? { ...c, name: formName, country: formCountry, latitude: parseFloat(formLat) || c.latitude, longitude: parseFloat(formLng) || c.longitude } : c));
    } else {
      setCities(prev => [...prev, { id: `city-${String(prev.length + 1).padStart(3, '0')}`, name: formName, country: formCountry, latitude: parseFloat(formLat) || 0, longitude: parseFloat(formLng) || 0, totalDevices: 0, createdAt: new Date() }]);
    }
    setDialogOpen(false); resetForm();
  };

  const handleDelete = (id: string) => setCities(prev => prev.filter(c => c.id !== id));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl p-2 bg-primary/10">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold font-display text-foreground">Ciudades</h1>
              <p className="text-xs text-muted-foreground mt-0.5">Administración de ciudades monitoreadas</p>
            </div>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={openAdd} className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-1.5" /> Nueva Ciudad
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle className="font-display">{editCity ? 'Editar Ciudad' : 'Nueva Ciudad'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">Nombre</Label>
                  <Input value={formName} onChange={e => setFormName(e.target.value)} placeholder="Nombre de la ciudad" className="bg-secondary/50 border-border" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">País</Label>
                  <Input value={formCountry} onChange={e => setFormCountry(e.target.value)} className="bg-secondary/50 border-border" />
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
              </div>
              <DialogFooter>
                <DialogClose asChild><Button variant="outline" className="border-border">Cancelar</Button></DialogClose>
                <Button onClick={handleSave} disabled={!formName.trim()} className="bg-primary text-primary-foreground">{editCity ? 'Guardar' : 'Crear Ciudad'}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cities.map((city, i) => {
            const cityDevices = SMART_DEVICES.filter(d => d.cityId === city.id);
            const online = cityDevices.filter(d => d.status === 'online').length;
            return (
              <Card key={city.id} className="bg-card border-border hover:border-primary/20 transition-all duration-300 animate-slide-in" style={{ animationDelay: `${i * 80}ms` }}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-card-foreground font-display text-lg">{city.name}</h3>
                        <p className="text-xs text-muted-foreground">{city.country}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground" onClick={() => openEdit(city)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(city.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="p-3 rounded-lg bg-secondary/30 border border-border text-center">
                      <Cpu className="h-4 w-4 mx-auto text-primary mb-1" />
                      <p className="text-lg font-bold font-display text-card-foreground">{cityDevices.length}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Dispositivos</p>
                    </div>
                    <div className="p-3 rounded-lg bg-success/5 border border-success/20 text-center">
                      <div className="h-4 w-4 mx-auto rounded-full bg-success/20 flex items-center justify-center mb-1">
                        <div className="h-2 w-2 rounded-full bg-success" />
                      </div>
                      <p className="text-lg font-bold font-display text-success">{online}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Online</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    <span className="font-mono">{city.latitude.toFixed(4)}°, {city.longitude.toFixed(4)}°</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CitiesPage;
