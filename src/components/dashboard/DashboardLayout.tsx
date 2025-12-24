import { ReactNode, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { 
  BarChart3, 
  FileText, 
  Users, 
  Settings, 
  LogOut,
  Bell,
  Search,
  FolderKanban,
  UserCircle,
  Building2,
  UserCog,
  CreditCard,
  PieChart,
} from "lucide-react";

interface NavItem {
  icon: React.ElementType;
  label: string;
  href: string;
}

// HR Admin navigation - operational features
const hrAdminNavItems: NavItem[] = [
  { icon: BarChart3, label: "Dashboard", href: "/dashboard" },
  { icon: FileText, label: "Assessments", href: "/assessments" },
  { icon: FolderKanban, label: "Assessment Groups", href: "/assessment-groups" },
  { icon: Users, label: "Participants", href: "/participants" },
  { icon: UserCircle, label: "Employees", href: "/employees" },
  { icon: PieChart, label: "Reports", href: "/reports" },
];

// Org Admin navigation - management features
const orgAdminNavItems: NavItem[] = [
  { icon: BarChart3, label: "Dashboard", href: "/dashboard" },
  { icon: PieChart, label: "Reports", href: "/reports" },
  { icon: Building2, label: "Organization", href: "/settings" },
  { icon: UserCog, label: "User Management", href: "/user-management" },
  { icon: CreditCard, label: "Subscription", href: "/subscription" },
];

interface DashboardLayoutProps {
  children: ReactNode;
  activeItem?: string;
}

export const DashboardLayout = ({ children, activeItem }: DashboardLayoutProps) => {
  const navigate = useNavigate();
  const { user, signOut, isOrgAdmin, isHrAdmin } = useAuth();

  // Determine which nav items to show based on role
  const navItems = useMemo(() => {
    if (isOrgAdmin()) return orgAdminNavItems;
    if (isHrAdmin()) return hrAdminNavItems;
    // Default to HR admin items for users with no specific role
    return hrAdminNavItems;
  }, [isOrgAdmin, isHrAdmin]);

  const getRoleLabel = () => {
    if (isOrgAdmin()) return "Org Admin";
    if (isHrAdmin()) return "HR Admin";
    return "User";
  };

  const getUserName = () => {
    return user?.user_metadata?.full_name || user?.email?.split('@')[0] || "User";
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
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

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.label}
              to={item.href}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeItem === item.label 
                  ? "bg-sidebar-accent text-sidebar-primary" 
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          ))}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-sidebar-accent/50 cursor-pointer transition-colors">
            <div className="w-9 h-9 rounded-full bg-sidebar-accent flex items-center justify-center">
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
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="pl-64">
        {/* Header */}
        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-8 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search..."
                className="w-80 h-10 pl-10 pr-4 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5 text-muted-foreground" />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-highlight" />
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