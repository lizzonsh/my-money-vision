import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Receipt,
  Wallet,
  PiggyBank,
  Target,
  BarChart3,
  Menu,
  X,
  ChevronLeft,
  CircleDollarSign,
  Settings,
  LogOut,
  Bug,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Expenses', href: '/expenses', icon: Receipt },
  { name: 'Income', href: '/income', icon: Wallet },
  { name: 'Savings', href: '/savings', icon: PiggyBank },
  { name: 'Goals', href: '/goals', icon: Target },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Issues', href: '/issues', icon: Bug },
  { name: 'Settings', href: '/settings', icon: Settings },
];

interface SidebarProps {
  children: React.ReactNode;
}

const Sidebar = ({ children }: SidebarProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 h-16 glass border-b border-border/50 flex items-center px-4">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 hover:bg-secondary rounded-lg transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="ml-4 flex items-center gap-2">
          <CircleDollarSign className="h-6 w-6 text-primary" />
          <h1 className="text-lg font-bold">MoneyFlow</h1>
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full glass border-r border-border/50 transition-all duration-300',
          collapsed ? 'w-16' : 'w-64',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-border/50">
            {!collapsed ? (
              <div className="flex items-center gap-2">
                <CircleDollarSign className="h-7 w-7 text-primary" />
                <h1 className="text-xl font-bold">MoneyFlow</h1>
              </div>
            ) : (
              <CircleDollarSign className="h-7 w-7 text-primary mx-auto" />
            )}
            <button
              onClick={() => {
                setCollapsed(!collapsed);
                setMobileOpen(false);
              }}
              className={cn(
                'p-2 hover:bg-secondary rounded-lg transition-colors',
                collapsed && 'mx-auto'
              )}
            >
              {mobileOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <ChevronLeft
                  className={cn(
                    'h-5 w-5 transition-transform',
                    collapsed && 'rotate-180'
                  )}
                />
              )}
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-3 space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-glow'
                      : 'hover:bg-secondary text-muted-foreground hover:text-foreground'
                  )}
                >
                  <item.icon className={cn('h-5 w-5 flex-shrink-0')} />
                  {!collapsed && (
                    <span className="font-medium">{item.name}</span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User & Logout */}
          <div className="p-3 border-t border-border/50">
            {!collapsed && user && (
              <div className="mb-2 px-3 py-2">
                <p className="text-xs text-muted-foreground truncate">
                  {user.email}
                </p>
              </div>
            )}
            <Button
              variant="ghost"
              onClick={handleSignOut}
              className={cn(
                'w-full justify-start gap-3 text-muted-foreground hover:text-destructive',
                collapsed && 'justify-center px-0'
              )}
            >
              <LogOut className="h-5 w-5" />
              {!collapsed && <span>Sign out</span>}
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main
        className={cn(
          'min-h-screen transition-all duration-300 pt-16 lg:pt-0',
          collapsed ? 'lg:pl-16' : 'lg:pl-64'
        )}
      >
        <div className="p-4 lg:p-6">{children}</div>
      </main>
    </div>
  );
};

export default Sidebar;
