import { Building2, FileText, Languages } from 'lucide-react';
import { notFound } from 'next/navigation';

import { AssessmentRegistrationForm } from '@/app/assess/[token]/registration-form';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { createAdminClient } from '@/lib/supabase/server';

interface AssessmentPreview {
  groupId: string;
  groupName: string;
  organizationName: string;
  assessmentTitle: string;
  assessmentDescription: string | null;
  assessmentType: string;
  language: 'en' | 'ar';
  questionCount: number;
  deadline: string | null;
}

async function getAssessmentPreview(
  token: string,
): Promise<AssessmentPreview | null> {
  const supabase = createAdminClient();

  const { data: group } = await supabase
    .from('assessment_groups')
    .select(
      `
      id,
      name,
      end_date,
      is_active,
      organizations!inner(name),
      assessments!inner(id, title, description, type, language, questions(count))
    `,
    )
    .eq('group_link_token', token)
    .maybeSingle();

  if (!group) return null;

  const g = group as unknown as {
    id: string;
    name: string;
    end_date: string | null;
    is_active: boolean | null;
    organizations: { name: string };
    assessments: {
      id: string;
      title: string;
      description: string | null;
      type: string;
      language: string | null;
      questions?: { count: number }[];
    };
  };

  if (!g.is_active) {
    return null;
  }

  return {
    groupId: g.id,
    groupName: g.name,
    organizationName: g.organizations.name,
    assessmentTitle: g.assessments.title,
    assessmentDescription: g.assessments.description,
    assessmentType: g.assessments.type,
    language: (g.assessments.language ?? 'en') as 'en' | 'ar',
    questionCount: g.assessments.questions?.[0]?.count ?? 0,
    deadline: g.end_date,
  };
}

export default async function TakeAssessmentPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  if (!token || token.length < 8) {
    notFound();
  }

  const preview = await getAssessmentPreview(token);
  if (!preview) {
    notFound();
  }

  const dir = preview.language === 'ar' ? 'rtl' : 'ltr';
  const isRtl = dir === 'rtl';

  return (
    <div
      dir={dir}
      className={`flex min-h-screen flex-col bg-gradient-to-b from-background via-background to-primary-50/20 ${isRtl ? 'font-arabic' : ''}`}
    >
      {/* Header */}
      <header className="border-b border-border/40 bg-card/50 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-muted-foreground" />
            <span className="font-medium">{preview.organizationName}</span>
          </div>
          <div className="text-sm font-display font-bold text-primary">
            Qudurat
          </div>
        </div>
      </header>

      {/* Welcome content */}
      <main className="flex flex-1 items-center justify-center p-6">
        <Card className="w-full max-w-2xl shadow-xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <FileText className="h-8 w-8" />
            </div>
            <CardTitle className="text-3xl">
              {preview.assessmentTitle}
            </CardTitle>
            {preview.assessmentDescription && (
              <CardDescription className="mt-3 text-base">
                {preview.assessmentDescription}
              </CardDescription>
            )}
            <div className="mt-4 flex items-center justify-center gap-2">
              <Badge variant="outline" className="capitalize">
                {preview.assessmentType}
              </Badge>
              <Badge variant="outline" className="uppercase">
                <Languages className="h-3 w-3" />
                {preview.language}
              </Badge>
              <Badge variant="outline">
                {preview.questionCount} questions
              </Badge>
            </div>
          </CardHeader>

          <CardContent>
            <div className="mb-6 rounded-lg border border-border bg-muted/30 p-4 text-sm">
              <h3 className="mb-2 font-semibold">
                {isRtl ? 'قبل أن تبدأ' : 'Before you begin'}
              </h3>
              <ul
                className={`space-y-1.5 text-muted-foreground ${isRtl ? 'list-inside' : ''}`}
              >
                <li>
                  {isRtl
                    ? '• تأكد من اتصال إنترنت مستقر'
                    : '• Make sure you have a stable internet connection'}
                </li>
                <li>
                  {isRtl
                    ? '• أجب على كل الأسئلة بصدق ودقة'
                    : '• Answer all questions honestly and carefully'}
                </li>
                <li>
                  {isRtl
                    ? '• يمكنك الانتقال بين الأسئلة قبل التسليم'
                    : '• You can navigate between questions before submitting'}
                </li>
                <li>
                  {isRtl
                    ? '• إجاباتك سرية ولن تتم مشاركتها خارج مؤسستك'
                    : '• Your answers are confidential and will only be shared with your organization'}
                </li>
              </ul>
            </div>

            <AssessmentRegistrationForm
              groupToken={token}
              language={preview.language}
            />
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-card/30 py-4">
        <div className="container text-center text-xs text-muted-foreground">
          {isRtl ? 'مدعوم بواسطة' : 'Powered by'}{' '}
          <span className="font-semibold text-primary">Qudurat</span>
        </div>
      </footer>
    </div>
  );
}
