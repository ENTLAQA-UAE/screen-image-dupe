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

export interface TalentSnapshotReport {
  employeeName: string;
  employeeEmail: string;
  employeeCode?: string;
  department?: string;
  jobTitle?: string;
  snapshotText: string;
  generatedAt: string;
  assessmentCount: number;
  organization: OrganizationBranding;
  language?: Language;
}

// ============= Security: HTML Escaping =============
function escapeHtml(unsafe: string | null | undefined): string {
  if (!unsafe) return '';
  return String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ============= Grade Label Mapping =============
const gradeLabels = {
  en: {
    A: "Outstanding",
    B: "Exceed Expectations \"EE\"",
    C: "Meet Expectations \"ME\"",
    D: "Below Expectations \"BE\"",
    F: "Doesn't Meet \"DM\"",
  },
  ar: {
    A: "متميز",
    B: "يتجاوز التوقعات",
    C: "يحقق التوقعات",
    D: "أقل من التوقعات",
    F: "لا يحقق المتطلبات",
  }
};

function getGradeLabel(grade: string, lang: Language): string {
  const labels = gradeLabels[lang];
  return labels[grade as keyof typeof labels] || grade;
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
    percentage: "Percentage",
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
    talentSnapshotReport: "Talent Snapshot Report",
    jobTitle: "Job Title",
    basedOnAssessments: "Based on",
    assessments: "assessments",
    competencyBreakdown: "Competency Breakdown",
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
    percentage: "النسبة المئوية",
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
    talentSnapshotReport: "تقرير لمحة المواهب",
    jobTitle: "المسمى الوظيفي",
    basedOnAssessments: "بناءً على",
    assessments: "تقييمات",
    competencyBreakdown: "تفصيل الكفاءات",
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
  const safeTitle = escapeHtml(title);
  const safeOrgName = escapeHtml(org.name);
  
  const logoHtml = logoBase64 ? `
    <div style="margin-bottom: 15px;">
      <img src="${logoBase64}" alt="${safeOrgName}" style="max-height: 60px; max-width: 200px; object-fit: contain;" />
    </div>
  ` : '';

  return `
    <div class="page-break-inside-avoid" style="background: linear-gradient(135deg, ${gradient.start} 0%, ${gradient.end} 100%); color: white; padding: 35px 40px; border-radius: 16px; text-align: center; margin-bottom: 35px; direction: ${dir};">
      ${logoHtml}
      <h1 style="margin: 0; font-size: 26px; font-weight: 700; letter-spacing: 0.5px;">${safeTitle}</h1>
      <div style="margin-top: 8px; font-size: 14px; opacity: 0.9;">${safeOrgName}</div>
    </div>
  `;
}

function buildSectionHeader(title: string, primaryColor: string, lang: Language): string {
  const textAlign = getTextAlign(lang);
  const safeTitle = escapeHtml(title);
  return `
    <h2 style="color: ${primaryColor}; font-size: 17px; margin-bottom: 18px; padding-bottom: 10px; border-bottom: 2px solid ${primaryColor}; font-weight: 600; text-align: ${textAlign};">
      ${safeTitle}
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
          <div style="${labelStyle}">${escapeHtml(item.label)}</div>
          <div style="color: #0f172a; font-weight: 600; font-size: 14px;">${escapeHtml(item.value)}</div>
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

  // Split content into paragraphs to keep better layout and avoid mid-paragraph breaks
  const paragraphs = content.split("\n\n").filter((p) => p.trim());
  const formattedContent = paragraphs
    .map((p) => {
      // Escape HTML to prevent XSS attacks from AI-generated content
      const safe = escapeHtml(p.trim());
      // For Arabic, isolate the paragraph to prevent punctuation/numbers flipping.
      const bidi = lang === "ar" ? "isolate" : "plaintext";
      return `<p style="margin: 0 0 12px 0; text-align: ${textAlign}; direction: ${dir}; unicode-bidi: ${bidi};">${safe}</p>`;
    })
    .join("");

  const bidiContainer = lang === "ar" ? "isolate" : "plaintext";

  return `
    <div style="margin-bottom: 30px; direction: ${dir}; text-align: ${textAlign};">
      ${buildSectionHeader(title, primaryColor, lang)}
      <div style="
        background: linear-gradient(135deg, hsl(${hsl.h}, 40%, 97%) 0%, hsl(${hsl.h}, 35%, 94%) 100%);
        border: 1px solid hsl(${hsl.h}, 50%, 85%);
        padding: 24px;
        border-radius: 12px;
        line-height: 1.8;
        color: #1e293b;
        font-size: 14px;
        direction: ${dir};
        text-align: ${textAlign};
        unicode-bidi: ${bidiContainer};
        word-break: break-word;
      ">
        ${formattedContent || `<p style="margin:0; text-align:${textAlign}; direction:${dir}; unicode-bidi:${bidiContainer};">-</p>`}
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
const A4_WIDTH_PX = 794; // 8.27in @ 96dpi
const A4_HEIGHT_PX = 1122; // 11.69in @ 96dpi

async function ensureArabicFontLoaded(lang: Language) {
  if (lang !== 'ar') return;

  const existingLink = document.querySelector('link[href*="fonts.googleapis.com"][href*="Cairo"]');
  if (!existingLink) {
    const fontLink = document.createElement('link');
    fontLink.rel = 'stylesheet';
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap';
    document.head.appendChild(fontLink);
  }

  // Wait for font to load
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
  await new Promise((resolve) => setTimeout(resolve, 200));
  document.body.removeChild(testEl);
}

async function renderPageToCanvas(pageHtml: string, lang: Language): Promise<HTMLCanvasElement> {
  const wrapper = document.createElement('div');
  wrapper.innerHTML = pageHtml;
  wrapper.style.position = 'absolute';
  wrapper.style.left = '-9999px';
  wrapper.style.top = '0';
  document.body.appendChild(wrapper);

  try {
    const element = wrapper.querySelector('#pdf-page') as HTMLElement | null;
    if (!element) throw new Error('PDF page not found');

    // Ensure fonts/images are ready
    if (document.fonts?.ready) {
      await document.fonts.ready;
    }

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

    // Delay helps Arabic shaping apply before rasterization
    await new Promise((resolve) => setTimeout(resolve, lang === 'ar' ? 650 : 80));

    return await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: false,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: A4_WIDTH_PX,
      windowHeight: A4_HEIGHT_PX,
      scrollX: 0,
      scrollY: 0,
    });
  } finally {
    document.body.removeChild(wrapper);
  }
}

