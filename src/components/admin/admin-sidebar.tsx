"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BarChart3,
  ClipboardList,
  Gauge,
  LoaderCircle,
  LogOut,
  ShieldCheck,
  ReceiptText,
  ScrollText,
  UsersRound,
  Siren,
  Zap,
  Network,
  CalendarClock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";

interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status?: string;
}

interface MeResponse {
  success?: boolean;
  message?: string;
  data?: CurrentUser;
  user?: CurrentUser;
}

const adminNavigation = [
  {
    label: "Overview",
    href: "/admin",
    icon: Gauge,
  },
  {
    label: "Outage Reports",
    href: "/admin/outages",
    icon: ClipboardList,
  },
  {
    label: "Incidents",
    href: "/admin/incidents",
    icon: Siren,
  },
  {
    label: "Schedules",
    href: "/admin/schedules",
    icon: CalendarClock,
  },
  {
    label: "Analytics",
    href: "/admin/analytics",
    icon: BarChart3,
  },
  {
    label: "Infrastructure",
    href: "/admin/infrastructure",
    icon: Network,
  },
  {
    label: "Users",
    href: "/admin/users",
    icon: UsersRound,
  },
  {
    label: "Billing",
    href: "/admin/billing",
    icon: ReceiptText,
  },
  {
    label: "Audit & Broadcasts",
    href: "/admin/audit",
    icon: ScrollText,
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { state } = useSidebar();

  const collapsed = state === "collapsed";

  const userQuery = useQuery({
    queryKey: ["auth", "me"],
    queryFn: getCurrentUser,
    staleTime: 5 * 60 * 1000,
  });

  const logoutMutation = useMutation({
    mutationFn: logout,

    onSuccess: () => {
      queryClient.clear();
      router.replace("/login");
      router.refresh();
    },

    onError: (error) => {
      toast.error(error.message);
    },
  });

  const user = userQuery.data;

  return (
    <Sidebar collapsible="icon" variant="inset" className="border-r border-[var(--ps-border)]">
      <SidebarHeader className="border-b border-[var(--ps-border)] p-3">
        <Link
          href="/admin"
          className="flex min-h-11 cursor-pointer items-center gap-3 overflow-hidden rounded-xl px-2 transition-colors duration-200 hover:bg-[var(--ps-surface-muted)]"
        >
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[var(--ps-primary)] text-white transition-transform duration-200 group-data-[collapsible=icon]:scale-95">
            <Zap className="size-5" />
          </div>

          <div
            className={[
              "min-w-0 overflow-hidden transition-all duration-200 ease-linear",
              collapsed ? "w-0 translate-x-2 opacity-0" : "w-36 translate-x-0 opacity-100",
            ].join(" ")}
          >
            <p className="whitespace-nowrap text-sm font-black tracking-[-0.03em] text-[var(--ps-text)]">
              PowerSync
            </p>

            <p className="whitespace-nowrap text-[11px] font-semibold text-[var(--ps-text-muted)]">
              Control Center
            </p>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className="py-3">
        <SidebarGroup>
          <SidebarGroupLabel>Operations</SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu>
              {adminNavigation.map((item) => {
                const Icon = item.icon;

                const isActive =
                  item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.label}
                      className={cn(
                        "h-10 cursor-pointer rounded-xl font-semibold transition-all duration-200 mt-5",
                        isActive
                          ? "data-[active=true]:bg-[var(--ps-primary)] data-[active=true]:text-white data-[active=true]:hover:bg-[var(--ps-primary-hover)] data-[active=true]:hover:text-white data-[active=true]:[&>svg]:text-white"
                          : "bg-transparent text-[var(--ps-text-soft)] hover:bg-[var(--ps-primary-soft)] hover:text-[var(--ps-primary)]",
                      )}
                    >
                      <Link href={item.href}>
                        <Icon />

                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-[var(--ps-border)] p-3">
        <div
          className={[
            "mb-2 flex min-h-12 items-center overflow-hidden rounded-xl transition-all duration-200 ease-linear",
            collapsed ? "justify-center px-0" : "gap-3 px-2",
          ].join(" ")}
        >
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[var(--ps-primary-soft)] text-xs font-black text-[var(--ps-primary)] transition-transform duration-200">
            {user ? getInitials(user.name) : <ShieldCheck className="size-4" />}
          </div>

          <div
            className={[
              "min-w-0 overflow-hidden transition-all duration-200 ease-linear",
              collapsed ? "w-0 translate-x-2 opacity-0" : "w-40 translate-x-0 opacity-100",
            ].join(" ")}
          >
            <p className="truncate whitespace-nowrap text-sm font-bold text-[var(--ps-text)]">
              {user?.name ?? "Administrator"}
            </p>

            <p className="truncate whitespace-nowrap text-xs text-[var(--ps-text-muted)]">
              {user?.email ?? "Admin account"}
            </p>
          </div>
        </div>

        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Sign out"
              disabled={logoutMutation.isPending}
              onClick={() => logoutMutation.mutate()}
              className="cursor-pointer text-[var(--ps-text-muted)] transition-all duration-200 hover:text-[var(--ps-danger)] disabled:cursor-not-allowed"
            >
              {logoutMutation.isPending ? <LoaderCircle className="animate-spin" /> : <LogOut />}

              <span>{logoutMutation.isPending ? "Signing out..." : "Sign out"}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}

async function getCurrentUser(): Promise<CurrentUser | null> {
  const response = await fetch("/api/auth/me", {
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as MeResponse;

  return payload.data ?? payload.user ?? null;
}

async function logout() {
  const response = await fetch("/api/auth/logout", {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error("Unable to sign out.");
  }
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}
