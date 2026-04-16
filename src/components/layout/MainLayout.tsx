import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  Package,
  LogOut,
  Menu,
  Headset,
  Settings,
  FileText,
  LibraryBig,
  Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export function MainLayout() {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    {
      title: 'Dashboard',
      href: '/',
      icon: LayoutDashboard,
      roles: ['Staff', 'Business Manager'],
    },
    {
      title: 'Orders',
      href: '/orders',
      icon: ShoppingCart,
      roles: ['Staff', 'Business Manager'],
    },
    {
      title: 'Instock Products',
      href: '/instock-products',
      icon: Package,
      roles: ['Staff', 'Business Manager'],
    },
    {
      title: 'Price Management',
      href: '/price-management',
      icon: Users,
      roles: ['Business Manager'],
    },
    {
      title: 'Inventory Management',
      href: '/inventory-management',
      icon: Users,
      roles: ['Business Manager'],
    },
    {
      title: 'Partner Approvals',
      href: '/partners',
      icon: Users,
      roles: ['Business Manager'],
    },
    {
      title: 'Partner Products',
      href: '/partner-products',
      icon: Package,
      roles: ['Business Manager'],
    },
    {
      title: 'Import Service Config',
      href: '/import-service-configs',
      icon: Settings,
      roles: ['Business Manager'],
    },
    {
      title: 'Partner Product Requests',
      href: '/partner-product-requests',
      icon: FileText,
      roles: ['Staff', 'Business Manager'],
    },
    {
      title: 'Support Tickets',
      href: '/support-tickets',
      icon: Headset,
      roles: ['Staff', 'Business Manager'],
    },
    {
      title: 'Feedback Management',
      href: '/feedback-management',
      icon: Headset,
      roles: ['Staff', 'Business Manager'],
    },
    {
      title: 'Catalog',
      href: '/catalog',
      icon: LibraryBig,
      roles: ['Staff', 'Business Manager'],
    },
    {
      title: 'Requests',
      href: '/requests',
      icon: Headset,
      roles: ['Staff', 'Business Manager'],
    },
    {
      title: 'Requirements',
      href: '/requirements',
      icon: Headset,
      roles: ['Staff', 'Business Manager'],
    },
    {
      title: 'Production Template',
      href: '/production-template',
      icon: Layers,
      roles: ['Staff', 'Business Manager'],
    },
    {
      title: 'System Configurations',
      href: '/system-configurations',
      icon: Settings,
      roles: ['Business Manager'],
    },
  ];

  const filteredNavItems = navItems.filter(
    (item) => user && item.roles.includes(user.role)
  );

  return (
    <div className="flex min-h-screen w-full bg-muted/40">
      <aside className="fixed inset-y-0 left-0 z-10 hidden w-64 flex-col border-r bg-background sm:flex">
        <div className="flex h-14 items-center border-b px-6 lg:h-[60px]">
          <Link to="/" className="flex items-center gap-2 font-bold">
            <span className="text-lg text-primary">PuzKit3D Admin</span>
          </Link>
        </div>

        <div className="flex-1 overflow-auto py-4">
          <nav className="grid items-start gap-2 px-4 text-sm font-medium">
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;

              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all hover:text-primary ${
                    isActive
                      ? 'bg-primary/10 text-primary font-semibold'
                      : 'text-muted-foreground hover:bg-muted'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {item.title}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      <div className="flex flex-1 flex-col sm:pl-64">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur sm:h-[60px] sm:px-6">
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
              <div className="hidden flex-col items-end md:flex">
                <span className="text-sm font-semibold">{user?.email || 'User'}</span>
                <span className="mt-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium capitalize text-muted-foreground">
                  {user?.role?.toLowerCase() || 'Unknown'}
                </span>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={logout}
                title="Logout"
                className="hover:bg-destructive/10 hover:text-destructive"
              >
                <LogOut className="h-5 w-5" />
                <span className="sr-only">Logout</span>
              </Button>
            </div>
          )}
        </header>

        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm sm:hidden">
            <div className="fixed inset-y-0 left-0 w-3/4 max-w-xs border-r bg-background p-6 shadow-lg">
              <div className="mb-8 flex items-center justify-between">
                <span className="text-lg font-bold text-primary">PuzKit3D Admin</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
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
                      className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium ${
                        isActive
                          ? 'bg-primary/10 text-primary font-semibold'
                          : 'text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      {item.title}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        )}

        <main className="flex-1 p-2 sm:p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}