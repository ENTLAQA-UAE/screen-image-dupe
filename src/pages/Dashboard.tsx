import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { 
  Plus, 
  FileText, 
  Users, 
  BarChart3, 
  Settings, 
  Bell,
  Search,
  ChevronDown,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Play,
  Eye,
  MoreHorizontal,
  Brain,
  Heart,
  MessageSquare,
  Languages
} from "lucide-react";
import { Link } from "react-router-dom";

// Stats data
const stats = [
  { 
    label: "Active Assessments", 
    value: "12", 
    change: "+2 this week",
    trend: "up",
    icon: FileText,
    color: "accent"
  },
  { 
    label: "Total Participants", 
    value: "847", 
    change: "+124 this month",
    trend: "up",
    icon: Users,
    color: "highlight"
  },
  { 
    label: "Completion Rate", 
    value: "89%", 
    change: "+5% vs last",
    trend: "up",
    icon: CheckCircle2,
    color: "success"
  },
  { 
    label: "Avg. Score", 
    value: "72.4", 
    change: "Stable",
    trend: "neutral",
    icon: BarChart3,
    color: "accent"
  },
];

// Recent assessment groups
const recentGroups = [
  {
    id: 1,
    name: "Cognitive – Q4 – IT Team",
    assessment: "Cognitive Assessment",
    status: "active",
    participants: 45,
    completed: 38,
    endDate: "Dec 30, 2024",
    icon: Brain,
    color: "blue",
  },
  {
    id: 2,
    name: "DESC Profile – Leadership",
    assessment: "Personality Profile",
    status: "active",
    participants: 28,
    completed: 15,
    endDate: "Jan 5, 2025",
    icon: Heart,
    color: "rose",
  },
  {
    id: 3,
    name: "SJT – Managers Cohort",
    assessment: "Situational Judgment",
    status: "draft",
    participants: 0,
    completed: 0,
    endDate: "Jan 15, 2025",
    icon: MessageSquare,
    color: "amber",
  },
  {
    id: 4,
    name: "English Proficiency – All Staff",
    assessment: "Language Assessment",
    status: "completed",
    participants: 120,
    completed: 118,
    endDate: "Dec 15, 2024",
    icon: Languages,
    color: "violet",
  },
];

const statusColors = {
  active: "bg-success/10 text-success border-success/20",
  draft: "bg-muted text-muted-foreground border-border",
  completed: "bg-accent/10 text-accent border-accent/20",
};

interface DashboardSidebarProps {
  userName: string;
  roleLabel: string;
}

const DashboardSidebar = ({ userName, roleLabel }: DashboardSidebarProps) => {
  const navItems = [
    { icon: BarChart3, label: "Dashboard", active: true },
    { icon: FileText, label: "Assessments", active: false },
    { icon: Users, label: "Assessment Groups", active: false },
    { icon: Users, label: "Employees", active: false },
    { icon: Settings, label: "Settings", active: false },
  ];

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

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.label}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
              item.active 
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
        <div className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-sidebar-accent/50 cursor-pointer transition-colors">
          <div className="w-9 h-9 rounded-full bg-sidebar-accent flex items-center justify-center">
            <span className="text-sidebar-foreground font-semibold text-sm">
              {userName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">{userName}</p>
            <p className="text-xs text-sidebar-foreground/60 truncate">{roleLabel}</p>
          </div>
          <ChevronDown className="w-4 h-4 text-sidebar-foreground/60" />
        </div>
      </div>
    </aside>
  );
};

const Dashboard = () => {
  const { user, roles, signOut, isSuperAdmin, isOrgAdmin, isHrAdmin } = useAuth();
  
  const getRoleLabel = () => {
    if (isSuperAdmin()) return "Super Admin";
    if (isOrgAdmin()) return "Org Admin";
    if (isHrAdmin()) return "HR Admin";
    return "User";
  };

  const getUserName = () => {
    return user?.user_metadata?.full_name || user?.email?.split('@')[0] || "User";
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar userName={getUserName()} roleLabel={getRoleLabel()} />

      {/* Main Content */}
      <div className="pl-64">
        {/* Header */}
        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-8 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search assessments, groups, employees..."
                className="w-80 h-10 pl-10 pr-4 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5 text-muted-foreground" />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-highlight" />
            </Button>
            <Button variant="hero" size="default">
              <Plus className="w-4 h-4" />
              Create Assessment
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-8">
          {/* Page Title */}
          <div className="mb-8">
            <motion.h1 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl font-display font-bold text-foreground mb-1"
            >
              Welcome back, {getUserName()}
            </motion.h1>
            <p className="text-muted-foreground">
              Here's what's happening with your assessments today.
            </p>
          </div>

          {/* Stats Grid */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-4 gap-6 mb-8"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
                className="p-6 rounded-2xl bg-card border border-border shadow-md hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    stat.color === "accent" ? "bg-accent/10 text-accent" :
                    stat.color === "highlight" ? "bg-highlight/10 text-highlight" :
                    "bg-success/10 text-success"
                  }`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                  {stat.trend === "up" && (
                    <span className="flex items-center gap-1 text-xs text-success font-medium">
                      <TrendingUp className="w-3 h-3" />
                      {stat.change}
                    </span>
                  )}
                  {stat.trend === "neutral" && (
                    <span className="text-xs text-muted-foreground">{stat.change}</span>
                  )}
                </div>
                <div className="text-3xl font-display font-bold text-foreground mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>

          {/* Recent Assessment Groups */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-display font-semibold text-foreground">
                Recent Assessment Groups
              </h2>
              <Button variant="ghost" size="sm" className="text-muted-foreground">
                View All
              </Button>
            </div>

            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left py-4 px-6 text-sm font-semibold text-foreground">Group Name</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-foreground">Assessment</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-foreground">Status</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-foreground">Progress</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-foreground">End Date</th>
                    <th className="text-right py-4 px-6 text-sm font-semibold text-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {recentGroups.map((group, index) => (
                    <motion.tr
                      key={group.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.4 + index * 0.05 }}
                      className="border-b border-border last:border-b-0 hover:bg-muted/20 transition-colors"
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            group.color === "blue" ? "bg-blue-500/10 text-blue-500" :
                            group.color === "rose" ? "bg-rose-500/10 text-rose-500" :
                            group.color === "amber" ? "bg-amber-500/10 text-amber-500" :
                            "bg-violet-500/10 text-violet-500"
                          }`}>
                            <group.icon className="w-5 h-5" />
                          </div>
                          <span className="font-medium text-foreground">{group.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-muted-foreground">{group.assessment}</td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                          statusColors[group.status as keyof typeof statusColors]
                        }`}>
                          {group.status === "active" && <Play className="w-3 h-3 mr-1" />}
                          {group.status === "completed" && <CheckCircle2 className="w-3 h-3 mr-1" />}
                          {group.status === "draft" && <Clock className="w-3 h-3 mr-1" />}
                          {group.status.charAt(0).toUpperCase() + group.status.slice(1)}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-24 h-2 rounded-full bg-muted overflow-hidden">
                            <div 
                              className="h-full gradient-accent rounded-full transition-all"
                              style={{ width: `${group.participants > 0 ? (group.completed / group.participants) * 100 : 0}%` }}
                            />
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {group.completed}/{group.participants}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-muted-foreground">{group.endDate}</td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Eye className="w-4 h-4 text-muted-foreground" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
