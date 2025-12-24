import jsPDF from "jspdf";
import { format } from "date-fns";

interface ParticipantReport {
  participantName: string;
  participantEmail: string;
  groupName: string;
  assessmentTitle: string;
  assessmentType: string;
  completedAt: string | null;
  scoreSummary: {
    percentage?: number;
    grade?: string;
    correctCount?: number;
    totalPossible?: number;
    traits?: Record<string, number>;
  } | null;
  aiReport: string | null;
  organizationName: string;
}

interface GroupReport {
  groupName: string;
  assessmentTitle: string;
  assessmentType: string;
  startDate: string | null;
  endDate: string | null;
  organizationName: string;
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
  participants: {
    name: string;
    email: string;
    status: string;
    score: number | null;
    completedAt: string | null;
  }[];
}

// Helper to add wrapped text
const addWrappedText = (
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
): number => {
  const lines = doc.splitTextToSize(text, maxWidth);
  doc.text(lines, x, y);
  return y + lines.length * lineHeight;
};

export const generateParticipantPDF = (report: ParticipantReport): void => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = 20;

  // Header
  doc.setFillColor(15, 23, 42); // Dark blue
  doc.rect(0, 0, pageWidth, 40, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("Assessment Report", margin, 25);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(report.organizationName, margin, 33);

  y = 55;

  // Participant Info Section
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Participant Information", margin, y);
  y += 10;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);

  const info = [
    ["Name:", report.participantName || "Anonymous"],
    ["Email:", report.participantEmail || "-"],
    ["Assessment:", report.assessmentTitle],
    ["Type:", report.assessmentType.charAt(0).toUpperCase() + report.assessmentType.slice(1)],
    ["Group:", report.groupName],
    ["Completed:", report.completedAt ? format(new Date(report.completedAt), "PPP p") : "-"],
  ];

  info.forEach(([label, value]) => {
    doc.setFont("helvetica", "bold");
    doc.text(label, margin, y);
    doc.setFont("helvetica", "normal");
    doc.text(value, margin + 30, y);
    y += 7;
  });

  y += 10;

  // Results Section
  if (report.scoreSummary) {
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Results", margin, y);
    y += 10;

    if (report.scoreSummary.percentage !== undefined) {
      // Graded assessment
      doc.setFillColor(240, 253, 244); // Light green
      doc.roundedRect(margin, y, contentWidth, 30, 3, 3, "F");

      doc.setFontSize(24);
      doc.setTextColor(22, 163, 74); // Green
      doc.setFont("helvetica", "bold");
      doc.text(`${report.scoreSummary.percentage}%`, margin + 10, y + 18);

      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105);
      doc.setFont("helvetica", "normal");
      doc.text(
        `${report.scoreSummary.correctCount || 0} of ${report.scoreSummary.totalPossible || 0} correct`,
        margin + 50,
        y + 15
      );

      if (report.scoreSummary.grade) {
        doc.setFont("helvetica", "bold");
        doc.text(`Grade: ${report.scoreSummary.grade}`, margin + 50, y + 23);
      }

      y += 40;
    } else if (report.scoreSummary.traits) {
      // Trait-based assessment
      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105);

      Object.entries(report.scoreSummary.traits).forEach(([trait, score]) => {
        const barWidth = (score / 5) * (contentWidth - 60);

        doc.setFont("helvetica", "normal");
        doc.text(trait.charAt(0).toUpperCase() + trait.slice(1), margin, y + 5);

        // Background bar
        doc.setFillColor(226, 232, 240);
        doc.roundedRect(margin + 50, y, contentWidth - 60, 8, 2, 2, "F");

        // Value bar
        doc.setFillColor(99, 102, 241); // Indigo
        doc.roundedRect(margin + 50, y, barWidth, 8, 2, 2, "F");

        doc.text(score.toFixed(1), pageWidth - margin - 10, y + 5);
        y += 12;
      });

      y += 10;
    }
  }

  // AI Report Section
  if (report.aiReport) {
    // Check if we need a new page
    if (y > 200) {
      doc.addPage();
      y = 20;
    }

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("AI-Generated Feedback", margin, y);
    y += 10;

    doc.setFillColor(249, 250, 251);
    doc.roundedRect(margin, y, contentWidth, 0, 3, 3, "F");

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(55, 65, 81);

    y = addWrappedText(doc, report.aiReport, margin + 5, y + 8, contentWidth - 10, 5);
    y += 10;
  }

  // Footer
  const pageCount = doc.internal.pages.length - 1;
  doc.setFontSize(8);
  doc.setTextColor(156, 163, 175);

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.text(
      `Generated on ${format(new Date(), "PPP")} • Page ${i} of ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" }
    );
  }

  // Save the PDF
  const fileName = `${report.participantName || "participant"}_${report.assessmentTitle}_report.pdf`
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .toLowerCase();
  doc.save(fileName);
};

export const generateGroupPDF = (report: GroupReport): void => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = 20;

  // Header
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 45, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("Group Assessment Report", margin, 25);

  doc.setFontSize(12);
  doc.text(report.groupName, margin, 36);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(report.organizationName, pageWidth - margin, 25, { align: "right" });

  y = 60;

  // Group Info
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Assessment Details", margin, y);
  y += 10;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);

  const groupInfo = [
    ["Assessment:", report.assessmentTitle],
    ["Type:", report.assessmentType.charAt(0).toUpperCase() + report.assessmentType.slice(1)],
    ["Period:", `${report.startDate ? format(new Date(report.startDate), "PP") : "-"} to ${report.endDate ? format(new Date(report.endDate), "PP") : "-"}`],
  ];

  groupInfo.forEach(([label, value]) => {
    doc.setFont("helvetica", "bold");
    doc.text(label, margin, y);
    doc.setFont("helvetica", "normal");
    doc.text(value, margin + 35, y);
    y += 7;
  });

  y += 15;

  // Statistics Section
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Statistics Overview", margin, y);
  y += 12;

  // Stats boxes
  const boxWidth = (contentWidth - 15) / 4;
  const boxHeight = 35;

  const statsData = [
    { label: "Total", value: report.stats.totalParticipants.toString(), color: [99, 102, 241] },
    { label: "Completed", value: `${report.stats.completionRate}%`, color: [22, 163, 74] },
    { label: "Avg Score", value: report.stats.averageScore ? `${report.stats.averageScore}%` : "-", color: [245, 158, 11] },
    { label: "Highest", value: report.stats.highestScore ? `${report.stats.highestScore}%` : "-", color: [14, 165, 233] },
  ];

  statsData.forEach((stat, index) => {
    const x = margin + index * (boxWidth + 5);

    doc.setFillColor(stat.color[0], stat.color[1], stat.color[2]);
    doc.roundedRect(x, y, boxWidth, boxHeight, 3, 3, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text(stat.value, x + boxWidth / 2, y + 15, { align: "center" });

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(stat.label, x + boxWidth / 2, y + 25, { align: "center" });
  });

  y += boxHeight + 20;

  // Participants Table
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Participants", margin, y);
  y += 10;

  // Table header
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, contentWidth, 10, "F");

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(71, 85, 105);

  doc.text("Name", margin + 5, y + 7);
  doc.text("Email", margin + 55, y + 7);
  doc.text("Status", margin + 115, y + 7);
  doc.text("Score", margin + 145, y + 7);
  doc.text("Completed", margin + 165, y + 7);

  y += 12;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);

  report.participants.slice(0, 20).forEach((participant, index) => {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }

    if (index % 2 === 0) {
      doc.setFillColor(249, 250, 251);
      doc.rect(margin, y - 3, contentWidth, 8, "F");
    }

    doc.setTextColor(55, 65, 81);
    doc.text((participant.name || "Anonymous").substring(0, 25), margin + 5, y + 2);
    doc.text((participant.email || "-").substring(0, 28), margin + 55, y + 2);

    // Status with color
    const statusColor = participant.status === "completed" ? [22, 163, 74] : participant.status === "started" ? [245, 158, 11] : [156, 163, 175];
    doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
    doc.text(participant.status?.charAt(0).toUpperCase() + participant.status?.slice(1) || "-", margin + 115, y + 2);

    doc.setTextColor(55, 65, 81);
    doc.text(participant.score !== null ? `${participant.score}%` : "-", margin + 145, y + 2);
    doc.text(participant.completedAt ? format(new Date(participant.completedAt), "MMM d") : "-", margin + 165, y + 2);

    y += 8;
  });

  if (report.participants.length > 20) {
    doc.setTextColor(156, 163, 175);
    doc.setFontSize(8);
    doc.text(`... and ${report.participants.length - 20} more participants`, margin + 5, y + 5);
  }

  // Footer
  const pageCount = doc.internal.pages.length - 1;
  doc.setFontSize(8);
  doc.setTextColor(156, 163, 175);

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.text(
      `Generated on ${format(new Date(), "PPP")} • Page ${i} of ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" }
    );
  }

  // Save
  const fileName = `${report.groupName}_report.pdf`.replace(/[^a-zA-Z0-9_-]/g, "_").toLowerCase();
  doc.save(fileName);
};
