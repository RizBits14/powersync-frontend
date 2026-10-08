import {
  Activity,
  ArrowRight,
  CircleCheck,
  Eye,
  Gauge,
  ShieldAlert,
  ShieldCheck,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";

interface ReliabilityLevel {
  label: string;
  description: string;
  icon: LucideIcon;
  background: string;
  color: string;
}

const reliabilityLevels: ReliabilityLevel[] = [
  {
    label: "Reliable",
    description: "Stable service performance",
    icon: CircleCheck,
    background: "var(--ps-success-soft)",
    color: "var(--ps-success)",
  },
  {
    label: "Watch",
    description: "Performance needs attention",
    icon: Eye,
    background: "var(--ps-sky-soft)",
    color: "var(--ps-primary)",
  },
  {
    label: "High Risk",
    description: "Repeated reliability concerns",
    icon: TriangleAlert,
    background: "var(--ps-warning-soft)",
    color: "var(--ps-warning)",
  },
  {
    label: "Critical",
    description: "Immediate reliability concern",
    icon: ShieldAlert,
    background: "var(--ps-danger-soft)",
    color: "var(--ps-danger)",
  },
];

export function ReliabilitySection() {
  return (
    <section
      id="reliability"
      className="border-b border-[var(--ps-border)] bg-[var(--ps-background)] py-16 sm:py-20 lg:py-24"
    >
      <div className="mx-auto grid w-full max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16 lg:px-8">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--ps-border)] bg-[var(--ps-surface)] px-3 py-1.5 text-xs font-bold tracking-[0.08em] text-[var(--ps-primary)] uppercase">
            <Activity className="size-3.5" />
            Reliability intelligence
          </div>

          <h2 className="mt-5 max-w-xl text-3xl leading-tight font-bold tracking-[-0.04em] text-[var(--ps-text)] sm:text-4xl lg:text-[2.8rem]">
            Turn outage activity into clearer reliability insight.
          </h2>

          <p className="mt-5 max-w-xl text-base leading-7 text-[var(--ps-text-muted)] sm:text-lg">
            PowerSync helps turn incident history, restoration activity, and service interruptions
            into information that is easier to understand and act on.
          </p>

          <div className="mt-8 space-y-4">
            <FeatureRow
              icon={Gauge}
              title="Restoration priority"
              description="Incidents can be ranked using an explainable priority score from 0 to 100."
              tone="primary"
            />

            <FeatureRow
              icon={ShieldCheck}
              title="Reliability classification"
              description="Service areas can be categorized from Reliable through Critical."
              tone="sage"
            />

            <FeatureRow
              icon={Activity}
              title="Operational visibility"
              description="Reliability information stays connected to outage and restoration activity."
              tone="lavender"
            />
          </div>

          <Link
            href="/register"
            className="mt-8 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[var(--ps-border-strong)] bg-[var(--ps-surface)] px-5 text-sm font-semibold text-[var(--ps-text)] transition-colors hover:bg-[var(--ps-primary-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ps-primary)]"
          >
            Explore PowerSync
            <ArrowRight className="size-4" />
          </Link>
        </div>

        <ReliabilityPreview />
      </div>
    </section>
  );
}

function ReliabilityPreview() {
  return (
    <div className="rounded-[2rem] border border-[var(--ps-border)] bg-[var(--ps-surface)] p-4 shadow-sm sm:p-6">
      <div className="flex flex-col justify-between gap-4 border-b border-[var(--ps-border)] pb-5 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-bold tracking-[0.12em] text-[var(--ps-primary)] uppercase">
            Service intelligence
          </p>

          <h3 className="mt-1 text-xl font-bold tracking-[-0.03em] text-[var(--ps-text)]">
            Reliability overview
          </h3>
        </div>

        <div className="inline-flex items-center gap-2 rounded-full bg-[var(--ps-success-soft)] px-3 py-1.5 text-xs font-bold text-[var(--ps-success)]">
          <span className="size-2 rounded-full bg-[var(--ps-success)]" />
          Live framework
        </div>
      </div>

      <div className="mt-6 rounded-3xl border border-[var(--ps-border)] bg-[var(--ps-background-soft)] p-5">
        <div className="flex items-start justify-between gap-5">
          <div>
            <p className="text-xs font-bold tracking-[0.1em] text-[var(--ps-text-muted)] uppercase">
              Restoration priority
            </p>

            <p className="mt-2 text-3xl font-bold tracking-[-0.04em] text-[var(--ps-text)]">
              0–100
            </p>

            <p className="mt-1 text-sm text-[var(--ps-text-muted)]">
              Explainable incident priority scale
            </p>
          </div>

          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--ps-primary-soft)] text-[var(--ps-primary)]">
            <Gauge className="size-6" />
          </div>
        </div>

        <div className="mt-6 grid grid-cols-10 gap-1.5">
          {Array.from({ length: 10 }).map((_, index) => (
            <div
              key={index}
              className="h-2 rounded-full"
              style={{
                backgroundColor:
                  index < 3
                    ? "var(--ps-success)"
                    : index < 6
                      ? "var(--ps-primary)"
                      : index < 8
                        ? "var(--ps-warning)"
                        : "var(--ps-danger)",
              }}
            />
          ))}
        </div>

        <div className="mt-2 flex justify-between text-[10px] font-bold text-[var(--ps-text-muted)]">
          <span>Lower priority</span>
          <span>Higher priority</span>
        </div>
      </div>

      <div className="mt-5">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-bold text-[var(--ps-text)]">Reliability levels</p>

          <span className="text-xs font-medium text-[var(--ps-text-muted)]">4 levels</span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {reliabilityLevels.map((level) => {
            const Icon = level.icon;

            return (
              <article
                key={level.label}
                className="group rounded-2xl border border-[var(--ps-border)] bg-[var(--ps-surface-elevated)] p-4 transition-transform duration-200 hover:-translate-y-1"
              >
                <div className="flex items-start gap-3">
                  <div
                    className="flex size-10 shrink-0 items-center justify-center rounded-xl"
                    style={{
                      backgroundColor: level.background,
                      color: level.color,
                    }}
                  >
                    <Icon className="size-4.5" />
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-[var(--ps-text)]">{level.label}</h4>

                    <p className="mt-1 text-xs leading-5 text-[var(--ps-text-muted)]">
                      {level.description}
                    </p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}

interface FeatureRowProps {
  icon: LucideIcon;
  title: string;
  description: string;
  tone: "primary" | "sage" | "lavender";
}

const featureToneClasses = {
  primary: "bg-[var(--ps-primary-soft)] text-[var(--ps-primary)]",
  sage: "bg-[var(--ps-sage-soft)] text-[var(--ps-success)]",
  lavender: "bg-[var(--ps-lavender-soft)] text-[#7667BB]",
};

function FeatureRow({ icon: Icon, title, description, tone }: FeatureRowProps) {
  return (
    <div className="flex gap-4">
      <div
        className={`flex size-11 shrink-0 items-center justify-center rounded-2xl ${featureToneClasses[tone]}`}
      >
        <Icon className="size-5" />
      </div>

      <div>
        <h3 className="font-bold text-[var(--ps-text)]">{title}</h3>

        <p className="mt-1 max-w-md text-sm leading-6 text-[var(--ps-text-muted)]">{description}</p>
      </div>
    </div>
  );
}
