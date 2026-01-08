// Helper functions to open print preview pages

export interface TalentSnapshotPrintData {
  employeeName: string;
  employeeEmail: string;
  employeeCode?: string;
  department?: string;
  jobTitle?: string;
  snapshotText: string;
  generatedAt: string;
  assessmentCount: number;
}

export interface ParticipantPrintData {
  participantName: string;
  participantEmail: string;
  employeeCode?: string;
  department?: string;
  groupName: string;
  assessmentTitle: string;
  assessmentType: string;
  completedAt: string | null;
  scoreSummary: any;
  aiReport: string | null;
}

export interface GroupPrintData {
  groupName: string;
  assessmentTitle: string;
  assessmentType: string;
  startDate: string | null;
  endDate: string | null;
  stats: {
    totalParticipants: number;
    completed: number;
    inProgress: number;
    invited: number;
    completionRate: number;
    averageScore: number | null;
    highestScore: number | null;
    lowestScore: number | null;
  };
  aiNarrative?: string;
}

export interface OrganizationBranding {
  name: string;
  logoUrl?: string | null;
  primaryColor?: string | null;
}

export function openTalentSnapshotPrintPreview(
  data: TalentSnapshotPrintData,
  organization: OrganizationBranding,
  language: "en" | "ar" = "en"
): void {
  // Store data in localStorage for the print preview page to access
  // Use localStorage instead of sessionStorage as it works across tabs
  localStorage.setItem("printReportData", JSON.stringify({
    organization,
    reportData: data,
  }));
  
  // Open print preview in new tab
  window.open(`/print-preview?type=talent-snapshot&lang=${language}`, "_blank");
}

export function openParticipantPrintPreview(
  data: ParticipantPrintData,
  organization: OrganizationBranding,
  language: "en" | "ar" = "en"
): void {
  localStorage.setItem("printReportData", JSON.stringify({
    organization,
    reportData: data,
  }));
  
  window.open(`/print-preview?type=participant&lang=${language}`, "_blank");
}

export function openGroupPrintPreview(
  data: GroupPrintData,
  organization: OrganizationBranding,
  language: "en" | "ar" = "en"
): void {
  localStorage.setItem("printReportData", JSON.stringify({
    organization,
    reportData: data,
  }));
  
  window.open(`/print-preview?type=group&lang=${language}`, "_blank");
}
