import type { CSSProperties, ReactNode } from "react";

import { ShieldCheck } from "lucide-react";

import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "17rem",
          "--sidebar-width-icon": "4.5rem",
        } as CSSProperties
      }
    >
      <AdminSidebar />

      <SidebarInset className="min-w-0 bg-[var(--ps-background)]">
        <header className="sticky top-0 z-30 flex min-h-16 items-center gap-3 border-b border-[var(--ps-border)] bg-[var(--ps-surface)]/95 px-4 backdrop-blur sm:px-6">
          <SidebarTrigger className="cursor-pointer" />

          <div className="h-6 w-px bg-[var(--ps-border)]" />

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-[var(--ps-primary)]" />

              <p className="truncate text-sm font-bold text-[var(--ps-text)]">Administration</p>
            </div>

            <p className="hidden truncate text-xs text-[var(--ps-text-muted)] sm:block">
              Operations, infrastructure and service intelligence
            </p>
          </div>

          <span className="hidden rounded-full bg-[var(--ps-primary-soft)] px-3 py-1 text-xs font-bold text-[var(--ps-primary)] sm:inline-flex">
            Administrator
          </span>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
