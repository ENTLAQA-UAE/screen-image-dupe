import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { HRAdminDashboard } from "@/components/dashboard/HRAdminDashboard";
import { OrgAdminDashboard } from "@/components/dashboard/OrgAdminDashboard";
import { Loader2 } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, roles, loading: authLoading, isSuperAdmin, isOrgAdmin, isHrAdmin } = useAuth();
  const { t } = useLanguage();
  
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [organizationName, setOrganizationName] = useState<string>("");
  const [loading, setLoading] = useState(true);

  // Redirect Super Admins to their dedicated console
  useEffect(() => {
    if (!authLoading && roles.length > 0 && isSuperAdmin()) {
      navigate('/super-admin', { replace: true });
    }
  }, [authLoading, roles, isSuperAdmin, navigate]);

  // Fetch user's organization
  useEffect(() => {
    const fetchOrganization = async () => {
      if (!user) return;
      
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching profile:', error);
        setLoading(false);
        return;
      }
      
      setOrganizationId(profile?.organization_id || null);

      if (profile?.organization_id) {
        const { data: org } = await supabase
          .from('organizations')
          .select('name')
          .eq('id', profile.organization_id)
          .maybeSingle();
        
        setOrganizationName(org?.name || '');
      }
      
      setLoading(false);
    };

    if (!authLoading) {
      fetchOrganization();
    }
  }, [user, authLoading]);

  const getUserName = () => {
    return user?.user_metadata?.full_name || user?.email?.split('@')[0] || "User";
  };

  // Show loading while checking auth
  if (authLoading || loading) {
    return (
      <DashboardLayout activeItem="Dashboard">
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      </DashboardLayout>
    );
  }

  // Don't render dashboard for Super Admins
  if (isSuperAdmin()) {
    return null;
  }

  // No organization assigned
  if (!organizationId) {
    return (
      <DashboardLayout activeItem="Dashboard">
        <div className="text-center py-20">
          <p className="text-muted-foreground">{t.common.noData}</p>
          <p className="text-sm text-muted-foreground mt-2">{t.common.loading}</p>
        </div>
      </DashboardLayout>
    );
  }

  // Render role-specific dashboard
  return (
    <DashboardLayout activeItem="Dashboard">
      {isOrgAdmin() ? (
        <OrgAdminDashboard 
          organizationId={organizationId} 
          organizationName={organizationName}
          userName={getUserName()} 
        />
      ) : (
        <HRAdminDashboard 
          organizationId={organizationId} 
          userName={getUserName()} 
        />
      )}
    </DashboardLayout>
  );
};

export default Dashboard;
