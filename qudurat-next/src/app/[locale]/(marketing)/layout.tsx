import type { ReactNode } from 'react';

import { MarketingFooter } from '@/components/layout/marketing-footer';
import { MarketingNavbar } from '@/components/layout/marketing-navbar';

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <MarketingNavbar />
      <main className="flex-1">{children}</main>
      <MarketingFooter />
    </div>
  );
}
