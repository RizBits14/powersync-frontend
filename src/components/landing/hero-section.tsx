"use client";

import {
  Activity,
  AlertTriangle,
  ArrowDown,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  GitBranch,
  ShieldCheck,
  UserCheck,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useState } from "react";

import { TextBlurReveal } from "@/components/ui/text-blur-reveal";

interface WorkflowStep {
  id: string;
  number: string;
  shortLabel: string;
  title: string;
  description: string;
  source: string;
  action: string;
  result: string;
  icon: LucideIcon;
  accent: string;
  soft: string;
}

const workflowSteps: WorkflowStep[] = [
  {
    id: "report",
    number: "01",
    shortLabel: "Report",
    title: "Report an outage",
    description: "Customers report service interruptions with outage type and location context.",
    source: "Customer",
    action: "Outage report",
    result: "Pending review",
    icon: AlertTriangle,
    accent: "var(--ps-peach)",
    soft: "var(--ps-peach-soft)",
  },
  {
    id: "verify",
    number: "02",
    shortLabel: "Verify",
    title: "Verify the report",
    description: "PowerSync operators review incoming reports and confirm genuine outage events.",
    source: "Report queue",
    action: "Verification",
    result: "Verified",
    icon: CheckCircle2,
    accent: "var(--ps-success)",
    soft: "var(--ps-success-soft)",
  },
  {
    id: "cluster",
    number: "03",
    shortLabel: "Cluster",
    title: "Group related outages",
    description:
      "Verified reports from the same area and time window can be grouped into one incident.",
    source: "Verified reports",
    action: "Smart clustering",
    result: "Incident",
    icon: GitBranch,
    accent: "var(--ps-lavender)",
    soft: "var(--ps-lavender-soft)",
  },
  {
    id: "assign",
    number: "04",
    shortLabel: "Assign",
    title: "Assign an operator",
    description: "The incident is prioritized and assigned to an operator for restoration work.",
    source: "Incident",
    action: "Assignment",
    result: "Operator dispatched",
    icon: UserCheck,
    accent: "var(--ps-primary)",
    soft: "var(--ps-primary-soft)",
  },
  {
    id: "restore",
    number: "05",
    shortLabel: "Restore",
    title: "Track restoration",
    description: "Operators accept assignments, start work, and update restoration progress.",
    source: "Field operator",
    action: "Restoration",
    result: "Service restored",
    icon: Wrench,
    accent: "var(--ps-success)",
    soft: "var(--ps-sage-soft)",
  },
  {
    id: "analyze",
    number: "06",
    shortLabel: "Analyze",
    title: "Measure reliability",
    description: "Completed incidents feed operational analytics and area reliability insights.",
    source: "Incident data",
    action: "Analytics",
    result: "Reliability score",
    icon: BarChart3,
    accent: "var(--ps-primary)",
    soft: "var(--ps-sky-soft)",
  },
];

export function HeroSection() {
  return (
    <section className="relative overflow-hidden border-b border-[var(--ps-border)]">
      <div
        aria-hidden="true"
        className="absolute top-20 left-[6%] size-24 rounded-3xl bg-[var(--ps-lavender-soft)]"
      />

      <div
        aria-hidden="true"
        className="absolute right-[3%] bottom-12 size-28 rounded-full bg-[var(--ps-sage-soft)]"
      />

      <div className="relative mx-auto grid w-full max-w-7xl items-center gap-14 px-4 py-16 sm:px-6 sm:py-20 xl:grid-cols-[0.88fr_1.12fr] xl:gap-14 xl:px-8 xl:py-24">
        <HeroContent />
        <WorkflowAccordion />
      </div>
    </section>
  );
}

