import jsPDF from "jspdf";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";

// Arabic translations
const translations = {
  en: {
    assessmentReport: "Assessment Report",
    groupAssessmentReport: "Group Assessment Report",
    participantInformation: "Participant Information",
    name: "Name:",
    email: "Email:",
    assessment: "Assessment:",
    type: "Type:",
    group: "Group:",
    completed: "Completed:",
    results: "Results",
    correct: "correct",
    grade: "Grade:",
    aiGeneratedFeedback: "AI-Generated Feedback",
    generatedOn: "Generated on",
    page: "Page",
    of: "of",
    assessmentDetails: "Assessment Details",
    period: "Period:",
    to: "to",
    statisticsOverview: "Statistics Overview",
    total: "Total",
    completionRate: "Completed",
    avgScore: "Avg Score",
    highest: "Highest",
    participants: "Participants",
    status: "Status",
    score: "Score",
    anonymous: "Anonymous",
    andMore: "and more participants",
    employeeCode: "Employee Code:",
    department: "Department:",
    cognitive: "Cognitive",
    personality: "Personality",
    situational: "Situational",
    language: "Language",
    invited: "Invited",
    started: "Started",
  },
  ar: {
    assessmentReport: "تقرير التقييم",
    groupAssessmentReport: "تقرير تقييم المجموعة",
    participantInformation: "معلومات المشارك",
    name: "الاسم:",
    email: "البريد الإلكتروني:",
    assessment: "التقييم:",
    type: "النوع:",
    group: "المجموعة:",
    completed: "اكتمل:",
    results: "النتائج",
    correct: "صحيح",
    grade: "الدرجة:",
    aiGeneratedFeedback: "ملاحظات الذكاء الاصطناعي",
    generatedOn: "تم الإنشاء في",
    page: "صفحة",
    of: "من",
    assessmentDetails: "تفاصيل التقييم",
    period: "الفترة:",
    to: "إلى",
    statisticsOverview: "نظرة عامة على الإحصائيات",
    total: "المجموع",
    completionRate: "نسبة الإكمال",
    avgScore: "متوسط الدرجة",
    highest: "الأعلى",
    participants: "المشاركون",
    status: "الحالة",
    score: "الدرجة",
    anonymous: "مجهول",
    andMore: "مشاركين آخرين",
    employeeCode: "كود الموظف:",
    department: "القسم:",
    cognitive: "معرفي",
    personality: "شخصية",
    situational: "مواقف",
    language: "لغة",
    invited: "مدعو",
    started: "بدأ",
  }
};

type Language = 'en' | 'ar';

interface ParticipantReport {
  participantName: string;
  participantEmail: string;
  employeeCode?: string;
  department?: string;
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
  language?: Language;
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
  language?: Language;
}

// Helper to detect if text contains Arabic
const containsArabic = (text: string): boolean => {
  const arabicPattern = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
  return arabicPattern.test(text);
};

// Helper to reverse Arabic text for RTL display in jsPDF (basic approach)
const processArabicText = (text: string): string => {
  if (!containsArabic(text)) return text;
  // For jsPDF, Arabic text needs to be reversed character-by-character
  // This is a simplified approach - for production, consider using arabic-reshaper
  return text.split('').reverse().join('');
};

// Helper to add wrapped text with RTL support
const addWrappedText = (
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  isRTL: boolean = false
): number => {
  const lines = doc.splitTextToSize(text, maxWidth);
  if (isRTL) {
    lines.forEach((line: string, index: number) => {
      doc.text(line, x + maxWidth, y + index * lineHeight, { align: 'right' });
    });
  } else {
    doc.text(lines, x, y);
  }
  return y + lines.length * lineHeight;
};

// Helper to add a label-value pair with RTL support
const addLabelValue = (
  doc: jsPDF,
  label: string,
  value: string,
  x: number,
  y: number,
  pageWidth: number,
  margin: number,
  isRTL: boolean
) => {
  if (isRTL) {
    doc.setFont("helvetica", "bold");
    doc.text(label, pageWidth - margin, y, { align: 'right' });
    doc.setFont("helvetica", "normal");
    doc.text(value, pageWidth - margin - 35, y, { align: 'right' });
  } else {
    doc.setFont("helvetica", "bold");
    doc.text(label, x, y);
    doc.setFont("helvetica", "normal");
    doc.text(value, x + 35, y);
  }
};

