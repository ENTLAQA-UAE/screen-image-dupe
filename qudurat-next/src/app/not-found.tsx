import Link from 'next/link';

export default function NotFound() {
  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-background p-6 font-sans">
        <div className="max-w-md text-center">
          <h1 className="text-6xl font-bold text-foreground">404</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Page not found. This URL may have been moved or doesn&apos;t exist.
          </p>
          <Link
            href="/"
            className="mt-6 inline-block rounded-lg bg-primary px-6 py-2 font-semibold text-primary-foreground hover:bg-primary-600"
          >
            Back to home
          </Link>
        </div>
      </body>
    </html>
  );
}
