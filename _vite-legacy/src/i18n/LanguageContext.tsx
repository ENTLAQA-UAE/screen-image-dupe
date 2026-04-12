import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { translations, Language, TranslationKeys } from "./translations";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: TranslationKeys;
  isRTL: boolean;
  dir: "ltr" | "rtl";
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [language, setLanguageState] = useState<Language>(() => {
    // Check localStorage first
    const stored = localStorage.getItem("jadarat-language") as Language;
    if (stored && (stored === "en" || stored === "ar")) {
      return stored;
    }
    // Check browser language
    const browserLang = navigator.language.split("-")[0];
    return browserLang === "ar" ? "ar" : "en";
  });

  // Fetch organization's primary language when user is authenticated
  useEffect(() => {
    const fetchOrgLanguage = async () => {
      if (!user) return;

      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("organization_id")
          .eq("id", user.id)
          .single();

        if (profile?.organization_id) {
          const { data: org } = await supabase
            .from("organizations")
            .select("primary_language")
            .eq("id", profile.organization_id)
            .single();

          if (org?.primary_language && !localStorage.getItem("jadarat-language")) {
            // Only set org language if user hasn't manually selected one
            const orgLang = org.primary_language as Language;
            if (orgLang === "en" || orgLang === "ar") {
              setLanguageState(orgLang);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching organization language:", error);
      }
    };

    fetchOrgLanguage();
  }, [user]);

  // Update HTML attributes when language changes
  useEffect(() => {
    const html = document.documentElement;
    html.lang = language;
    html.dir = language === "ar" ? "rtl" : "ltr";
    
    // Add/remove RTL class for Tailwind
    if (language === "ar") {
      html.classList.add("rtl");
    } else {
      html.classList.remove("rtl");
    }
  }, [language]);

  const setLanguage = useCallback((lang: Language) => {
    localStorage.setItem("jadarat-language", lang);
    setLanguageState(lang);
  }, []);

  // Clear language preference when user logs out (detected by user becoming null)
  useEffect(() => {
    if (!user) {
      // User logged out - clear the stored language preference
      localStorage.removeItem("jadarat-language");
      // Reset to English as default
      setLanguageState("en");
    }
  }, [user]);

  const value = useMemo(() => ({
    language,
    setLanguage,
    t: translations[language],
    isRTL: language === "ar",
    dir: (language === "ar" ? "rtl" : "ltr") as "ltr" | "rtl",
  }), [language, setLanguage]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}

// Convenience hook for just the translations
export function useTranslations() {
  const { t } = useLanguage();
  return t;
}
