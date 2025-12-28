import { ReactNode, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/i18n/LanguageContext";
import { useOrganizationBranding } from "@/contexts/OrganizationBrandingContext";
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
  ChevronRight,
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
  const { branding } = useOrganizationBranding();

  // Determine which nav items to show based on role
  const navItems = useMemo(() => {
    if (isOrgAdmin()) return orgAdminNavItems;
    if (isHrAdmin()) return hrAdminNavItems;
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

  const getNavLabel = (labelKey: string): string => {
    return (t.nav as Record<string, string>)[labelKey] || labelKey;
  };

  const isActiveItem = (labelKey: string): boolean => {
    if (!activeItem) return false;
    const labelKeyLower = labelKey.toLowerCase();
    const activeItemLower = activeItem.toLowerCase();
    
    if (labelKeyLower === activeItemLower) return true;
    
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

  const sidebarBg = branding?.primary_color || undefined;
  const useCustomColor = !!branding?.primary_color;

  return (
    <div className="min-h-screen bg-background" dir={dir}>
      {/* Sidebar */}
      <aside 
        className={`w-64 h-screen fixed top-0 flex flex-col shadow-xl ${isRTL ? 'right-0' : 'left-0'}`}
        style={{ 
          backgroundColor: sidebarBg || 'hsl(var(--sidebar-background))',
          color: useCustomColor ? '#ffffff' : undefined,
        }}
      >
        {/* Logo & Organization Branding */}
        <div className={`p-6 ${useCustomColor ? 'border-b border-white/10' : 'border-b border-sidebar-border'}`}>
          <Link to="/" className="flex items-center gap-3 group">
            {branding?.logo_url ? (
              <img 
                src={branding.logo_url} 
                alt={branding.name || "Organization"} 
                className="w-10 h-10 rounded-xl object-contain bg-white/10 p-1 transition-transform duration-200 group-hover:scale-105"
              />
            ) : (
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-105 ${useCustomColor ? 'bg-white/20' : 'bg-accent shadow-glow'}`}>
                <span className={`font-display font-bold text-lg ${useCustomColor ? 'text-white' : 'text-accent-foreground'}`}>
                  {branding?.name?.charAt(0) || "J"}
                </span>
              </div>
            )}
            <div className="flex flex-col">
              <span className={`font-display font-bold text-base truncate max-w-[140px] ${useCustomColor ? 'text-white' : 'text-sidebar-foreground'}`}>
                {branding?.name || "Jadarat"}
              </span>
              <span className={`text-[10px] -mt-0.5 tracking-widest uppercase ${useCustomColor ? 'text-white/50' : 'text-sidebar-foreground/50'}`}>
                Assess Platform
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <p className={`px-4 py-2 text-[10px] font-semibold uppercase tracking-widest ${useCustomColor ? 'text-white/40' : 'text-sidebar-foreground/40'}`}>
            Menu
          </p>
          {navItems.map((item, index) => {
            const label = getNavLabel(item.labelKey);
            const isActive = isActiveItem(item.labelKey);
            
            return (
              <Link
                key={item.labelKey}
                to={item.href}
                className={`group w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  useCustomColor
                    ? isActive 
                      ? "bg-white/20 text-white shadow-sm" 
                      : "text-white/70 hover:bg-white/10 hover:text-white"
                    : isActive 
                      ? "bg-accent/10 text-accent border border-accent/20" 
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                }`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <item.icon className={`w-[18px] h-[18px] flex-shrink-0 transition-transform duration-200 ${isActive ? '' : 'group-hover:scale-110'}`} />
                <span className="flex-1">{label}</span>
                {isActive && (
                  <ChevronRight className={`w-4 h-4 opacity-60 ${isRTL ? 'rotate-180' : ''}`} />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        <div className={`p-4 ${useCustomColor ? 'border-t border-white/10 bg-black/10' : 'border-t border-sidebar-border bg-sidebar-accent/30'}`}>
          <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${useCustomColor ? 'hover:bg-white/10' : 'hover:bg-sidebar-accent/50'}`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${useCustomColor ? 'bg-white/20' : 'bg-accent/20'}`}>
              <span className={`font-semibold ${useCustomColor ? 'text-white' : 'text-accent'}`}>
                {getUserName().charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold truncate ${useCustomColor ? 'text-white' : 'text-sidebar-foreground'}`}>
                {getUserName()}
              </p>
              <p className={`text-xs truncate ${useCustomColor ? 'text-white/50' : 'text-sidebar-foreground/50'}`}>
                {getRoleLabel()}
              </p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className={`w-full flex items-center gap-3 px-4 py-2.5 mt-2 rounded-xl text-sm font-medium transition-all duration-200 ${useCustomColor ? 'text-white/70 hover:bg-white/10 hover:text-white' : 'text-muted-foreground hover:bg-destructive/10 hover:text-destructive'}`}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {t.nav.signOut}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className={isRTL ? 'pr-64' : 'pl-64'}>
        {/* Header */}
        <header className="h-16 bg-card/80 backdrop-blur-sm border-b border-border flex items-center justify-between px-8 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <Search className={`w-4 h-4 absolute top-1/2 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-accent ${isRTL ? 'right-3' : 'left-3'}`} />
              <input
                type="text"
                placeholder={t.nav.search}
                className={`w-80 h-10 rounded-xl border-2 border-border bg-background text-sm transition-all duration-200 focus:outline-none focus:border-accent focus:ring-4 focus:ring-accent/10 ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'}`}
                dir={dir}
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Button variant="ghost" size="icon" className="relative hover:bg-accent/10 transition-colors">
              <Bell className="w-5 h-5 text-muted-foreground" />
              <span className={`absolute top-2 w-2 h-2 rounded-full bg-highlight animate-pulse ${isRTL ? 'left-2' : 'right-2'}`} />
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <main className="min-h-[calc(100vh-4rem)]">
          {children}
        </main>
      </div>
    </div>
  );
};
