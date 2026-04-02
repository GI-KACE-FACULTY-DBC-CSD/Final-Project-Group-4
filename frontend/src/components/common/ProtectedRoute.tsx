import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { AuthLoadingScreen } from './AuthLoadingScreen';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'admin' | 'lecturer' | 'student';
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return <AuthLoadingScreen variant="fullscreen" />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    // Redirect to appropriate dashboard based on role
    const dashboardMap: Record<string, string> = {
      admin: '/admin/dashboard',
      lecturer: '/lecturer/dashboard',
      student: '/student/dashboard',
    };
    return <Navigate to={dashboardMap[user?.role || 'student']} replace />;
  }

  return <>{children}</>;
}
