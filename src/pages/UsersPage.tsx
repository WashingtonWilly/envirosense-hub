import { DashboardLayout } from '@/components/DashboardLayout';
import { APP_USERS } from '@/lib/smart-city-data';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, User, Shield, Eye, MapPin } from 'lucide-react';

const roleConfig = {
  super_admin: { label: 'Super Admin', badge: 'bg-primary/15 text-primary border-primary/20', icon: Shield },
  admin: { label: 'Admin', badge: 'bg-info/15 text-info border-info/20', icon: Shield },
  user: { label: 'Usuario', badge: 'bg-secondary text-muted-foreground border-border', icon: Eye },
};

const UsersPage = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="rounded-xl p-2 bg-primary/10">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold font-display text-foreground">Usuarios</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Administración de usuarios del sistema</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge className="bg-primary/15 text-primary border-primary/20">{APP_USERS.filter(u => u.role === 'super_admin').length} Super Admin</Badge>
          <Badge className="bg-info/15 text-info border-info/20">{APP_USERS.filter(u => u.role === 'admin').length} Admins</Badge>
          <Badge className="bg-secondary text-muted-foreground border-border">{APP_USERS.filter(u => u.role === 'user').length} Usuarios</Badge>
        </div>

        <div className="grid gap-3">
          {APP_USERS.map((user, i) => {
            const config = roleConfig[user.role];
            const RoleIcon = config.icon;
            return (
              <Card key={user.id} className="bg-card border-border hover:border-primary/20 transition-all duration-300 animate-slide-in" style={{ animationDelay: `${i * 60}ms` }}>
                <CardContent className="p-4 md:p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-11 w-11 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-card-foreground font-display">{user.name}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" />
                        <span>{user.city}</span>
                      </div>
                      <Badge className={`text-[10px] ${config.badge}`}>
                        <RoleIcon className="h-3 w-3 mr-1" />
                        {config.label}
                      </Badge>
                    </div>
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

export default UsersPage;
