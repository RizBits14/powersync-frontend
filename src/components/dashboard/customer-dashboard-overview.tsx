"use client";

import { ArrowRight, Bell, CalendarDays, FileClock, MapPin, Zap } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
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

export function CustomerDashboardOverview() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="mx-auto w-full max-w-7xl">
      <motion.section
        initial={
          shouldReduceMotion
            ? false
            : {
                opacity: 0,
                y: 24,
              }
        }
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.55,
          ease: "easeOut",
        }}
        className="overflow-hidden rounded-[2rem] border border-[var(--ps-border)] bg-[var(--ps-surface)] p-6 sm:p-8"
      >
        <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
          <motion.div
            className="max-w-2xl"
            initial={
              shouldReduceMotion
                ? false
                : {
                    opacity: 0,
                    x: -18,
                  }
            }
            animate={{
              opacity: 1,
              x: 0,
            }}
            transition={{
              duration: 0.5,
              delay: 0.1,
              ease: "easeOut",
            }}
          >
            <motion.div
              initial={
                shouldReduceMotion
                  ? false
                  : {
                      opacity: 0,
                      scale: 0.95,
                    }
              }
              animate={{
                opacity: 1,
                scale: 1,
              }}
              transition={{
                duration: 0.4,
                delay: 0.16,
              }}
              className="inline-flex items-center gap-2 rounded-full bg-[var(--ps-primary-soft)] px-3 py-1.5 text-xs font-bold tracking-[0.08em] text-[var(--ps-primary)] uppercase"
            >
              <MapPin className="size-3.5" />
              Customer portal
            </motion.div>

            <h1 className="mt-5 text-3xl font-bold tracking-[-0.04em] text-[var(--ps-text)] sm:text-4xl">
              Your power service, easier to follow.
            </h1>

            <p className="mt-4 max-w-xl text-sm leading-6 text-[var(--ps-text-muted)] sm:text-base sm:leading-7">
              Report electricity interruptions, monitor restoration activity, check published
              schedules, and keep important service information in one place.
            </p>
          </motion.div>

          <motion.div
            initial={
              shouldReduceMotion
                ? false
                : {
                    opacity: 0,
                    x: 18,
                  }
            }
            animate={{
              opacity: 1,
              x: 0,
            }}
            transition={{
              duration: 0.5,
              delay: 0.2,
              ease: "easeOut",
            }}
            whileHover={
              shouldReduceMotion
                ? undefined
                : {
                    y: -2,
                  }
            }
            whileTap={
              shouldReduceMotion
                ? undefined
                : {
                    scale: 0.98,
                  }
            }
            className="self-start lg:self-auto"
          >
            <Link
              href="/dashboard/report-outage"
              className="group inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[var(--ps-primary)] px-5 text-sm font-semibold text-white transition-colors hover:bg-[var(--ps-primary-hover)]"
            >
              Report an Outage
              <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
          </motion.div>
        </div>
      </motion.section>

      <motion.section
        className="mt-7"
        initial={
          shouldReduceMotion
            ? false
            : {
                opacity: 0,
                y: 20,
              }
        }
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.5,
          delay: 0.2,
          ease: "easeOut",
        }}
      >
        <div>
          <p className="text-xs font-bold tracking-[0.12em] text-[var(--ps-primary)] uppercase">
            Quick access
          </p>

          <h2 className="mt-1 text-xl font-bold tracking-[-0.03em] text-[var(--ps-text)]">
            What would you like to do?
          </h2>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {quickActions.map((action, index) => {
            const Icon = action.icon;

            return (
              <motion.div
                key={action.href}
                initial={
                  shouldReduceMotion
                    ? false
                    : {
                        opacity: 0,
                        y: 24,
                        scale: 0.98,
                      }
                }
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: 1,
                }}
                transition={{
                  duration: 0.45,
                  delay: 0.28 + index * 0.07,
                  ease: "easeOut",
                }}
                whileHover={
                  shouldReduceMotion
                    ? undefined
                    : {
                        y: -5,
                      }
                }
              >
                <Link
                  href={action.href}
                  className="group flex h-full min-h-[250px] flex-col rounded-3xl border border-[var(--ps-border)] bg-[var(--ps-surface)] p-5 transition-[border-color,box-shadow] duration-200 hover:border-[var(--ps-border-strong)] hover:shadow-md"
                >
                  <motion.div
                    whileHover={
                      shouldReduceMotion
                        ? undefined
                        : {
                            rotate: -4,
                            scale: 1.06,
                          }
                    }
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 18,
                    }}
                    className={`flex size-11 items-center justify-center rounded-2xl ${action.tone}`}
                  >
                    <Icon className="size-5" />
                  </motion.div>

                  <h3 className="mt-5 text-base font-bold text-[var(--ps-text)]">{action.title}</h3>

                  <p className="mt-2 flex-1 text-sm leading-6 text-[var(--ps-text-muted)]">
                    {action.description}
                  </p>

                  <div className="mt-5 flex items-center gap-2 text-xs font-bold text-[var(--ps-primary)]">
                    Open
                    <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-1" />
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </motion.section>
    </div>
  );
}
