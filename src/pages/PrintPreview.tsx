import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";

type ReportType = "talent-snapshot" | "participant" | "group";

interface OrganizationBranding {
  name: string;
  logoUrl?: string | null;
  primaryColor?: string | null;
}

interface TalentSnapshotData {
  employeeName: string;
  employeeEmail: string;
  employeeCode?: string;
  department?: string;
  jobTitle?: string;
  snapshotText: string;
  generatedAt: string;
  assessmentCount: number;
}

interface ParticipantData {
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

interface GroupData {
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

const translations = {
  en: {
    talentSnapshotReport: "Talent Snapshot Report",
    assessmentReport: "Assessment Report",
    groupAssessmentReport: "Group Assessment Report",
    participantInformation: "Participant Information",
    name: "Name",
    email: "Email",
    employeeCode: "Employee Code",
    department: "Department",
    jobTitle: "Job Title",
    assessment: "Assessment",
    type: "Type",
    group: "Group",
    completed: "Completed",
    results: "Results",
    score: "Score",
    correct: "Correct Answers",
    grade: "Grade",
    aiGeneratedFeedback: "AI-Generated Feedback",
    talentSnapshot: "Talent Snapshot",
    generatedOn: "Generated on",
    basedOn: "Based on",
    assessments: "assessments",
    poweredBy: "Powered by",
    assessmentDetails: "Assessment Details",
    period: "Period",
    to: "to",
    statisticsOverview: "Statistics Overview",
    total: "Total",
    completionRate: "Completion Rate",
    avgScore: "Average Score",
    highest: "Highest Score",
    cognitive: "Cognitive",
    personality: "Personality",
    situational: "Situational",
    language: "Language",
    loading: "Loading report...",
    error: "Failed to load report",
  },
  ar: {
    talentSnapshotReport: "تقرير لمحة المواهب",
    assessmentReport: "تقرير التقييم",
    groupAssessmentReport: "تقرير تقييم المجموعة",
    participantInformation: "معلومات المشارك",
    name: "الاسم",
    email: "البريد الإلكتروني",
    employeeCode: "رقم الموظف",
    department: "القسم",
    jobTitle: "المسمى الوظيفي",
    assessment: "التقييم",
    type: "النوع",
    group: "المجموعة",
    completed: "تاريخ الإكمال",
    results: "النتائج",
    score: "الدرجة",
    correct: "الإجابات الصحيحة",
    grade: "التقدير",
    aiGeneratedFeedback: "ملاحظات الذكاء الاصطناعي",
    talentSnapshot: "لمحة المواهب",
    generatedOn: "تم الإنشاء في",
    basedOn: "بناءً على",
    assessments: "تقييمات",
    poweredBy: "مدعوم من",
    assessmentDetails: "تفاصيل التقييم",
    period: "الفترة",
    to: "إلى",
    statisticsOverview: "نظرة عامة على الإحصائيات",
    total: "المجموع",
    completionRate: "نسبة الإكمال",
    avgScore: "متوسط الدرجة",
    highest: "أعلى درجة",
    cognitive: "معرفي",
    personality: "شخصية",
    situational: "مواقف",
    language: "لغة",
    loading: "جاري تحميل التقرير...",
    error: "فشل تحميل التقرير",
  },
};

const PrintPreview = () => {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [organization, setOrganization] = useState<OrganizationBranding | null>(null);
  const [talentData, setTalentData] = useState<TalentSnapshotData | null>(null);
  const [participantData, setParticipantData] = useState<ParticipantData | null>(null);
  const [groupData, setGroupData] = useState<GroupData | null>(null);

  const reportType = searchParams.get("type") as ReportType;
  const lang = (searchParams.get("lang") as "en" | "ar") || "en";
  const isRtl = lang === "ar";
  const t = translations[lang];

  useEffect(() => {
    // Tell opener we're ready (handshake)
    try {
      window.opener?.postMessage({ kind: "printPreviewReady" }, "*");
      console.log("[PrintPreview] sent ready to opener");
    } catch {
      // ignore
    }

    loadReportData();
  }, []);

  useEffect(() => {
    // Auto-trigger print dialog when data is loaded
    if (!loading && !error && (talentData || participantData || groupData)) {
      setTimeout(() => {
        window.print();
      }, 500);
    }
  }, [loading, error, talentData, participantData, groupData]);

  const applyIncomingData = (data: any) => {
    setOrganization(data.organization);

    const incomingType: ReportType = (data.reportType || reportType) as ReportType;
    switch (incomingType) {
      case "talent-snapshot":
        setTalentData(data.reportData);
        break;
      case "participant":
        setParticipantData(data.reportData);
        break;
      case "group":
        setGroupData(data.reportData);
        break;
    }
  };

  const loadReportData = () => {
    // 1) Try localStorage
    try {
      const storedData = localStorage.getItem("printReportData");
      if (storedData) {
        const data = JSON.parse(storedData);
        console.log("[PrintPreview] loaded from localStorage", data?.reportType);
        applyIncomingData(data);
        localStorage.removeItem("printReportData");
        setLoading(false);
        return;
      }
    } catch {
      // ignore
    }

    // 2) Wait for postMessage data
    const onMessage = (event: MessageEvent) => {
      const msg = event.data;
      if (!msg || msg.kind !== "printReportData") return;

      console.log("[PrintPreview] received report data", msg?.payload?.reportType);
      setError(null);
      applyIncomingData(msg.payload);
      window.removeEventListener("message", onMessage);
      setLoading(false);
    };

    window.addEventListener("message", onMessage);

    setTimeout(() => {
      window.removeEventListener("message", onMessage);
      setError("No report data found");
      setLoading(false);
    }, 12000);
  };

  const formatDate = (date: string | null, includeTime = false): string => {
    if (!date) return "-";
    const formatStr = includeTime ? "PPP p" : "PP";
    return format(new Date(date), formatStr, { locale: lang === "ar" ? ar : enUS });
  };

  const getTypeLabel = (type: string): string => {
    const typeKey = type.toLowerCase() as keyof typeof t;
    return (t[typeKey] as string) || type;
  };

  const hexToHsl = (hex: string): { h: number; s: number; l: number } => {
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
  };

  const primaryColor = organization?.primaryColor || "#0f172a";
  const hsl = hexToHsl(primaryColor);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>{t.loading}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-500">{t.error}: {error}</p>
      </div>
    );
  }

