import Image from "next/image";
import Link from "next/link";

import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <main className="grid min-h-svh bg-[var(--ps-background)] lg:grid-cols-2">
      <div className="flex min-h-svh flex-col p-5 sm:p-6 md:p-10">
        <div className="flex justify-center md:justify-start">
          <Link
            href="/"
            className="inline-flex items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ps-primary)]"
          >
            <Image
              src="/powersync-icon.png"
              alt=""
              width={40}
              height={40}
              className="size-10 rounded-xl"
              priority
            />

            <div>
              <p className="text-lg font-bold tracking-[-0.03em] text-[var(--ps-text)]">
                PowerSync
              </p>

              <p className="text-[9px] font-bold tracking-[0.08em] text-[var(--ps-text-muted)] uppercase">
                Outage information. Faster solutions.
              </p>
            </div>
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-[420px]">
            <LoginForm />
          </div>
        </div>
      </div>

      <div className="relative hidden min-h-svh overflow-hidden bg-[var(--ps-surface-muted)] lg:block">
        <Image
          src="/auth/login-cover.jpg"
          alt="Electrical power infrastructure"
          fill
          priority
          sizes="50vw"
          className="object-cover"
        />

        <div className="absolute inset-0 bg-[#172033]/24" />

        <div className="absolute top-8 right-8">
          <Link
            href="/"
            className="inline-flex min-h-10 items-center justify-center rounded-xl border border-white/60 bg-white/90 px-4 text-sm font-semibold text-[var(--ps-text)] transition-colors hover:bg-white"
          >
            Back to home
          </Link>
        </div>

        <div className="absolute right-8 bottom-8 left-8 xl:right-12 xl:bottom-12 xl:left-12">
          <div className="max-w-xl rounded-[1.75rem] border border-white/70 bg-white/92 p-6 shadow-sm xl:p-8">
            <p className="text-xs font-bold tracking-[0.14em] text-[var(--ps-primary)] uppercase">
              PowerSync
            </p>

            <h1 className="mt-3 text-3xl leading-tight font-bold tracking-[-0.04em] text-[var(--ps-text)] xl:text-4xl">
              Power information when you need it most.
            </h1>

            <p className="mt-4 max-w-lg text-sm leading-6 text-[var(--ps-text-muted)] xl:text-base">
              Access outage reports, restoration updates, schedules, service information, and
              reliability insights through one connected platform.
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              <ImageBadge text="Outage tracking" />
              <ImageBadge text="Restoration updates" />
              <ImageBadge text="Secure access" />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function ImageBadge({ text }: { text: string }) {
  return (
    <span className="rounded-full border border-[var(--ps-border)] bg-[var(--ps-background-soft)] px-3 py-1.5 text-[10px] font-bold text-[var(--ps-text-soft)]">
      {text}
    </span>
  );
}
