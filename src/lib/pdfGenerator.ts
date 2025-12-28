import jsPDF from "jspdf";
import html2canvas from "html2canvas";
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

// Create HTML content for PDF generation (supports Arabic with proper fonts)
const createParticipantReportHTML = (report: ParticipantReport): string => {
  const lang = report.language || 'en';
  const t = translations[lang];
  const isRTL = lang === 'ar';
  const dateLocale = lang === 'ar' ? ar : enUS;
  const fontFamily = isRTL ? "'Segoe UI', 'Arial', 'Tahoma', sans-serif" : "'Segoe UI', 'Helvetica', 'Arial', sans-serif";
  
  const completedDate = report.completedAt 
    ? format(new Date(report.completedAt), "PPP p", { locale: dateLocale })
    : "-";

  const typeLabel = (t as any)[report.assessmentType.toLowerCase()] || 
    report.assessmentType.charAt(0).toUpperCase() + report.assessmentType.slice(1);

  let resultsHTML = '';
  
  if (report.scoreSummary) {
    if (report.scoreSummary.percentage !== undefined) {
      // Graded assessment
      resultsHTML = `
        <div style="background: linear-gradient(135deg, #22c55e15, #22c55e05); border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
          <div style="font-size: 48px; font-weight: bold; color: #16a34a; margin-bottom: 8px;">${report.scoreSummary.percentage}%</div>
          <div style="color: #64748b; font-size: 14px;">${report.scoreSummary.correctCount || 0} ${t.of} ${report.scoreSummary.totalPossible || 0} ${t.correct}</div>
          ${report.scoreSummary.grade ? `<div style="margin-top: 12px; display: inline-block; padding: 6px 16px; background: #22c55e20; border-radius: 20px; color: #16a34a; font-weight: 600;">${t.grade}: ${report.scoreSummary.grade}</div>` : ''}
        </div>
      `;
    } else if (report.scoreSummary.traits) {
      // Trait-based assessment
      const traitsHTML = Object.entries(report.scoreSummary.traits).map(([trait, score]) => {
        const percentage = (score / 5) * 100;
        const traitLabel = trait.charAt(0).toUpperCase() + trait.slice(1);
        return `
          <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 16px; flex-direction: ${isRTL ? 'row-reverse' : 'row'};">
            <div style="width: 50px; text-align: center; font-weight: 600; color: #6366f1; background: #6366f115; padding: 8px; border-radius: 8px;">${score.toFixed(1)}</div>
            <div style="flex: 1;">
              <div style="background: #e2e8f0; border-radius: 8px; height: 12px; overflow: hidden;">
                <div style="background: #6366f1; height: 100%; width: ${percentage}%; border-radius: 8px;"></div>
              </div>
            </div>
            <div style="width: 120px; text-align: ${isRTL ? 'right' : 'left'}; font-weight: 500;">${traitLabel}</div>
          </div>
        `;
      }).join('');
      
      resultsHTML = `
        <div style="margin-bottom: 24px;">
          <h3 style="font-size: 16px; font-weight: 600; color: #0f172a; margin-bottom: 16px;">${t.traitAnalysis}</h3>
          ${traitsHTML}
        </div>
      `;
    }
  }

  const aiReportHTML = report.aiReport ? `
    <div style="margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 24px;">
      <h3 style="font-size: 16px; font-weight: 600; color: #0f172a; margin-bottom: 12px;">${t.aiGeneratedFeedback}</h3>
      <div style="background: linear-gradient(135deg, #6366f108, #8b5cf608); border: 1px solid #6366f120; border-radius: 12px; padding: 20px;">
        <p style="color: #374151; line-height: 1.8; white-space: pre-wrap; margin: 0; font-size: 13px;">${report.aiReport}</p>
      </div>
    </div>
  ` : '';

  return `
    <!DOCTYPE html>
    <html lang="${lang}" dir="${isRTL ? 'rtl' : 'ltr'}">
    <head>
      <meta charset="UTF-8">
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: ${fontFamily}; background: white; }
      </style>
    </head>
    <body>
      <div style="width: 595px; min-height: 842px; padding: 0; background: white;">
        <!-- Header -->
        <div style="background: #0f172a; padding: 32px; text-align: center;">
          ${report.organizationLogo ? `<img src="${report.organizationLogo}" alt="${report.organizationName}" style="height: 48px; margin-bottom: 16px; object-fit: contain;" />` : ''}
          <h1 style="color: white; font-size: 24px; font-weight: bold; margin-bottom: 8px;">${t.assessmentReport}</h1>
          <p style="color: #94a3b8; font-size: 14px;">${report.organizationName}</p>
        </div>

        <!-- Content -->
        <div style="padding: 32px;">
          <!-- Participant Info -->
          <h2 style="font-size: 18px; font-weight: 600; color: #0f172a; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 2px solid #6366f1;">${t.participantInformation}</h2>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 32px;">
            <div style="background: #f8fafc; padding: 12px 16px; border-radius: 8px;">
              <div style="color: #64748b; font-size: 12px; margin-bottom: 4px;">${t.name}</div>
              <div style="color: #0f172a; font-weight: 500;">${report.participantName || t.anonymous}</div>
            </div>
            <div style="background: #f8fafc; padding: 12px 16px; border-radius: 8px;">
              <div style="color: #64748b; font-size: 12px; margin-bottom: 4px;">${t.email}</div>
              <div style="color: #0f172a; font-weight: 500; word-break: break-all;">${report.participantEmail || "-"}</div>
            </div>
            ${report.employeeCode ? `
            <div style="background: #f8fafc; padding: 12px 16px; border-radius: 8px;">
              <div style="color: #64748b; font-size: 12px; margin-bottom: 4px;">${t.employeeCode}</div>
              <div style="color: #0f172a; font-weight: 500;">${report.employeeCode}</div>
            </div>
            ` : ''}
            ${report.department ? `
            <div style="background: #f8fafc; padding: 12px 16px; border-radius: 8px;">
              <div style="color: #64748b; font-size: 12px; margin-bottom: 4px;">${t.department}</div>
              <div style="color: #0f172a; font-weight: 500;">${report.department}</div>
            </div>
            ` : ''}
            <div style="background: #f8fafc; padding: 12px 16px; border-radius: 8px;">
              <div style="color: #64748b; font-size: 12px; margin-bottom: 4px;">${t.assessment}</div>
              <div style="color: #0f172a; font-weight: 500;">${report.assessmentTitle}</div>
            </div>
            <div style="background: #f8fafc; padding: 12px 16px; border-radius: 8px;">
              <div style="color: #64748b; font-size: 12px; margin-bottom: 4px;">${t.type}</div>
              <div style="color: #0f172a; font-weight: 500;">${typeLabel}</div>
            </div>
            <div style="background: #f8fafc; padding: 12px 16px; border-radius: 8px;">
              <div style="color: #64748b; font-size: 12px; margin-bottom: 4px;">${t.group}</div>
              <div style="color: #0f172a; font-weight: 500;">${report.groupName}</div>
            </div>
            <div style="background: #f8fafc; padding: 12px 16px; border-radius: 8px;">
              <div style="color: #64748b; font-size: 12px; margin-bottom: 4px;">${t.completed}</div>
              <div style="color: #0f172a; font-weight: 500;">${completedDate}</div>
            </div>
          </div>

          <!-- Results -->
          <h2 style="font-size: 18px; font-weight: 600; color: #0f172a; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 2px solid #6366f1;">${t.results}</h2>
          ${resultsHTML}

          <!-- AI Report -->
          ${aiReportHTML}
        </div>

        <!-- Footer -->
        <div style="position: absolute; bottom: 0; left: 0; right: 0; padding: 16px 32px; border-top: 1px solid #e2e8f0; text-align: center; color: #94a3b8; font-size: 11px;">
          ${t.generatedOn} ${format(new Date(), "PPP", { locale: dateLocale })}
        </div>
      </div>
    </body>
    </html>
  `;
};

