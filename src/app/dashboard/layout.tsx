import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { Zap } from "lucide-react";

import { CustomerSidebar } from "@/components/dashboard/customer-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "17rem",
          "--sidebar-width-icon": "4.5rem",
        } as CSSProperties
      }
    >
      <CustomerSidebar />

      <SidebarInset className="min-w-0 bg-[var(--ps-background)]">
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center border-b border-[var(--ps-border)] bg-[var(--ps-surface)] px-4 sm:px-6">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <SidebarTrigger className="-ml-1" />

            <div className="h-5 w-px bg-[var(--ps-border)]" />

            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-[var(--ps-text)]">Customer workspace</p>

              <p className="hidden text-xs text-[var(--ps-text-muted)] sm:block">
                Outages, schedules and service updates
              </p>
            </div>
          </div>

          <Link
            href="/dashboard/report-outage"
            className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl bg-[var(--ps-primary)] px-3 text-xs font-semibold text-white transition-colors hover:bg-[var(--ps-primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ps-primary)] focus-visible:ring-offset-2 sm:px-4 sm:text-sm"
          >
            <Zap className="size-4" />

            <span className="hidden sm:inline">Report Outage</span>

            <span className="sm:hidden">Report</span>
          </Link>
        </header>

        <div className="flex-1 p-4 sm:p-6 lg:p-8">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
