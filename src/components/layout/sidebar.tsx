'use client';

import {
  BarChart3,
  Brain,
  Building2,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  FileText,
  FolderKanban,
  Globe,
  Library,
  LogOut,
  Mail,
  PieChart,
  Settings,
  Shield,
  UserCog,
  UserCircle,
  Users,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import { useState, useTransition } from 'react';

import { logoutAction } from '@/app/[locale]/(auth)/actions';
import { Link } from '@/lib/i18n/routing';
import { cn } from '@/lib/utils';

// ==============================================================================
// Nav configuration per role
// ==============================================================================

interface NavItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href: string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const HR_ADMIN_NAV: NavGroup[] = [
  {
    label: '',
    items: [
      { icon: BarChart3, label: 'Dashboard', href: '/dashboard' },
      { icon: FileText, label: 'Assessments', href: '/assessments' },
      { icon: FolderKanban, label: 'Groups', href: '/groups' },
      { icon: UserCircle, label: 'Employees', href: '/employees' },
      { icon: Library, label: 'Question Bank', href: '/question-bank' },
      { icon: PieChart, label: 'Results', href: '/results' },
    ],
  },
  {
    label: 'SETTINGS',
    items: [
      { icon: Building2, label: 'Organization', href: '/settings/organization' },
      { icon: Users, label: 'Members', href: '/settings/members' },
      { icon: Mail, label: 'Email', href: '/settings/email' },
      { icon: Brain, label: 'AI Provider', href: '/settings/ai' },
      { icon: CreditCard, label: 'Billing', href: '/settings/billing' },
    ],
  },
];

const ORG_ADMIN_NAV: NavGroup[] = [
  {
    label: '',
    items: [
      { icon: BarChart3, label: 'Dashboard', href: '/dashboard' },
      { icon: PieChart, label: 'Reports', href: '/results' },
    ],
  },
  {
    label: 'ORGANIZATION',
    items: [
      { icon: Building2, label: 'Settings', href: '/settings/organization' },
      { icon: Users, label: 'Members', href: '/settings/members' },
      { icon: UserCog, label: 'Roles', href: '/settings/members' },
    ],
  },
  {
    label: 'BILLING',
    items: [
      { icon: CreditCard, label: 'Subscription', href: '/settings/billing' },
    ],
  },
  {
    label: 'SETTINGS',
    items: [
      { icon: Mail, label: 'Email', href: '/settings/email' },
      { icon: Brain, label: 'AI Provider', href: '/settings/ai' },
      { icon: Settings, label: 'Notifications', href: '/settings/notifications' },
    ],
  },
];

const SUPER_ADMIN_NAV: NavGroup[] = [
  {
    label: '',
    items: [
      { icon: BarChart3, label: 'Platform Overview', href: '/admin' },
    ],
  },
  {
    label: 'BILLING',
    items: [
      { icon: CreditCard, label: 'Providers', href: '/admin/billing/providers' },
      { icon: FileText, label: 'Subscriptions', href: '/admin/billing/subscriptions' },
      { icon: Globe, label: 'Requests', href: '/admin/billing/requests' },
      { icon: Shield, label: 'Activate', href: '/admin/billing/activate' },
    ],
  },
];

// ==============================================================================
// Sidebar component
// ==============================================================================

interface SidebarProps {
  userName: string;
  userEmail: string;
  userRole: string;
  organizationName: string | null;
  organizationLogo: string | null;
  role: 'hr_admin' | 'org_admin' | 'super_admin';
}

export function AppSidebar({
  userName,
  userEmail,
  userRole,
  organizationName,
  organizationLogo,
  role,
}: SidebarProps) {
  const locale = useLocale();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [isPending, startTransition] = useTransition();

  const navGroups =
    role === 'super_admin'
      ? SUPER_ADMIN_NAV
      : role === 'org_admin'
        ? ORG_ADMIN_NAV
        : HR_ADMIN_NAV;

  const isActive = (href: string) => {
    const localePath = `/${locale}${href}`;
    if (href === '/dashboard' || href === '/admin') {
      return pathname === localePath;
    }
    return pathname.startsWith(localePath);
  };

  const handleLogout = () => {
    startTransition(async () => {
      await logoutAction(locale);
    });
  };

  return (
    <aside
      className={cn(
        'fixed inset-y-0 start-0 z-30 flex flex-col border-e border-[hsl(var(--sidebar-border))] bg-[hsl(var(--sidebar-bg))] transition-all duration-300',
        collapsed ? 'w-[var(--sidebar-width-collapsed)]' : 'w-[var(--sidebar-width)]',
      )}
    >
      {/* Header: Logo + Org name */}
      <div className="flex h-16 items-center gap-3 border-b border-[hsl(var(--sidebar-border))] px-4">
        {organizationLogo ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={organizationLogo}
            alt={organizationName ?? 'Organization'}
            className="h-9 w-9 flex-shrink-0 rounded-lg object-contain"
          />
        ) : (
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-primary text-white font-bold text-sm">
            {(organizationName ?? 'Q').charAt(0).toUpperCase()}
          </div>
        )}
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-bold text-[hsl(var(--sidebar-foreground))]">
              {organizationName ?? 'Qudurat'}
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {navGroups.map((group, gi) => (
          <div key={gi} className={gi > 0 ? 'mt-6' : ''}>
            {group.label && !collapsed && (
              <div className="section-label mb-2 px-3">{group.label}</div>
            )}
            {group.label && collapsed && gi > 0 && (
              <div className="mx-3 mb-2 border-t border-[hsl(var(--sidebar-border))]" />
            )}
            <div className="space-y-1">
              {group.items.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href + item.label}
                    href={item.href}
                    className={cn(
                      'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                      active
                        ? 'bg-[hsl(var(--sidebar-active))] text-[hsl(var(--sidebar-active-foreground))] shadow-sm'
                        : 'text-[hsl(var(--sidebar-muted))] hover:bg-[hsl(var(--sidebar-hover))] hover:text-[hsl(var(--sidebar-foreground))]',
                      collapsed && 'justify-center px-0',
                    )}
                    title={collapsed ? item.label : undefined}
                  >
                    <item.icon
                      className={cn(
                        'h-[18px] w-[18px] flex-shrink-0 transition-transform duration-200',
                        !active && 'group-hover:scale-110',
                      )}
                    />
                    {!collapsed && <span className="flex-1">{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User section */}
      <div className="border-t border-[hsl(var(--sidebar-border))] p-3">
        {!collapsed ? (
          <div className="flex items-center gap-3 rounded-lg px-3 py-2.5">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 font-semibold text-primary">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold">
                {userName}
              </div>
              <div className="truncate text-[10px] text-muted-foreground">
                {userRole}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex justify-center py-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 font-semibold text-primary text-sm">
              {userName.charAt(0).toUpperCase()}
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          disabled={isPending}
          className={cn(
            'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive',
            collapsed && 'justify-center px-0',
          )}
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -end-3 top-20 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-background shadow-sm transition-colors hover:bg-muted"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? (
          <ChevronRight className="h-3 w-3 rtl:rotate-180" />
        ) : (
          <ChevronLeft className="h-3 w-3 rtl:rotate-180" />
        )}
      </button>

      {/* Powered by */}
      {!collapsed && (
        <div className="px-4 pb-3 text-center text-[9px] text-muted-foreground/50">
          Powered by <span className="font-semibold text-primary/50">Qudurat</span>
        </div>
      )}
    </aside>
  );
}
