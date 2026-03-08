import { useState, useCallback } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Search, Loader2 } from 'lucide-react';

interface LocationTabsProps {
  city: string;
  position: [number, number] | null;
  onPositionChange: (lat: number, lng: number) => void;
  onFlyTo: (lat: number, lng: number) => void;
}

async function geocodeAddress(address: string, city: string): Promise<[number, number] | null> {
  try {
    const q = encodeURIComponent(`${address}, ${city}, Ecuador`);
    const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`, {
      headers: { 'Accept-Language': 'es' },
    });
    const data = await res.json();
    if (data.length > 0) {
      return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
    }
  } catch (e) {
    console.warn('Geocoding failed', e);
  }
  return null;
}

export function LocationTabs({ city, position, onPositionChange, onFlyTo }: LocationTabsProps) {
  const [address, setAddress] = useState('');
  const [searching, setSearching] = useState(false);
  const [manualLat, setManualLat] = useState('');
  const [manualLng, setManualLng] = useState('');
  const [coordsSynced, setCoordsSynced] = useState(true);

  // Sync coordinate fields when position changes from map click (only if synced)
  const displayLat = coordsSynced && position ? position[0].toFixed(6) : manualLat;
  const displayLng = coordsSynced && position ? position[1].toFixed(6) : manualLng;

  const handleSearch = useCallback(async () => {
    if (!address.trim()) return;
    setSearching(true);
    try {
      const coords = await geocodeAddress(address, city);
      if (coords) {
        onPositionChange(coords[0], coords[1]);
        onFlyTo(coords[0], coords[1]);
        setManualLat(coords[0].toFixed(6));
        setManualLng(coords[1].toFixed(6));
        setCoordsSynced(true);
      } else {
        // Silently fail — map stays in current position
      }
    } finally {
      setSearching(false);
    }
  }, [address, city, onPositionChange, onFlyTo]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  const handleLatChange = (val: string) => {
    setManualLat(val);
    setCoordsSynced(false);
    const lat = parseFloat(val);
    const lng = parseFloat(manualLng);
    if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      onPositionChange(lat, lng);
      onFlyTo(lat, lng);
      setCoordsSynced(true);
    }
  };

  const handleLngChange = (val: string) => {
    setManualLng(val);
    setCoordsSynced(false);
    const lat = parseFloat(manualLat);
    const lng = parseFloat(val);
    if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      onPositionChange(lat, lng);
      onFlyTo(lat, lng);
      setCoordsSynced(true);
    }
  };

  // Called externally when map is clicked — keep coords in sync
  // This is handled via the displayLat/displayLng logic above

  return (
    <Tabs defaultValue="address" className="w-full">
      <TabsList className="w-full h-8 bg-secondary/50 p-0.5">
        <TabsTrigger value="address" className="flex-1 text-xs h-7 data-[state=active]:bg-background">
          Por Dirección
        </TabsTrigger>
        <TabsTrigger value="coords" className="flex-1 text-xs h-7 data-[state=active]:bg-background">
          Por Coordenadas
        </TabsTrigger>
      </TabsList>

      <TabsContent value="address" className="mt-2">
        <div className="flex gap-2">
          <Input
            value={address}
            onChange={e => setAddress(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ej. Calles o intersección"
            className="bg-secondary/50 border-border text-sm h-8 flex-1"
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleSearch}
            disabled={searching || !address.trim()}
            className="h-8 px-3 border-border"
          >
            {searching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </TabsContent>

      <TabsContent value="coords" className="mt-2">
        <div className="flex gap-2">
          <div className="flex-1 space-y-1">
            <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Latitud</Label>
            <Input
              type="number"
              step="any"
              value={displayLat}
              onChange={e => handleLatChange(e.target.value)}
              placeholder="-1.6697"
              className="bg-secondary/50 border-border text-sm h-8 font-mono"
            />
          </div>
          <div className="flex-1 space-y-1">
            <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Longitud</Label>
            <Input
              type="number"
              step="any"
              value={displayLng}
              onChange={e => handleLngChange(e.target.value)}
              placeholder="-78.6510"
              className="bg-secondary/50 border-border text-sm h-8 font-mono"
            />
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}