export const generateParticipantPDF = (report: ParticipantReport): void => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  const lang = report.language || 'en';
  const t = translations[lang];
  const isRTL = lang === 'ar';
  const dateLocale = lang === 'ar' ? ar : enUS;
  let y = 20;

  // Header
  doc.setFillColor(15, 23, 42); // Dark blue
  doc.rect(0, 0, pageWidth, 40, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  
  if (isRTL) {
    doc.text(t.assessmentReport, pageWidth - margin, 25, { align: 'right' });
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(report.organizationName, pageWidth - margin, 33, { align: 'right' });
  } else {
    doc.text(t.assessmentReport, margin, 25);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(report.organizationName, margin, 33);
  }

  y = 55;

  // Participant Info Section
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  
  if (isRTL) {
    doc.text(t.participantInformation, pageWidth - margin, y, { align: 'right' });
  } else {
    doc.text(t.participantInformation, margin, y);
  }
  y += 10;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);

  const info = [
    [t.name, report.participantName || t.anonymous],
    [t.email, report.participantEmail || "-"],
    ...(report.employeeCode ? [[t.employeeCode, report.employeeCode]] : []),
    ...(report.department ? [[t.department, report.department]] : []),
    [t.assessment, report.assessmentTitle],
    [t.type, (t as any)[report.assessmentType.toLowerCase()] || report.assessmentType.charAt(0).toUpperCase() + report.assessmentType.slice(1)],
    [t.group, report.groupName],
    [t.completed, report.completedAt ? format(new Date(report.completedAt), "PPP p", { locale: dateLocale }) : "-"],
  ];

  info.forEach(([label, value]) => {
    addLabelValue(doc, label as string, value as string, margin, y, pageWidth, margin, isRTL);
    y += 7;
  });

  y += 10;

  // Results Section
  if (report.scoreSummary) {
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    
    if (isRTL) {
      doc.text(t.results, pageWidth - margin, y, { align: 'right' });
    } else {
      doc.text(t.results, margin, y);
    }
    y += 10;

    if (report.scoreSummary.percentage !== undefined) {
      // Graded assessment
      doc.setFillColor(240, 253, 244); // Light green
      doc.roundedRect(margin, y, contentWidth, 30, 3, 3, "F");

      doc.setFontSize(24);
      doc.setTextColor(22, 163, 74); // Green
      doc.setFont("helvetica", "bold");
      
      if (isRTL) {
        doc.text(`%${report.scoreSummary.percentage}`, pageWidth - margin - 10, y + 18, { align: 'right' });
        doc.setFontSize(10);
        doc.setTextColor(71, 85, 105);
        doc.setFont("helvetica", "normal");
        doc.text(
          `${report.scoreSummary.correctCount || 0} ${t.correct} ${t.of} ${report.scoreSummary.totalPossible || 0}`,
          pageWidth - margin - 50,
          y + 15,
          { align: 'right' }
        );
        if (report.scoreSummary.grade) {
          doc.setFont("helvetica", "bold");
          doc.text(`${t.grade} ${report.scoreSummary.grade}`, pageWidth - margin - 50, y + 23, { align: 'right' });
        }
      } else {
        doc.text(`${report.scoreSummary.percentage}%`, margin + 10, y + 18);
        doc.setFontSize(10);
        doc.setTextColor(71, 85, 105);
        doc.setFont("helvetica", "normal");
        doc.text(
          `${report.scoreSummary.correctCount || 0} ${t.of} ${report.scoreSummary.totalPossible || 0} ${t.correct}`,
          margin + 50,
          y + 15
        );
        if (report.scoreSummary.grade) {
          doc.setFont("helvetica", "bold");
          doc.text(`${t.grade} ${report.scoreSummary.grade}`, margin + 50, y + 23);
        }
      }

      y += 40;
    } else if (report.scoreSummary.traits) {
      // Trait-based assessment
      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105);

      Object.entries(report.scoreSummary.traits).forEach(([trait, score]) => {
        const barWidth = (score / 5) * (contentWidth - 60);
        const traitLabel = trait.charAt(0).toUpperCase() + trait.slice(1);

        if (isRTL) {
          doc.setFont("helvetica", "normal");
          doc.text(traitLabel, pageWidth - margin, y + 5, { align: 'right' });

          // Background bar
          doc.setFillColor(226, 232, 240);
          doc.roundedRect(margin, y, contentWidth - 60, 8, 2, 2, "F");

          // Value bar (from right)
          doc.setFillColor(99, 102, 241);
          doc.roundedRect(margin + contentWidth - 60 - barWidth, y, barWidth, 8, 2, 2, "F");

          doc.text(score.toFixed(1), margin + 5, y + 5);
        } else {
          doc.setFont("helvetica", "normal");
          doc.text(traitLabel, margin, y + 5);

          // Background bar
          doc.setFillColor(226, 232, 240);
          doc.roundedRect(margin + 50, y, contentWidth - 60, 8, 2, 2, "F");

          // Value bar
          doc.setFillColor(99, 102, 241);
          doc.roundedRect(margin + 50, y, barWidth, 8, 2, 2, "F");

          doc.text(score.toFixed(1), pageWidth - margin - 10, y + 5);
        }
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
    
    if (isRTL) {
      doc.text(t.aiGeneratedFeedback, pageWidth - margin, y, { align: 'right' });
    } else {
      doc.text(t.aiGeneratedFeedback, margin, y);
    }
    y += 10;

    doc.setFillColor(249, 250, 251);
    doc.roundedRect(margin, y, contentWidth, 0, 3, 3, "F");

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(55, 65, 81);

    y = addWrappedText(doc, report.aiReport, margin + 5, y + 8, contentWidth - 10, 5, isRTL);
    y += 10;
  }

  // Footer
  const pageCount = doc.internal.pages.length - 1;
  doc.setFontSize(8);
  doc.setTextColor(156, 163, 175);

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const footerText = isRTL 
      ? `${i} ${t.of} ${pageCount} ${t.page} • ${t.generatedOn} ${format(new Date(), "PPP", { locale: dateLocale })}`
      : `${t.generatedOn} ${format(new Date(), "PPP", { locale: dateLocale })} • ${t.page} ${i} ${t.of} ${pageCount}`;
    doc.text(
      footerText,
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
  const lang = report.language || 'en';
  const t = translations[lang];
  const isRTL = lang === 'ar';
  const dateLocale = lang === 'ar' ? ar : enUS;
  let y = 20;

  // Header
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 45, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  
  if (isRTL) {
    doc.text(t.groupAssessmentReport, pageWidth - margin, 25, { align: 'right' });
    doc.setFontSize(12);
    doc.text(report.groupName, pageWidth - margin, 36, { align: 'right' });
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(report.organizationName, margin, 25);
  } else {
    doc.text(t.groupAssessmentReport, margin, 25);
    doc.setFontSize(12);
    doc.text(report.groupName, margin, 36);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(report.organizationName, pageWidth - margin, 25, { align: "right" });
  }

  y = 60;

  // Group Info
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  
  if (isRTL) {
    doc.text(t.assessmentDetails, pageWidth - margin, y, { align: 'right' });
  } else {
    doc.text(t.assessmentDetails, margin, y);
  }
  y += 10;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);

  const groupInfo = [
    [t.assessment, report.assessmentTitle],
    [t.type, (t as any)[report.assessmentType.toLowerCase()] || report.assessmentType.charAt(0).toUpperCase() + report.assessmentType.slice(1)],
    [t.period, `${report.startDate ? format(new Date(report.startDate), "PP", { locale: dateLocale }) : "-"} ${t.to} ${report.endDate ? format(new Date(report.endDate), "PP", { locale: dateLocale }) : "-"}`],
  ];

  groupInfo.forEach(([label, value]) => {
    addLabelValue(doc, label, value, margin, y, pageWidth, margin, isRTL);
    y += 7;
  });

  y += 15;

  // Statistics Section
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  
  if (isRTL) {
    doc.text(t.statisticsOverview, pageWidth - margin, y, { align: 'right' });
  } else {
    doc.text(t.statisticsOverview, margin, y);
  }
  y += 12;

  // Stats boxes
  const boxWidth = (contentWidth - 15) / 4;
  const boxHeight = 35;

  const statsData = [
    { label: t.total, value: report.stats.totalParticipants.toString(), color: [99, 102, 241] },
    { label: t.completionRate, value: `${report.stats.completionRate}%`, color: [22, 163, 74] },
    { label: t.avgScore, value: report.stats.averageScore ? `${report.stats.averageScore}%` : "-", color: [245, 158, 11] },
    { label: t.highest, value: report.stats.highestScore ? `${report.stats.highestScore}%` : "-", color: [14, 165, 233] },
  ];

  // Reverse order for RTL
  const orderedStats = isRTL ? [...statsData].reverse() : statsData;

  orderedStats.forEach((stat, index) => {
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
  
  if (isRTL) {
    doc.text(t.participants, pageWidth - margin, y, { align: 'right' });
  } else {
    doc.text(t.participants, margin, y);
  }
  y += 10;

  // Table header
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, contentWidth, 10, "F");

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(71, 85, 105);

  if (isRTL) {
    doc.text(t.name, pageWidth - margin - 5, y + 7, { align: 'right' });
    doc.text(t.email, pageWidth - margin - 55, y + 7, { align: 'right' });
    doc.text(t.status, pageWidth - margin - 115, y + 7, { align: 'right' });
    doc.text(t.score, pageWidth - margin - 145, y + 7, { align: 'right' });
    doc.text(t.completed, pageWidth - margin - 165, y + 7, { align: 'right' });
  } else {
    doc.text(t.name.replace(':', ''), margin + 5, y + 7);
    doc.text(t.email.replace(':', ''), margin + 55, y + 7);
    doc.text(t.status, margin + 115, y + 7);
    doc.text(t.score, margin + 145, y + 7);
    doc.text(t.completed.replace(':', ''), margin + 165, y + 7);
  }

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

    const statusText = (t as any)[participant.status] || participant.status?.charAt(0).toUpperCase() + participant.status?.slice(1) || "-";
    const statusColor = participant.status === "completed" ? [22, 163, 74] : participant.status === "started" ? [245, 158, 11] : [156, 163, 175];

    if (isRTL) {
      doc.text((participant.name || t.anonymous).substring(0, 25), pageWidth - margin - 5, y + 2, { align: 'right' });
      doc.text((participant.email || "-").substring(0, 28), pageWidth - margin - 55, y + 2, { align: 'right' });
      doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
      doc.text(statusText, pageWidth - margin - 115, y + 2, { align: 'right' });
      doc.setTextColor(55, 65, 81);
      doc.text(participant.score !== null ? `%${participant.score}` : "-", pageWidth - margin - 145, y + 2, { align: 'right' });
      doc.text(participant.completedAt ? format(new Date(participant.completedAt), "MMM d", { locale: dateLocale }) : "-", pageWidth - margin - 165, y + 2, { align: 'right' });
    } else {
      doc.text((participant.name || t.anonymous).substring(0, 25), margin + 5, y + 2);
      doc.text((participant.email || "-").substring(0, 28), margin + 55, y + 2);
      doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
      doc.text(statusText, margin + 115, y + 2);
      doc.setTextColor(55, 65, 81);
      doc.text(participant.score !== null ? `${participant.score}%` : "-", margin + 145, y + 2);
      doc.text(participant.completedAt ? format(new Date(participant.completedAt), "MMM d", { locale: dateLocale }) : "-", margin + 165, y + 2);
    }

    y += 8;
  });

  if (report.participants.length > 20) {
    doc.setTextColor(156, 163, 175);
    doc.setFontSize(8);
    const moreText = isRTL 
      ? `${report.participants.length - 20} ${t.andMore} ...`
      : `... and ${report.participants.length - 20} more participants`;
    if (isRTL) {
      doc.text(moreText, pageWidth - margin - 5, y + 5, { align: 'right' });
    } else {
      doc.text(moreText, margin + 5, y + 5);
    }
  }

  // Footer
  const pageCount = doc.internal.pages.length - 1;
  doc.setFontSize(8);
  doc.setTextColor(156, 163, 175);

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const footerText = isRTL 
      ? `${i} ${t.of} ${pageCount} ${t.page} • ${t.generatedOn} ${format(new Date(), "PPP", { locale: dateLocale })}`
      : `${t.generatedOn} ${format(new Date(), "PPP", { locale: dateLocale })} • ${t.page} ${i} ${t.of} ${pageCount}`;
    doc.text(
      footerText,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" }
    );
  }

  // Save
  const fileName = `${report.groupName}_report.pdf`.replace(/[^a-zA-Z0-9_-]/g, "_").toLowerCase();
  doc.save(fileName);
};

