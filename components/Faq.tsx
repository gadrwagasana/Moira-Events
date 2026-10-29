type FaqItem = { question: string; answer: string };

// Renders both the visible accordion AND its JSON-LD from one shared list,
// same principle as Breadcrumbs.tsx — the structured data can never claim
// something the page doesn't actually show. Native <details>/<summary>:
// no JavaScript, keyboard- and screen-reader-accessible by default.
export function Faq({ items }: { items: FaqItem[] }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="space-y-3">
        {items.map((item) => (
          <details key={item.question} className="group rounded-lg border border-espresso-100 bg-ivory-50 p-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-medium text-espresso-700 marker:content-none">
              {item.question}
              <span aria-hidden="true" className="text-espresso-500 transition-transform group-open:rotate-45">
                +
              </span>
            </summary>
            <p className="mt-3 text-sm text-ink-muted">{item.answer}</p>
          </details>
        ))}
      </div>
    </>
  );
}
