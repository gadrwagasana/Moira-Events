import Link from "next/link";
import { Logo } from "@/components/Logo";
import { siteConfig } from "@/lib/content/config";

// Shared branded content for every error/not-found boundary in the app
// (app/(site)/request-a-quote/error.tsx, app/error.tsx, app/global-error.tsx,
// app/not-found.tsx) — one place to keep the recovery links consistent
// rather than four slightly-different hand-rolled pages.
export function ErrorRecovery({
  title,
  message,
  onRetry,
}: {
  title: string;
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-ivory-100 px-6 text-center">
      <Logo className="h-12 w-auto" />
      <h1 className="mt-2 font-serif text-3xl text-espresso-700">{title}</h1>
      <p className="max-w-md text-ink/80">{message}</p>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
        {onRetry && (
          <button type="button" onClick={onRetry} className="btn-primary">
            Try again
          </button>
        )}
        <Link href="/" className="btn-secondary">
          Home
        </Link>
        <a
          href={`https://wa.me/${siteConfig.whatsappNumber}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary"
        >
          WhatsApp
        </a>
        <Link href="/contact" className="btn-secondary">
          Contact
        </Link>
      </div>
    </div>
  );
}
