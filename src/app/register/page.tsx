import Image from "next/image";
import Link from "next/link";

import { RegisterVisual } from "@/components/auth/register-visual";
import { RegisterForm } from "@/components/register-form";

export default function RegisterPage() {
  return (
    <main className="grid min-h-svh bg-[var(--ps-background)] lg:grid-cols-2">
      <RegisterVisual />

      <div className="flex min-h-svh flex-col p-5 sm:p-6 md:p-10">
        <div className="flex justify-center md:justify-end">
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
            <RegisterForm />
          </div>
        </div>
      </div>
    </main>
  );
}
