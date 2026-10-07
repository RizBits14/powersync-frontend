"use client";

import { AnimatePresence, motion } from "motion/react";
import { Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navigationItems = [
  {
    label: "Home",
    href: "/",
  },
  {
    label: "Features",
    href: "/#features",
  },
  {
    label: "How It Works",
    href: "/#how-it-works",
  },
  {
    label: "Reliability",
    href: "/#reliability",
  },
  {
    label: "About",
    href: "/#about",
  },
] as const;

export function SiteNavbar() {
  const pathname = usePathname();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeItem, setActiveItem] = useState(pathname === "/about" ? "About" : "Home");

  function handleNavigation(label: string) {
    setActiveItem(label);
    setIsMenuOpen(false);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--ps-border)] bg-[var(--ps-surface)]">
      <div className="mx-auto flex min-h-20 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Brand onNavigate={() => handleNavigation("Home")} />

        <DesktopNavigation activeItem={activeItem} onNavigate={handleNavigation} />

        <DesktopActions />

        <MobileMenuButton
          isOpen={isMenuOpen}
          onToggle={() => setIsMenuOpen((current) => !current)}
        />
      </div>

      <MobileNavigation
        isOpen={isMenuOpen}
        activeItem={activeItem}
        onNavigate={handleNavigation}
        onClose={() => setIsMenuOpen(false)}
      />
    </header>
  );
}

interface BrandProps {
  onNavigate: () => void;
}

function Brand({ onNavigate }: BrandProps) {
  return (
    <motion.div
      initial={{
        opacity: 0,
        x: -16,
      }}
      animate={{
        opacity: 1,
        x: 0,
      }}
      transition={{
        duration: 0.45,
        ease: "easeOut",
      }}
    >
      <Link
        href="/"
        aria-label="PowerSync home"
        onClick={onNavigate}
        className="group flex items-center gap-3 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-[var(--ps-primary)] focus-visible:ring-offset-4 focus-visible:ring-offset-[var(--ps-surface)]"
      >
        <motion.div
          whileHover={{
            rotate: -4,
            scale: 1.06,
          }}
          whileTap={{
            scale: 0.95,
          }}
          transition={{
            type: "spring",
            stiffness: 320,
            damping: 20,
          }}
          className="shrink-0"
        >
          <Image
            src="/powersync-icon.png"
            alt=""
            width={44}
            height={44}
            priority
            className="size-11 rounded-xl object-contain sm:size-12"
          />
        </motion.div>

        <div className="flex min-w-0 flex-col">
          <span className="text-xl font-bold tracking-[-0.035em] text-[var(--ps-text)] sm:text-2xl">
            Power
            <span className="text-[var(--ps-primary)]">Sync</span>
          </span>

          <span className="mt-0.5 hidden whitespace-nowrap text-[8px] font-semibold tracking-[0.18em] text-[var(--ps-text-muted)] uppercase sm:block">
            Outage information. Faster solutions.
          </span>
        </div>
      </Link>
    </motion.div>
  );
}

interface DesktopNavigationProps {
  activeItem: string;
  onNavigate: (label: string) => void;
}