function HeroContent() {
  return (
    <div className="max-w-2xl">
      <h1 className="max-w-3xl text-4xl leading-[1.08] font-bold tracking-[-0.045em] text-[var(--ps-text)] sm:text-5xl lg:text-[3.55rem]">
        <TextBlurReveal text="PowerSync" className="mr-3 text-[var(--ps-primary)]" />
        keeps outages visible, coordinated, and accountable.
      </h1>

      <motion.p
        initial={{
          opacity: 0,
          y: 14,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.5,
          delay: 0.35,
        }}
        className="mt-6 max-w-xl text-base leading-7 text-[var(--ps-text-muted)] sm:text-lg sm:leading-8"
      >
        One connected platform for customers, operators, and administrators to report outages,
        coordinate restoration, follow load-shedding schedules, manage billing, and understand grid
        reliability.
      </motion.p>

      <motion.div
        initial={{
          opacity: 0,
          y: 14,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.5,
          delay: 0.45,
        }}
        className="mt-8 flex flex-col gap-3 sm:flex-row"
      >
        <Link
          href="/register"
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[var(--ps-primary)] px-6 text-sm font-semibold text-white transition-colors hover:bg-[var(--ps-primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ps-primary)] focus-visible:ring-offset-2"
        >
          Get Started
          <ArrowRight className="size-4" />
        </Link>

        <Link
          href="/#how-it-works"
          className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[var(--ps-border-strong)] bg-[var(--ps-surface)] px-6 text-sm font-semibold text-[var(--ps-text)] transition-colors hover:bg-[var(--ps-lavender-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ps-primary)]"
        >
          See How It Works
        </Link>
      </motion.div>

      <motion.div
        initial={{
          opacity: 0,
        }}
        animate={{
          opacity: 1,
        }}
        transition={{
          duration: 0.5,
          delay: 0.6,
        }}
        className="mt-8 flex flex-wrap gap-x-5 gap-y-3 text-sm font-medium text-[var(--ps-text-muted)]"
      >
        <span className="inline-flex items-center gap-2">
          <CheckCircle2 className="size-4 text-[var(--ps-success)]" />
          Real outage workflows
        </span>

        <span className="inline-flex items-center gap-2">
          <ShieldCheck className="size-4 text-[var(--ps-primary)]" />
          Role-based access
        </span>

        <span className="inline-flex items-center gap-2">
          <Activity className="size-4 text-[var(--ps-peach)]" />
          Reliability insights
        </span>
      </motion.div>
    </div>
  );
}

function WorkflowAccordion() {
  const [activeStep, setActiveStep] = useState<number | null>(0);

  function activateStep(index: number) {
    setActiveStep(index);
  }

  function toggleStep(index: number) {
    setActiveStep((current) => (current === index ? null : index));
  }

  function closeWorkflow() {
    setActiveStep(null);
  }

  return (
    <motion.div
      initial={{
        opacity: 0,
        x: 28,
      }}
      animate={{
        opacity: 1,
        x: 0,
      }}
      transition={{
        duration: 0.65,
        delay: 0.2,
        ease: "easeOut",
      }}
      className="min-w-0"
    >
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold tracking-[0.15em] text-[var(--ps-primary)] uppercase">
            From report to restoration
          </p>

          <h2 className="mt-1 text-xl font-bold tracking-[-0.03em] text-[var(--ps-text)] sm:text-2xl">
            See how PowerSync works
          </h2>
        </div>

        <p className="hidden text-xs font-medium text-[var(--ps-text-muted)] xl:block">
          Hover to explore
        </p>
      </div>

      <DesktopWorkflow
        activeStep={activeStep}
        onActivate={activateStep}
        onToggle={toggleStep}
        onClose={closeWorkflow}
      />

      <MobileWorkflow activeStep={activeStep} onToggle={toggleStep} />
    </motion.div>
  );
}

interface DesktopWorkflowProps {
  activeStep: number | null;
  onActivate: (index: number) => void;
  onToggle: (index: number) => void;
  onClose: () => void;
}