  return (
    <>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
          
          @page {
            size: A4;
            margin: 15mm;
          }
          
          @media print {
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .no-print {
              display: none !important;
            }
          }
          
          @media screen {
            body {
              background: #f1f5f9;
            }
            .print-container {
              max-width: 210mm;
              margin: 20px auto;
              box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            }
          }
          
          .print-container {
            background: white;
            font-family: ${isRtl ? "'Cairo', 'Noto Naskh Arabic', sans-serif" : "'Segoe UI', 'Helvetica Neue', Arial, sans-serif"};
            direction: ${isRtl ? "rtl" : "ltr"};
            text-align: ${isRtl ? "right" : "left"};
            unicode-bidi: plaintext;
            line-height: 1.6;
            color: #1e293b;
          }
          
          .page-break {
            page-break-before: always;
          }
          
          .avoid-break {
            break-inside: avoid;
            page-break-inside: avoid;
          }
          
          .header-gradient {
            background: linear-gradient(135deg, hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%) 0%, hsl(${hsl.h + 20}, ${Math.max(hsl.s - 10, 30)}%, ${Math.min(hsl.l + 15, 45)}%) 100%);
            color: white;
            padding: 30px;
            border-radius: 12px;
            text-align: center;
            margin-bottom: 30px;
          }
          
