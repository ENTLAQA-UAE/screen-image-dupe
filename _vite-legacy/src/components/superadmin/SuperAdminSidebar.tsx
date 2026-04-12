import { Link } from 'react-router-dom';
import { Shield, LogOut, BarChart3, Building2, UserCog, CreditCard, Settings } from 'lucide-react';
import { ActiveSection } from './types';

interface SuperAdminSidebarProps {
  activeSection: ActiveSection;
  setActiveSection: (section: ActiveSection) => void;
  userName: string;
  onSignOut: () => void;
}

const navItems = [
  { id: 'dashboard' as ActiveSection, icon: BarChart3, label: 'Dashboard' },
  { id: 'organizations' as ActiveSection, icon: Building2, label: 'Organizations' },
  { id: 'users' as ActiveSection, icon: UserCog, label: 'Users & Roles' },
  { id: 'subscriptions' as ActiveSection, icon: CreditCard, label: 'Subscriptions' },
  { id: 'settings' as ActiveSection, icon: Settings, label: 'Platform Settings' },
];

export function SuperAdminSidebar({ activeSection, setActiveSection, userName, onSignOut }: SuperAdminSidebarProps) {
  return (
    <aside className="w-64 h-screen bg-sidebar fixed left-0 top-0 border-r border-sidebar-border flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-9 h-9 gradient-accent rounded-lg flex items-center justify-center shadow-glow">
            <span className="text-accent-foreground font-display font-bold">J</span>
          </div>
          <div className="flex flex-col">
            <span className="font-display font-bold text-sidebar-foreground">Jadarat</span>
            <span className="text-[10px] text-sidebar-foreground/60 -mt-0.5 tracking-wider">ASSESS</span>
          </div>
        </Link>
      </div>

      {/* Super Admin Badge */}
      <div className="px-4 py-3 mx-4 mt-4 rounded-xl bg-highlight/10 border border-highlight/20">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-highlight" />
          <span className="text-xs font-semibold text-highlight">SUPER ADMIN</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 mt-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveSection(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
              activeSection === item.id 
                ? "bg-sidebar-accent text-sidebar-primary" 
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
            }`}
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </button>
        ))}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div className="w-9 h-9 rounded-full bg-highlight/20 flex items-center justify-center">
            <span className="text-highlight font-semibold text-sm">
              {userName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">{userName}</p>
            <p className="text-xs text-highlight truncate">Super Admin</p>
          </div>
        </div>
        <button
          onClick={onSignOut}
          className="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
