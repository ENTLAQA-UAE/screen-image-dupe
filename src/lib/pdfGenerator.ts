import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";

// ============= Types =============
export type Language = 'en' | 'ar';

export interface OrganizationBranding {
  name: string;
  logoUrl?: string | null;
  primaryColor?: string | null;
}

export interface ParticipantReport {
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
  organization: OrganizationBranding;
  language?: Language;
}

export interface GroupReport {
  groupName: string;
  assessmentTitle: string;
  assessmentType: string;
  startDate: string | null;
  endDate: string | null;
  organization: OrganizationBranding;
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

// ============= Translations =============
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
    correct: "Correct Answers",
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
    completionRate: "Completion Rate",
    avgScore: "Average Score",
    highest: "Highest Score",
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
    poweredBy: "Powered by",
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
    correct: "الإجابات الصحيحة",
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
    highest: "أعلى درجة",
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
    poweredBy: "مدعوم من",
  }
};

// ============= Utility Functions =============
function getTranslations(lang: Language) {
  return translations[lang];
}

function getDirection(lang: Language): 'rtl' | 'ltr' {
  return lang === 'ar' ? 'rtl' : 'ltr';
}

function getTextAlign(lang: Language): 'right' | 'left' {
  return lang === 'ar' ? 'right' : 'left';
}

function getDateLocale(lang: Language) {
  return lang === 'ar' ? ar : enUS;
}

function formatDate(date: string | null, lang: Language, includeTime = false): string {
  if (!date) return "-";
  const formatStr = includeTime ? "PPP p" : "PP";
  return format(new Date(date), formatStr, { locale: getDateLocale(lang) });
}

