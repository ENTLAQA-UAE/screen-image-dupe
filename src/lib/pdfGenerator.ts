import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";

type Language = 'en' | 'ar';

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

// Build sections HTML
function buildSectionsHtml(sections: Array<{ label: string; value: string }>): string {
  return sections.map(s => `
    <div style="background:#f8fafc;padding:15px;border-radius:8px;">
      <div style="color:#64748b;font-size:12px;margin-bottom:5px;">${s.label}</div>
      <div style="color:#0f172a;font-weight:600;font-size:14px;">${s.value}</div>
    </div>
  `).join('');
}

// Build stats HTML
function buildStatsHtml(stats: { label: string; value: string | number }[]): string {
  return stats.slice(0, 4).map(stat => `
    <div style="background:linear-gradient(135deg,#f0f5ff 0%,#e8ecff 100%);padding:20px;border-radius:10px;text-align:center;">
      <div style="color:#6366f1;font-size:28px;font-weight:700;">${stat.value}</div>
      <div style="color:#64748b;font-size:12px;margin-top:5px;">${stat.label}</div>
    </div>
  `).join('');
}

// Generate PDF from HTML using html2canvas
async function generatePdfFromHtml(htmlContent: string, fileName: string): Promise<void> {
  const container = document.createElement('div');
  container.innerHTML = htmlContent;
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '0';
  document.body.appendChild(container);

  try {
    const element = container.querySelector('#pdf-content') as HTMLElement;
    if (!element) throw new Error('PDF content not found');

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = pdfWidth / imgWidth;
    const scaledHeight = imgHeight * ratio;
    
    if (scaledHeight <= pdfHeight) {
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, scaledHeight);
    } else {
      let remainingHeight = scaledHeight;
      let srcY = 0;
      let pageNum = 0;
      
      while (remainingHeight > 0) {
        if (pageNum > 0) pdf.addPage();
        
        const sliceHeight = Math.min(pdfHeight, remainingHeight);
        const srcHeight = sliceHeight / ratio;
        
        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = imgWidth;
        pageCanvas.height = srcHeight;
        const ctx = pageCanvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(canvas, 0, srcY, imgWidth, srcHeight, 0, 0, imgWidth, srcHeight);
          pdf.addImage(pageCanvas.toDataURL('image/png'), 'PNG', 0, 0, pdfWidth, sliceHeight);
        }
        
        srcY += srcHeight;
        remainingHeight -= sliceHeight;
        pageNum++;
      }
    }
    
    pdf.save(fileName);
  } finally {
    document.body.removeChild(container);
  }
}

export async function generateParticipantPDF(report: ParticipantReport): Promise<void> {
  const lang = report.language || 'en';
  const t = translations[lang];
  const isRTL = lang === 'ar';
  const dateLocale = lang === 'ar' ? ar : enUS;
  const dir = isRTL ? 'rtl' : 'ltr';
  const textAlign = isRTL ? 'right' : 'left';

  const completedDate = report.completedAt 
    ? format(new Date(report.completedAt), "PPP p", { locale: dateLocale })
    : "-";

  const typeKey = report.assessmentType.toLowerCase() as keyof typeof t;
  const typeLabel = t[typeKey] || report.assessmentType;

  const sections = [
    { label: t.name, value: report.participantName || t.anonymous },
    { label: t.email, value: report.participantEmail || "-" },
  ];
  if (report.employeeCode) sections.push({ label: t.employeeCode, value: report.employeeCode });
  if (report.department) sections.push({ label: t.department, value: report.department });
  sections.push(
    { label: t.assessment, value: report.assessmentTitle },
    { label: t.type, value: String(typeLabel) },
    { label: t.group, value: report.groupName },
    { label: t.completed, value: completedDate }
  );

  let stats: { label: string; value: string | number }[] = [];
  if (report.scoreSummary) {
    if (report.scoreSummary.percentage !== undefined) {
      stats.push({ label: t.score, value: `${report.scoreSummary.percentage}%` });
      stats.push({ label: t.correct, value: `${report.scoreSummary.correctCount || 0}/${report.scoreSummary.totalPossible || 0}` });
      if (report.scoreSummary.grade) stats.push({ label: t.grade, value: report.scoreSummary.grade });
    } else if (report.scoreSummary.traits) {
      stats = Object.entries(report.scoreSummary.traits).map(([trait, score]) => ({
        label: trait.charAt(0).toUpperCase() + trait.slice(1),
        value: score.toFixed(1),
      }));
    }
  }

  const html = `
    <div id="pdf-content" style="width:794px;padding:40px;background:white;font-family:Arial,sans-serif;direction:${dir};text-align:${textAlign};">
      <div style="background:linear-gradient(135deg,#0f172a 0%,#1e3a5f 100%);color:white;padding:30px;border-radius:12px;text-align:center;margin-bottom:30px;">
        <h1 style="margin:0;font-size:28px;font-weight:700;">${t.assessmentReport}</h1>
      </div>
      <div style="margin-bottom:30px;">
        <h2 style="color:#6366f1;font-size:18px;margin-bottom:20px;padding-bottom:8px;border-bottom:2px solid #6366f1;">${t.participantInformation}</h2>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:15px;">${buildSectionsHtml(sections)}</div>
      </div>
      ${stats.length > 0 ? `
        <div style="margin-bottom:30px;">
          <h2 style="color:#6366f1;font-size:18px;margin-bottom:20px;padding-bottom:8px;border-bottom:2px solid #6366f1;">${t.results}</h2>
          <div style="display:grid;grid-template-columns:repeat(${Math.min(stats.length, 4)},1fr);gap:15px;">${buildStatsHtml(stats)}</div>
        </div>
      ` : ''}
      ${report.aiReport ? `
        <div style="margin-bottom:30px;">
          <h2 style="color:#6366f1;font-size:18px;margin-bottom:20px;padding-bottom:8px;border-bottom:2px solid #6366f1;">${t.aiGeneratedFeedback}</h2>
          <div style="background:linear-gradient(135deg,#f5f3ff 0%,#ede9fe 100%);border:1px solid #c7d2fe;padding:25px;border-radius:10px;line-height:1.7;color:#0f172a;font-size:14px;white-space:pre-wrap;">${report.aiReport}</div>
        </div>
      ` : ''}
      <div style="text-align:center;color:#94a3b8;font-size:11px;margin-top:40px;padding-top:20px;border-top:1px solid #e2e8f0;">
        ${t.generatedOn} ${format(new Date(), "PPP p", { locale: dateLocale })}
      </div>
    </div>
  `;

  const fileName = `${report.participantName || "participant"}_report.pdf`.replace(/[^a-zA-Z0-9_.-]/g, "_").toLowerCase();
  await generatePdfFromHtml(html, fileName);
}

