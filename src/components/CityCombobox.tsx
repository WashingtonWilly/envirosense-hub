import { useState, useRef, useEffect } from 'react';
import { Check, ChevronsUpDown, Plus, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { useFirestoreCities } from '@/hooks/useFirestoreCities';

interface CityComboboxProps {
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
}

export function CityCombobox({ value, onValueChange, className }: CityComboboxProps) {
  const { cities, loading, addCity } = useFirestoreCities();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [adding, setAdding] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setSearch('');
    }
  }, [open]);

  const filtered = cities.filter((c) =>
    c.toLowerCase().includes(search.toLowerCase().trim())
  );

  const exactMatch = cities.some(
    (c) => c.toLowerCase() === search.toLowerCase().trim()
  );
  const showCreate = search.trim().length > 0 && !exactMatch;

  const handleSelect = (city: string) => {
    onValueChange(city);
    setOpen(false);
  };

  const handleCreate = async () => {
    const name = search.trim();
    if (!name) return;
    setAdding(true);
    try {
      await addCity(name);
      onValueChange(name);
      setOpen(false);
    } finally {
      setAdding(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            'w-full justify-between bg-secondary/50 border-border font-normal h-10 text-sm',
            !value && 'text-muted-foreground',
            className,
          )}
        >
          {value || 'Selecciona una ubicaciónión'}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <div className="flex items-center border-b border-border px-3">
          <input
            ref={inputRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar o crubicaciónudad..."
            className="flex h-10 w-full bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>

        <div className="max-h-[200px] overflow-y-auto p-1">
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 && !showCreate ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No se encontraron ciudades
            </p>
          ) : (
            <>
              {filtered.map((city) => (
                <button
                  key={city}
                  onClick={() => handleSelect(city)}
                  className={cn(
                    'relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground',
                    value === city && 'bg-accent text-accent-foreground',
                  )}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === city ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                  {city}
                </button>
              ))}
            </>
          )}

          {showCreate && (
            <button
              onClick={handleCreate}
              disabled={adding}
              className="relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground text-primary font-medium"
            >
              {adding ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Agregar "{search.trim()}"
            </button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