function getPrimaryColor(org: OrganizationBranding): string {
  return org.primaryColor || '#0f172a';
}

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return { h: 220, s: 50, l: 20 };
  
  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;
  
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function getGradientColors(primaryColor: string): { start: string; end: string } {
  const hsl = hexToHsl(primaryColor);
  return {
    start: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`,
    end: `hsl(${hsl.h + 20}, ${Math.max(hsl.s - 10, 30)}%, ${Math.min(hsl.l + 15, 45)}%)`,
  };
}

// Convert image URL to base64 for embedding in PDF
async function imageUrlToBase64(url: string): Promise<string | null> {
  try {
    // Fetch the image and convert to blob
    const response = await fetch(url, { mode: 'cors' });
    if (!response.ok) return null;
    
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    console.warn('Failed to load logo image:', url);
    return null;
  }
}

// ============= HTML Template Builders =============
function buildHeaderHtml(
  title: string, 
  org: OrganizationBranding, 
  lang: Language,
  logoBase64?: string | null
): string {
  const gradient = getGradientColors(getPrimaryColor(org));
  const dir = getDirection(lang);
  
  const logoHtml = logoBase64 ? `
    <div style="margin-bottom: 15px;">
      <img src="${logoBase64}" alt="${org.name}" style="max-height: 60px; max-width: 200px; object-fit: contain;" />
    </div>
  ` : '';

  return `
    <div class="page-break-inside-avoid" style="background: linear-gradient(135deg, ${gradient.start} 0%, ${gradient.end} 100%); color: white; padding: 35px 40px; border-radius: 16px; text-align: center; margin-bottom: 35px; direction: ${dir};">
      ${logoHtml}
      <h1 style="margin: 0; font-size: 26px; font-weight: 700; letter-spacing: 0.5px;">${title}</h1>
      <div style="margin-top: 8px; font-size: 14px; opacity: 0.9;">${org.name}</div>
    </div>
  `;
}

function buildSectionHeader(title: string, primaryColor: string, lang: Language): string {
  const textAlign = getTextAlign(lang);
  return `
    <h2 style="color: ${primaryColor}; font-size: 17px; margin-bottom: 18px; padding-bottom: 10px; border-bottom: 2px solid ${primaryColor}; font-weight: 600; text-align: ${textAlign};">
      ${title}
    </h2>
  `;
}

function buildInfoGrid(items: { label: string; value: string }[], lang: Language): string {
  const dir = getDirection(lang);
  const textAlign = getTextAlign(lang);
  const labelStyle = lang === 'ar'
    ? 'color: #64748b; font-size: 12px; margin-bottom: 4px; letter-spacing: 0.2px;'
    : 'color: #64748b; font-size: 11px; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px;';

  return `
    <div class="page-break-inside-avoid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; direction: ${dir};">
      ${items.map(item => `
        <div style="background: #f8fafc; padding: 14px 16px; border-radius: 10px; text-align: ${textAlign};">
          <div style="${labelStyle}">${item.label}</div>
          <div style="color: #0f172a; font-weight: 600; font-size: 14px;">${item.value}</div>
        </div>
      `).join('')}
    </div>
  `;
}

function buildStatsGrid(stats: { label: string; value: string | number }[], primaryColor: string, lang: Language): string {
  const dir = getDirection(lang);
  const hsl = hexToHsl(primaryColor);
  const bgStart = `hsl(${hsl.h}, 30%, 96%)`;
  const bgEnd = `hsl(${hsl.h}, 25%, 93%)`;
  
  return `
    <div class="page-break-inside-avoid" style="display: grid; grid-template-columns: repeat(${Math.min(stats.length, 4)}, 1fr); gap: 12px; direction: ${dir};">
      ${stats.slice(0, 4).map(stat => `
        <div style="background: linear-gradient(135deg, ${bgStart} 0%, ${bgEnd} 100%); padding: 20px 16px; border-radius: 12px; text-align: center;">
          <div style="color: ${primaryColor}; font-size: 28px; font-weight: 700;">${stat.value}</div>
          <div style="color: #64748b; font-size: 11px; margin-top: 6px; text-transform: uppercase; letter-spacing: 0.3px;">${stat.label}</div>
        </div>
      `).join('')}
    </div>
  `;
}

function buildAiFeedbackSection(content: string, title: string, primaryColor: string, lang: Language): string {
  const dir = getDirection(lang);
  const textAlign = getTextAlign(lang);
  const hsl = hexToHsl(primaryColor);
  
  // Split content into paragraphs to avoid page breaks mid-paragraph
  const paragraphs = content.split('\n\n').filter(p => p.trim());
  const formattedContent = paragraphs.map(p => 
    `<p style="margin: 0 0 12px 0; text-align: ${textAlign};">${p.trim()}</p>`
  ).join('');
  
  return `
    <div style="margin-bottom: 30px; direction: ${dir};">
      ${buildSectionHeader(title, primaryColor, lang)}
      <div style="background: linear-gradient(135deg, hsl(${hsl.h}, 40%, 97%) 0%, hsl(${hsl.h}, 35%, 94%) 100%); border: 1px solid hsl(${hsl.h}, 50%, 85%); padding: 24px; border-radius: 12px; line-height: 1.8; color: #1e293b; font-size: 14px;">
        ${formattedContent}
      </div>
    </div>
  `;
}

function buildFooterHtml(t: typeof translations.en, org: OrganizationBranding, lang: Language): string {
  const dateStr = format(new Date(), "PPP p", { locale: getDateLocale(lang) });
  const dir = getDirection(lang);
  
  return `
    <div class="page-break-inside-avoid" style="text-align: center; color: #94a3b8; font-size: 10px; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; direction: ${dir};">
      <div>${t.generatedOn} ${dateStr}</div>
      <div style="margin-top: 4px;">${t.poweredBy} ${org.name}</div>
    </div>
  `;
}

// ============= PDF Generation Core =============
async function generatePdfFromHtml(htmlContent: string, fileName: string, lang: Language = 'en'): Promise<void> {
  // Pre-load Arabic font if needed - add to document head
  if (lang === 'ar') {
    const existingLink = document.querySelector('link[href*="fonts.googleapis.com"][href*="Cairo"]');
    if (!existingLink) {
      const fontLink = document.createElement('link');
      fontLink.rel = 'stylesheet';
      fontLink.href = 'https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap';
      document.head.appendChild(fontLink);
    }
    // Wait for font to load
    await new Promise(resolve => setTimeout(resolve, 500));
    if (document.fonts?.ready) {
      await document.fonts.ready;
    }
    // Force font load by creating a test element
    const testEl = document.createElement('span');
    testEl.style.fontFamily = 'Cairo, sans-serif';
    testEl.style.position = 'absolute';
    testEl.style.left = '-9999px';
    testEl.textContent = 'تجربة الخط العربي';
    document.body.appendChild(testEl);
    await new Promise(resolve => setTimeout(resolve, 200));
    document.body.removeChild(testEl);
  }

  const container = document.createElement('div');
  container.innerHTML = htmlContent;
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '794px';
  document.body.appendChild(container);

  try {
    const element = container.querySelector('#pdf-content') as HTMLElement | null;
    if (!element) throw new Error('PDF content not found');

    // Ensure fonts are loaded before rasterizing
    if (document.fonts?.ready) {
      await document.fonts.ready;
    }

    // Wait for images to load
    const imgs = Array.from(element.querySelectorAll('img'));
    await Promise.all(
      imgs.map((img) =>
        img.complete
          ? Promise.resolve()
          : new Promise<void>((resolve) => {
              img.addEventListener('load', () => resolve(), { once: true });
              img.addEventListener('error', () => resolve(), { once: true });
            })
      )
    );

    // Longer delay for Arabic content to ensure font rendering
    await new Promise(resolve => setTimeout(resolve, lang === 'ar' ? 300 : 100));

    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    // Rasterize the whole document
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: false,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: 794,
      windowHeight: element.scrollHeight,
      scrollX: 0,
      scrollY: 0,
    });

    const imgWidthPx = canvas.width;
    const imgHeightPx = canvas.height;

    const mmPerPx = pdfWidth / imgWidthPx;
    const pageHeightPx = pdfHeight / mmPerPx;

    let srcY = 0;
    let page = 0;

    while (srcY < imgHeightPx) {
      if (page > 0) pdf.addPage();

      const sliceHeightPx = Math.min(pageHeightPx, imgHeightPx - srcY);

      const pageCanvas = document.createElement('canvas');
      pageCanvas.width = imgWidthPx;
      pageCanvas.height = Math.ceil(sliceHeightPx);

      const ctx = pageCanvas.getContext('2d');
      if (!ctx) break;

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
      ctx.drawImage(
        canvas,
        0,
        srcY,
        imgWidthPx,
        sliceHeightPx,
        0,
        0,
        imgWidthPx,
        sliceHeightPx
      );

      const sliceImg = pageCanvas.toDataURL('image/png');
      const sliceHeightMm = sliceHeightPx * mmPerPx;

      pdf.addImage(sliceImg, 'PNG', 0, 0, pdfWidth, sliceHeightMm, undefined, 'FAST');

      srcY += sliceHeightPx;
      page++;
    }

    pdf.save(fileName);
  } finally {
    document.body.removeChild(container);
  }
}

function buildDocumentContainer(content: string, lang: Language): string {
  const dir = getDirection(lang);
  const textAlign = getTextAlign(lang);

  // Use proper Arabic font loaded via Google Fonts
  const fontFamily = lang === 'ar'
    ? "'Cairo', 'Noto Naskh Arabic', 'Noto Sans Arabic', 'Tahoma', 'Arial', sans-serif"
    : "'Segoe UI', 'Helvetica Neue', Arial, sans-serif";

  const styleTag = `
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
      #pdf-content { box-sizing: border-box; }
      #pdf-content * { box-sizing: border-box; }
      .page-break-inside-avoid { break-inside: avoid; page-break-inside: avoid; }
    </style>
  `;

  return `
    ${styleTag}
    <div id="pdf-content" style="
      width: 794px;
      padding: 45px;
      background: white;
      font-family: ${fontFamily};
      direction: ${dir};
      text-align: ${textAlign};
      line-height: 1.5;
    ">
      ${content}
    </div>
  `;
}

// ============= Public Export Functions =============
export async function generateParticipantPDF(report: ParticipantReport): Promise<void> {
  const lang = report.language || 'en';
  const t = getTranslations(lang);
  const primaryColor = getPrimaryColor(report.organization);

  // Pre-load logo as base64
  let logoBase64: string | null = null;
  if (report.organization.logoUrl) {
    logoBase64 = await imageUrlToBase64(report.organization.logoUrl);
  }

  // Build info items
  const infoItems: { label: string; value: string }[] = [
    { label: t.name, value: report.participantName || t.anonymous },
    { label: t.email, value: report.participantEmail || "-" },
  ];
  
  if (report.employeeCode) {
    infoItems.push({ label: t.employeeCode, value: report.employeeCode });
  }
  if (report.department) {
    infoItems.push({ label: t.department, value: report.department });
  }
  
  const typeKey = report.assessmentType.toLowerCase() as keyof typeof t;
  const typeLabel = (t[typeKey] as string) || report.assessmentType;
  
  infoItems.push(
    { label: t.assessment, value: report.assessmentTitle },
    { label: t.type, value: typeLabel },
    { label: t.group, value: report.groupName },
    { label: t.completed, value: formatDate(report.completedAt, lang, true) }
  );

  // Build stats
  let statsItems: { label: string; value: string | number }[] = [];
  if (report.scoreSummary) {
    if (report.scoreSummary.percentage !== undefined) {
      statsItems.push({ label: t.score, value: `${report.scoreSummary.percentage}%` });
      statsItems.push({ 
        label: t.correct, 
        value: `${report.scoreSummary.correctCount || 0}/${report.scoreSummary.totalPossible || 0}` 
      });
      if (report.scoreSummary.grade) {
        statsItems.push({ label: t.grade, value: report.scoreSummary.grade });
      }
    } else if (report.scoreSummary.traits) {
      statsItems = Object.entries(report.scoreSummary.traits).map(([trait, score]) => ({
        label: trait.charAt(0).toUpperCase() + trait.slice(1),
        value: score.toFixed(1),
      }));
    }
  }

  // Build HTML content
  let content = buildHeaderHtml(t.assessmentReport, report.organization, lang, logoBase64);
  
  content += `<div class="page-break-inside-avoid" style="margin-bottom: 30px;">`;
  content += buildSectionHeader(t.participantInformation, primaryColor, lang);
  content += buildInfoGrid(infoItems, lang);
  content += `</div>`;

  if (statsItems.length > 0) {
    content += `<div class="page-break-inside-avoid" style="margin-bottom: 30px;">`;
    content += buildSectionHeader(t.results, primaryColor, lang);
    content += buildStatsGrid(statsItems, primaryColor, lang);
    content += `</div>`;
  }

  if (report.aiReport) {
    content += buildAiFeedbackSection(report.aiReport, t.aiGeneratedFeedback, primaryColor, lang);
  }

  content += buildFooterHtml(t, report.organization, lang);

  const html = buildDocumentContainer(content, lang);
  const fileName = `${report.participantName || "participant"}_report.pdf`
    .replace(/[^a-zA-Z0-9_.-\u0600-\u06FF]/g, "_")
    .toLowerCase();
  
  await generatePdfFromHtml(html, fileName, lang);
}

export async function generateGroupPDF(report: GroupReport): Promise<void> {
  const lang = report.language || 'en';
  const t = getTranslations(lang);
  const primaryColor = getPrimaryColor(report.organization);

  // Pre-load logo as base64
  let logoBase64: string | null = null;
  if (report.organization.logoUrl) {
    logoBase64 = await imageUrlToBase64(report.organization.logoUrl);
  }

  const typeKey = report.assessmentType.toLowerCase() as keyof typeof t;
  const typeLabel = (t[typeKey] as string) || report.assessmentType;
  
  const periodText = `${formatDate(report.startDate, lang)} ${t.to} ${formatDate(report.endDate, lang)}`;

  const infoItems = [
    { label: t.group, value: report.groupName },
    { label: t.assessment, value: report.assessmentTitle },
    { label: t.type, value: typeLabel },
    { label: t.period, value: periodText },
  ];

  const statsItems = [
    { label: t.total, value: report.stats.totalParticipants },
    { label: t.completionRate, value: `${report.stats.completionRate}%` },
    { label: t.avgScore, value: report.stats.averageScore !== null ? `${report.stats.averageScore}%` : '-' },
    { label: t.highest, value: report.stats.highestScore !== null ? `${report.stats.highestScore}%` : '-' },
  ];

  // Build HTML content
  let content = buildHeaderHtml(t.groupAssessmentReport, report.organization, lang, logoBase64);
  
  content += `<div class="page-break-inside-avoid" style="margin-bottom: 30px;">`;
  content += buildSectionHeader(t.assessmentDetails, primaryColor, lang);
  content += buildInfoGrid(infoItems, lang);
  content += `</div>`;

  content += `<div class="page-break-inside-avoid" style="margin-bottom: 30px;">`;
  content += buildSectionHeader(t.statisticsOverview, primaryColor, lang);
  content += buildStatsGrid(statsItems, primaryColor, lang);
  content += `</div>`;

  if (report.aiNarrative) {
    content += buildAiFeedbackSection(report.aiNarrative, t.aiGeneratedFeedback, primaryColor, lang);
  }

  content += buildFooterHtml(t, report.organization, lang);

  const html = buildDocumentContainer(content, lang);
  const fileName = `${report.groupName}_group_report.pdf`
    .replace(/[^a-zA-Z0-9_.-\u0600-\u06FF]/g, "_")
    .toLowerCase();
  
  await generatePdfFromHtml(html, fileName, lang);
}