function DesktopNavigation({ activeItem, onNavigate }: DesktopNavigationProps) {
  return (
    <motion.nav
      initial={{
        opacity: 0,
        y: -10,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration: 0.45,
        delay: 0.08,
      }}
      aria-label="Primary navigation"
      className="hidden items-center rounded-2xl border border-[var(--ps-border)] bg-[var(--ps-surface-muted)] p-1 lg:flex"
    >
      {navigationItems.map((item) => {
        const isActive = activeItem === item.label;

        return (
          <Link
            key={item.label}
            href={item.href}
            onClick={() => onNavigate(item.label)}
            className="relative rounded-xl px-4 py-2 text-sm font-semibold outline-none focus-visible:ring-2 focus-visible:ring-[var(--ps-primary)]"
          >
            {isActive ? (
              <motion.span
                layoutId="powersync-desktop-navigation"
                className="absolute inset-0 rounded-xl bg-[var(--ps-primary)]"
                transition={{
                  type: "spring",
                  stiffness: 360,
                  damping: 30,
                }}
              />
            ) : null}

            <span
              className={`relative z-10 transition-colors duration-200 ${
                isActive ? "text-white" : "text-[var(--ps-text-muted)] hover:text-[var(--ps-text)]"
              }`}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </motion.nav>
  );
}

function DesktopActions() {
  return (
    <motion.div
      initial={{
        opacity: 0,
        x: 16,
      }}
      animate={{
        opacity: 1,
        x: 0,
      }}
      transition={{
        duration: 0.45,
        delay: 0.12,
      }}
      className="hidden items-center gap-3 lg:flex"
    >
      <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}>
        <Link
          href="/login"
          className="inline-flex h-10 items-center justify-center rounded-xl border border-[var(--ps-border-strong)] bg-[var(--ps-surface-elevated)] px-5 text-sm font-semibold text-[var(--ps-text)] transition-colors duration-200 hover:border-[var(--ps-lavender)] hover:bg-[var(--ps-lavender-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ps-primary)] focus-visible:ring-offset-2"
        >
          Sign In
        </Link>
      </motion.div>

      <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}>
        <Link
          href="/register"
          className="inline-flex h-10 items-center justify-center rounded-xl bg-[var(--ps-primary)] px-5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-[var(--ps-primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ps-primary)] focus-visible:ring-offset-2"
        >
          Get Started
        </Link>
      </motion.div>
    </motion.div>
  );
}

interface MobileMenuButtonProps {
  isOpen: boolean;
  onToggle: () => void;
}

function MobileMenuButton({ isOpen, onToggle }: MobileMenuButtonProps) {
  return (
    <motion.button
      type="button"
      whileTap={{
        scale: 0.92,
      }}
      aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
      aria-expanded={isOpen}
      aria-controls="mobile-navigation"
      onClick={onToggle}
      className="relative inline-flex size-11 items-center justify-center rounded-xl border border-[var(--ps-border-strong)] bg-[var(--ps-surface-muted)] text-[var(--ps-text)] transition-colors duration-200 hover:bg-[var(--ps-lavender-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ps-primary)] lg:hidden"
    >
      <AnimatePresence mode="wait" initial={false}>
        {isOpen ? (
          <motion.span
            key="close"
            initial={{
              opacity: 0,
              rotate: -90,
              scale: 0.7,
            }}
            animate={{
              opacity: 1,
              rotate: 0,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              rotate: 90,
              scale: 0.7,
            }}
            transition={{
              duration: 0.18,
            }}
          >
            <X aria-hidden="true" className="size-5" />
          </motion.span>
        ) : (
          <motion.span
            key="menu"
            initial={{
              opacity: 0,
              rotate: 90,
              scale: 0.7,
            }}
            animate={{
              opacity: 1,
              rotate: 0,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              rotate: -90,
              scale: 0.7,
            }}
            transition={{
              duration: 0.18,
            }}
          >
            <Menu aria-hidden="true" className="size-5" />
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

interface MobileNavigationProps {
  isOpen: boolean;
  activeItem: string;
  onNavigate: (label: string) => void;
  onClose: () => void;
}

function MobileNavigation({ isOpen, activeItem, onNavigate, onClose }: MobileNavigationProps) {
  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          id="mobile-navigation"
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
            duration: 0.3,
            ease: "easeInOut",
          }}
          className="overflow-hidden border-t border-[var(--ps-border)] bg-[var(--ps-surface)] lg:hidden"
        >
          <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6">
            <nav aria-label="Mobile navigation" className="flex flex-col gap-1.5">
              {navigationItems.map((item, index) => {
                const isActive = activeItem === item.label;

                return (
                  <motion.div
                    key={item.label}
                    initial={{
                      opacity: 0,
                      x: -12,
                    }}
                    animate={{
                      opacity: 1,
                      x: 0,
                    }}
                    transition={{
                      duration: 0.24,
                      delay: index * 0.045,
                    }}
                  >
                    <Link
                      href={item.href}
                      onClick={() => onNavigate(item.label)}
                      className={`flex min-h-11 items-center rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ps-primary)] ${
                        isActive
                          ? "bg-[var(--ps-primary)] text-white"
                          : "text-[var(--ps-text-muted)] hover:bg-[var(--ps-sage-soft)] hover:text-[var(--ps-text)]"
                      }`}
                    >
                      {item.label}
                    </Link>
                  </motion.div>
                );
              })}
            </nav>

            <motion.div
              initial={{
                opacity: 0,
                y: 12,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                duration: 0.3,
                delay: 0.2,
              }}
              className="mt-5 grid gap-3 border-t border-[var(--ps-border)] pt-5 sm:grid-cols-2"
            >
              <Link
                href="/login"
                onClick={onClose}
                className="inline-flex h-11 items-center justify-center rounded-xl border border-[var(--ps-border-strong)] bg-[var(--ps-surface-elevated)] px-5 text-sm font-semibold text-[var(--ps-text)] transition-colors duration-200 hover:bg-[var(--ps-lavender-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ps-primary)]"
              >
                Sign In
              </Link>

              <Link
                href="/register"
                onClick={onClose}
                className="inline-flex h-11 items-center justify-center rounded-xl bg-[var(--ps-primary)] px-5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-[var(--ps-primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ps-primary)]"
              >
                Get Started
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{
                duration: 0.3,
                delay: 0.28,
              }}
              className="mt-5 flex items-center gap-2"
            >
              <span className="size-2 rounded-full bg-[var(--ps-peach)]" />

              <span className="size-2 rounded-full bg-[var(--ps-sage)]" />

              <span className="size-2 rounded-full bg-[var(--ps-lavender)]" />

              <span className="ml-1 text-xs font-medium text-[var(--ps-text-muted)]">
                PowerSync
              </span>
            </motion.div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
