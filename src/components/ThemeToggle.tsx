import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';

interface ThemeToggleProps {
  collapsed?: boolean;
}

export function ThemeToggle({ collapsed = false }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-[13px] font-medium text-sidebar-foreground transition-all duration-200 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
    >
      <div className="relative h-[18px] w-[18px] shrink-0">
        <Sun className={`absolute inset-0 h-[18px] w-[18px] transition-all duration-300 ${theme === 'dark' ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'}`} />
        <Moon className={`absolute inset-0 h-[18px] w-[18px] transition-all duration-300 ${theme === 'light' ? 'rotate-0 scale-100 opacity-100' : 'rotate-90 scale-0 opacity-0'}`} />
      </div>
      {!collapsed && (
        <span>{theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}</span>
      )}
    </button>
  );
}

export function ThemeToggleCompact() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="relative p-2 rounded-lg hover:bg-secondary/50 transition-colors"
      title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
    >
      <div className="relative h-4 w-4">
        <Sun className={`absolute inset-0 h-4 w-4 text-muted-foreground transition-all duration-300 ${theme === 'dark' ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'}`} />
        <Moon className={`absolute inset-0 h-4 w-4 text-muted-foreground transition-all duration-300 ${theme === 'light' ? 'rotate-0 scale-100 opacity-100' : 'rotate-90 scale-0 opacity-0'}`} />
      </div>
    </button>
  );
}
