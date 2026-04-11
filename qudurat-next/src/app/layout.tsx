import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? 'https://qudurat.com',
  ),
  title: {
    default: 'Qudurat — Enterprise Assessment Platform',
    template: '%s | Qudurat',
  },
  description:
    'Bilingual enterprise HR assessment platform for MENA. Cognitive, personality, behavioral, and skills testing with AI-powered insights.',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    type: 'website',
    siteName: 'Qudurat',
    images: ['/og-default.png'],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@qudurat',
  },
};

/**
 * Root layout.
 *
 * Intentionally minimal — delegates <html> and <body> setup to [locale]/layout.tsx
 * which has access to the locale for `lang` and `dir` attributes.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