export async function generateGroupPDF(report: GroupReport): Promise<void> {
  const lang = report.language || 'en';
  const t = translations[lang];
  const isRTL = lang === 'ar';
  const dateLocale = lang === 'ar' ? ar : enUS;
  const dir = isRTL ? 'rtl' : 'ltr';
  const textAlign = isRTL ? 'right' : 'left';

  const typeKey = report.assessmentType.toLowerCase() as keyof typeof t;
  const typeLabel = t[typeKey] || report.assessmentType;
  const periodText = `${report.startDate ? format(new Date(report.startDate), "PP", { locale: dateLocale }) : "-"} ${t.to} ${report.endDate ? format(new Date(report.endDate), "PP", { locale: dateLocale }) : "-"}`;

  const sections = [
    { label: t.group, value: report.groupName },
    { label: t.assessment, value: report.assessmentTitle },
    { label: t.type, value: String(typeLabel) },
    { label: t.period, value: periodText },
  ];

  const stats = [
    { label: t.total, value: report.stats.totalParticipants },
    { label: t.completionRate, value: `${report.stats.completionRate}%` },
    { label: t.avgScore, value: report.stats.averageScore !== null ? `${report.stats.averageScore}%` : '-' },
    { label: t.highest, value: report.stats.highestScore !== null ? `${report.stats.highestScore}%` : '-' },
  ];

  const html = `
    <div id="pdf-content" style="width:794px;padding:40px;background:white;font-family:Arial,sans-serif;direction:${dir};text-align:${textAlign};">
      <div style="background:linear-gradient(135deg,#0f172a 0%,#1e3a5f 100%);color:white;padding:30px;border-radius:12px;text-align:center;margin-bottom:30px;">
        <h1 style="margin:0;font-size:28px;font-weight:700;">${t.groupAssessmentReport}</h1>
      </div>
      <div style="margin-bottom:30px;">
        <h2 style="color:#6366f1;font-size:18px;margin-bottom:20px;padding-bottom:8px;border-bottom:2px solid #6366f1;">${t.assessmentDetails}</h2>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:15px;">${buildSectionsHtml(sections)}</div>
      </div>
      <div style="margin-bottom:30px;">
        <h2 style="color:#6366f1;font-size:18px;margin-bottom:20px;padding-bottom:8px;border-bottom:2px solid #6366f1;">${t.statisticsOverview}</h2>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:15px;">${buildStatsHtml(stats)}</div>
      </div>
      ${report.aiNarrative ? `
        <div style="margin-bottom:30px;">
          <h2 style="color:#6366f1;font-size:18px;margin-bottom:20px;padding-bottom:8px;border-bottom:2px solid #6366f1;">${t.aiGeneratedFeedback}</h2>
          <div style="background:linear-gradient(135deg,#f5f3ff 0%,#ede9fe 100%);border:1px solid #c7d2fe;padding:25px;border-radius:10px;line-height:1.7;color:#0f172a;font-size:14px;white-space:pre-wrap;">${report.aiNarrative}</div>
        </div>
      ` : ''}
      <div style="text-align:center;color:#94a3b8;font-size:11px;margin-top:40px;padding-top:20px;border-top:1px solid #e2e8f0;">
        ${t.generatedOn} ${format(new Date(), "PPP p", { locale: dateLocale })}
      </div>
    </div>
  `;

  const fileName = `${report.groupName}_group_report.pdf`.replace(/[^a-zA-Z0-9_.-]/g, "_").toLowerCase();
  await generatePdfFromHtml(html, fileName);
}
