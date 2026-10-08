import {
  ArrowRight,
  BellRing,
  CircleCheck,
  Clock3,
  MapPin,
  RadioTower,
  Zap,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface InsightItem {
  title: string;
  description: string;
  icon: LucideIcon;
  accent: string;
  soft: string;
}

const insights: InsightItem[] = [
  {
    title: "Know what happened",
    description:
      "Report an interruption and follow its status instead of wondering whether the problem has been recognized.",
    icon: MapPin,
    accent: "var(--ps-primary)",
    soft: "var(--ps-primary-soft)",
  },
  {
    title: "Know what is happening",
    description:
      "Follow outage progress as reports are reviewed, incidents are handled, and restoration work moves forward.",
    icon: RadioTower,
    accent: "var(--ps-lavender)",
    soft: "var(--ps-lavender-soft)",
  },
  {
    title: "Know when power returns",
    description:
      "Stay connected to restoration updates and receive important service information when conditions change.",
    icon: BellRing,
    accent: "var(--ps-success)",
    soft: "var(--ps-success-soft)",
  },
];

export function GridVisibilitySection() {
  return (
    <section
      id="features"
      className="border-b border-[var(--ps-border)] bg-[var(--ps-background-soft)] py-16 sm:py-20 lg:py-24"
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:gap-16">
          <GridImage />

          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--ps-border)] bg-[var(--ps-surface)] px-3 py-1.5 text-xs font-bold tracking-[0.08em] text-[var(--ps-primary)] uppercase">
              <Zap className="size-3.5" />
              Outage visibility
            </div>

            <h2 className="mt-5 max-w-xl text-3xl leading-tight font-bold tracking-[-0.04em] text-[var(--ps-text)] sm:text-4xl lg:text-[2.75rem]">
              Power outages are disruptive. Information should not be.
            </h2>

            <p className="mt-5 max-w-xl text-base leading-7 text-[var(--ps-text-muted)] sm:text-lg">
              PowerSync gives people a clearer view of what is happening during an outage, from the
              first report through restoration.
            </p>

            <div className="mt-8 space-y-4">
              {insights.map((insight) => (
                <InsightRow key={insight.title} insight={insight} />
              ))}
            </div>

            <div className="mt-8">
              <Link
                href="/register"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[var(--ps-primary)] px-5 text-sm font-semibold text-white transition-colors hover:bg-[var(--ps-primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ps-primary)] focus-visible:ring-offset-2"
              >
                Get started with PowerSync
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function GridImage() {
  return (
    <div className="relative">
      <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] border border-[var(--ps-border)] bg-[var(--ps-surface-muted)] sm:aspect-[5/4] lg:aspect-[4/5] xl:aspect-[5/4]">
        <Image
          src="https://images.unsplash.com/photo-1658870901700-9c0418787aa7?auto=format&fit=crop&q=85&w=1600"
          alt="Electric power grid infrastructure and transmission towers"
          fill
          sizes="(max-width: 1024px) 100vw, 55vw"
          className="object-cover"
        />

        <div className="absolute top-4 left-4 rounded-2xl border border-white/70 bg-white/95 px-4 py-3 shadow-sm sm:top-6 sm:left-6">
          <div className="flex items-center gap-2">
            <span className="relative flex size-2.5">
              <span className="absolute inline-flex size-full rounded-full bg-[var(--ps-success)] opacity-30" />
              <span className="relative inline-flex size-2.5 rounded-full bg-[var(--ps-success)]" />
            </span>

            <span className="text-xs font-bold text-[var(--ps-text)]">PowerSync connected</span>
          </div>
        </div>

        <div className="absolute right-4 bottom-4 left-4 rounded-2xl border border-white/70 bg-white/95 p-4 shadow-sm sm:right-6 sm:bottom-6 sm:left-6 sm:p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold tracking-[0.12em] text-[var(--ps-text-muted)] uppercase">
                Service visibility
              </p>

              <p className="mt-1 text-base font-bold text-[var(--ps-text)] sm:text-lg">
                Stay informed through every outage.
              </p>
            </div>

            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--ps-primary-soft)] text-[var(--ps-primary)]">
              <RadioTower className="size-5" />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <StatusItem icon={CircleCheck} label="Reported" />

            <StatusItem icon={Clock3} label="Tracked" />

            <StatusItem icon={Zap} label="Restored" />
          </div>
        </div>
      </div>

      <div className="absolute -right-3 -bottom-3 -z-10 size-28 rounded-[2rem] bg-[var(--ps-lavender-soft)] sm:-right-5 sm:-bottom-5 sm:size-36" />

      <div className="absolute -top-4 -left-4 -z-10 size-20 rounded-full bg-[var(--ps-sage-soft)] sm:-top-6 sm:-left-6 sm:size-28" />
    </div>
  );
}

interface InsightRowProps {
  insight: InsightItem;
}

function InsightRow({ insight }: InsightRowProps) {
  const Icon = insight.icon;

  return (
    <article className="flex gap-4 rounded-2xl border border-transparent p-3 transition-colors hover:border-[var(--ps-border)] hover:bg-[var(--ps-surface)] sm:p-4">
      <div
        className="flex size-11 shrink-0 items-center justify-center rounded-2xl"
        style={{
          backgroundColor: insight.soft,
          color: insight.accent,
        }}
      >
        <Icon className="size-5" />
      </div>

      <div>
        <h3 className="font-bold tracking-[-0.02em] text-[var(--ps-text)]">{insight.title}</h3>

        <p className="mt-1 text-sm leading-6 text-[var(--ps-text-muted)]">{insight.description}</p>
      </div>
    </article>
  );
}

interface StatusItemProps {
  icon: LucideIcon;
  label: string;
}

function StatusItem({ icon: Icon, label }: StatusItemProps) {
  return (
    <div className="rounded-xl bg-[var(--ps-background-soft)] px-2 py-2.5 text-center">
      <Icon className="mx-auto size-3.5 text-[var(--ps-primary)]" />

      <p className="mt-1.5 truncate text-[9px] font-bold text-[var(--ps-text-soft)] sm:text-[10px]">
        {label}
      </p>
    </div>
  );
}
