import jsPDF from "jspdf";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";

// Arabic translations
const translations = {
  en: {
    assessmentReport: "Assessment Report",
    groupAssessmentReport: "Group Assessment Report",
    participantInformation: "Participant Information",
    name: "Name",
    email: "Email",
    assessment: "Assessment",
    type: "Type",
    group: "Group",
    completed: "Completed",
    results: "Results",
    correct: "correct",
    grade: "Grade",
    aiGeneratedFeedback: "AI-Generated Feedback",
    generatedOn: "Generated on",
    page: "Page",
    of: "of",
    assessmentDetails: "Assessment Details",
    period: "Period",
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
    employeeCode: "Employee Code",
    department: "Department",
    cognitive: "Cognitive",
    personality: "Personality",
    situational: "Situational",
    language: "Language",
    invited: "Invited",
    started: "Started",
    traitAnalysis: "Trait Analysis",
  },
  ar: {
    assessmentReport: "تقرير التقييم",
    groupAssessmentReport: "تقرير تقييم المجموعة",
    participantInformation: "معلومات المشارك",
    name: "الاسم",
    email: "البريد الإلكتروني",
    assessment: "التقييم",
    type: "النوع",
    group: "المجموعة",
    completed: "تاريخ الإكمال",
    results: "النتائج",
    correct: "صحيحة",
    grade: "التقدير",
    aiGeneratedFeedback: "ملاحظات الذكاء الاصطناعي",
    generatedOn: "تم الإنشاء في",
    page: "صفحة",
    of: "من",
    assessmentDetails: "تفاصيل التقييم",
    period: "الفترة",
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
    employeeCode: "رقم الموظف",
    department: "القسم",
    cognitive: "معرفي",
    personality: "شخصية",
    situational: "مواقف",
    language: "لغة",
    invited: "مدعو",
    started: "بدأ",
    traitAnalysis: "تحليل السمات",
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
  organizationLogo?: string;
  language?: Language;
}

interface GroupReport {
  groupName: string;
  assessmentTitle: string;
  assessmentType: string;
  startDate: string | null;
  endDate: string | null;
  organizationName: string;
  organizationLogo?: string;
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
  aiNarrative?: string;
}

// Helper to reverse Arabic text for proper PDF rendering (jsPDF doesn't support RTL natively)
const processArabicText = (text: string): string => {
  if (!text) return text;
  // Split by lines and process each
  return text.split('\n').map(line => {
    // Check if line contains Arabic characters
    const hasArabic = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(line);
    if (hasArabic) {
      // Reverse the text for RTL display in PDF
      return line.split('').reverse().join('');
    }
    return line;
  }).join('\n');
};

// Generate PDF using jsPDF directly (no html2canvas for better Arabic support)
const generatePDFDirectly = (
  title: string,
  sections: Array<{ label: string; value: string }>,
  stats?: { label: string; value: string | number }[],
  aiText?: string,
  isRTL?: boolean,
  t?: typeof translations.en
): jsPDF => {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  let yPos = margin;

  // Colors
  const primaryColor: [number, number, number] = [99, 102, 241]; // Indigo
  const textColor: [number, number, number] = [15, 23, 42];
  const mutedColor: [number, number, number] = [100, 116, 139];
  const bgColor: [number, number, number] = [248, 250, 252];

  // Helper for text alignment
  const getX = (text: string, align: 'left' | 'right' | 'center' = 'left'): number => {
    if (align === 'center') return pageWidth / 2;
    if (align === 'right' || isRTL) return pageWidth - margin;
    return margin;
  };

  // Header background
  pdf.setFillColor(15, 23, 42);
  pdf.rect(0, 0, pageWidth, 40, 'F');

  // Title
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  const titleText = isRTL ? processArabicText(title) : title;
  pdf.text(titleText, pageWidth / 2, 25, { align: 'center' });

  yPos = 55;

  // Section: Info fields
  if (sections.length > 0) {
    pdf.setFontSize(14);
    pdf.setTextColor(...primaryColor);
    pdf.setFont('helvetica', 'bold');
    const infoTitle = isRTL ? processArabicText(t?.participantInformation || 'Information') : (t?.participantInformation || 'Information');
    pdf.text(infoTitle, isRTL ? pageWidth - margin : margin, yPos, { align: isRTL ? 'right' : 'left' });
    
    // Underline
    pdf.setDrawColor(...primaryColor);
    pdf.setLineWidth(0.5);
    pdf.line(margin, yPos + 2, pageWidth - margin, yPos + 2);
    
    yPos += 12;

    // Info grid
    pdf.setFontSize(10);
    const colWidth = contentWidth / 2;
    
    sections.forEach((section, index) => {
      const col = index % 2;
      const xBase = margin + (col * colWidth);
      
      if (index % 2 === 0 && index > 0) {
        yPos += 18;
      }
      
      // Check for page break
      if (yPos > pageHeight - 40) {
        pdf.addPage();
        yPos = margin;
      }

      // Background box
      pdf.setFillColor(...bgColor);
      const boxX = isRTL ? pageWidth - margin - colWidth + 5 - (col * colWidth) : xBase;
      pdf.roundedRect(boxX, yPos - 4, colWidth - 10, 16, 2, 2, 'F');

      // Label
      pdf.setTextColor(...mutedColor);
      pdf.setFont('helvetica', 'normal');
      const labelText = isRTL ? processArabicText(section.label) : section.label;
      const labelX = isRTL ? pageWidth - margin - 5 - (col * colWidth) : xBase + 5;
      pdf.text(labelText, labelX, yPos, { align: isRTL ? 'right' : 'left' });

      // Value
      pdf.setTextColor(...textColor);
      pdf.setFont('helvetica', 'bold');
      const valueText = isRTL ? processArabicText(section.value) : section.value;
      pdf.text(valueText, labelX, yPos + 6, { align: isRTL ? 'right' : 'left' });
    });

    yPos += 25;
  }

  // Stats section
  if (stats && stats.length > 0) {
    // Check for page break
    if (yPos > pageHeight - 60) {
      pdf.addPage();
      yPos = margin;
    }

    pdf.setFontSize(14);
    pdf.setTextColor(...primaryColor);
    pdf.setFont('helvetica', 'bold');
    const statsTitle = isRTL ? processArabicText(t?.results || 'Results') : (t?.results || 'Results');
    pdf.text(statsTitle, isRTL ? pageWidth - margin : margin, yPos, { align: isRTL ? 'right' : 'left' });
    
    pdf.setDrawColor(...primaryColor);
    pdf.line(margin, yPos + 2, pageWidth - margin, yPos + 2);
    
    yPos += 15;

    // Stats boxes
    const statWidth = contentWidth / Math.min(stats.length, 4);
    stats.slice(0, 4).forEach((stat, index) => {
      const xBase = margin + (index * statWidth);
      
      // Box with gradient-like effect
      pdf.setFillColor(240, 245, 255);
      const boxX = isRTL ? pageWidth - margin - statWidth - (index * statWidth) : xBase;
      pdf.roundedRect(boxX + 2, yPos, statWidth - 4, 30, 3, 3, 'F');

      // Value
      pdf.setFontSize(24);
      pdf.setTextColor(...primaryColor);
      pdf.setFont('helvetica', 'bold');
      const valueStr = String(stat.value);
      const valueX = boxX + statWidth / 2;
      pdf.text(valueStr, valueX, yPos + 15, { align: 'center' });

      // Label
      pdf.setFontSize(9);
      pdf.setTextColor(...mutedColor);
      pdf.setFont('helvetica', 'normal');
      const statLabel = isRTL ? processArabicText(stat.label) : stat.label;
      pdf.text(statLabel, valueX, yPos + 24, { align: 'center' });
    });

    yPos += 40;
  }

  // AI Report section
  if (aiText) {
    // Check for page break
    if (yPos > pageHeight - 80) {
      pdf.addPage();
      yPos = margin;
    }

    pdf.setFontSize(14);
    pdf.setTextColor(...primaryColor);
    pdf.setFont('helvetica', 'bold');
    const aiTitle = isRTL ? processArabicText(t?.aiGeneratedFeedback || 'AI Feedback') : (t?.aiGeneratedFeedback || 'AI Feedback');
    pdf.text(aiTitle, isRTL ? pageWidth - margin : margin, yPos, { align: isRTL ? 'right' : 'left' });
    
    pdf.setDrawColor(...primaryColor);
    pdf.line(margin, yPos + 2, pageWidth - margin, yPos + 2);
    
    yPos += 10;

    // AI text box
    pdf.setFillColor(245, 243, 255);
    pdf.setDrawColor(199, 210, 254);
    
    // Process and wrap text
    pdf.setFontSize(10);
    pdf.setTextColor(...textColor);
    pdf.setFont('helvetica', 'normal');
    
    const processedAiText = isRTL ? processArabicText(aiText) : aiText;
    const lines = pdf.splitTextToSize(processedAiText, contentWidth - 20);
    const textHeight = lines.length * 5 + 15;
    
    // Draw background
    pdf.roundedRect(margin, yPos, contentWidth, Math.min(textHeight, pageHeight - yPos - 30), 3, 3, 'FD');
    
    yPos += 8;
    
    // Draw text with pagination
    lines.forEach((line: string, index: number) => {
      if (yPos > pageHeight - 25) {
        pdf.addPage();
        yPos = margin + 8;
        // Redraw box on new page
        const remainingLines = lines.length - index;
        const remainingHeight = remainingLines * 5 + 10;
        pdf.setFillColor(245, 243, 255);
        pdf.setDrawColor(199, 210, 254);
        pdf.roundedRect(margin, margin, contentWidth, Math.min(remainingHeight, pageHeight - margin - 30), 3, 3, 'FD');
      }
      
      const textX = isRTL ? pageWidth - margin - 10 : margin + 10;
      pdf.text(line, textX, yPos, { align: isRTL ? 'right' : 'left' });
      yPos += 5;
    });
  }

  // Footer on all pages
  const totalPages = pdf.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setFontSize(9);
    pdf.setTextColor(...mutedColor);
    const footerText = isRTL 
      ? processArabicText(`${t?.page || 'Page'} ${i} ${t?.of || 'of'} ${totalPages}`)
      : `${t?.page || 'Page'} ${i} ${t?.of || 'of'} ${totalPages}`;
    pdf.text(footerText, pageWidth / 2, pageHeight - 10, { align: 'center' });
  }

  return pdf;
};

