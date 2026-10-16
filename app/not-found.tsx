import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-ivory-100 px-6 text-center">
      <p className="label-eyebrow">404</p>
      <h1 className="font-serif text-3xl text-espresso-700">Page Not Found</h1>
      <p className="max-w-md text-ink/70">
        The page you&rsquo;re looking for doesn&rsquo;t exist or may have moved.
      </p>
      <Link href="/" className="btn-primary mt-2">
        Back to Home
      </Link>
    </div>
  );
}
