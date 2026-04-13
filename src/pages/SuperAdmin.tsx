import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, Globe } from 'lucide-react';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useLanguage } from '@/i18n/LanguageContext';
import {
  SuperAdminSidebar,
  DashboardSection,
  OrganizationsSection,
  UsersSection,
  SubscriptionsSection,
  SettingsSection,
  StripeSettingsSection,
  Organization,
  OrganizationStats,
  UserWithRole,
  ActiveSection,
} from '@/components/superadmin';

export default function SuperAdmin() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { isRTL, dir } = useLanguage();

  const [activeSection, setActiveSection] = useState<ActiveSection>('dashboard');
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [orgStats, setOrgStats] = useState<Record<string, OrganizationStats>>({});
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Assign admin dialog state (shared between sections)
  const [isAssignAdminOpen, setIsAssignAdminOpen] = useState(false);
  const [selectedOrgId, setSelectedOrgId] = useState('');

  const sidebarWidth = sidebarCollapsed ? '68px' : '256px';

  const fetchData = async () => {
    setIsLoading(true);

    const { data: orgsData, error: orgsError } = await supabase
      .from('organizations')
      .select('*')
      .order('created_at', { ascending: false });

    if (orgsError) {
      console.error('Error fetching organizations:', orgsError);
    } else {
      setOrganizations(orgsData || []);

      const statsMap: Record<string, OrganizationStats> = {};
      for (const org of orgsData || []) {
        const [assessmentsRes, participantsRes, groupsRes] = await Promise.all([
          supabase.from('assessments').select('id', { count: 'exact', head: true }).eq('organization_id', org.id),
          supabase.from('participants').select('id', { count: 'exact', head: true }).eq('organization_id', org.id),
          supabase.from('assessment_groups').select('id', { count: 'exact', head: true }).eq('organization_id', org.id),
        ]);

        statsMap[org.id] = {
          assessments: assessmentsRes.count || 0,
          participants: participantsRes.count || 0,
          groups: groupsRes.count || 0,
        };
      }
      setOrgStats(statsMap);
    }

    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        organization_id,
        organizations (name)
      `);

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
    }

    const { data: rolesData, error: rolesError } = await supabase
      .from('user_roles')
      .select('user_id, role');

    if (rolesError) {
      console.error('Error fetching roles:', rolesError);
    }

    if (profilesData) {
      const usersWithRoles: UserWithRole[] = profilesData.map(profile => {
        const userRoles = rolesData?.filter(r => r.user_id === profile.id).map(r => r.role) || [];
        return {
          id: profile.id,
          email: '',
          full_name: profile.full_name,
          organization_id: profile.organization_id,
          organization_name: (profile.organizations as any)?.name,
          roles: userRoles,
        };
      });
      setUsers(usersWithRoles);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const getUserName = () => {
    return user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Super Admin';
  };

  const handleOpenAssignAdmin = (orgId: string) => {
    setSelectedOrgId(orgId);
    setIsAssignAdminOpen(true);
  };

  const getSectionTitle = () => {
    const titles: Record<ActiveSection, string> = {
      dashboard: 'Dashboard',
      organizations: 'Organizations',
      users: 'Users & Roles',
      subscriptions: 'Subscriptions',
      settings: 'Platform Settings',
      stripe: 'Stripe Settings',
    };
    return titles[activeSection];
  };

  return (
    <div className="min-h-screen bg-background" dir={dir}>
      <SuperAdminSidebar
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        userName={getUserName()}
        onSignOut={handleSignOut}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Top Bar */}
      <header
        className="h-16 bg-card border-b border-border/60 flex items-center justify-between px-6 sticky top-0 z-40 transition-all duration-200"
        style={{ [isRTL ? 'marginRight' : 'marginLeft']: sidebarWidth }}
      >
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-bold text-foreground">{getSectionTitle()}</h1>
          <div className="relative hidden md:block">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search..."
              className="w-64 h-9 rounded-lg border border-border bg-muted/30 text-sm pl-10 pr-4 transition-all duration-150 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 placeholder:text-muted-foreground/50"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <button className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors relative">
            <Bell className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3 pl-3 ml-2 border-l border-border/60">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
              {getUserName().charAt(0).toUpperCase()}
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-foreground">{getUserName()}</p>
              <p className="text-[11px] text-muted-foreground">Super Admin</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main
        className="transition-all duration-200"
        style={{ [isRTL ? 'marginRight' : 'marginLeft']: sidebarWidth }}
      >
        <div className="p-4 sm:p-6 lg:p-8">
          {activeSection === 'dashboard' && (
            <DashboardSection
              organizations={organizations}
              orgStats={orgStats}
              users={users}
              isLoading={isLoading}
              onViewAllOrganizations={() => setActiveSection('organizations')}
            />
          )}

          {activeSection === 'organizations' && (
            <OrganizationsSection
              organizations={organizations}
              orgStats={orgStats}
              isLoading={isLoading}
              onRefresh={fetchData}
              onOpenAssignAdmin={handleOpenAssignAdmin}
            />
          )}

          {activeSection === 'users' && (
            <UsersSection
              users={users}
              organizations={organizations}
              isLoading={isLoading}
              onRefresh={fetchData}
              isAssignAdminOpen={isAssignAdminOpen}
              setIsAssignAdminOpen={setIsAssignAdminOpen}
              selectedOrgId={selectedOrgId}
              setSelectedOrgId={setSelectedOrgId}
            />
          )}

          {activeSection === 'subscriptions' && (
            <SubscriptionsSection
              organizations={organizations}
              orgStats={orgStats}
              onEditOrg={() => setActiveSection('organizations')}
            />
          )}

          {activeSection === 'settings' && (
            <SettingsSection />
          )}

          {activeSection === 'stripe' && (
            <StripeSettingsSection onBack={() => setActiveSection('settings')} />
          )}
        </div>
      </main>
    </div>
  );
}
