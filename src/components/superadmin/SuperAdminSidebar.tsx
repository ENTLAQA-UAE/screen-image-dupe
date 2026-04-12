import { Link } from 'react-router-dom';
import { Shield, LogOut, BarChart3, Building2, UserCog, CreditCard, Settings, ChevronLeft, ChevronRight } from 'lucide-react';
import { ActiveSection } from './types';

interface SuperAdminSidebarProps {
  activeSection: ActiveSection;
  setActiveSection: (section: ActiveSection) => void;
  userName: string;
  onSignOut: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

const navItems = [
  { id: 'dashboard' as ActiveSection, icon: BarChart3, label: 'Dashboard' },
  { id: 'organizations' as ActiveSection, icon: Building2, label: 'Organizations' },
  { id: 'users' as ActiveSection, icon: UserCog, label: 'Users & Roles' },
  { id: 'subscriptions' as ActiveSection, icon: CreditCard, label: 'Subscriptions' },
  { id: 'settings' as ActiveSection, icon: Settings, label: 'Platform Settings' },
];

export function SuperAdminSidebar({ activeSection, setActiveSection, userName, onSignOut, collapsed = false, onToggleCollapse }: SuperAdminSidebarProps) {
  return (
    <aside className={`${collapsed ? 'w-[68px]' : 'w-64'} h-screen bg-white fixed left-0 top-0 border-r border-border/60 flex flex-col transition-all duration-200 z-50`}>
      {/* Logo + Collapse Toggle */}
      <div className="p-4 border-b border-border/60 flex items-center justify-between">
        <Link to="/" className={`flex items-center group ${collapsed ? 'justify-center w-full' : 'gap-3'}`}>
          <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shadow-md shadow-primary/20 transition-transform duration-200 group-hover:scale-105 flex-shrink-0">
            <span className="text-primary-foreground font-bold text-sm">Q</span>
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-foreground text-sm">Qudurat</span>
              <span className="text-[10px] text-muted-foreground -mt-0.5 tracking-wider uppercase">Platform</span>
            </div>
          )}
        </Link>
        {!collapsed && onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Collapsed toggle */}
      {collapsed && onToggleCollapse && (
        <div className="px-3 py-2">
          <button
            onClick={onToggleCollapse}
            className="w-full flex items-center justify-center p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Super Admin Badge */}
      {!collapsed && (
        <div className="px-4 py-3 mx-3 mt-3 rounded-xl bg-primary/5 border border-primary/10">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">Super Admin</span>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {!collapsed && (
          <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
            Menu
          </p>
        )}
        {navItems.map((item) => {
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              title={collapsed ? item.label : undefined}
              className={`w-full flex items-center gap-3 rounded-xl text-[13px] font-medium transition-all duration-200 ${
                collapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5'
              } ${
                isActive
                  ? "bg-primary text-white shadow-md shadow-primary/20"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              }`}
            >
              <item.icon className={`flex-shrink-0 ${collapsed ? 'w-5 h-5' : 'w-[18px] h-[18px]'}`} />
              {!collapsed && <span className="flex-1 text-left truncate">{item.label}</span>}
              {isActive && !collapsed && (
                <div className="w-1.5 h-1.5 rounded-full bg-white" />
              )}
            </button>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="p-3 border-t border-border/60">
        {!collapsed && (
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg mb-1">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 text-xs font-semibold text-primary">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{userName}</p>
              <p className="text-[11px] text-muted-foreground truncate">Super Admin</p>
            </div>
          </div>
        )}
        <button
          onClick={onSignOut}
          title={collapsed ? 'Sign Out' : undefined}
          className={`w-full flex items-center gap-3 rounded-xl text-[13px] font-medium transition-all duration-150 text-muted-foreground hover:bg-destructive/10 hover:text-destructive ${
            collapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5'
          }`}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!collapsed && 'Sign Out'}
        </button>
      </div>

      {/* Powered By */}
      {!collapsed && (
        <div className="px-4 pb-3 pt-1">
          <p className="text-[10px] text-muted-foreground/40 text-center">
            Powered by Qudurat
          </p>
        </div>
      )}
    </aside>
  );
}
