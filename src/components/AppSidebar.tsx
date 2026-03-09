import { 
  LayoutDashboard, MapPin, Cpu, Warehouse, AlertTriangle, Users, Settings, 
  Zap, UserCircle
} from 'lucide-react';
import guardchicksLogo from '@/assets/guardchicks-logo.png';
import { NavLink } from '@/components/NavLink';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useAuth, AppRole } from '@/contexts/AuthContext';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';

interface NavItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: AppRole[];
}

const mainItems: NavItem[] = [
  { title: 'Dashboard', url: '/', icon: LayoutDashboard },
  { title: 'Mapa de Sensores', url: '/map', icon: MapPin },
  { title: 'Dispositivos', url: '/devices', icon: Cpu },
  { title: 'Ubicaciones', url: '/cities', icon: Warehouse, roles: ['super_admin', 'admin'] },
  { title: 'Alertas', url: '/alerts', icon: AlertTriangle, roles: ['super_admin', 'admin'] },
  { title: 'Usuarios', url: '/users', icon: Users, roles: ['super_admin'] },
];

const bottomItems: NavItem[] = [
  { title: 'Mi Cuenta', url: '/profile', icon: UserCircle },
  { title: 'Configuración', url: '/settings', icon: Settings, roles: ['super_admin'] },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const { hasRole } = useAuth();

  const filterByRole = (items: NavItem[]) =>
    items.filter((item) => !item.roles || hasRole(item.roles));

  const visibleMain = filterByRole(mainItems);
  const visibleBottom = filterByRole(bottomItems);

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarHeader className="px-4 py-5 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl overflow-hidden bg-sidebar-accent">
            <img src={guardchicksLogo} alt="GuardChicks" className="h-9 w-9 object-contain" />
            <div className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-success border-2 border-sidebar" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-bold font-display tracking-wide text-sidebar-accent-foreground">
                GuardChicks
              </span>
              <span className="text-[10px] uppercase tracking-[0.15em] text-sidebar-foreground font-medium">
                Control Ambiental Avícola
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-3">
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-[0.15em] text-sidebar-foreground/40 font-semibold mb-1 px-3">
            Plataforma
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5">
              {visibleMain.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === '/'}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium text-sidebar-foreground transition-all duration-200 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      activeClassName="bg-primary/10 text-primary border border-primary/20 glow-primary"
                    >
                      <item.icon className="h-[18px] w-[18px] shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="px-2 pb-4 border-t border-sidebar-border pt-3">
        <SidebarMenu>
          {visibleBottom.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild>
                <NavLink
                  to={item.url}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium text-sidebar-foreground transition-all duration-200 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  activeClassName="bg-primary/10 text-primary border border-primary/20"
                >
                  <item.icon className="h-[18px] w-[18px] shrink-0" />
                  {!collapsed && <span>{item.title}</span>}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
          <SidebarMenuItem>
            <ThemeToggle collapsed={collapsed} />
          </SidebarMenuItem>
        </SidebarMenu>
        {!collapsed && (
          <div className="mt-3 mx-3 rounded-lg bg-sidebar-accent/50 p-3 border border-sidebar-border">
            <div className="flex items-center gap-2 text-[11px] text-sidebar-foreground">
              <Zap className="h-3.5 w-3.5 text-primary" />
              <span>GuardChicks Platform v2.0</span>
            </div>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
