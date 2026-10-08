import { ArrowRight, Bell, CalendarDays, FileClock, MapPin, Zap } from "lucide-react";
import Link from "next/link";

const quickActions = [
  {
    title: "Report an outage",
    description: "Tell PowerSync when electricity service is interrupted in your area.",
    href: "/dashboard/report-outage",
    icon: Zap,
    tone: "bg-[var(--ps-primary-soft)] text-[var(--ps-primary)]",
  },
  {
    title: "View my reports",
    description: "Follow your previously reported outages and restoration progress.",
    href: "/dashboard/outages",
    icon: FileClock,
    tone: "bg-[var(--ps-lavender-soft)] text-[#7667BB]",
  },
  {
    title: "Check schedules",
    description: "See published load-shedding and planned service interruption schedules.",
    href: "/dashboard/schedules",
    icon: CalendarDays,
    tone: "bg-[var(--ps-warning-soft)] text-[var(--ps-warning)]",
  },
  {
    title: "Notifications",
    description: "Review important outage, schedule, restoration, and service updates.",
    href: "/dashboard/notifications",
    icon: Bell,
    tone: "bg-[var(--ps-sage-soft)] text-[var(--ps-success)]",
  },
];

export default function CustomerDashboardPage() {
  return (
    <div className="mx-auto w-full max-w-7xl">
      <section className="overflow-hidden rounded-[2rem] border border-[var(--ps-border)] bg-[var(--ps-surface)] p-6 sm:p-8">
        <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-[var(--ps-primary-soft)] px-3 py-1.5 text-xs font-bold tracking-[0.08em] text-[var(--ps-primary)] uppercase">
              <MapPin className="size-3.5" />
              Customer portal
            </div>

            <h1 className="mt-5 text-3xl font-bold tracking-[-0.04em] text-[var(--ps-text)] sm:text-4xl">
              Your power service, easier to follow.
            </h1>

            <p className="mt-4 max-w-xl text-sm leading-6 text-[var(--ps-text-muted)] sm:text-base sm:leading-7">
              Report electricity interruptions, monitor restoration activity, check published
              schedules, and keep important service information in one place.
            </p>
          </div>

          <Link
            href="/dashboard/report-outage"
            className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-xl bg-[var(--ps-primary)] px-5 text-sm font-semibold text-white transition-colors hover:bg-[var(--ps-primary-hover)] lg:self-auto"
          >
            Report an Outage
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      <section className="mt-6">
        <div>
          <p className="text-xs font-bold tracking-[0.12em] text-[var(--ps-primary)] uppercase">
            Quick access
          </p>

          <h2 className="mt-1 text-xl font-bold tracking-[-0.03em] text-[var(--ps-text)]">
            What would you like to do?
          </h2>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {quickActions.map((action) => {
            const Icon = action.icon;

            return (
              <Link
                key={action.href}
                href={action.href}
                className="group rounded-3xl border border-[var(--ps-border)] bg-[var(--ps-surface)] p-5 transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-1 hover:border-[var(--ps-border-strong)] hover:shadow-sm"
              >
                <div
                  className={`flex size-11 items-center justify-center rounded-2xl ${action.tone}`}
                >
                  <Icon className="size-5" />
                </div>

                <h3 className="mt-5 text-base font-bold text-[var(--ps-text)]">{action.title}</h3>

                <p className="mt-2 text-sm leading-6 text-[var(--ps-text-muted)]">
                  {action.description}
                </p>

                <div className="mt-5 flex items-center gap-2 text-xs font-bold text-[var(--ps-primary)]">
                  Open
                  <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