          .section-header {
            color: ${primaryColor};
            font-size: 16px;
            font-weight: 600;
            border-bottom: 2px solid ${primaryColor};
            padding-bottom: 8px;
            margin-bottom: 16px;
          }
          
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin-bottom: 24px;
          }
          
          .info-item {
            background: #f8fafc;
            padding: 12px 16px;
            border-radius: 8px;
          }
          
          .info-label {
            color: #64748b;
            font-size: 11px;
            text-transform: ${isRtl ? "none" : "uppercase"};
            letter-spacing: 0.3px;
            margin-bottom: 4px;
          }
          
          .info-value {
            color: #0f172a;
            font-weight: 600;
            font-size: 14px;
          }
          
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
            gap: 12px;
            margin-bottom: 24px;
          }
          
          .stat-item {
            background: linear-gradient(135deg, hsl(${hsl.h}, 30%, 96%) 0%, hsl(${hsl.h}, 25%, 93%) 100%);
            padding: 20px 16px;
            border-radius: 10px;
            text-align: center;
          }
          
          .stat-value {
            color: ${primaryColor};
            font-size: 24px;
            font-weight: 700;
          }
          
          .stat-label {
            color: #64748b;
            font-size: 11px;
            margin-top: 4px;
          }
          
          .ai-content {
            background: linear-gradient(135deg, hsl(${hsl.h}, 40%, 97%) 0%, hsl(${hsl.h}, 35%, 94%) 100%);
            border: 1px solid hsl(${hsl.h}, 50%, 85%);
            padding: 24px;
            border-radius: 12px;
            line-height: 1.8;
            font-size: 14px;
          }
          
          .ai-content h4 {
            font-weight: 600;
            color: ${primaryColor};
            margin-top: 16px;
            margin-bottom: 8px;
          }
          
          .ai-content h4:first-child {
            margin-top: 0;
          }
          
          .ai-content p {
            margin-bottom: 8px;
          }
          
          .ai-content ul {
            margin: 8px 0;
            padding-${isRtl ? "right" : "left"}: 20px;
          }
          
          .ai-content li {
            margin-bottom: 4px;
          }
          
          .footer {
            text-align: center;
            color: #94a3b8;
            font-size: 10px;
            margin-top: 40px;
            padding-top: 16px;
            border-top: 1px solid #e2e8f0;
          }
          
          .trait-bar {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 8px;
          }
          
          .trait-name {
            min-width: 100px;
            font-weight: 500;
          }
          
          .trait-bar-bg {
            flex: 1;
            height: 8px;
            background: #e2e8f0;
            border-radius: 4px;
            overflow: hidden;
          }
          
          .trait-bar-fill {
            height: 100%;
            background: ${primaryColor};
            border-radius: 4px;
          }
          
          .trait-value {
            min-width: 40px;
            text-align: ${isRtl ? "left" : "right"};
            font-weight: 600;
          }
        `}
      </style>

      <div className="print-container" style={{ padding: "20px" }}>
        {/* Header */}
        <div className="header-gradient avoid-break">
          {organization?.logoUrl && (
            <div style={{ marginBottom: 12 }}>
              <img
                src={organization.logoUrl}
                alt={organization.name}
                style={{ maxHeight: 50, maxWidth: 180, objectFit: "contain", margin: "0 auto" }}
                crossOrigin="anonymous"
              />
            </div>
          )}
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>
            {reportType === "talent-snapshot" && t.talentSnapshotReport}
            {reportType === "participant" && t.assessmentReport}
            {reportType === "group" && t.groupAssessmentReport}
          </h1>
          <div style={{ marginTop: 6, fontSize: 13, opacity: 0.9 }}>{organization?.name}</div>
        </div>

        {/* Talent Snapshot Content */}
        {reportType === "talent-snapshot" && talentData && (
          <>
            <div className="avoid-break">
              <h2 className="section-header">{t.participantInformation}</h2>
              <div className="info-grid">
                <div className="info-item">
                  <div className="info-label">{t.name}</div>
                  <div className="info-value">{talentData.employeeName}</div>
                </div>
                <div className="info-item">
                  <div className="info-label">{t.email}</div>
                  <div className="info-value">{talentData.employeeEmail}</div>
                </div>
                {talentData.employeeCode && (
                  <div className="info-item">
                    <div className="info-label">{t.employeeCode}</div>
                    <div className="info-value">{talentData.employeeCode}</div>
                  </div>
                )}
                {talentData.department && (
                  <div className="info-item">
                    <div className="info-label">{t.department}</div>
                    <div className="info-value">{talentData.department}</div>
                  </div>
                )}
                {talentData.jobTitle && (
                  <div className="info-item">
                    <div className="info-label">{t.jobTitle}</div>
                    <div className="info-value">{talentData.jobTitle}</div>
                  </div>
                )}
              </div>
            </div>

            <div className="avoid-break">
              <div className="stats-grid">
                <div className="stat-item">
                  <div className="stat-value">{talentData.assessmentCount}</div>
                  <div className="stat-label">{t.assessments}</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value" style={{ fontSize: 14 }}>{formatDate(talentData.generatedAt, true)}</div>
                  <div className="stat-label">{t.generatedOn}</div>
                </div>
              </div>
            </div>

            <div className="avoid-break" style={{ marginTop: 24 }}>
              <h2 className="section-header">{t.talentSnapshot}</h2>
              <div className="ai-content">
                {talentData.snapshotText.split(/##\s*/).filter(Boolean).map((section, i) => {
                  const [title, ...content] = section.split('\n');
                  return (
                    <div key={i}>
                      {title && <h4>{title.replace(/\*\*/g, '')}</h4>}
                      {content.map((line, j) => {
                        const trimmedLine = line.trim();
                        if (!trimmedLine) return null;
                        if (trimmedLine.startsWith('-') || trimmedLine.startsWith('•')) {
                          return <p key={j}>• {trimmedLine.replace(/^[-•]\s*/, '').replace(/\*\*/g, '')}</p>;
                        }
                        return <p key={j}>{trimmedLine.replace(/\*\*/g, '')}</p>;
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* Participant Report Content */}
        {reportType === "participant" && participantData && (
          <>
            <div className="avoid-break">
              <h2 className="section-header">{t.participantInformation}</h2>
              <div className="info-grid">
                <div className="info-item">
                  <div className="info-label">{t.name}</div>
                  <div className="info-value">{participantData.participantName}</div>
                </div>
                <div className="info-item">
                  <div className="info-label">{t.email}</div>
                  <div className="info-value">{participantData.participantEmail}</div>
                </div>
                {participantData.employeeCode && (
                  <div className="info-item">
                    <div className="info-label">{t.employeeCode}</div>
                    <div className="info-value">{participantData.employeeCode}</div>
                  </div>
                )}
                {participantData.department && (
                  <div className="info-item">
                    <div className="info-label">{t.department}</div>
                    <div className="info-value">{participantData.department}</div>
                  </div>
                )}
                <div className="info-item">
                  <div className="info-label">{t.assessment}</div>
                  <div className="info-value">{participantData.assessmentTitle}</div>
                </div>
                <div className="info-item">
                  <div className="info-label">{t.type}</div>
                  <div className="info-value">{getTypeLabel(participantData.assessmentType)}</div>
                </div>
                <div className="info-item">
                  <div className="info-label">{t.group}</div>
                  <div className="info-value">{participantData.groupName}</div>
                </div>
                <div className="info-item">
                  <div className="info-label">{t.completed}</div>
                  <div className="info-value">{formatDate(participantData.completedAt, true)}</div>
                </div>
              </div>
            </div>

            {participantData.scoreSummary && (
              <div className="avoid-break">
                <h2 className="section-header">{t.results}</h2>
                {participantData.scoreSummary.percentage !== undefined ? (
                  <div className="stats-grid">
                    <div className="stat-item">
                      <div className="stat-value">{participantData.scoreSummary.percentage}%</div>
                      <div className="stat-label">{t.score}</div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-value">{participantData.scoreSummary.correctCount || 0}/{participantData.scoreSummary.totalPossible || 0}</div>
                      <div className="stat-label">{t.correct}</div>
                    </div>
                    {participantData.scoreSummary.grade && (
                      <div className="stat-item">
                        <div className="stat-value">{participantData.scoreSummary.grade}</div>
                        <div className="stat-label">{t.grade}</div>
                      </div>
                    )}
                  </div>
                ) : participantData.scoreSummary.traits ? (
                  <div style={{ marginBottom: 24 }}>
                    {Object.entries(participantData.scoreSummary.traits).map(([trait, score]: [string, any]) => (
                      <div key={trait} className="trait-bar">
                        <span className="trait-name">{trait.charAt(0).toUpperCase() + trait.slice(1)}</span>
                        <div className="trait-bar-bg">
                          <div className="trait-bar-fill" style={{ width: `${(score / 5) * 100}%` }} />
                        </div>
                        <span className="trait-value">{score.toFixed(1)}</span>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            )}

            {participantData.aiReport && (
              <div className="avoid-break" style={{ marginTop: 24 }}>
                <h2 className="section-header">{t.aiGeneratedFeedback}</h2>
                <div className="ai-content">
                  {participantData.aiReport.split('\n\n').map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Group Report Content */}
        {reportType === "group" && groupData && (
          <>
            <div className="avoid-break">
              <h2 className="section-header">{t.assessmentDetails}</h2>
              <div className="info-grid">
                <div className="info-item">
                  <div className="info-label">{t.group}</div>
                  <div className="info-value">{groupData.groupName}</div>
                </div>
                <div className="info-item">
                  <div className="info-label">{t.assessment}</div>
                  <div className="info-value">{groupData.assessmentTitle}</div>
                </div>
                <div className="info-item">
                  <div className="info-label">{t.type}</div>
                  <div className="info-value">{getTypeLabel(groupData.assessmentType)}</div>
                </div>
                <div className="info-item">
                  <div className="info-label">{t.period}</div>
                  <div className="info-value">{formatDate(groupData.startDate)} {t.to} {formatDate(groupData.endDate)}</div>
                </div>
              </div>
            </div>

            <div className="avoid-break">
              <h2 className="section-header">{t.statisticsOverview}</h2>
              <div className="stats-grid">
                <div className="stat-item">
                  <div className="stat-value">{groupData.stats.totalParticipants}</div>
                  <div className="stat-label">{t.total}</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{groupData.stats.completionRate}%</div>
                  <div className="stat-label">{t.completionRate}</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{groupData.stats.averageScore !== null ? `${groupData.stats.averageScore}%` : '-'}</div>
                  <div className="stat-label">{t.avgScore}</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{groupData.stats.highestScore !== null ? `${groupData.stats.highestScore}%` : '-'}</div>
                  <div className="stat-label">{t.highest}</div>
                </div>
              </div>
            </div>

            {groupData.aiNarrative && (
              <div className="avoid-break" style={{ marginTop: 24 }}>
                <h2 className="section-header">{t.aiGeneratedFeedback}</h2>
                <div className="ai-content">
                  {groupData.aiNarrative.split('\n\n').map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Footer */}
        <div className="footer">
          <div>{t.generatedOn} {format(new Date(), "PPP p", { locale: lang === "ar" ? ar : enUS })}</div>
          <div style={{ marginTop: 4 }}>{t.poweredBy} {organization?.name}</div>
        </div>
      </div>

      {/* Print button for screen view */}
      <div className="no-print" style={{ textAlign: "center", padding: 20 }}>
        <button
          onClick={() => window.print()}
          style={{
            background: primaryColor,
            color: "white",
            padding: "12px 32px",
            border: "none",
            borderRadius: 8,
            fontSize: 16,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {isRtl ? "طباعة / حفظ PDF" : "Print / Save as PDF"}
        </button>
      </div>
    </>
  );
};

export default PrintPreview;
