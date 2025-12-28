import { ReactNode, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/i18n/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import { 
  BarChart3, 
  FileText, 
  Users, 
  LogOut,
  Bell,
  Search,
  FolderKanban,
  UserCircle,
  Building2,
  UserCog,
  CreditCard,
  PieChart,
  Library,
} from "lucide-react";

interface NavItem {
  icon: React.ElementType;
  labelKey: string;
  href: string;
}

// HR Admin navigation - operational features
const hrAdminNavItems: NavItem[] = [
  { icon: BarChart3, labelKey: "dashboard", href: "/dashboard" },
  { icon: FileText, labelKey: "assessments", href: "/assessments" },
  { icon: FolderKanban, labelKey: "assessmentGroups", href: "/assessment-groups" },
  { icon: Users, labelKey: "participants", href: "/participants" },
  { icon: UserCircle, labelKey: "employees", href: "/employees" },
  { icon: Library, labelKey: "questionBank", href: "/question-bank" },
  { icon: PieChart, labelKey: "reports", href: "/reports" },
];

// Org Admin navigation - management features
const orgAdminNavItems: NavItem[] = [
  { icon: BarChart3, labelKey: "dashboard", href: "/dashboard" },
  { icon: PieChart, labelKey: "reports", href: "/reports" },
  { icon: Building2, labelKey: "organization", href: "/settings" },
  { icon: UserCog, labelKey: "userManagement", href: "/user-management" },
  { icon: CreditCard, labelKey: "subscription", href: "/subscription" },
];

interface DashboardLayoutProps {
  children: ReactNode;
  activeItem?: string;
}

export const DashboardLayout = ({ children, activeItem }: DashboardLayoutProps) => {
  const navigate = useNavigate();
  const { user, signOut, isOrgAdmin, isHrAdmin } = useAuth();
  const { t, isRTL, dir } = useLanguage();

  // Determine which nav items to show based on role
  const navItems = useMemo(() => {
    if (isOrgAdmin()) return orgAdminNavItems;
    if (isHrAdmin()) return hrAdminNavItems;
    // Default to HR admin items for users with no specific role
    return hrAdminNavItems;
  }, [isOrgAdmin, isHrAdmin]);

  const getRoleLabel = () => {
    if (isOrgAdmin()) return t.roles.orgAdmin;
    if (isHrAdmin()) return t.roles.hrAdmin;
    return t.roles.user;
  };

  const getUserName = () => {
    return user?.user_metadata?.full_name || user?.email?.split('@')[0] || "User";
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  // Get translated label for nav item
  const getNavLabel = (labelKey: string): string => {
    return (t.nav as Record<string, string>)[labelKey] || labelKey;
  };

  // Check if nav item is active based on labelKey
  const isActiveItem = (labelKey: string): boolean => {
    if (!activeItem) return false;
    // Map English activeItem prop to labelKey
    const labelKeyLower = labelKey.toLowerCase();
    const activeItemLower = activeItem.toLowerCase();
    
    // Direct match
    if (labelKeyLower === activeItemLower) return true;
    
    // Check if activeItem contains the labelKey words
    const mappings: Record<string, string[]> = {
      'dashboard': ['dashboard'],
      'assessments': ['assessments'],
      'assessmentgroups': ['assessment groups', 'assessment-groups'],
      'participants': ['participants'],
      'employees': ['employees'],
      'questionbank': ['question bank', 'question-bank'],
      'reports': ['reports'],
      'organization': ['organization', 'settings'],
      'usermanagement': ['user management', 'user-management'],
      'subscription': ['subscription'],
    };

    const labelMappings = mappings[labelKeyLower] || [labelKeyLower];
    return labelMappings.some(m => activeItemLower.includes(m.replace('-', ' ').replace(/\s+/g, '')));
  };

  return (
    <div className="min-h-screen bg-background" dir={dir}>
      {/* Sidebar */}
      <aside className={`w-64 h-screen bg-sidebar fixed top-0 border-sidebar-border flex flex-col ${isRTL ? 'right-0 border-l' : 'left-0 border-r'}`}>
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

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const label = getNavLabel(item.labelKey);
            const isActive = isActiveItem(item.labelKey);
            
            return (
              <Link
                key={item.labelKey}
                to={item.href}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive 
                    ? "bg-sidebar-accent text-sidebar-primary" 
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                }`}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-sidebar-accent/50 cursor-pointer transition-colors">
            <div className="w-9 h-9 rounded-full bg-sidebar-accent flex items-center justify-center flex-shrink-0">
              <span className="text-sidebar-foreground font-semibold text-sm">
                {getUserName().charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">{getUserName()}</p>
              <p className="text-xs text-sidebar-foreground/60 truncate">{getRoleLabel()}</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-2 mt-2 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {t.nav.signOut}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className={isRTL ? 'pr-64' : 'pl-64'}>
        {/* Header */}
        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-8 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className={`w-4 h-4 absolute top-1/2 -translate-y-1/2 text-muted-foreground ${isRTL ? 'right-3' : 'left-3'}`} />
              <input
                type="text"
                placeholder={t.nav.search}
                className={`w-80 h-10 pr-4 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'}`}
                dir={dir}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5 text-muted-foreground" />
              <span className={`absolute top-2 w-2 h-2 rounded-full bg-highlight ${isRTL ? 'left-2' : 'right-2'}`} />
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <main>
          {children}
        </main>
      </div>
    </div>
  );
};
