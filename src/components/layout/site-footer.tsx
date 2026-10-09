import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const productLinks = [
  {
    label: "How It Works",
    href: "/#how-it-works",
  },
  {
    label: "Features",
    href: "/#features",
  },
  {
    label: "Reliability",
    href: "/#reliability",
  },
];

const accountLinks = [
  {
    label: "Sign In",
    href: "/login",
  },
  {
    label: "Create Account",
    href: "/register",
  },
];

export function SiteFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[var(--ps-surface)]">
      <div className="border-b border-[var(--ps-border)] bg-[var(--ps-primary-soft)]">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <div className="max-w-2xl">
            <p className="text-xs font-bold tracking-[0.14em] text-[var(--ps-primary)] uppercase">
              PowerSync
            </p>

            <h2 className="mt-2 text-2xl font-bold tracking-[-0.035em] text-[var(--ps-text)] sm:text-3xl">
              Stay informed when the power goes out.
            </h2>

            <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--ps-text-muted)] sm:text-base">
              Report outages, follow restoration progress, and stay connected to important power
              service updates.
            </p>
          </div>

          <Link
            href="/register"
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 self-start rounded-xl bg-[var(--ps-primary)] px-5 text-sm font-semibold text-white transition-colors hover:bg-[var(--ps-primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ps-primary)] focus-visible:ring-offset-2 md:self-auto"
          >
            Get Started
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>

      <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.5fr_0.75fr_0.75fr_1fr] lg:gap-12">
          <div className="max-w-sm">
            <Link href="/" className="inline-flex items-center gap-3" aria-label="PowerSync home">
              <Image
                src="/powersync-icon.png"
                alt=""
                width={44}
                height={44}
                className="size-11 rounded-xl"
              />

              <div>
                <p className="text-lg font-bold tracking-[-0.03em] text-[var(--ps-text)]">
                  PowerSync
                </p>

                <p className="text-[10px] font-bold tracking-[0.08em] text-[var(--ps-text-muted)] uppercase">
                  Outage information. Faster solutions.
                </p>
              </div>
            </Link>

            <p className="mt-5 text-sm leading-6 text-[var(--ps-text-muted)]">
              A connected platform designed to improve outage visibility, restoration coordination,
              and access to reliable power service information.
            </p>
          </div>

          <FooterColumn title="Platform" links={productLinks} />

          <FooterColumn title="Account" links={accountLinks} />

          <div>
            <p className="text-sm font-bold text-[var(--ps-text)]">Platform focus</p>

            <div className="mt-5 space-y-4">
              <FooterInfo
                title="Clear reporting"
                description="Make power interruptions easier to report and follow."
              />

              <FooterInfo
                title="Connected response"
                description="Keep outage and restoration activity connected."
              />

              <FooterInfo
                title="Better visibility"
                description="Reduce uncertainty with timely service information."
              />
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-[var(--ps-border)]">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-6 text-xs text-[var(--ps-text-muted)] sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <p>© {currentYear} PowerSync. All rights reserved.</p>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <span>Load Shedding & Power Outage Management Platform</span>

            <span className="hidden size-1 rounded-full bg-[var(--ps-border-strong)] md:block" />

            <span>Built for reliable service communication</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

interface FooterColumnProps {
  title: string;
  links: {
    label: string;
    href: string;
  }[];
}

function FooterColumn({ title, links }: FooterColumnProps) {
  return (
    <div>
      <p className="text-sm font-bold text-[var(--ps-text)]">{title}</p>

      <nav aria-label={`${title} footer navigation`} className="mt-5">
        <ul className="space-y-3">
          {links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="text-sm text-[var(--ps-text-muted)] transition-colors hover:text-[var(--ps-primary)] focus-visible:outline-none focus-visible:text-[var(--ps-primary)]"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

interface FooterInfoProps {
  title: string;
  description: string;
}

function FooterInfo({ title, description }: FooterInfoProps) {
  return (
    <div>
      <p className="text-sm font-semibold text-[var(--ps-text-soft)]">{title}</p>

      <p className="mt-1 text-xs leading-5 text-[var(--ps-text-muted)]">{description}</p>
    </div>
  );
}
