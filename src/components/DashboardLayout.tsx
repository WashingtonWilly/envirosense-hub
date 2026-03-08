import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { ThemeToggleCompact } from '@/components/ThemeToggle';
import { Bell, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';

interface DashboardLayoutProps {
  children: React.ReactNode;
  alertCount?: number;
  connected?: boolean;
}

function LiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <span className="font-mono text-xs text-muted-foreground tabular-nums">
      {time.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
    </span>
  );
}

export function DashboardLayout({ children, alertCount = 0, connected = false }: DashboardLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top bar */}
          <header className="h-14 flex items-center justify-between border-b border-border bg-card/50 backdrop-blur-sm px-4 sticky top-0 z-20">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground transition-colors" />
              
              {/* Connection status */}
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/50 border border-border">
                <div className={`h-2 w-2 rounded-full transition-colors ${connected ? 'bg-success status-pulse' : 'bg-destructive'}`} />
                <span className="text-[11px] font-medium text-muted-foreground">
                  {connected ? 'MQTT Conectado' : 'Sin conexión'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Live clock */}
              <div className="hidden md:flex items-center gap-1.5 text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                <LiveClock />
              </div>

              {/* Theme toggle in header */}
              <ThemeToggleCompact />

              {/* Alerts bell */}
              <button className="relative p-2 rounded-lg hover:bg-secondary/50 transition-colors">
                <Bell className="h-4 w-4 text-muted-foreground" />
                {alertCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                    {alertCount > 99 ? '99+' : alertCount}
                  </span>
                )}
              </button>

              {/* Mobile connection dot */}
              <div className={`sm:hidden h-2.5 w-2.5 rounded-full ${connected ? 'bg-success status-pulse' : 'bg-destructive'}`} />
            </div>
          </header>

          {/* Main content */}
          <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
            <div className="max-w-[1600px] mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
