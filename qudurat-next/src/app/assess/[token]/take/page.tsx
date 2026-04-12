import { notFound } from 'next/navigation';

import { TakeAssessmentBootstrap } from '@/app/assess/[token]/take/take-assessment-bootstrap';

/**
 * Public assessment taker — question-by-question flow.
 *
 * This is a Server Component that renders a client bootstrap. The actual
 * bundle fetch happens client-side because we need the participantId from
 * sessionStorage (set by the registration form in the parent route).
 */
export default async function TakeAssessmentFlowPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  if (!token || token.length < 8) {
    notFound();
  }

  return <TakeAssessmentBootstrap token={token} />;
}
