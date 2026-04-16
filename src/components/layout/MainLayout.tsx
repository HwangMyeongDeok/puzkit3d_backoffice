import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  LogOut,
  Menu,
  Headset,
  Settings,
  FileText,
  LibraryBig,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useState } from 'react';

type UserRole = 'Staff' | 'Business Manager';

type NavChildItem = {
  title: string;
  href: string;
  roles: UserRole[];
};

type NavItem = {
  title: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: UserRole[];
  children?: NavChildItem[];
};

export function MainLayout() {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems: NavItem[] = [
    {
      title: 'Dashboard',
      href: '/',
      icon: LayoutDashboard,
      roles: ['Staff', 'Business Manager'],
    },
    {
      title: 'Orders',
      icon: ShoppingCart,
      roles: ['Staff', 'Business Manager'],
      children: [
        {
          title: 'Instock Orders',
          href: '/orders/instock',
          roles: ['Staff', 'Business Manager'],
        },
        {
          title: 'Partner Orders',
          href: '/orders/partner',
          roles: ['Staff', 'Business Manager'],
        },
        {
          title: 'Support Tickets',
          href: '/support-tickets',
          roles: ['Staff', 'Business Manager'],
        },
      ],
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
      title: 'Instock Products',
      href: '/instock-products',
      icon: Settings,
      roles: ['Business Manager', 'Staff'],
    },
    {
      title: 'Feedback Management',
      href: '/feedback-management',
      icon: Headset,
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
      title: 'Catalog Management',
      href: '/catalog-management',
      icon: LibraryBig,
      roles: ['Staff', 'Business Manager'],
    },
    {
      title: 'System Configurations',
      href: '/system-configurations',
      icon: Settings,
      roles: ['Business Manager'],
    },
    {
      title: 'Formula Management',
      href: '/formula-management',
      icon: Settings,
      roles: ['Business Manager'],
    },
    {
      title: 'Drive Management',
      href: '/drive-management',
      icon: Settings,
      roles: ['Business Manager'],
    },
  ];

  const filteredNavItems = navItems.filter(
    (item) => user && item.roles.includes(user.role as UserRole),
  );

  const isPathActive = (href?: string) => {
    if (!href) return false;
    if (href === '/') return location.pathname === '/';
    return location.pathname === href || location.pathname.startsWith(`${href}/`);
  };

  const renderNavItems = (onItemClick?: () => void) => {
    return filteredNavItems.map((item) => {
      const Icon = item.icon;

      if (item.children?.length) {
        const visibleChildren = item.children.filter(
          (child) => user && child.roles.includes(user.role as UserRole),
        );

        const isAnyChildActive = visibleChildren.some((child) => isPathActive(child.href));

        return (
          <Collapsible
            key={item.title}
            defaultOpen={isAnyChildActive}
            className="group/collapsible flex flex-col gap-1"
          >
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 transition-all hover:bg-muted/80 hover:text-primary ${
                  isAnyChildActive
                    ? 'font-semibold text-primary'
                    : 'text-muted-foreground'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-5 w-5" />
                  <span className="text-sm font-medium">{item.title}</span>
                </div>
                <ChevronRight className="h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
              </button>
            </CollapsibleTrigger>

            <CollapsibleContent className="mt-1 flex flex-col gap-1 pl-9 pr-2">
              {visibleChildren.map((child) => {
                const isChildActive = isPathActive(child.href);

                return (
                  <Link
                    key={child.href}
                    to={child.href}
                    onClick={onItemClick}
                    className={`rounded-lg px-3 py-2 text-sm transition-all ${
                      isChildActive
                        ? 'bg-primary/10 font-semibold text-primary'
                        : 'text-muted-foreground hover:bg-muted hover:text-primary'
                    }`}
                  >
                    {child.title}
                  </Link>
                );
              })}
            </CollapsibleContent>
          </Collapsible>
        );
      }

      const isActive = isPathActive(item.href);

      return (
        <Link
          key={item.href}
          to={item.href!}
          onClick={onItemClick}
          className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all hover:text-primary ${
            isActive
              ? 'bg-primary/10 font-semibold text-primary'
              : 'text-muted-foreground hover:bg-muted'
          }`}
        >
          <Icon className="h-5 w-5" />
          <span className="text-sm font-medium">{item.title}</span>
        </Link>
      );
    });
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="flex min-h-screen">
        <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r bg-background sm:flex">
          <div className="flex h-14 items-center border-b px-6 sm:h-[60px]">
            <Link to="/" className="text-lg font-bold text-primary">
              PuzKit3D Admin
            </Link>
          </div>

          <div className="flex-1 overflow-y-auto py-4">
            <nav className="grid items-start gap-1 px-4">{renderNavItems()}</nav>
          </div>
        </aside>

        <div className="flex flex-1 flex-col sm:pl-64">
          <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur sm:h-[60px] sm:px-6">
            <Button
              variant="outline"
              size="icon"
              className="sm:hidden"
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle Menu</span>
            </Button>

            <div className="flex-1" />

            {user && (
              <div className="flex items-center gap-4">
                <div className="hidden flex-col items-end md:flex">
                  <span className="text-sm font-semibold">{user.email || 'User'}</span>
                  <span className="mt-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium capitalize text-muted-foreground">
                    {user.role?.toLowerCase() || 'Unknown'}
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
            <div
              className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm sm:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <div
                className="fixed inset-y-0 left-0 w-3/4 max-w-xs overflow-y-auto border-r bg-background p-6 shadow-lg"
                onClick={(e) => e.stopPropagation()}
              >
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

                <nav className="grid gap-1">
                  {renderNavItems(() => setIsMobileMenuOpen(false))}
                </nav>
              </div>
            </div>
          )}

          <main className="flex-1 p-2 sm:p-4 lg:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}