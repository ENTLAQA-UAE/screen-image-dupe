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

type ReportType = "talent-snapshot" | "participant" | "group";

type PrintPayload = {
  organization: OrganizationBranding;
  reportData: TalentSnapshotPrintData | ParticipantPrintData | GroupPrintData;
  reportType: ReportType;
};

function openWithHandshake(url: string, payload: PrintPayload) {
  // Fallback storage (used if postMessage isn't delivered)
  try {
    localStorage.setItem("printReportData", JSON.stringify({ ts: Date.now(), payload }));
  } catch {
    // ignore
  }

  const win = window.open(url, "_blank");
  if (!win) return;

  const sendData = () => {
    try {
      win.postMessage({ kind: "printReportData", payload }, "*");
      console.log("[printPreview] sent report data", payload.reportType);
    } catch (e) {
      console.log("[printPreview] failed to postMessage", e);
    }
  };

  const onMessage = (event: MessageEvent) => {
    if (event.source !== win) return;
    const msg = event.data;
    if (!msg || msg.kind !== "printPreviewReady") return;

    console.log("[printPreview] received ready from new tab");
    window.removeEventListener("message", onMessage);
    sendData();
  };

  window.addEventListener("message", onMessage);

  // Also attempt sending a couple times in case the ready signal is missed.
  setTimeout(sendData, 300);
  setTimeout(sendData, 900);

  // Cleanup listener after a while
  setTimeout(() => {
    window.removeEventListener("message", onMessage);
  }, 15000);
}

export function openTalentSnapshotPrintPreview(
  data: TalentSnapshotPrintData,
  organization: OrganizationBranding,
  language: "en" | "ar" = "en"
): void {
  openWithHandshake(`/print-preview?type=talent-snapshot&lang=${language}`,
    { organization, reportData: data, reportType: "talent-snapshot" }
  );
}

export function openParticipantPrintPreview(
  data: ParticipantPrintData,
  organization: OrganizationBranding,
  language: "en" | "ar" = "en"
): void {
  openWithHandshake(`/print-preview?type=participant&lang=${language}`,
    { organization, reportData: data, reportType: "participant" }
  );
}

export function openGroupPrintPreview(
  data: GroupPrintData,
  organization: OrganizationBranding,
  language: "en" | "ar" = "en"
): void {
  openWithHandshake(`/print-preview?type=group&lang=${language}`,
    { organization, reportData: data, reportType: "group" }
  );
}