// Bilingual PDF - generates both English and Arabic sections
export const generateBilingualParticipantPDF = (report: ParticipantReport): void => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = 20;

  // Use English translations
  const tEn = translations.en;
  const tAr = translations.ar;

  // Header - Bilingual
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 45, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(tEn.assessmentReport, margin, 22);
  doc.setFontSize(14);
  doc.text(tAr.assessmentReport, pageWidth - margin, 22, { align: 'right' });

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(report.organizationName, margin, 36);

  y = 55;

  // Participant Info - Bilingual header
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(tEn.participantInformation, margin, y);
  doc.text(tAr.participantInformation, pageWidth - margin, y, { align: 'right' });
  y += 12;

  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);

  // Info table with bilingual labels
  const bilingualInfo = [
    [tEn.name, report.participantName || tEn.anonymous, tAr.name],
    [tEn.email, report.participantEmail || "-", tAr.email],
    ...(report.employeeCode ? [[tEn.employeeCode, report.employeeCode, tAr.employeeCode]] : []),
    [tEn.assessment, report.assessmentTitle, tAr.assessment],
    [tEn.type, report.assessmentType.charAt(0).toUpperCase() + report.assessmentType.slice(1), tAr.type],
    [tEn.group, report.groupName, tAr.group],
    [tEn.completed, report.completedAt ? format(new Date(report.completedAt), "PPP p") : "-", tAr.completed],
  ];

  bilingualInfo.forEach(([labelEn, value, labelAr]) => {
    doc.setFont("helvetica", "bold");
    doc.text(labelEn as string, margin, y);
    doc.setFont("helvetica", "normal");
    doc.text(value as string, margin + 40, y);
    doc.setFont("helvetica", "bold");
    doc.text(labelAr as string, pageWidth - margin, y, { align: 'right' });
    y += 8;
  });

  y += 12;

  // Results Section - Bilingual
  if (report.scoreSummary) {
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(tEn.results, margin, y);
    doc.text(tAr.results, pageWidth - margin, y, { align: 'right' });
    y += 12;

    if (report.scoreSummary.percentage !== undefined) {
      doc.setFillColor(240, 253, 244);
      doc.roundedRect(margin, y, contentWidth, 35, 3, 3, "F");

      doc.setFontSize(28);
      doc.setTextColor(22, 163, 74);
      doc.setFont("helvetica", "bold");
      doc.text(`${report.scoreSummary.percentage}%`, pageWidth / 2, y + 20, { align: 'center' });

      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105);
      doc.setFont("helvetica", "normal");
      doc.text(
        `${report.scoreSummary.correctCount || 0} / ${report.scoreSummary.totalPossible || 0} ${tEn.correct}`,
        pageWidth / 2,
        y + 30,
        { align: 'center' }
      );

      y += 45;
    }
  }

  // AI Report - Bilingual header
  if (report.aiReport) {
    if (y > 180) {
      doc.addPage();
      y = 20;
    }

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(tEn.aiGeneratedFeedback, margin, y);
    doc.text(tAr.aiGeneratedFeedback, pageWidth - margin, y, { align: 'right' });
    y += 12;

    doc.setFillColor(249, 250, 251);
    const reportLines = doc.splitTextToSize(report.aiReport, contentWidth - 10);
    const boxHeight = Math.min(reportLines.length * 5 + 10, 120);
    doc.roundedRect(margin, y, contentWidth, boxHeight, 3, 3, "F");

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(55, 65, 81);
    doc.text(reportLines.slice(0, 20), margin + 5, y + 8);
    y += boxHeight + 10;
  }

  // Footer
  const pageCount = doc.internal.pages.length - 1;
  doc.setFontSize(8);
  doc.setTextColor(156, 163, 175);

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.text(
      `${tEn.generatedOn} ${format(new Date(), "PPP")} | ${tAr.generatedOn} • ${tEn.page} ${i} ${tEn.of} ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" }
    );
  }

  const fileName = `${report.participantName || "participant"}_bilingual_report.pdf`
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .toLowerCase();
  doc.save(fileName);
};