function DesktopWorkflow({ activeStep, onActivate, onToggle, onClose }: DesktopWorkflowProps) {
  return (
    <div className="hidden h-[610px] gap-2 xl:flex 2xl:h-[580px]" onMouseLeave={onClose}>
      {workflowSteps.map((step, index) => {
        const isActive = activeStep === index;
        const Icon = step.icon;

        return (
          <motion.button
            key={step.id}
            type="button"
            aria-expanded={isActive}
            onMouseEnter={() => onActivate(index)}
            onFocus={() => onActivate(index)}
            onClick={() => onToggle(index)}
            animate={{
              flexGrow: isActive ? 5.5 : 1,
            }}
            transition={{
              type: "spring",
              stiffness: 260,
              damping: 28,
            }}
            className="relative min-w-0 basis-0 overflow-hidden rounded-[1.4rem] border border-[var(--ps-border)] bg-[var(--ps-surface)] text-left outline-none focus-visible:ring-2 focus-visible:ring-[var(--ps-primary)]"
          >
            <div className="flex h-full min-w-0 flex-col p-3.5">
              <div className="flex shrink-0 items-center justify-between gap-2">
                <span className="text-[10px] font-bold tracking-[0.08em] text-[var(--ps-text-muted)]">
                  {step.number}
                </span>

                <div
                  className="flex size-9 shrink-0 items-center justify-center rounded-xl"
                  style={{
                    backgroundColor: step.soft,
                    color: step.accent,
                  }}
                >
                  <Icon className="size-4" />
                </div>
              </div>

              <AnimatePresence mode="wait" initial={false}>
                {isActive ? (
                  <motion.div
                    key="expanded"
                    initial={{
                      opacity: 0,
                      x: 12,
                    }}
                    animate={{
                      opacity: 1,
                      x: 0,
                    }}
                    exit={{
                      opacity: 0,
                      x: -8,
                    }}
                    transition={{
                      duration: 0.22,
                    }}
                    className="flex min-h-0 flex-1 flex-col"
                  >
                    <div className="mt-7">
                      <p className="text-xs font-bold tracking-[0.12em] text-[var(--ps-text-muted)] uppercase">
                        {step.shortLabel}
                      </p>

                      <h3 className="mt-2 text-xl leading-tight font-bold tracking-[-0.035em] text-[var(--ps-text)] xl:text-2xl">
                        {step.title}
                      </h3>

                      <p className="mt-3 max-w-sm text-sm leading-6 text-[var(--ps-text-muted)]">
                        {step.description}
                      </p>
                    </div>

                    <div className="mt-auto pt-5">
                      <DesktopWorkflowVisual step={step} />
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="collapsed"
                    initial={{
                      opacity: 0,
                    }}
                    animate={{
                      opacity: 1,
                    }}
                    exit={{
                      opacity: 0,
                    }}
                    className="flex min-h-0 flex-1 items-end justify-center pb-4"
                  >
                    <span
                      className="whitespace-nowrap text-xs font-bold tracking-[0.14em] text-[var(--ps-text-muted)] uppercase"
                      style={{
                        writingMode: "vertical-rl",
                        transform: "rotate(180deg)",
                      }}
                    >
                      {step.shortLabel}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {isActive ? (
              <motion.span
                layoutId="workflow-active-line"
                className="absolute bottom-0 left-0 h-1 w-full"
                style={{
                  backgroundColor: step.accent,
                }}
              />
            ) : null}
          </motion.button>
        );
      })}
    </div>
  );
}

interface MobileWorkflowProps {
  activeStep: number | null;
  onToggle: (index: number) => void;
}

function MobileWorkflow({ activeStep, onToggle }: MobileWorkflowProps) {
  return (
    <div className="xl:hidden">
      <p className="mb-3 text-sm font-medium text-[var(--ps-text-muted)]">
        Tap a step to open or close the workflow.
      </p>

      <div className="space-y-2">
        {workflowSteps.map((step, index) => {
          const isActive = activeStep === index;
          const Icon = step.icon;

          return (
            <div
              key={step.id}
              className="overflow-hidden rounded-2xl border border-[var(--ps-border)] bg-[var(--ps-surface)]"
            >
              <button
                type="button"
                aria-expanded={isActive}
                onClick={() => onToggle(index)}
                className="flex min-h-16 w-full items-center gap-3 px-4 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--ps-primary)]"
              >
                <span className="w-6 shrink-0 text-xs font-bold text-[var(--ps-text-muted)]">
                  {step.number}
                </span>

                <span
                  className="flex size-9 shrink-0 items-center justify-center rounded-xl"
                  style={{
                    backgroundColor: step.soft,
                    color: step.accent,
                  }}
                >
                  <Icon className="size-4" />
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-[var(--ps-text)]">
                    {step.title}
                  </span>

                  <span className="mt-0.5 block text-xs text-[var(--ps-text-muted)]">
                    {step.shortLabel}
                  </span>
                </span>

                <motion.span
                  animate={{
                    rotate: isActive ? 90 : 0,
                  }}
                  transition={{
                    duration: 0.2,
                  }}
                  className="text-[var(--ps-text-muted)]"
                >
                  <ArrowRight className="size-4" />
                </motion.span>
              </button>

              <AnimatePresence initial={false}>
                {isActive ? (
                  <motion.div
                    initial={{
                      opacity: 0,
                      height: 0,
                    }}
                    animate={{
                      opacity: 1,
                      height: "auto",
                    }}
                    exit={{
                      opacity: 0,
                      height: 0,
                    }}
                    transition={{
                      duration: 0.28,
                      ease: "easeInOut",
                    }}
                  >
                    <div className="border-t border-[var(--ps-border)] px-4 pt-4 pb-5">
                      <p className="text-sm leading-6 text-[var(--ps-text-muted)]">
                        {step.description}
                      </p>

                      <div className="mt-4">
                        <MobileWorkflowVisual step={step} />
                      </div>
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface WorkflowVisualProps {
  step: WorkflowStep;
}

function DesktopWorkflowVisual({ step }: WorkflowVisualProps) {
  const Icon = step.icon;

  return (
    <div
      className="rounded-2xl border border-[var(--ps-border)] p-4"
      style={{
        backgroundColor: step.soft,
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-bold tracking-[0.12em] text-[var(--ps-text-soft)] uppercase">
          Workflow preview
        </p>

        <div
          className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-[var(--ps-surface-elevated)]"
          style={{
            color: step.accent,
          }}
        >
          <Icon className="size-4" />
        </div>
      </div>

      <div className="mt-3 space-y-1.5">
        <FlowNode label="Source" value={step.source} />

        <VerticalFlowArrow />

        <FlowNode label="Action" value={step.action} active accent={step.accent} />

        <VerticalFlowArrow />

        <FlowNode label="Result" value={step.result} />
      </div>
    </div>
  );
}

function MobileWorkflowVisual({ step }: WorkflowVisualProps) {
  const Icon = step.icon;

  return (
    <div
      className="rounded-2xl border border-[var(--ps-border)] p-4"
      style={{
        backgroundColor: step.soft,
      }}
    >
      <div className="mb-5 flex items-center justify-between gap-3">
        <p className="text-[10px] font-bold tracking-[0.12em] text-[var(--ps-text-soft)] uppercase">
          Workflow preview
        </p>

        <div
          className="flex size-9 items-center justify-center rounded-xl bg-[var(--ps-surface-elevated)]"
          style={{
            color: step.accent,
          }}
        >
          <Icon className="size-4" />
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-[1fr_auto_1fr_auto_1fr] sm:items-center">
        <FlowNode label="Source" value={step.source} />

        <HorizontalFlowArrow />

        <FlowNode label="Action" value={step.action} active accent={step.accent} />

        <HorizontalFlowArrow />

        <FlowNode label="Result" value={step.result} />
      </div>
    </div>
  );
}

interface FlowNodeProps {
  label: string;
  value: string;
  active?: boolean;
  accent?: string;
}

function FlowNode({ label, value, active = false, accent }: FlowNodeProps) {
  return (
    <div
      className="min-w-0 rounded-xl border bg-[var(--ps-surface-elevated)] px-3 py-2.5"
      style={{
        borderColor: active ? accent : "var(--ps-border)",
      }}
    >
      <p className="text-[9px] font-bold tracking-[0.1em] text-[var(--ps-text-muted)] uppercase">
        {label}
      </p>

      <p className="mt-1 break-words text-xs font-bold text-[var(--ps-text)]">{value}</p>
    </div>
  );
}

function VerticalFlowArrow() {
  return (
    <div className="flex h-5 items-center justify-center text-[var(--ps-text-muted)]">
      <ArrowDown className="size-3.5" />
    </div>
  );
}

function HorizontalFlowArrow() {
  return (
    <div className="hidden items-center justify-center text-[var(--ps-text-muted)] sm:flex">
      <ArrowRight className="size-4" />
    </div>
  );
}
