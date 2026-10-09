"use client";

import { Bell, ClipboardList, Home, LogOut, ShieldCheck } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import Image from "next/image";
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
} from "@/components/ui/sidebar";

type UserRole = "CUSTOMER" | "OPERATOR" | "ADMIN";

interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

interface CurrentUserResponse {
  user?: CurrentUser;
  data?: CurrentUser;
}

const operationsNavigation = [
  {
    label: "Overview",
    href: "/operator",
    icon: Home,
  },
  {
    label: "My Assignments",
    href: "/operator/assignments",
    icon: ClipboardList,
  },
];

const accountNavigation = [
  {
    label: "Notifications",
    href: "/operator/notifications",
    icon: Bell,
  },
];

export function OperatorSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const { data: user, isLoading: isLoadingUser } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: getCurrentUser,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const logoutMutation = useMutation({
    mutationFn: logoutUser,

    onSuccess: () => {
      toast.success("Signed out successfully.");

      router.replace("/login");
      router.refresh();
    },

    onError: () => {
      toast.error("Unable to sign out. Please try again.");
    },
  });

  return (
    <Sidebar collapsible="icon" variant="inset" className="border-r border-[var(--ps-border)]">
      <SidebarHeader className="border-b border-[var(--ps-border)] p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg" tooltip="PowerSync">
              <Link href="/operator" className="cursor-pointer">
                <div className="flex aspect-square size-9 items-center justify-center overflow-hidden rounded-xl">
                  <Image
                    src="/powersync-icon.png"
                    alt=""
                    width={36}
                    height={36}
                    className="size-9"
                  />
                </div>

                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-bold text-[var(--ps-text)]">PowerSync</span>

                  <span className="truncate text-[10px] font-semibold tracking-[0.06em] text-[var(--ps-text-muted)] uppercase">
                    Operator Portal
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavigationGroup
          label="Field operations"
          items={operationsNavigation}
          pathname={pathname}
        />

        <NavigationGroup label="My account" items={accountNavigation} pathname={pathname} />
      </SidebarContent>

      <SidebarFooter className="border-t border-[var(--ps-border)] p-3">
        <SidebarMenu className="gap-5">
          <SidebarMenuItem>
            <SidebarMenuButton
              className="h-auto min-h-12"
              tooltip={user?.name ?? "Operator account"}
            >
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[var(--ps-primary-soft)] text-xs font-bold text-[var(--ps-primary)]">
                {getInitials(user?.name)}
              </div>

              <div className="grid min-w-0 flex-1 text-left">
                <span className="truncate text-sm font-semibold text-[var(--ps-text)]">
                  {isLoadingUser ? "Loading account..." : (user?.name ?? "Operator")}
                </span>

                <span className="truncate text-[11px] text-[var(--ps-text-muted)]">
                  {isLoadingUser ? "Please wait..." : (user?.email ?? "PowerSync account")}
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton
              type="button"
              tooltip="Sign out"
              disabled={logoutMutation.isPending}
              onClick={() => logoutMutation.mutate()}
              className="cursor-pointer text-[var(--ps-text-muted)] hover:text-[var(--ps-danger)] disabled:cursor-not-allowed"
            >
              <LogOut className="size-4" />

              <span>{logoutMutation.isPending ? "Signing out..." : "Sign out"}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}

interface NavigationItem {
  label: string;
  href: string;
  icon: typeof ShieldCheck;
}

interface NavigationGroupProps {
  label: string;
  items: NavigationItem[];
  pathname: string;
}

function NavigationGroup({ label, items, pathname }: NavigationGroupProps) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>

      <SidebarGroupContent>
        <SidebarMenu className="gap-5">
          {items.map((item) => {
            const Icon = item.icon;

            const isActive =
              item.href === "/operator" ? pathname === item.href : pathname.startsWith(item.href);

            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  tooltip={item.label}
                  className="data-[active=true]:bg-[var(--ps-primary-soft)] data-[active=true]:text-[var(--ps-primary)]"
                >
                  <Link href={item.href} className="cursor-pointer">
                    <Icon className="size-4" />

                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

async function getCurrentUser() {
  const response = await fetch("/api/auth/me", {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Unable to load current user.");
  }

  const payload = (await response.json()) as CurrentUserResponse;

  return payload.user ?? payload.data ?? null;
}

async function logoutUser() {
  const response = await fetch("/api/auth/logout", {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error("Unable to sign out.");
  }
}

function getInitials(name?: string) {
  if (!name) {
    return "PS";
  }

  const words = name.trim().split(/\s+/).filter(Boolean);

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

  return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
}
