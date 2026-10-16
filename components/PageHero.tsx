import { ReactNode } from "react";

export function PageHero({
  eyebrow,
  title,
  support,
  children,
}: {
  eyebrow?: string;
  title: string;
  support?: string;
  children?: ReactNode;
}) {
  return (
    <section className="border-b border-espresso-100 bg-gradient-to-b from-ivory-200 to-ivory-100">
      <div className="section pb-14 pt-16 text-center md:pt-20">
        {eyebrow && <p className="label-eyebrow mb-4">{eyebrow}</p>}
        <h1 className="mx-auto max-w-3xl font-serif text-4xl leading-tight text-espresso-700 md:text-5xl">
          {title}
        </h1>
        {support && <p className="mx-auto mt-5 max-w-2xl text-base text-ink/70 md:text-lg">{support}</p>}
        {children && <div className="mt-8 flex justify-center">{children}</div>}
      </div>
    </section>
  );
}
