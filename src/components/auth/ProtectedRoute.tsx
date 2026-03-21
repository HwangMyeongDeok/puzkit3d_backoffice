import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore, type Role } from '@/store/useAuthStore';

interface ProtectedRouteProps {
  allowedRoles?: Role[];
  children?: React.ReactNode;
}

export function ProtectedRoute({ allowedRoles, children }: ProtectedRouteProps) {
  const { isAuthenticated, user, isLoading } = useAuthStore();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <span className="text-muted-foreground">Loading...</span>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    // Lưu lại vị trí hiện tại để login xong quay lại đây
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Hỗ trợ cả bọc children HOẶC dùng Outlet cho react-router-dom v6/v7
  return children ? <>{children}</> : <Outlet />;
}