// Create HTML content for Group Report
const createGroupReportHTML = (report: GroupReport): string => {
  const lang = report.language || 'en';
  const t = translations[lang];
  const isRTL = lang === 'ar';
  const dateLocale = lang === 'ar' ? ar : enUS;
  const fontFamily = isRTL ? "'Segoe UI', 'Arial', 'Tahoma', sans-serif" : "'Segoe UI', 'Helvetica', 'Arial', sans-serif";
  
  const typeLabel = (t as any)[report.assessmentType.toLowerCase()] || 
    report.assessmentType.charAt(0).toUpperCase() + report.assessmentType.slice(1);

  const periodText = `${report.startDate ? format(new Date(report.startDate), "PP", { locale: dateLocale }) : "-"} ${t.to} ${report.endDate ? format(new Date(report.endDate), "PP", { locale: dateLocale }) : "-"}`;

  const statsHTML = `
    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 32px;">
      <div style="background: linear-gradient(135deg, #6366f115, #6366f105); border: 1px solid #6366f120; border-radius: 12px; padding: 20px; text-align: center;">
        <div style="font-size: 32px; font-weight: bold; color: #6366f1;">${report.stats.totalParticipants}</div>
        <div style="color: #64748b; font-size: 12px; margin-top: 4px;">${t.total}</div>
      </div>
      <div style="background: linear-gradient(135deg, #22c55e15, #22c55e05); border: 1px solid #22c55e20; border-radius: 12px; padding: 20px; text-align: center;">
        <div style="font-size: 32px; font-weight: bold; color: #16a34a;">${report.stats.completionRate}%</div>
        <div style="color: #64748b; font-size: 12px; margin-top: 4px;">${t.completionRate}</div>
      </div>
      <div style="background: linear-gradient(135deg, #f59e0b15, #f59e0b05); border: 1px solid #f59e0b20; border-radius: 12px; padding: 20px; text-align: center;">
        <div style="font-size: 32px; font-weight: bold; color: #d97706;">${report.stats.averageScore !== null ? report.stats.averageScore + '%' : '-'}</div>
        <div style="color: #64748b; font-size: 12px; margin-top: 4px;">${t.avgScore}</div>
      </div>
      <div style="background: linear-gradient(135deg, #8b5cf615, #8b5cf605); border: 1px solid #8b5cf620; border-radius: 12px; padding: 20px; text-align: center;">
        <div style="font-size: 32px; font-weight: bold; color: #7c3aed;">${report.stats.highestScore !== null ? report.stats.highestScore + '%' : '-'}</div>
        <div style="color: #64748b; font-size: 12px; margin-top: 4px;">${t.highest}</div>
      </div>
    </div>
  `;

  const participantsTableHTML = report.participants.length > 0 ? `
    <h2 style="font-size: 18px; font-weight: 600; color: #0f172a; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 2px solid #6366f1;">${t.participants}</h2>
    <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
      <thead>
        <tr style="background: #f8fafc;">
          <th style="padding: 12px; text-align: ${isRTL ? 'right' : 'left'}; border-bottom: 1px solid #e2e8f0; color: #64748b;">${t.name}</th>
          <th style="padding: 12px; text-align: center; border-bottom: 1px solid #e2e8f0; color: #64748b;">${t.status}</th>
          <th style="padding: 12px; text-align: center; border-bottom: 1px solid #e2e8f0; color: #64748b;">${t.score}</th>
          <th style="padding: 12px; text-align: ${isRTL ? 'left' : 'right'}; border-bottom: 1px solid #e2e8f0; color: #64748b;">${t.completed}</th>
        </tr>
      </thead>
      <tbody>
        ${report.participants.slice(0, 15).map((p, i) => `
          <tr style="background: ${i % 2 === 0 ? 'white' : '#fafafa'};">
            <td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9;">${p.name || t.anonymous}</td>
            <td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; text-align: center;">
              <span style="padding: 4px 8px; border-radius: 12px; font-size: 11px; background: ${p.status === 'completed' ? '#dcfce7' : p.status === 'started' ? '#fef3c7' : '#f1f5f9'}; color: ${p.status === 'completed' ? '#16a34a' : p.status === 'started' ? '#d97706' : '#64748b'};">
                ${(t as any)[p.status] || p.status}
              </span>
            </td>
            <td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; text-align: center; font-weight: ${p.score !== null ? '600' : 'normal'}; color: ${p.score !== null ? '#6366f1' : '#94a3b8'};">
              ${p.score !== null ? p.score + '%' : '-'}
            </td>
            <td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; text-align: ${isRTL ? 'left' : 'right'}; color: #64748b;">
              ${p.completedAt ? format(new Date(p.completedAt), "PP", { locale: dateLocale }) : '-'}
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    ${report.participants.length > 15 ? `<p style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 12px;">+ ${report.participants.length - 15} ${t.andMore}</p>` : ''}
  ` : '';

  const aiNarrativeHTML = report.aiNarrative ? `
    <div style="margin-top: 32px; page-break-inside: avoid;">
      <h2 style="font-size: 18px; font-weight: 600; color: #0f172a; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 2px solid #6366f1;">${t.aiGeneratedFeedback}</h2>
      <div style="background: linear-gradient(135deg, #6366f108, #8b5cf608); border: 1px solid #6366f120; border-radius: 12px; padding: 20px;">
        <p style="color: #374151; line-height: 1.8; white-space: pre-wrap; margin: 0; font-size: 13px;">${report.aiNarrative}</p>
      </div>
    </div>
  ` : '';

  return `
    <!DOCTYPE html>
    <html lang="${lang}" dir="${isRTL ? 'rtl' : 'ltr'}">
    <head>
      <meta charset="UTF-8">
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: ${fontFamily}; background: white; }
      </style>
    </head>
    <body>
      <div style="width: 595px; min-height: 842px; padding: 0; background: white;">
        <!-- Header -->
        <div style="background: #0f172a; padding: 32px; text-align: center;">
          ${report.organizationLogo ? `<img src="${report.organizationLogo}" alt="${report.organizationName}" style="height: 48px; margin-bottom: 16px; object-fit: contain;" />` : ''}
          <h1 style="color: white; font-size: 24px; font-weight: bold; margin-bottom: 8px;">${t.groupAssessmentReport}</h1>
          <p style="color: #94a3b8; font-size: 14px;">${report.groupName} • ${report.organizationName}</p>
        </div>

        <!-- Content -->
        <div style="padding: 32px;">
          <!-- Assessment Details -->
          <h2 style="font-size: 18px; font-weight: 600; color: #0f172a; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 2px solid #6366f1;">${t.assessmentDetails}</h2>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 32px;">
            <div style="background: #f8fafc; padding: 12px 16px; border-radius: 8px;">
              <div style="color: #64748b; font-size: 12px; margin-bottom: 4px;">${t.assessment}</div>
              <div style="color: #0f172a; font-weight: 500;">${report.assessmentTitle}</div>
            </div>
            <div style="background: #f8fafc; padding: 12px 16px; border-radius: 8px;">
              <div style="color: #64748b; font-size: 12px; margin-bottom: 4px;">${t.type}</div>
              <div style="color: #0f172a; font-weight: 500;">${typeLabel}</div>
            </div>
            <div style="background: #f8fafc; padding: 12px 16px; border-radius: 8px;">
              <div style="color: #64748b; font-size: 12px; margin-bottom: 4px;">${t.period}</div>
              <div style="color: #0f172a; font-weight: 500; font-size: 12px;">${periodText}</div>
            </div>
          </div>

          <!-- Statistics -->
          <h2 style="font-size: 18px; font-weight: 600; color: #0f172a; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 2px solid #6366f1;">${t.statisticsOverview}</h2>
          ${statsHTML}

          <!-- Participants Table -->
          ${participantsTableHTML}

          <!-- AI Narrative -->
          ${aiNarrativeHTML}
        </div>

        <!-- Footer -->
        <div style="padding: 16px 32px; border-top: 1px solid #e2e8f0; text-align: center; color: #94a3b8; font-size: 11px;">
          ${t.generatedOn} ${format(new Date(), "PPP", { locale: dateLocale })}
        </div>
      </div>
    </body>
    </html>
  `;
};

// Generate PDF from HTML using html2canvas
const generatePDFFromHTML = async (htmlContent: string, fileName: string): Promise<void> => {
  // Create a hidden container
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.innerHTML = htmlContent;
  document.body.appendChild(container);

  // Wait for fonts and images to load
  await new Promise(resolve => setTimeout(resolve, 500));

  try {
    const element = container.firstElementChild as HTMLElement;
    
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = Math.min(pdfWidth / (imgWidth / 2), pdfHeight / (imgHeight / 2));
    const imgX = (pdfWidth - (imgWidth / 2) * ratio) / 2;
    const imgY = 0;

    pdf.addImage(imgData, 'PNG', imgX, imgY, (imgWidth / 2) * ratio, (imgHeight / 2) * ratio);
    pdf.save(fileName);
  } finally {
    document.body.removeChild(container);
  }
};

export const generateParticipantPDF = async (report: ParticipantReport): Promise<void> => {
  const htmlContent = createParticipantReportHTML(report);
  const fileName = `${report.participantName || "participant"}_${report.assessmentTitle}_report.pdf`
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .toLowerCase();
  
  await generatePDFFromHTML(htmlContent, fileName);
};

export const generateGroupPDF = async (report: GroupReport): Promise<void> => {
  const htmlContent = createGroupReportHTML(report);
  const fileName = `${report.groupName}_report.pdf`
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .toLowerCase();
  
  await generatePDFFromHTML(htmlContent, fileName);
};
