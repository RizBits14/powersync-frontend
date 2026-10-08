"use client";

import { motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import Link from "next/link";

export function RegisterVisual() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="relative hidden min-h-svh overflow-hidden bg-[var(--ps-surface-muted)] lg:block">
      <motion.div
        className="absolute inset-0"
        initial={
          shouldReduceMotion
            ? false
            : {
                scale: 1.06,
              }
        }
        animate={{
          scale: 1,
        }}
        transition={{
          duration: 1.6,
          ease: "easeOut",
        }}
      >
        <motion.div
          className="absolute inset-0"
          animate={
            shouldReduceMotion
              ? undefined
              : {
                  scale: [1, 1.025, 1],
                }
          }
          transition={{
            duration: 14,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <Image
            src="/auth/register-cover.jpg"
            alt="Electrical power infrastructure"
            fill
            priority
            sizes="50vw"
            className="object-cover"
          />
        </motion.div>
      </motion.div>

      <div className="absolute inset-0 bg-[#172033]/24" />

      <motion.div
        className="absolute top-8 left-8"
        initial={
          shouldReduceMotion
            ? false
            : {
                opacity: 0,
                y: -12,
              }
        }
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.5,
          delay: 0.3,
        }}
      >
        <motion.div
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
                  scale: 0.97,
                }
          }
        >
          <Link
            href="/"
            className="inline-flex min-h-10 items-center justify-center rounded-xl border border-white/60 bg-white/90 px-4 text-sm font-semibold text-[var(--ps-text)] transition-colors hover:bg-white"
          >
            Back to home
          </Link>
        </motion.div>
      </motion.div>

      <motion.div
        className="absolute right-8 bottom-8 left-8 xl:right-12 xl:bottom-12 xl:left-12"
        initial={
          shouldReduceMotion
            ? false
            : {
                opacity: 0,
                y: 36,
              }
        }
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.7,
          delay: 0.35,
          ease: "easeOut",
        }}
      >
        <motion.div
          whileHover={
            shouldReduceMotion
              ? undefined
              : {
                  y: -5,
                }
          }
          transition={{
            duration: 0.2,
          }}
          className="max-w-xl rounded-[1.75rem] border border-white/70 bg-white/92 p-6 shadow-sm xl:p-8"
        >
          <motion.p
            initial={shouldReduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{
              duration: 0.4,
              delay: 0.65,
            }}
            className="text-xs font-bold tracking-[0.14em] text-[var(--ps-primary)] uppercase"
          >
            PowerSync
          </motion.p>

          <motion.h1
            initial={
              shouldReduceMotion
                ? false
                : {
                    opacity: 0,
                    y: 10,
                  }
            }
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.45,
              delay: 0.72,
            }}
            className="mt-3 text-3xl leading-tight font-bold tracking-[-0.04em] text-[var(--ps-text)] xl:text-4xl"
          >
            Stay connected through every outage.
          </motion.h1>

          <motion.p
            initial={shouldReduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{
              duration: 0.45,
              delay: 0.8,
            }}
            className="mt-4 max-w-lg text-sm leading-6 text-[var(--ps-text-muted)] xl:text-base"
          >
            Create your PowerSync account to report interruptions, follow restoration activity, view
            schedules, and receive important service updates.
          </motion.p>
        </motion.div>
      </motion.div>
    </div>
  );
}