export const generateParticipantPDF = async (report: ParticipantReport): Promise<void> => {
  const lang = report.language || 'en';
  const t = translations[lang];
  const isRTL = lang === 'ar';
  const dateLocale = lang === 'ar' ? ar : enUS;

  const completedDate = report.completedAt 
    ? format(new Date(report.completedAt), "PPP p", { locale: dateLocale })
    : "-";

  const typeLabel = (t as any)[report.assessmentType.toLowerCase()] || 
    report.assessmentType.charAt(0).toUpperCase() + report.assessmentType.slice(1);

  const sections = [
    { label: t.name, value: report.participantName || t.anonymous },
    { label: t.email, value: report.participantEmail || "-" },
    ...(report.employeeCode ? [{ label: t.employeeCode, value: report.employeeCode }] : []),
    ...(report.department ? [{ label: t.department, value: report.department }] : []),
    { label: t.assessment, value: report.assessmentTitle },
    { label: t.type, value: typeLabel },
    { label: t.group, value: report.groupName },
    { label: t.completed, value: completedDate },
  ];

  let stats: { label: string; value: string | number }[] = [];
  
  if (report.scoreSummary) {
    if (report.scoreSummary.percentage !== undefined) {
      stats = [
        { label: t.score, value: `${report.scoreSummary.percentage}%` },
        { label: t.correct, value: `${report.scoreSummary.correctCount || 0}/${report.scoreSummary.totalPossible || 0}` },
        ...(report.scoreSummary.grade ? [{ label: t.grade, value: report.scoreSummary.grade }] : []),
      ];
    } else if (report.scoreSummary.traits) {
      stats = Object.entries(report.scoreSummary.traits).map(([trait, score]) => ({
        label: trait.charAt(0).toUpperCase() + trait.slice(1),
        value: score.toFixed(1),
      }));
    }
  }

  const pdf = generatePDFDirectly(
    t.assessmentReport,
    sections,
    stats,
    report.aiReport || undefined,
    isRTL,
    t
  );

  const fileName = `${report.participantName || "participant"}_${report.assessmentTitle}_report.pdf`
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .toLowerCase();
  
  pdf.save(fileName);
};

