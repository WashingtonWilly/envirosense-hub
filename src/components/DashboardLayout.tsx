import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Bell } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface DashboardLayoutProps {
  children: React.ReactNode;
  alertCount?: number;
  connected?: boolean;
}

export function DashboardLayout({ children, alertCount = 0, connected = false }: DashboardLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center justify-between border-b border-border bg-card px-4">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
              <div className="hidden sm:flex items-center gap-2">
                <div className={`h-2.5 w-2.5 rounded-full ${connected ? 'bg-success animate-pulse-glow' : 'bg-destructive'}`} />
                <span className="text-xs text-muted-foreground">
                  {connected ? 'Conectado al broker MQTT' : 'Desconectado'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Bell className="h-5 w-5 text-muted-foreground" />
                {alertCount > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-4 min-w-4 px-1 text-[10px] bg-destructive text-destructive-foreground border-0">
                    {alertCount}
                  </Badge>
                )}
              </div>
              <div className={`sm:hidden h-2.5 w-2.5 rounded-full ${connected ? 'bg-success animate-pulse-glow' : 'bg-destructive'}`} />
            </div>
          </header>
          <main className="flex-1 overflow-auto p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
