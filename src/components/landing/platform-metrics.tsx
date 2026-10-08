import { Clock3, Gauge, ShieldCheck, Users } from "lucide-react";
import Image from "next/image";

import { NumberTicker } from "@/components/ui/number-ticker";

const metrics = [
  {
    icon: Users,
    value: 3,
    suffix: "",
    label: "Connected roles",
    description: "Customer, Operator & Admin",
    tone: "primary",
    image: "/metrics/roles.jpg",
    imageAlt: "People connected through a digital service platform",
  },
  {
    icon: Clock3,
    value: 30,
    suffix: " min",
    label: "Smart clustering window",
    description: "Related verified outage reports",
    tone: "peach",
    image: "/metrics/clustering.jpg",
    imageAlt: "Electricity transmission and outage infrastructure",
  },
  {
    icon: Gauge,
    value: 100,
    suffix: "",
    label: "Restoration priority scale",
    description: "Explainable incident scoring",
    tone: "lavender",
    image: "/metrics/priority.jpg",
    imageAlt: "Power infrastructure monitored for restoration priority",
  },
  {
    icon: ShieldCheck,
    value: 4,
    suffix: "",
    label: "Reliability risk levels",
    description: "Reliable through critical",
    tone: "sage",
    image: "/metrics/reliability.jpg",
    imageAlt: "Reliable electrical grid infrastructure",
  },
] as const;

const toneClasses = {
  primary: "bg-[var(--ps-primary-soft)] text-[var(--ps-primary)]",
  peach: "bg-[var(--ps-peach-soft)] text-[#C87355]",
  lavender: "bg-[var(--ps-lavender-soft)] text-[#7667BB]",
  sage: "bg-[var(--ps-sage-soft)] text-[var(--ps-success)]",
};

export function PlatformMetrics() {
  return (
    <section className="border-b border-[var(--ps-border)] bg-[var(--ps-surface)]">
      <div className="mx-auto grid w-full max-w-7xl gap-3 px-4 py-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;

          return (
            <article
              key={metric.label}
              className="group relative min-h-[220px] overflow-hidden rounded-3xl border border-[var(--ps-border)]"
            >
              <Image
                src={metric.image}
                alt={metric.imageAlt}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
              />

              <div className="absolute inset-0 bg-white/20" />

              <div className="absolute inset-x-0 bottom-0 h-[42%] bg-[var(--ps-surface)]/90" />

              <div className="relative flex min-h-[220px] flex-col justify-between p-5">
                <div className="flex items-start justify-between gap-4">
                  <div
                    className={`flex size-11 shrink-0 items-center justify-center rounded-2xl border border-white/70 shadow-sm ${toneClasses[metric.tone]}`}
                  >
                    <Icon className="size-5" />
                  </div>
                </div>

                <div>
                  <div className="text-3xl font-bold tracking-[-0.04em] text-[var(--ps-text)] sm:text-4xl">
                    <NumberTicker
                      value={metric.value}
                      suffix={metric.suffix}
                      delay={index * 0.1}
                    />
                  </div>

                  <p className="mt-2 text-sm font-bold text-[var(--ps-text)]">
                    {metric.label}
                  </p>

                  <p className="mt-1 text-xs leading-5 text-[var(--ps-text-muted)]">
                    {metric.description}
                  </p>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}