async function generatePdfFromPages(pagesHtml: string[], fileName: string, lang: Language): Promise<void> {
  await ensureArabicFontLoaded(lang);

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();

  for (let i = 0; i < pagesHtml.length; i++) {
    if (i > 0) pdf.addPage();

    const canvas = await renderPageToCanvas(pagesHtml[i], lang);
    const imgData = canvas.toDataURL('image/png');

    // Fit exactly one A4 page
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
  }

  pdf.save(fileName);
}

async function measurePdfPageScrollHeight(pageHtml: string, lang: Language): Promise<number> {
  const wrapper = document.createElement('div');
  wrapper.innerHTML = pageHtml;
  wrapper.style.position = 'absolute';
  wrapper.style.left = '-9999px';
  wrapper.style.top = '0';
  document.body.appendChild(wrapper);

  try {
    if (document.fonts?.ready) {
      await document.fonts.ready;
    }

    const page = wrapper.querySelector('#pdf-page') as HTMLElement | null;
    if (!page) return A4_HEIGHT_PX;

    // scrollHeight reflects overflow content even when fixed height is used
    return page.scrollHeight;
  } finally {
    document.body.removeChild(wrapper);
  }
}

async function paginateAiTextToPages(params: {
  headerHtml: string;
  footerHtml: string;
  aiTitle: string;
  aiText: string;
  primaryColor: string;
  lang: Language;
}): Promise<string[]> {
  const { headerHtml, footerHtml, aiTitle, aiText, primaryColor, lang } = params;

  const paragraphs = aiText.split('\n\n').map((p) => p.trim()).filter(Boolean);
  if (paragraphs.length === 0) {
    const content = headerHtml + buildAiFeedbackSection('-', aiTitle, primaryColor, lang) + footerHtml;
    return [buildPageContainer(content, lang)];
  }

  const pages: string[] = [];
  let start = 0;

  while (start < paragraphs.length) {
    let low = start + 1;
    let high = paragraphs.length;
    let best = low;

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const chunk = paragraphs.slice(start, mid).join('\n\n');
      const content = headerHtml + buildAiFeedbackSection(chunk, aiTitle, primaryColor, lang) + footerHtml;
      const pageHtml = buildPageContainer(content, lang);
      const h = await measurePdfPageScrollHeight(pageHtml, lang);

      if (h <= A4_HEIGHT_PX) {
        best = mid;
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    // Safety: always progress at least one paragraph
    if (best === start) best = start + 1;

    const chunk = paragraphs.slice(start, best).join('\n\n');
    const content = headerHtml + buildAiFeedbackSection(chunk, aiTitle, primaryColor, lang) + footerHtml;
    pages.push(buildPageContainer(content, lang));
    start = best;
  }

  return pages;
}

function buildPageContainer(content: string, lang: Language): string {
  const dir = getDirection(lang);
  const textAlign = getTextAlign(lang);

  const fontFamily = lang === 'ar'
    ? "'Cairo', 'Noto Naskh Arabic', 'Noto Sans Arabic', 'Tahoma', 'Arial', sans-serif"
    : "'Segoe UI', 'Helvetica Neue', Arial, sans-serif";

  // NOTE: font is loaded in the document head (see ensureArabicFontLoaded)
  const styleTag = `
    <style>
      #pdf-page { box-sizing: border-box; }
      #pdf-page * { box-sizing: border-box; font-family: ${fontFamily}; }

      /* Use per-block BiDi handling (prevents double-processing) */
      #pdf-page { unicode-bidi: normal; }
      .bidi-plaintext { unicode-bidi: plaintext; }

      /* Make tables respect RTL alignment */
      #pdf-page table { width: 100%; border-collapse: collapse; direction: ${dir}; }
      #pdf-page th, #pdf-page td { text-align: ${textAlign}; vertical-align: top; }

      .page-break-inside-avoid { break-inside: avoid; page-break-inside: avoid; }
    </style>
  `;

  return `
    ${styleTag}
    <div id="pdf-page" style="
      width: ${A4_WIDTH_PX}px;
      height: ${A4_HEIGHT_PX}px;
      padding: 45px;
      overflow: hidden;
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

  // Build stats - Show only percentage and grade with label mapping for graded assessments
  let statsItems: { label: string; value: string | number }[] = [];
  if (report.scoreSummary) {
    if (report.scoreSummary.percentage !== undefined) {
      // Show percentage only, not the raw score
      statsItems.push({ label: t.percentage, value: `${report.scoreSummary.percentage}%` });
      if (report.scoreSummary.grade) {
        // Map grade to descriptive label (A → Outstanding, etc.)
        statsItems.push({ label: t.grade, value: `${report.scoreSummary.grade} - ${getGradeLabel(report.scoreSummary.grade, lang)}` });
      }
    } else if (report.scoreSummary.traits) {
      statsItems = Object.entries(report.scoreSummary.traits).map(([trait, score]) => ({
        label: trait.charAt(0).toUpperCase() + trait.slice(1),
        value: score.toFixed(1),
      }));
    }
  }

  // Build page 1 (summary)
  let page1 = buildHeaderHtml(t.assessmentReport, report.organization, lang, logoBase64);

  page1 += `<div class="page-break-inside-avoid" style="margin-bottom: 30px;">`;
  page1 += buildSectionHeader(t.participantInformation, primaryColor, lang);
  page1 += buildInfoGrid(infoItems, lang);
  page1 += `</div>`;

  if (statsItems.length > 0) {
    page1 += `<div class="page-break-inside-avoid" style="margin-bottom: 30px;">`;
    page1 += buildSectionHeader(t.results, primaryColor, lang);
    page1 += buildStatsGrid(statsItems, primaryColor, lang);
    page1 += `</div>`;
  }

  // Build AI feedback pages (auto-paginated so nothing gets cut)
  const header2 = buildHeaderHtml(t.assessmentReport, report.organization, lang, logoBase64);
  const footer2 = buildFooterHtml(t, report.organization, lang);
  const aiPages = await paginateAiTextToPages({
    headerHtml: header2,
    footerHtml: footer2,
    aiTitle: t.aiGeneratedFeedback,
    aiText: report.aiReport || "-",
    primaryColor,
    lang,
  });

  const pages = [buildPageContainer(page1, lang), ...aiPages];

  const fileName = `${report.participantName || "participant"}_report.pdf`
    .replace(/[^a-zA-Z0-9_.-\u0600-\u06FF]/g, "_")
    .toLowerCase();

  await generatePdfFromPages(pages, fileName, lang);
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

  // Build page 1 (summary)
  let page1 = buildHeaderHtml(t.groupAssessmentReport, report.organization, lang, logoBase64);

  page1 += `<div class="page-break-inside-avoid" style="margin-bottom: 30px;">`;
  page1 += buildSectionHeader(t.assessmentDetails, primaryColor, lang);
  page1 += buildInfoGrid(infoItems, lang);
  page1 += `</div>`;

  page1 += `<div class="page-break-inside-avoid" style="margin-bottom: 30px;">`;
  page1 += buildSectionHeader(t.statisticsOverview, primaryColor, lang);
  page1 += buildStatsGrid(statsItems, primaryColor, lang);
  page1 += `</div>`;

  // Build AI narrative pages (auto-paginated so nothing gets cut)
  const header2 = buildHeaderHtml(t.groupAssessmentReport, report.organization, lang, logoBase64);
  const footer2 = buildFooterHtml(t, report.organization, lang);
  const aiPages = await paginateAiTextToPages({
    headerHtml: header2,
    footerHtml: footer2,
    aiTitle: t.aiGeneratedFeedback,
    aiText: report.aiNarrative || "-",
    primaryColor,
    lang,
  });

  const pages = [buildPageContainer(page1, lang), ...aiPages];

  const fileName = `${report.groupName}_group_report.pdf`
    .replace(/[^a-zA-Z0-9_.-\u0600-\u06FF]/g, "_")
    .toLowerCase();

  await generatePdfFromPages(pages, fileName, lang);
}

export async function generateTalentSnapshotPDF(report: TalentSnapshotReport): Promise<void> {
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
    { label: t.name, value: report.employeeName || t.anonymous },
    { label: t.email, value: report.employeeEmail || "-" },
  ];
  
  if (report.employeeCode) {
    infoItems.push({ label: t.employeeCode, value: report.employeeCode });
  }
  if (report.department) {
    infoItems.push({ label: t.department, value: report.department });
  }
  if (report.jobTitle) {
    infoItems.push({ label: t.jobTitle, value: report.jobTitle });
  }

  // Build stats
  const statsItems = [
    { label: t.basedOnAssessments, value: `${report.assessmentCount} ${t.assessments}` },
    { label: t.generatedOn, value: formatDate(report.generatedAt, lang, true) },
  ];

  // Build page 1 (summary)
  let page1 = buildHeaderHtml(t.talentSnapshotReport, report.organization, lang, logoBase64);

  page1 += `<div class="page-break-inside-avoid" style="margin-bottom: 30px;">`;
  page1 += buildSectionHeader(t.participantInformation, primaryColor, lang);
  page1 += buildInfoGrid(infoItems, lang);
  page1 += `</div>`;

  page1 += `<div class="page-break-inside-avoid" style="margin-bottom: 30px;">`;
  page1 += buildStatsGrid(statsItems, primaryColor, lang);
  page1 += `</div>`;

  // Build AI snapshot pages (auto-paginated so nothing gets cut)
  const header2 = buildHeaderHtml(t.talentSnapshotReport, report.organization, lang, logoBase64);
  const footer2 = buildFooterHtml(t, report.organization, lang);
  const aiPages = await paginateAiTextToPages({
    headerHtml: header2,
    footerHtml: footer2,
    aiTitle: t.aiGeneratedFeedback,
    aiText: report.snapshotText || "-",
    primaryColor,
    lang,
  });

  const pages = [buildPageContainer(page1, lang), ...aiPages];

  const fileName = `${report.employeeName || "employee"}_talent_snapshot.pdf`
    .replace(/[^a-zA-Z0-9_.-\u0600-\u06FF]/g, "_")
    .toLowerCase();

  await generatePdfFromPages(pages, fileName, lang);
}
