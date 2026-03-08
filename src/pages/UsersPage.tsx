import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useFirestoreUsers, type FirestoreUser } from '@/hooks/useFirestoreUsers';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Users, Search, Shield, ShieldCheck, Eye, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { AppRole } from '@/contexts/AuthContext';

const ROLE_META: Record<AppRole, { label: string; badge: string; icon: typeof Shield }> = {
  super_admin: { label: 'Super Admin', badge: 'bg-primary/15 text-primary border-primary/20', icon: ShieldCheck },
  admin: { label: 'Admin', badge: 'bg-info/15 text-info border-info/20', icon: Shield },
  user: { label: 'Usuario', badge: 'bg-secondary text-muted-foreground border-border', icon: Eye },
};

const UsersPage = () => {
  const { users, loading, updateRole, toggleActive } = useFirestoreUsers();
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  const filtered = useMemo(() => {
    let list = users;
    if (roleFilter !== 'all') {
      list = list.filter((u) => u.role === roleFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
      );
    }
    return list;
  }, [users, search, roleFilter]);

  async function handleRoleChange(user: FirestoreUser, newRole: AppRole) {
    try {
      await updateRole(user.uid, newRole);
      toast({ title: 'Rol actualizado', description: `${user.name} ahora es ${ROLE_META[newRole].label}` });
    } catch {
      toast({ title: 'Error', description: 'No se pudo actualizar el rol', variant: 'destructive' });
    }
  }

  async function handleToggleActive(user: FirestoreUser) {
    const next = !user.isActive;
    try {
      await toggleActive(user.uid, next);
      toast({
        title: next ? 'Usuario activado' : 'Usuario suspendido',
        description: `${user.name} ha sido ${next ? 'activado' : 'suspendido'}`,
      });
    } catch {
      toast({ title: 'Error', description: 'No se pudo cambiar el estado', variant: 'destructive' });
    }
  }

  const counts = useMemo(() => ({
    super_admin: users.filter((u) => u.role === 'super_admin').length,
    admin: users.filter((u) => u.role === 'admin').length,
    user: users.filter((u) => u.role === 'user').length,
  }), [users]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="rounded-xl p-2 bg-primary/10">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold font-display text-foreground">Usuarios</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Administración de usuarios del sistema</p>
          </div>
        </div>

        {/* Badges de resumen */}
        <div className="flex flex-wrap gap-2">
          <Badge className="bg-primary/15 text-primary border-primary/20">{counts.super_admin} Super Admin</Badge>
          <Badge className="bg-info/15 text-info border-info/20">{counts.admin} Admins</Badge>
          <Badge className="bg-secondary text-muted-foreground border-border">{counts.user} Usuarios</Badge>
        </div>

        {/* Filtros */}
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre o correo..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filtrar por rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los roles</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="user">Usuario</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        {loading ? (
          <Card className="bg-card border-border">
            <CardContent className="p-4 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                  <Skeleton className="h-8 w-28" />
                  <Skeleton className="h-6 w-12 rounded-full" />
                </div>
              ))}
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-card border-border overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead className="hidden md:table-cell">Ciudad</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Activo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                        No se encontraron usuarios
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((user) => {
                      const isSelf = currentUser?.uid === user.uid;
                      const meta = ROLE_META[user.role] || ROLE_META.user;
                      const RoleIcon = meta.icon;

                      return (
                        <TableRow
                          key={user.uid}
                          className={!user.isActive ? 'opacity-50' : ''}
                        >
                          {/* User info */}
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                <RoleIcon className="h-4 w-4 text-primary" />
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium text-card-foreground truncate">{user.name}</p>
                                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                              </div>
                            </div>
                          </TableCell>

                          {/* City */}
                          <TableCell className="hidden md:table-cell">
                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                              <MapPin className="h-3.5 w-3.5 shrink-0" />
                              <span>{user.city}</span>
                            </div>
                          </TableCell>

                          {/* Role selector */}
                          <TableCell>
                            {isSelf ? (
                              <Badge className={`text-[10px] ${meta.badge}`}>
                                <RoleIcon className="h-3 w-3 mr-1" />
                                {meta.label}
                              </Badge>
                            ) : (
                              <Select
                                value={user.role}
                                onValueChange={(v) => handleRoleChange(user, v as AppRole)}
                              >
                                <SelectTrigger className="w-[140px] h-8 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="super_admin">Super Admin</SelectItem>
                                  <SelectItem value="admin">Admin</SelectItem>
                                  <SelectItem value="user">Usuario</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                          </TableCell>

                          {/* Status badge */}
                          <TableCell>
                            {user.isActive ? (
                              <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/20 text-[10px]">Activo</Badge>
                            ) : (
                              <Badge variant="outline" className="text-[10px] text-destructive border-destructive/30">Suspendido</Badge>
                            )}
                          </TableCell>

                          {/* Toggle */}
                          <TableCell className="text-right">
                            {isSelf ? (
                              <span className="text-[10px] text-muted-foreground">—</span>
                            ) : (
                              <Switch
                                checked={user.isActive}
                                onCheckedChange={() => handleToggleActive(user)}
                              />
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default UsersPage;
