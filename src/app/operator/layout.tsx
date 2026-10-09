import type { CSSProperties, ReactNode } from "react";
import { ShieldCheck } from "lucide-react";

import { OperatorSidebar } from "@/components/operator/operator-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

interface OperatorLayoutProps {
  children: ReactNode;
}

export default function OperatorLayout({ children }: OperatorLayoutProps) {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "17rem",
          "--sidebar-width-icon": "4.5rem",
        } as CSSProperties
      }
    >
      <OperatorSidebar />

      <SidebarInset className="min-w-0 bg-[var(--ps-background)]">
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center border-b border-[var(--ps-border)] bg-[var(--ps-surface)] px-4 sm:px-6">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <SidebarTrigger className="-ml-1 cursor-pointer" />

            <div className="h-5 w-px bg-[var(--ps-border)]" />

            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-[var(--ps-text)]">Operator workspace</p>

              <p className="hidden text-xs text-[var(--ps-text-muted)] sm:block">
                Field assignments and restoration operations
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-xl bg-[var(--ps-primary-soft)] px-3 py-2 text-xs font-bold text-[var(--ps-primary)]">
            <ShieldCheck className="size-4" />

            <span className="hidden sm:inline">Field Operator</span>

            <span className="sm:hidden">Operator</span>
          </div>
        </header>

        <div className="flex-1 p-4 sm:p-6 lg:p-8">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
