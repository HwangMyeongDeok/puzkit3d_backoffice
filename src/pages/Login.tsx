import { useAuthStore } from '@/store/useAuthStore';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function Login() {
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const handleLogin = (role: 'STAFF' | 'MANAGER') => {
    login({
      id: '1',
      name: role === 'MANAGER' ? 'Admin User' : 'Staff Member',
      email: role === 'MANAGER' ? 'admin@puzkit.com' : 'staff@puzkit.com',
      role,
    });
    navigate(from, { replace: true });
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-muted/40 px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">PuzKit3D Backoffice</CardTitle>
          <CardDescription>Select a role to continue testing RBAC</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Button onClick={() => handleLogin('STAFF')} className="w-full">
            Login as Staff
          </Button>
          <Button onClick={() => handleLogin('MANAGER')} variant="secondary" className="w-full">
            Login as Manager
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
