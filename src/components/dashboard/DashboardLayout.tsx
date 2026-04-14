import { ReactNode, useMemo, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/i18n/LanguageContext";
import { useOrganizationBranding } from "@/contexts/OrganizationBrandingContext";
import { useSubscription } from "@/hooks/useSubscription";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { NotificationCenter } from "@/components/dashboard/NotificationCenter";
import { TrialBanner } from "@/components/TrialBanner";
import { TrialExpiredGate } from "@/components/TrialExpiredGate";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  BarChart3,
  FileText,
  Users,
  LogOut,
  Search,
  FolderKanban,
  UserCircle,
  Building2,
  UserCog,
  CreditCard,
  PieChart,
  Library,
  Menu,
  PanelLeftClose,
  PanelLeft,
  Clock,
  Sparkles,
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
  const location = useLocation();
  const { user, signOut, isSuperAdmin, isOrgAdmin, isHrAdmin } = useAuth();
  const { t, isRTL, dir } = useLanguage();
  const { branding } = useOrganizationBranding();
  const { isTrial, daysRemaining } = useSubscription();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const navItems = useMemo(() => {
    if (isOrgAdmin()) return orgAdminNavItems;
    if (isHrAdmin()) return hrAdminNavItems;
    return hrAdminNavItems;
  }, [isOrgAdmin, isHrAdmin]);

  const getRoleLabel = () => {
    if (isSuperAdmin()) return t.roles.superAdmin;
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

  // Tenant branding support
  const sidebarBg = branding?.primary_color || undefined;
  const useCustomColor = !!branding?.primary_color;

  const sidebarWidth = sidebarCollapsed ? 'w-[68px]' : 'w-60';
  const contentOffset = sidebarCollapsed ? '68px' : '240px';

  const NavigationContent = ({ onItemClick, collapsed = false }: { onItemClick?: () => void; collapsed?: boolean }) => (
    <>
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {!collapsed && (
          <p className={`px-3 pb-2 text-[10px] font-semibold uppercase tracking-widest ${useCustomColor ? 'text-white/40' : 'text-sidebar-foreground/40'}`}>
            {t.nav?.menu || 'Menu'}
          </p>
        )}
        {navItems.map((item) => {
          const label = getNavLabel(item.labelKey);
          const isActive = isActiveItem(item.labelKey);

          return (
            <Link
              key={item.labelKey}
              to={item.href}
              onClick={onItemClick}
              title={collapsed ? label : undefined}
              className={`group flex items-center gap-3 rounded-lg text-[13px] font-medium transition-all duration-150 ${
                collapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5'
              } ${
                useCustomColor
                  ? isActive
                    ? "bg-white/15 text-white shadow-sm"
                    : "text-white/60 hover:bg-white/10 hover:text-white"
                  : isActive
                    ? "bg-sidebar-primary/10 text-sidebar-primary font-semibold"
                    : "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              }`}
            >
              <item.icon className={`flex-shrink-0 transition-colors duration-150 ${collapsed ? 'w-5 h-5' : 'w-[18px] h-[18px]'}`} />
              {!collapsed && <span className="flex-1 truncate">{label}</span>}
              {isActive && !collapsed && (
                <div className={`w-1.5 h-1.5 rounded-full ${useCustomColor ? 'bg-white' : 'bg-sidebar-primary'}`} />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Section */}
      <div className={`p-3 ${useCustomColor ? 'border-t border-white/10' : 'border-t border-sidebar-border'}`}>
        {!collapsed && (
          <div className={`flex items-center gap-3 px-3 py-2 rounded-lg mb-1 ${useCustomColor ? 'hover:bg-white/5' : ''}`}>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-semibold ${
              useCustomColor ? 'bg-white/15 text-white' : 'bg-sidebar-primary/15 text-sidebar-primary'
            }`}>
              {getUserName().charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium truncate ${useCustomColor ? 'text-white' : 'text-sidebar-foreground'}`}>
                {getUserName()}
              </p>
              <p className={`text-[11px] truncate ${useCustomColor ? 'text-white/40' : 'text-sidebar-foreground/40'}`}>
                {getRoleLabel()}
              </p>
            </div>
          </div>
        )}
        <button
          onClick={() => {
            onItemClick?.();
            handleSignOut();
          }}
          title={collapsed ? t.nav.signOut : undefined}
          className={`w-full flex items-center gap-3 rounded-lg text-[13px] font-medium transition-all duration-150 ${
            collapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5'
          } ${
            useCustomColor
              ? 'text-white/50 hover:bg-white/10 hover:text-white'
              : 'text-sidebar-foreground/40 hover:bg-destructive/10 hover:text-destructive'
          }`}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!collapsed && t.nav.signOut}
        </button>
      </div>
    </>
  );

  const SidebarHeader = ({ collapsed = false }: { collapsed?: boolean }) => (
    <div className={`p-4 ${useCustomColor ? 'border-b border-white/10' : 'border-b border-sidebar-border'}`}>
      <Link to="/" className={`flex items-center group ${collapsed ? 'justify-center' : 'gap-3'}`}>
        {branding?.logo_url ? (
          <img
            src={branding.logo_url}
            alt={branding.name || "Organization"}
            className="w-8 h-8 rounded-lg object-contain bg-white/10 p-0.5 transition-transform duration-200 group-hover:scale-105"
          />
        ) : (
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-transform duration-200 group-hover:scale-105 ${
            useCustomColor ? 'bg-white/15' : 'bg-sidebar-primary'
          }`}>
            <span className={`font-bold text-sm ${useCustomColor ? 'text-white' : 'text-sidebar-primary-foreground'}`}>
              Q
            </span>
          </div>
        )}
        {!collapsed && (
          <div className="flex flex-col min-w-0">
            <span className={`font-bold text-sm truncate ${useCustomColor ? 'text-white' : 'text-sidebar-foreground'}`}>
              {branding?.name || "Qudurat"}
            </span>
            <span className={`text-[10px] -mt-0.5 tracking-wider uppercase ${useCustomColor ? 'text-white/40' : 'text-sidebar-foreground/40'}`}>
              Assessment Platform
            </span>
          </div>
        )}
      </Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-background" dir={dir}>
      {/* Mobile Header */}
      <header className="lg:hidden h-14 bg-card border-b border-border flex items-center justify-between px-4 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side={isRTL ? "right" : "left"}
              className="p-0 w-72"
              style={{
                backgroundColor: sidebarBg || 'hsl(var(--sidebar-background))',
                color: useCustomColor ? '#ffffff' : undefined,
              }}
            >
              <SidebarHeader />
              <NavigationContent onItemClick={() => setMobileMenuOpen(false)} />
            </SheetContent>
          </Sheet>
          <Link to="/" className="flex items-center gap-2">
            {branding?.logo_url ? (
              <img
                src={branding.logo_url}
                alt={branding.name || "Organization"}
                className="w-7 h-7 rounded-md object-contain"
              />
            ) : (
              <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
                <span className="font-bold text-xs text-primary-foreground">Q</span>
              </div>
            )}
            <span className="font-bold text-sm">
              {branding?.name || "Qudurat"}
            </span>
          </Link>
        </div>
        <div className="flex items-center gap-1">
          <LanguageSwitcher />
          <NotificationCenter />
        </div>
      </header>

      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex ${sidebarWidth} h-screen fixed top-0 flex-col transition-all duration-200 z-50 ${isRTL ? 'right-0' : 'left-0'}`}
        style={{
          backgroundColor: sidebarBg || 'hsl(var(--sidebar-background))',
          color: useCustomColor ? '#ffffff' : undefined,
        }}
      >
        <SidebarHeader collapsed={sidebarCollapsed} />
        <NavigationContent collapsed={sidebarCollapsed} />

        {/* Collapse Toggle */}
        <div className={`px-3 pb-3 ${useCustomColor ? '' : ''}`}>
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className={`w-full flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] transition-all duration-150 ${
              sidebarCollapsed ? 'justify-center' : ''
            } ${
              useCustomColor
                ? 'text-white/40 hover:bg-white/10 hover:text-white/70'
                : 'text-sidebar-foreground/30 hover:bg-sidebar-accent hover:text-sidebar-foreground/60'
            }`}
          >
            {sidebarCollapsed ? (
              <PanelLeft className="w-4 h-4" />
            ) : (
              <>
                <PanelLeftClose className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
                <span>{t.nav?.collapse || 'Collapse'}</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div
        className="transition-all duration-200"
        style={{
          [isRTL ? 'marginRight' : 'marginLeft']: contentOffset,
        }}
      >
        {/* Desktop Top Bar */}
        <header
          className={`hidden lg:flex h-16 bg-card border-b border-border items-center justify-between px-6 sticky top-0 z-40`}
          style={{
            [isRTL ? 'marginRight' : 'marginLeft']: contentOffset,
          }}
        >
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className={`w-4 h-4 absolute top-1/2 -translate-y-1/2 text-muted-foreground ${isRTL ? 'right-3' : 'left-3'}`} />
              <input
                type="text"
                placeholder={t.nav.search}
                className={`w-64 h-9 rounded-lg border border-border bg-background text-sm transition-all duration-150 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 placeholder:text-muted-foreground/60 ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'}`}
                dir={dir}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Trial Countdown — shown for org_admin on trial */}
            {isOrgAdmin() && isTrial && (
              <button
                onClick={() => navigate('/subscription')}
                className={`hidden md:inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs font-semibold transition-colors ${
                  daysRemaining <= 3
                    ? 'bg-amber-500/10 text-amber-700 hover:bg-amber-500/15 border border-amber-500/20'
                    : 'bg-primary/5 text-primary hover:bg-primary/10 border border-primary/15'
                }`}
              >
                {daysRemaining <= 3 ? (
                  <Clock className="w-3.5 h-3.5" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                <span>
                  {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} trial
                </span>
              </button>
            )}
            <LanguageSwitcher />
            <NotificationCenter />
            {/* User info — name + role label, consistent across roles */}
            <div className={`flex items-center gap-3 ps-3 ms-1 border-s border-border/60`}>
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                {getUserName().charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:block leading-tight">
                <p className="text-sm font-medium text-foreground">{getUserName()}</p>
                <p className="text-[11px] text-muted-foreground">{getRoleLabel()}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Trial Banner */}
        <div style={{ [isRTL ? 'marginRight' : 'marginLeft']: contentOffset }}>
          <TrialBanner />
        </div>

        {/* Page Content */}
        <main
          className="min-h-[calc(100vh-4rem)]"
          style={{
            [isRTL ? 'marginRight' : 'marginLeft']: contentOffset,
          }}
        >
          <TrialExpiredGate>
            <div className="p-4 sm:p-6 lg:p-8">
              {children}
            </div>
          </TrialExpiredGate>
        </main>
      </div>
    </div>
  );
};
