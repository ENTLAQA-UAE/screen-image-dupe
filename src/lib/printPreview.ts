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
  const url = `/print-preview?type=talent-snapshot&lang=${language}`;

  // Fallback storage (may not be shared between iframe/new tab due to browser partitioning)
  try {
    localStorage.setItem(
      "printReportData",
      JSON.stringify({ organization, reportData: data, reportType: "talent-snapshot" })
    );
  } catch {
    // ignore
  }

  const win = window.open(url, "_blank");
  if (!win) return;

  const message = { kind: "printReportData", payload: { organization, reportData: data, reportType: "talent-snapshot" } };

  // Post immediately and again shortly after to avoid timing issues
  try {
    win.postMessage(message, "*");
    setTimeout(() => {
      try {
        win.postMessage(message, "*");
      } catch {
        // ignore
      }
    }, 250);
  } catch {
    // ignore
  }
}

export function openParticipantPrintPreview(
  data: ParticipantPrintData,
  organization: OrganizationBranding,
  language: "en" | "ar" = "en"
): void {
  const url = `/print-preview?type=participant&lang=${language}`;

  try {
    localStorage.setItem(
      "printReportData",
      JSON.stringify({ organization, reportData: data, reportType: "participant" })
    );
  } catch {
    // ignore
  }

  const win = window.open(url, "_blank");
  if (!win) return;

  const message = { kind: "printReportData", payload: { organization, reportData: data, reportType: "participant" } };

  try {
    win.postMessage(message, "*");
    setTimeout(() => {
      try {
        win.postMessage(message, "*");
      } catch {
        // ignore
      }
    }, 250);
  } catch {
    // ignore
  }
}

export function openGroupPrintPreview(
  data: GroupPrintData,
  organization: OrganizationBranding,
  language: "en" | "ar" = "en"
): void {
  const url = `/print-preview?type=group&lang=${language}`;

  try {
    localStorage.setItem(
      "printReportData",
      JSON.stringify({ organization, reportData: data, reportType: "group" })
    );
  } catch {
    // ignore
  }

  const win = window.open(url, "_blank");
  if (!win) return;

  const message = { kind: "printReportData", payload: { organization, reportData: data, reportType: "group" } };

  try {
    win.postMessage(message, "*");
    setTimeout(() => {
      try {
        win.postMessage(message, "*");
      } catch {
        // ignore
      }
    }, 250);
  } catch {
    // ignore
  }
}
