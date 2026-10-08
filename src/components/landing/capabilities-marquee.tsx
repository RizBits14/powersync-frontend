import {
  BellRing,
  CalendarClock,
  CreditCard,
  Gauge,
  MapPinned,
  RadioTower,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

import { Marquee } from "@/components/ui/marquee";

interface Capability {
  title: string;
  description: string;
  icon: LucideIcon;
  accent: string;
  soft: string;
}

const capabilities: Capability[] = [
  {
    title: "Outage Reporting",
    description:
      "Report power interruptions quickly and keep every issue connected to the right service area.",
    icon: MapPinned,
    accent: "var(--ps-primary)",
    soft: "var(--ps-primary-soft)",
  },
  {
    title: "Incident Tracking",
    description: "Follow an outage from verification through operator assignment and restoration.",
    icon: RadioTower,
    accent: "var(--ps-lavender)",
    soft: "var(--ps-lavender-soft)",
  },
  {
    title: "Load-Shedding Schedules",
    description:
      "See published outage schedules clearly and know when planned interruptions may affect you.",
    icon: CalendarClock,
    accent: "var(--ps-warning)",
    soft: "var(--ps-warning-soft)",
  },
  {
    title: "Smart Notifications",
    description:
      "Stay informed when important outage, restoration, schedule, and service updates happen.",
    icon: BellRing,
    accent: "var(--ps-peach)",
    soft: "var(--ps-peach-soft)",
  },
  {
    title: "Reliability Insights",
    description:
      "Understand outage frequency, restoration performance, and reliability trends across service areas.",
    icon: Gauge,
    accent: "var(--ps-success)",
    soft: "var(--ps-success-soft)",
  },
  {
    title: "Secure Billing",
    description:
      "Keep payment activity connected to your PowerSync account through a secure billing workflow.",
    icon: CreditCard,
    accent: "var(--ps-primary)",
    soft: "var(--ps-sky-soft)",
  },
  {
    title: "Protected Access",
    description:
      "Keep platform actions protected through authenticated and role-aware access controls.",
    icon: ShieldCheck,
    accent: "var(--ps-success)",
    soft: "var(--ps-sage-soft)",
  },
];

export function CapabilitiesMarquee() {
  return (
    <section
      id="features"
      className="overflow-hidden border-b border-[var(--ps-border)] bg-[var(--ps-background-soft)] py-16 sm:py-20 lg:py-24"
    >
      <div className="mx-auto mb-10 w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-xs font-bold tracking-[0.15em] text-[var(--ps-primary)] uppercase">
            Built for every outage
          </p>

          <h2 className="mt-3 text-3xl font-bold tracking-[-0.04em] text-[var(--ps-text)] sm:text-4xl lg:text-5xl">
            Everything you need to stay informed and respond faster.
          </h2>

          <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--ps-text-muted)] sm:text-lg">
            PowerSync brings outage reporting, restoration tracking, schedules, notifications,
            billing, and reliability insights into one connected experience.
          </p>
        </div>
      </div>

      <Marquee duration={34}>
        {capabilities.map((capability) => (
          <CapabilityCard key={capability.title} capability={capability} />
        ))}
      </Marquee>

      <div className="mt-4">
        <Marquee duration={38} reverse>
          {[...capabilities].reverse().map((capability) => (
            <CapabilityCard key={`reverse-${capability.title}`} capability={capability} compact />
          ))}
        </Marquee>
      </div>
    </section>
  );
}

interface CapabilityCardProps {
  capability: Capability;
  compact?: boolean;
}

function CapabilityCard({ capability, compact = false }: CapabilityCardProps) {
  const Icon = capability.icon;

  return (
    <article
      className={
        compact
          ? "w-[260px] shrink-0 rounded-2xl border border-[var(--ps-border)] bg-[var(--ps-surface)] p-4 sm:w-[290px]"
          : "w-[300px] shrink-0 rounded-3xl border border-[var(--ps-border)] bg-[var(--ps-surface)] p-5 sm:w-[340px]"
      }
    >
      <div className="flex items-start gap-4">
        <div
          className="flex size-11 shrink-0 items-center justify-center rounded-2xl"
          style={{
            backgroundColor: capability.soft,
            color: capability.accent,
          }}
        >
          <Icon className="size-5" />
        </div>

        <div className="min-w-0">
          <h3 className="text-base font-bold tracking-[-0.02em] text-[var(--ps-text)] sm:text-lg">
            {capability.title}
          </h3>

          {!compact ? (
            <p className="mt-2 text-sm leading-6 text-[var(--ps-text-muted)]">
              {capability.description}
            </p>
          ) : null}
        </div>
      </div>
    </article>
  );
}
