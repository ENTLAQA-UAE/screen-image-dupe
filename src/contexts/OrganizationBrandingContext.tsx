import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface OrganizationBranding {
  name: string | null;
  logo_url: string | null;
  primary_color: string | null;
}

interface OrganizationBrandingContextType {
  branding: OrganizationBranding | null;
  loading: boolean;
  organizationId: string | null;
}

const OrganizationBrandingContext = createContext<OrganizationBrandingContextType | undefined>(undefined);

// Convert hex to HSL for CSS variable
function hexToHSL(hex: string): string {
  // Remove # if present
  hex = hex.replace(/^#/, '');
  
  // Parse hex values
  let r = parseInt(hex.substring(0, 2), 16) / 255;
  let g = parseInt(hex.substring(2, 4), 16) / 255;
  let b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

// Generate lighter/darker variants
function adjustLightness(hsl: string, amount: number): string {
  const parts = hsl.split(' ');
  const h = parts[0];
  const s = parts[1];
  let l = parseInt(parts[2]);
  l = Math.min(100, Math.max(0, l + amount));
  return `${h} ${s} ${l}%`;
}

export function OrganizationBrandingProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [branding, setBranding] = useState<OrganizationBranding | null>(null);
  const [loading, setLoading] = useState(true);
  const [organizationId, setOrganizationId] = useState<string | null>(null);

  useEffect(() => {
    const fetchBranding = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // First get the user's organization
        const { data: profile } = await supabase
          .from("profiles")
          .select("organization_id")
          .eq("id", user.id)
          .single();

        if (profile?.organization_id) {
          setOrganizationId(profile.organization_id);
          
          // Fetch organization branding
          const { data: org } = await supabase
            .from("organizations")
            .select("name, logo_url, primary_color")
            .eq("id", profile.organization_id)
            .single();

          if (org) {
            setBranding({
              name: org.name,
              logo_url: org.logo_url,
              primary_color: org.primary_color,
            });
          }
        }
      } catch (error) {
        console.error("Error fetching organization branding:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBranding();
  }, [user]);

  // Apply branding colors to CSS variables
  useEffect(() => {
    if (branding?.primary_color) {
      const hsl = hexToHSL(branding.primary_color);
      const root = document.documentElement;
      
      // Set the primary color
      root.style.setProperty('--primary', hsl);
      root.style.setProperty('--primary-glow', adjustLightness(hsl, 20));
      
      // Also update accent if we want it to match
      root.style.setProperty('--accent', hsl);
      root.style.setProperty('--accent-glow', adjustLightness(hsl, 20));
    } else {
      // Reset to defaults when no branding
      const root = document.documentElement;
      root.style.removeProperty('--primary');
      root.style.removeProperty('--primary-glow');
      root.style.removeProperty('--accent');
      root.style.removeProperty('--accent-glow');
    }
  }, [branding?.primary_color]);

  const value = useMemo(() => ({
    branding,
    loading,
    organizationId,
  }), [branding, loading, organizationId]);

  return (
    <OrganizationBrandingContext.Provider value={value}>
      {children}
    </OrganizationBrandingContext.Provider>
  );
}

export function useOrganizationBranding() {
  const context = useContext(OrganizationBrandingContext);
  if (context === undefined) {
    throw new Error("useOrganizationBranding must be used within an OrganizationBrandingProvider");
  }
  return context;
}
