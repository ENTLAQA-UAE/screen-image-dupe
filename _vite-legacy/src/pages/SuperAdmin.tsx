import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import {
  SuperAdminSidebar,
  DashboardSection,
  OrganizationsSection,
  UsersSection,
  SubscriptionsSection,
  SettingsSection,
  Organization,
  OrganizationStats,
  UserWithRole,
  ActiveSection,
} from '@/components/superadmin';

export default function SuperAdmin() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  
  const [activeSection, setActiveSection] = useState<ActiveSection>('dashboard');
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [orgStats, setOrgStats] = useState<Record<string, OrganizationStats>>({});
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Assign admin dialog state (shared between sections)
  const [isAssignAdminOpen, setIsAssignAdminOpen] = useState(false);
  const [selectedOrgId, setSelectedOrgId] = useState('');

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

  return (
    <div className="min-h-screen bg-background flex">
      <SuperAdminSidebar
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        userName={getUserName()}
        onSignOut={handleSignOut}
      />

      <div className="pl-64 flex-1">
        <main className="p-8">
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
        </main>
      </div>
    </div>
  );
}
