import Link from "next/link";

// Catches notFound() calls from any page under app/admin/(dashboard) (e.g.
// an enquiry/quote/booking id that doesn't exist) while keeping the
// dashboard layout — and its sidebar — mounted, instead of falling through
// to the public-site app/not-found.tsx.
export default function AdminDashboardNotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 rounded-xl border border-espresso-100 bg-ivory-50 p-10 text-center">
      <h1 className="font-serif text-xl text-espresso-700">Not found</h1>
      <p className="max-w-md text-sm text-ink/60">This record doesn&rsquo;t exist, or may have been removed.</p>
      <Link href="/admin/enquiries" className="btn-primary">
        Back to Dashboard
      </Link>
    </div>
  );
}