export const generateGroupPDF = async (report: GroupReport): Promise<void> => {
  const lang = report.language || 'en';
  const t = translations[lang];
  const isRTL = lang === 'ar';
  const dateLocale = lang === 'ar' ? ar : enUS;

  const typeLabel = (t as any)[report.assessmentType.toLowerCase()] || 
    report.assessmentType.charAt(0).toUpperCase() + report.assessmentType.slice(1);

  const periodText = `${report.startDate ? format(new Date(report.startDate), "PP", { locale: dateLocale }) : "-"} ${t.to} ${report.endDate ? format(new Date(report.endDate), "PP", { locale: dateLocale }) : "-"}`;

  const sections = [
    { label: t.group, value: report.groupName },
    { label: t.assessment, value: report.assessmentTitle },
    { label: t.type, value: typeLabel },
    { label: t.period, value: periodText },
  ];

  const stats = [
    { label: t.total, value: report.stats.totalParticipants },
    { label: t.completionRate, value: `${report.stats.completionRate}%` },
    { label: t.avgScore, value: report.stats.averageScore !== null ? `${report.stats.averageScore}%` : '-' },
    { label: t.highest, value: report.stats.highestScore !== null ? `${report.stats.highestScore}%` : '-' },
  ];

  const pdf = generatePDFDirectly(
    t.groupAssessmentReport,
    sections,
    stats,
    report.aiNarrative || undefined,
    isRTL,
    t
  );

  // Add participants table on a new page if there are participants
  if (report.participants.length > 0) {
    pdf.addPage();
    
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 20;
    let yPos = margin;

    // Title
    pdf.setFontSize(14);
    pdf.setTextColor(99, 102, 241);
    pdf.setFont('helvetica', 'bold');
    const participantsTitle = isRTL ? processArabicText(t.participants) : t.participants;
    pdf.text(participantsTitle, isRTL ? pageWidth - margin : margin, yPos, { align: isRTL ? 'right' : 'left' });
    
    pdf.setDrawColor(99, 102, 241);
    pdf.line(margin, yPos + 2, pageWidth - margin, yPos + 2);
    
    yPos += 15;

    // Table header
    pdf.setFillColor(248, 250, 252);
    pdf.rect(margin, yPos - 5, pageWidth - margin * 2, 10, 'F');
    
    pdf.setFontSize(9);
    pdf.setTextColor(100, 116, 139);
    pdf.setFont('helvetica', 'bold');
    
    const colWidths = [60, 35, 30, 45];
    const headers = [t.name, t.status, t.score, t.completed];
    
    let xPos = isRTL ? pageWidth - margin - colWidths[0] : margin;
    headers.forEach((header, i) => {
      const headerText = isRTL ? processArabicText(header) : header;
      pdf.text(headerText, xPos + 3, yPos, { align: isRTL ? 'right' : 'left' });
      xPos = isRTL ? xPos - colWidths[i + 1] || 0 : xPos + colWidths[i];
    });
    
    yPos += 8;

    // Table rows
    pdf.setFont('helvetica', 'normal');
    report.participants.slice(0, 20).forEach((p, index) => {
      if (yPos > pdf.internal.pageSize.getHeight() - 30) {
        pdf.addPage();
        yPos = margin;
      }

      // Alternating background
      if (index % 2 === 0) {
        pdf.setFillColor(250, 250, 250);
        pdf.rect(margin, yPos - 4, pageWidth - margin * 2, 8, 'F');
      }

      pdf.setTextColor(15, 23, 42);
      
      let xPos = isRTL ? pageWidth - margin - colWidths[0] : margin;
      
      // Name
      const nameText = isRTL ? processArabicText(p.name || t.anonymous) : (p.name || t.anonymous);
      pdf.text(nameText.substring(0, 25), xPos + 3, yPos, { align: isRTL ? 'right' : 'left' });
      xPos = isRTL ? xPos - colWidths[1] : xPos + colWidths[0];
      
      // Status
      const statusText = isRTL ? processArabicText((t as any)[p.status] || p.status) : ((t as any)[p.status] || p.status);
      pdf.text(statusText, xPos + 3, yPos, { align: isRTL ? 'right' : 'left' });
      xPos = isRTL ? xPos - colWidths[2] : xPos + colWidths[1];
      
      // Score
      pdf.text(p.score !== null ? `${p.score}%` : '-', xPos + 3, yPos, { align: isRTL ? 'right' : 'left' });
      xPos = isRTL ? xPos - colWidths[3] : xPos + colWidths[2];
      
      // Completed date
      const dateText = p.completedAt ? format(new Date(p.completedAt), "PP", { locale: dateLocale }) : '-';
      pdf.text(dateText, xPos + 3, yPos, { align: isRTL ? 'right' : 'left' });
      
      yPos += 8;
    });

    // Show "and more" if truncated
    if (report.participants.length > 20) {
      yPos += 5;
      pdf.setTextColor(100, 116, 139);
      pdf.setFontSize(10);
      const moreText = isRTL 
        ? processArabicText(`+ ${report.participants.length - 20} ${t.andMore}`)
        : `+ ${report.participants.length - 20} ${t.andMore}`;
      pdf.text(moreText, pageWidth / 2, yPos, { align: 'center' });
    }
  }

  const fileName = `${report.groupName}_report.pdf`
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .toLowerCase();
  
  pdf.save(fileName);
};
