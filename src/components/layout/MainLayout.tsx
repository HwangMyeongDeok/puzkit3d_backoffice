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
  Layers,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
      ]
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
      icon: Layers,
      roles: ['Staff', 'Business Manager'],
    },
    {
      title: 'System Configurations',
      href: '/system-configurations',
      icon: Settings,
      roles: ['Business Manager'],
    }
  ];

  // Lọc navItems dựa trên Role
  const filteredNavItems = navItems.filter(item =>
    user && item.roles.includes(user.role)
  );

  // Hàm helper để render một mảng items (dùng chung cho Desktop & Mobile)
  const renderNavItems = (onItemClick?: () => void) => {
    return filteredNavItems.map((item) => {
      const Icon = item.icon;
      
      // Nếu item có menu con, dùng Collapsible của shadcn
      if (item.children) {
        const isAnyChildActive = item.children.some(child => location.pathname === child.href);

        return (
          <Collapsible
            key={item.title}
            defaultOpen={isAnyChildActive} // Tự động mở nếu đang ở tab con
            className="group/collapsible flex flex-col gap-1"
          >
            <CollapsibleTrigger asChild>
              <button
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 transition-all hover:bg-muted/80 hover:text-primary ${
                  isAnyChildActive ? "text-primary font-semibold" : "text-muted-foreground"
                }`}
              >
                <div className="flex items-center gap-3">
                  {Icon && <Icon className="h-5 w-5" />}
                  <span className="text-sm font-medium">{item.title}</span>
                </div>
                {/* Mũi tên tự xoay nhờ class group-data-[state=open] */}
                <ChevronRight className="h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
              </button>
            </CollapsibleTrigger>
            
            <CollapsibleContent className="flex flex-col gap-1 pl-9 pr-2 mt-1">
              {item.children.map((child) => {
                const isChildActive = location.pathname === child.href;
                return (
                  <Link
                    key={child.href}
                    to={child.href}
                    onClick={onItemClick}
                    className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-all hover:text-primary ${
                      isChildActive
                        ? "bg-primary/10 text-primary font-semibold"
                        : "text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-current opacity-50" />
                    {child.title}
                  </Link>
                );
              })}
            </CollapsibleContent>
          </Collapsible>
        );
      }

      // Render các item đơn lẻ bình thường
      const isActive = location.pathname === item.href;
      return (
        <Link
          key={item.href}
          to={item.href || '#'}
          onClick={onItemClick}
          className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all hover:text-primary ${
            isActive
              ? "bg-primary/10 text-primary font-semibold"
              : "text-muted-foreground hover:bg-muted"
          }`}
        >
          {Icon && <Icon className="h-5 w-5" />}
          <span className="text-sm font-medium">{item.title}</span>
        </Link>
      );
    });
  };

  return (
    <div className="flex min-h-screen w-full bg-muted/40">
      {/* Sidebar (Desktop) */}
      <aside className="fixed inset-y-0 left-0 z-10 hidden w-64 flex-col border-r bg-background sm:flex">
        <div className="flex h-14 items-center border-b px-6 lg:h-[60px]">
          <Link to="/" className="flex items-center gap-2 font-bold">
            <span className="text-lg text-primary">PuzKit3D Admin</span>
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto py-4 scrollbar-thin">
          <nav className="grid items-start px-4 gap-1">
            {renderNavItems()}
          </nav>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 sm:pl-64">

        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/95 backdrop-blur px-4 sm:h-[60px] sm:px-6">
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
                <span className="text-sm font-semibold">{user?.email || 'User'}</span>
                <span className="text-xs text-muted-foreground font-medium rounded-full bg-primary/10 px-2 py-0.5 mt-1 capitalize">
                  {user?.role?.toLowerCase() || 'Unknown'}
                </span>
              </div>
              <Button variant="ghost" size="icon" onClick={logout} title="Logout" className="hover:bg-destructive/10 hover:text-destructive">
                <LogOut className="h-5 w-5" />
                <span className="sr-only">Logout</span>
              </Button>
            </div>
          )}
        </header>

        {/* Mobile Sidebar Overlay */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm sm:hidden" onClick={() => setIsMobileMenuOpen(false)}>
            <div 
              className="fixed inset-y-0 left-0 w-3/4 max-w-xs border-r bg-background p-6 shadow-lg overflow-y-auto"
              onClick={(e) => e.stopPropagation()} 
            >
              <div className="flex items-center justify-between mb-8">
                <span className="font-bold text-lg text-primary">PuzKit3D Admin</span>
                <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)}>
                  <Menu className="h-5 w-5" />
                </Button>
              </div>
              <nav className="grid gap-1">
                {renderNavItems(() => setIsMobileMenuOpen(false))}
              </nav>
            </div>
          </div>
        )}

        {/* Màn hình hiển thị chính */}
        <main className="flex-1 p-2 sm:p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}