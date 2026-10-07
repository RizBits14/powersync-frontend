import { Clock3, Gauge, ShieldCheck, Users } from "lucide-react";

import { NumberTicker } from "@/components/ui/number-ticker";

const metrics = [
  {
    icon: Users,
    value: 3,
    suffix: "",
    label: "Connected roles",
    description: "Customer, Operator & Admin",
    tone: "primary",
  },
  {
    icon: Clock3,
    value: 30,
    suffix: " min",
    label: "Smart clustering window",
    description: "Related verified outage reports",
    tone: "peach",
  },
  {
    icon: Gauge,
    value: 100,
    suffix: "",
    label: "Restoration priority scale",
    description: "Explainable incident scoring",
    tone: "lavender",
  },
  {
    icon: ShieldCheck,
    value: 4,
    suffix: "",
    label: "Reliability risk levels",
    description: "Reliable through critical",
    tone: "sage",
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
      <div className="mx-auto grid w-full max-w-7xl divide-y divide-[var(--ps-border)] px-4 sm:grid-cols-2 sm:divide-x sm:divide-y-0 sm:px-6 lg:grid-cols-4 lg:px-8">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;

          return (
            <div
              key={metric.label}
              className="flex min-h-44 items-start gap-4 px-1 py-7 sm:px-6 lg:px-7"
            >
              <div
                className={`flex size-11 shrink-0 items-center justify-center rounded-2xl ${toneClasses[metric.tone]}`}
              >
                <Icon className="size-5" />
              </div>

              <div>
                <div className="text-3xl font-bold tracking-[-0.04em] text-[var(--ps-text)]">
                  <NumberTicker value={metric.value} suffix={metric.suffix} delay={index * 0.1} />
                </div>

                <p className="mt-2 text-sm font-bold text-[var(--ps-text)]">{metric.label}</p>

                <p className="mt-1 text-xs leading-5 text-[var(--ps-text-muted)]">
                  {metric.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
