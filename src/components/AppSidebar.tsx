import { 
  LayoutDashboard, MapPin, Cpu, Warehouse,
  AlertTriangle, Users, Settings, 
  Zap, UserCircle,
} from 'lucide-react';
import guardchicksLogo from '@/assets/guardchicks-logo.png';
import { NavLink } from '@/components/NavLink';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useAuth, AppRole } from '@/contexts/AuthContext';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
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
  {
    title: 'Ubicaciones', url: '/cities',
    icon: Warehouse, roles: ['super_admin', 'admin'],
  },
  {
    title: 'Alertas', url: '/alerts',
    icon: AlertTriangle, roles: ['super_admin', 'admin'],
  },
  {
    title: 'Usuarios', url: '/users',
    icon: Users, roles: ['super_admin'],
  },
];

const bottomItems: NavItem[] = [
  { title: 'Mi Cuenta', url: '/profile', icon: UserCircle },
  {
    title: 'Configuración', url: '/settings',
    icon: Settings, roles: ['super_admin'],
  },
];

function SidebarNavItem({
  item,
  collapsed,
}: {
  item: NavItem;
  collapsed: boolean;
}) {
  const link = (
    <NavLink
      to={item.url}
      end={item.url === '/'}
      className={`
        group/nav relative flex items-center gap-3
        rounded-lg px-3 py-2.5 text-[13px] font-medium
        text-sidebar-foreground transition-all duration-200
        hover:bg-sidebar-accent hover:text-sidebar-accent-foreground
        ${collapsed ? 'justify-center px-0' : ''}
      `}
      activeClassName={`
        bg-primary/10 text-primary
        border-l-2 border-l-primary
        !rounded-l-none
      `}
    >
      <item.icon className="h-[18px] w-[18px] shrink-0" />
      <span
        className={`
          transition-all duration-200
          ${collapsed
            ? 'w-0 opacity-0 overflow-hidden'
            : 'w-auto opacity-100'}
        `}
      >
        {item.title}
      </span>
    </NavLink>
  );

  if (collapsed) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton asChild>
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              {link}
            </TooltipTrigger>
            <TooltipContent
              side="right"
              className="bg-popover text-popover-foreground"
            >
              {item.title}
            </TooltipContent>
          </Tooltip>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild>
        {link}
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const { hasRole } = useAuth();

  const filterByRole = (items: NavItem[]) =>
    items.filter((i) => !i.roles || hasRole(i.roles));

  const visibleMain = filterByRole(mainItems);
  const visibleBottom = filterByRole(bottomItems);

  return (
    <Sidebar
      collapsible="icon"
      className="border-r-0 transition-all duration-300"
    >
      {/* ── Header ── */}
      <SidebarHeader
        className={`
          border-b border-sidebar-border transition-all duration-300
          ${collapsed ? 'px-2 py-4' : 'px-4 py-5'}
        `}
      >
        <div
          className={`
            flex items-center
            ${collapsed ? 'justify-center' : 'gap-3'}
          `}
        >
          <div
            className={`
              relative flex items-center justify-center
              rounded-xl overflow-hidden bg-sidebar-accent
              shrink-0 transition-all duration-300
              ${collapsed ? 'h-8 w-8' : 'h-10 w-10'}
            `}
          >
            <img
              src={guardchicksLogo}
              alt="GuardChicks"
              className={`
                object-contain transition-all duration-300
                ${collapsed ? 'h-7 w-7' : 'h-9 w-9'}
              `}
            />
            <div
              className="
                absolute -top-0.5 -right-0.5 h-2.5 w-2.5
                rounded-full bg-success border-2 border-sidebar
              "
            />
          </div>
          <div
            className={`
              flex flex-col transition-all duration-200 overflow-hidden
              ${collapsed
                ? 'w-0 opacity-0'
                : 'w-auto opacity-100'}
            `}
          >
            <span
              className="
                text-sm font-bold font-display tracking-wide
                text-sidebar-accent-foreground whitespace-nowrap
              "
            >
              GuardChicks
            </span>
            <span
              className="
                text-[10px] uppercase tracking-[0.15em]
                text-sidebar-foreground font-medium whitespace-nowrap
              "
            >
              Control Ambiental Avícola
            </span>
          </div>
        </div>
      </SidebarHeader>

      {/* ── Nav principal ── */}
      <SidebarContent className="px-2 py-3">
        <SidebarGroup>
          {!collapsed && (
            <SidebarGroupLabel
              className="
                text-[10px] uppercase tracking-[0.15em]
                text-sidebar-foreground/40 font-semibold
                mb-1 px-3
              "
            >
              Plataforma
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5">
              {visibleMain.map((item) => (
                <SidebarNavItem
                  key={item.title}
                  item={item}
                  collapsed={collapsed}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* ── Footer ── */}
      <SidebarFooter
        className="px-2 pb-4 border-t border-sidebar-border pt-3"
      >
        <SidebarMenu>
          {visibleBottom.map((item) => (
            <SidebarNavItem
              key={item.title}
              item={item}
              collapsed={collapsed}
            />
          ))}
          <SidebarMenuItem>
            <ThemeToggle collapsed={collapsed} />
          </SidebarMenuItem>
        </SidebarMenu>
        {!collapsed && (
          <div
            className="
              mt-3 mx-3 rounded-lg bg-sidebar-accent/50
              p-3 border border-sidebar-border
            "
          >
            <div
              className="
                flex items-center gap-2 text-[11px]
                text-sidebar-foreground
              "
            >
              <Zap className="h-3.5 w-3.5 text-primary" />
              <span>GuardChicks Platform v2.0</span>
            </div>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
