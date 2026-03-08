import { Navigate } from 'react-router-dom';
import { useAuth, AppRole } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: AppRole[];
}

export function ProtectedRoute({ children, requiredRoles }: ProtectedRouteProps) {
  const { currentUser, userProfile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRoles && userProfile && !requiredRoles.includes(userProfile.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
