import { processSteps } from "@/lib/content/company";

export function ProcessSteps({ compact = false }: { compact?: boolean }) {
  const steps = compact ? processSteps.slice(0, 5) : processSteps;

  return (
    <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {steps.map((step) => (
        <li key={step.step} className="rounded-xl border border-espresso-100 bg-ivory-50 p-6 shadow-sm">
          <span className="font-serif text-3xl text-espresso-300">{step.step}</span>
          <h3 className="mt-3 font-serif text-lg text-espresso-700">{step.title}</h3>
          <p className="mt-2 text-sm text-ink/70">{step.description}</p>
        </li>
      ))}
    </ol>
  );
}
