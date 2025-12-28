import { AlertTriangle, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { useLanguage } from "@/i18n/LanguageContext";
import { limitTranslations } from "@/hooks/useSubscriptionLimits";

interface LimitWarningProps {
  resourceType: "assessments" | "groups" | "participants" | "hrAdmins";
  currentUsage: number;
  limit: number;
  showUpgrade?: boolean;
  compact?: boolean;
}

export function LimitWarning({ 
  resourceType, 
  currentUsage, 
  limit, 
  showUpgrade = true,
  compact = false 
}: LimitWarningProps) {
  const navigate = useNavigate();
  const { language, isRTL } = useLanguage();
  const t = limitTranslations[language as "en" | "ar"] || limitTranslations.en;

  // If unlimited, don't show warning
  if (limit === -1) return null;

  const percentage = Math.min(100, (currentUsage / limit) * 100);
  const isAtLimit = currentUsage >= limit;
  const isNearLimit = percentage >= 80;

  // Don't show anything if below 80%
  if (!isNearLimit && !isAtLimit) return null;

  const resourceNames: Record<string, { en: string; ar: string }> = {
    assessments: { en: "assessments", ar: "التقييمات" },
    groups: { en: "assessment groups", ar: "مجموعات التقييم" },
    participants: { en: "participants", ar: "المشاركين" },
    hrAdmins: { en: "HR admins", ar: "مدراء الموارد البشرية" },
  };

  const resourceName = resourceNames[resourceType][language as "en" | "ar"] || resourceNames[resourceType].en;

  const getMessage = () => {
    if (isAtLimit) {
      const messages: Record<string, string> = {
        assessments: t.assessmentLimitReached,
        groups: t.groupLimitReached,
        participants: t.participantLimitReached,
        hrAdmins: t.hrAdminLimitReached,
      };
      return messages[resourceType].replace("{limit}", limit.toString());
    }
    return t.nearLimit
      .replace("{resource}", resourceName)
      .replace("{used}", currentUsage.toString())
      .replace("{limit}", limit.toString());
  };

  if (compact) {
    return (
      <div className={`flex items-center gap-2 text-sm ${isAtLimit ? "text-destructive" : "text-amber-600"}`}>
        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
        <span>
          {currentUsage}/{limit} {resourceName}
        </span>
      </div>
    );
  }

  return (
    <Alert 
      variant={isAtLimit ? "destructive" : "default"} 
      className={`mb-4 ${!isAtLimit ? "border-amber-500/50 bg-amber-50 dark:bg-amber-950/20" : ""}`}
    >
      <AlertTriangle className={`h-4 w-4 ${!isAtLimit ? "text-amber-600" : ""}`} />
      <AlertTitle className={!isAtLimit ? "text-amber-800 dark:text-amber-200" : ""}>
        {isAtLimit ? t.limitReached : `${t.currentUsage}: ${currentUsage} ${t.of} ${limit}`}
      </AlertTitle>
      <AlertDescription className={`mt-2 ${!isAtLimit ? "text-amber-700 dark:text-amber-300" : ""}`}>
        <p className="mb-3">{getMessage()}</p>
        <Progress 
          value={percentage} 
          className={`h-2 mb-3 ${isAtLimit ? "[&>div]:bg-destructive" : "[&>div]:bg-amber-500"}`}
        />
        {showUpgrade && (
          <Button 
            variant={isAtLimit ? "destructive" : "outline"}
            size="sm"
            onClick={() => navigate("/subscription")}
            className="gap-2"
          >
            <TrendingUp className="w-4 h-4" />
            {t.upgradePlan}
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}

interface LimitBadgeProps {
  currentUsage: number;
  limit: number;
}

export function LimitBadge({ currentUsage, limit }: LimitBadgeProps) {
  const { language } = useLanguage();
  const t = limitTranslations[language as "en" | "ar"] || limitTranslations.en;

  if (limit === -1) {
    return (
      <span className="text-xs text-muted-foreground">
        {t.unlimited}
      </span>
    );
  }

  const percentage = Math.min(100, (currentUsage / limit) * 100);
  const isAtLimit = currentUsage >= limit;
  const isNearLimit = percentage >= 80;

  return (
    <span 
      className={`text-xs font-medium px-2 py-0.5 rounded-full ${
        isAtLimit 
          ? "bg-destructive/10 text-destructive" 
          : isNearLimit 
            ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
            : "bg-muted text-muted-foreground"
      }`}
    >
      {currentUsage}/{limit}
    </span>
  );
}
