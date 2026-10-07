import { Activity, ArrowRight } from "lucide-react";

import { ScrollVelocity } from "@/components/ui/scroll-velocity";

const restorationFlow = "REPORT THE OUTAGE, TRACK THE RESPONSE, AND KNOW WHEN POWER IS BACK.";

const platformFlow = "FASTER UPDATES, CLEARER ACTIONS, AND LESS UNCERTAINTY DURING EVERY OUTAGE.";

export function OperationalFlowStrip() {
  return (
    <section
      id="how-it-works"
      className="overflow-hidden border-b border-[var(--ps-border)] bg-[var(--ps-background)] py-16 sm:py-20"
    >
      <div className="mx-auto mb-10 w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[var(--ps-border)] bg-[var(--ps-surface)] px-3 py-1.5 text-xs font-bold tracking-[0.08em] text-[var(--ps-primary)] uppercase">
              <Activity className="size-3.5" />
              Operational flow
            </div>

            <h2 className="text-3xl font-bold tracking-[-0.04em] text-[var(--ps-text)] sm:text-4xl">
              One workflow from outage report to reliability insight.
            </h2>

            <p className="mt-4 max-w-xl text-base leading-7 text-[var(--ps-text-muted)]">
              Every PowerSync action connects to the next, creating a traceable flow between
              customers, operators, administrators, incidents, and restoration outcomes.
            </p>
          </div>

          <div className="hidden items-center gap-2 text-sm font-semibold text-[var(--ps-text-muted)] md:flex">
            Scroll to accelerate
            <ArrowRight className="size-4" />
          </div>
        </div>
      </div>

      <div className="border-y border-[var(--ps-border)] bg-[var(--ps-surface)] py-5">
        <ScrollVelocity
          text={restorationFlow}
          defaultVelocity={2.5}
          className="text-2xl text-[var(--ps-primary)] sm:text-3xl lg:text-4xl"
        />
      </div>

      <div className="border-b border-[var(--ps-border)] bg-[var(--ps-primary-soft)] py-4">
        <ScrollVelocity
          text={platformFlow}
          defaultVelocity={1.8}
          direction={-1}
          className="text-sm text-[var(--ps-text-soft)] sm:text-base lg:text-lg"
        />
      </div>

      <div className="mx-auto mt-8 flex w-full max-w-7xl justify-center px-4 sm:px-6 lg:px-8">
        <p className="max-w-2xl text-center text-sm leading-6 text-[var(--ps-text-muted)]">
          Scroll faster or reverse direction to see the operational stream respond in real time.
        </p>
      </div>
    </section>
  );
}
