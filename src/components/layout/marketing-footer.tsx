import { Link } from '@/lib/i18n/routing';

export function MarketingFooter() {
  return (
    <footer className="border-t border-border/40 bg-background">
      <div className="container py-12 md:py-16">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <div className="font-display text-xl font-bold">
              قدرات <span className="text-muted-foreground">·</span>{' '}
              <span className="text-primary">Qudurat</span>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Enterprise assessment platform built for the MENA region.
            </p>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold text-foreground">
              Product
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/features" className="hover:text-foreground">Features</Link></li>
              <li><Link href="/pricing" className="hover:text-foreground">Pricing</Link></li>
              <li><Link href="/docs" className="hover:text-foreground">Documentation</Link></li>
              <li><Link href="/changelog" className="hover:text-foreground">Changelog</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold text-foreground">
              Company
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/about" className="hover:text-foreground">About</Link></li>
              <li><Link href="/blog" className="hover:text-foreground">Blog</Link></li>
              <li><Link href="/customers" className="hover:text-foreground">Customers</Link></li>
              <li><Link href="/contact" className="hover:text-foreground">Contact</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold text-foreground">
              Legal
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/terms" className="hover:text-foreground">Terms</Link></li>
              <li><Link href="/privacy" className="hover:text-foreground">Privacy</Link></li>
              <li><Link href="/dpa" className="hover:text-foreground">DPA</Link></li>
              <li><Link href="/cookies" className="hover:text-foreground">Cookies</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-border/40 pt-8 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Qudurat. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
