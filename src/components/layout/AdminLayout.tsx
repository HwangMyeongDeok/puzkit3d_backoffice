import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Users, 
  LogOut, 
  Menu
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export function AdminLayout() {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Define navigation items with their required roles
  const navItems = [
    {
      title: 'Dashboard',
      href: '/',
      icon: LayoutDashboard,
      roles: ['STAFF', 'MANAGER'],
    },
    {
      title: 'Orders',
      href: '/orders',
      icon: ShoppingCart,
      roles: ['STAFF', 'MANAGER'],
    },
    {
      title: 'Partner Approvals',
      href: '/partners',
      icon: Users,
      roles: ['MANAGER'],
    },
  ];

  // Filter items based on current user's role
  const filteredNavItems = navItems.filter(item => 
    user && item.roles.includes(user.role)
  );

  return (
    <div className="flex min-h-screen w-full bg-muted/40">
      {/* Sidebar (Desktop) */}
      <aside className="fixed inset-y-0 left-0 z-10 hidden w-64 flex-col border-r bg-background sm:flex">
        <div className="flex h-14 items-center border-b px-6 lg:h-[60px]">
          <Link to="/" className="flex items-center gap-2 font-bold">
            <span className="text-lg">PuzKit3D Admin</span>
          </Link>
        </div>
        <div className="flex-1 py-4">
          <nav className="grid items-start px-4 text-sm font-medium gap-1">
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary ${
                    isActive ? "bg-muted text-primary" : "text-muted-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.title}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-64 w-full">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
          <Button 
            variant="outline" 
            size="icon" 
            className="sm:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
          </Button>

          <div className="flex-1" />
          
          {user && (
            <div className="flex items-center gap-4">
              <div className="hidden md:flex flex-col items-end">
                <span className="text-sm font-medium">{user.name}</span>
                <span className="text-xs text-muted-foreground capitalize">{user.role}</span>
              </div>
              <Button variant="ghost" size="icon" onClick={logout} title="Logout">
                <LogOut className="h-5 w-5" />
                <span className="sr-only">Logout</span>
              </Button>
            </div>
          )}
        </header>

        {/* Mobile Sidebar Overlay (Simple toggle for demo purposes) */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm sm:hidden">
            <div className="fixed inset-y-0 left-0 w-3/4 max-w-xs border-r bg-background p-6 shadow-lg">
              <div className="flex items-center justify-between mb-8">
                <span className="font-bold text-lg">PuzKit3D Admin</span>
                <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)}>
                  <Menu className="h-5 w-5" />
                </Button>
              </div>
              <nav className="grid gap-2">
                {filteredNavItems.map((item) => {
                   const Icon = item.icon;
                   const isActive = location.pathname === item.href;
                   return (
                     <Link
                       key={item.href}
                       to={item.href}
                       onClick={() => setIsMobileMenuOpen(false)}
                       className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium ${
                         isActive ? "bg-muted text-primary" : "text-muted-foreground"
                       }`}
                     >
                       <Icon className="h-4 w-4" />
                       {item.title}
                     </Link>
                   )
                })}
              </nav>
            </div>
          </div>
        )}

        <main className="flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
