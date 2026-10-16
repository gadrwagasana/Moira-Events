import { values } from "@/lib/content/company";

export function ValuesGrid() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
      {values.map((value, i) => (
        <div key={value.name} className="rounded-xl border border-espresso-100 bg-ivory-50 p-6 text-center shadow-sm">
          <span className="font-serif text-2xl text-espresso-300">{String(i + 1).padStart(2, "0")}</span>
          <h3 className="mt-2 font-serif text-xl text-espresso-700">{value.name}</h3>
          <p className="mt-2 text-sm text-ink/70">{value.description}</p>
        </div>
      ))}
    </div>
  );
}
