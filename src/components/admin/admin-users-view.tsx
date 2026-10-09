"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Search,
  ShieldCheck,
  UserRound,
  UsersRound,
  Wrench,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ApiResponse<T> {
  success?: boolean;
  message?: string;
  error?: string;
  data?: T;
}

interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: "CUSTOMER" | "OPERATOR" | "ADMIN" | string;
  status: string;
  createdAt: string;
}

const PAGE_SIZE = 10;

export function AdminUsersView() {
  const reducedMotion = useReducedMotion();

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const q = searchParams.get("q")?.trim() ?? "";
  const role = parseRole(searchParams.get("role"));
  const page = parsePositiveInteger(searchParams.get("page"), 1);

  const usersQuery = useQuery({
    queryKey: ["admin", "users"],
    queryFn: getUsers,
  });

  function updateParams(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(updates).forEach(([key, value]) => {
      if (!value) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });

    const next = params.toString();

    router.replace(next ? `${pathname}?${next}` : pathname, {
      scroll: false,
    });
  }

  function commitSearch(value: string) {
    const params = new URLSearchParams(window.location.search);

    const normalized = value.trim();

    if (normalized) {
      params.set("q", normalized);
    } else {
      params.delete("q");
    }

    params.delete("page");

    const next = params.toString();

    router.replace(next ? `${pathname}?${next}` : pathname, {
      scroll: false,
    });
  }

  if (usersQuery.isLoading) {
    return <UsersLoading />;
  }

  if (usersQuery.isError) {
    return (
      <UsersError
        onRetry={() => {
          void usersQuery.refetch();
        }}
      />
    );
  }

  const users = usersQuery.data ?? [];

  const normalizedQ = q.toLowerCase();

  const filtered = users.filter((user) => {
    if (role !== "ALL" && user.role !== role) {
      return false;
    }

    if (!normalizedQ) {
      return true;
    }

    return [user.name, user.email, user.role, user.status]
      .join(" ")
      .toLowerCase()
      .includes(normalizedQ);
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  const safePage = Math.min(page, totalPages);

  const visible = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const customers = users.filter((user) => user.role === "CUSTOMER").length;

  const operators = users.filter((user) => user.role === "OPERATOR").length;

  const admins = users.filter((user) => user.role === "ADMIN").length;

  return (
    <motion.div
      className="mx-auto w-full max-w-7xl"
      initial={
        reducedMotion
          ? false
          : {
              opacity: 0,
              y: 18,
            }
      }
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration: 0.4,
      }}
    >
      <div>
        <div className="flex items-center gap-2 text-xs font-bold tracking-[0.12em] text-[var(--ps-primary)] uppercase">
          <UsersRound className="size-4" />
          Administration
        </div>

        <h1 className="mt-2 text-2xl font-black tracking-[-0.04em] text-[var(--ps-text)] sm:text-3xl lg:text-4xl">
          User Management
        </h1>

        <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--ps-text-muted)] sm:text-base">
          Inspect registered customers, field operators and administrators using the real PowerSync
          account directory.
        </p>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard icon={UsersRound} label="Total users" value={users.length} tone="primary" />

        <StatCard icon={UserRound} label="Customers" value={customers} tone="success" />

        <StatCard icon={Wrench} label="Operators" value={operators} tone="warning" />

        <StatCard icon={ShieldCheck} label="Administrators" value={admins} tone="danger" />
      </div>

      <div className="mt-6 grid gap-3 rounded-2xl border border-[var(--ps-border)] bg-[var(--ps-surface)] p-3 sm:p-4 md:grid-cols-[1fr_220px]">
        <DebouncedSearch key={q} initialValue={q} onSearch={commitSearch} />

        <select
          value={role}
          onChange={(event) =>
            updateParams({
              role: event.target.value === "ALL" ? null : event.target.value,
              page: null,
            })
          }
          className="h-11 w-full cursor-pointer rounded-xl border border-[var(--ps-border)] bg-[var(--ps-background)] px-3 text-sm font-semibold text-[var(--ps-text)] outline-none focus:border-[var(--ps-primary)]"
        >
          <option value="ALL">All roles</option>
          <option value="CUSTOMER">Customers</option>
          <option value="OPERATOR">Operators</option>
          <option value="ADMIN">Administrators</option>
        </select>
      </div>

      <div className="mt-5">
        <p className="text-sm font-black text-[var(--ps-text)]">Account directory</p>

        <p className="mt-1 text-xs text-[var(--ps-text-muted)]">
          {filtered.length} matching {filtered.length === 1 ? "account" : "accounts"}
        </p>
      </div>

      <div className="mt-4 space-y-3">
        {visible.length > 0 ? (
          visible.map((user) => <UserCard key={user.id} user={user} />)
        ) : (
          <EmptyUsers />
        )}
      </div>

      {totalPages > 1 ? (
        <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-[var(--ps-border)] bg-[var(--ps-surface)] p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
          <p className="text-center text-xs font-semibold text-[var(--ps-text-muted)] sm:text-left">
            Page {safePage} of {totalPages}
          </p>

          <div className="grid grid-cols-2 gap-2 sm:flex">
            <Button
              type="button"
              variant="outline"
              disabled={safePage <= 1}
              onClick={() =>
                updateParams({
                  page: safePage - 1 <= 1 ? null : String(safePage - 1),
                })
              }
              className="cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronLeft className="size-4" />
              Previous
            </Button>

            <Button
              type="button"
              variant="outline"
              disabled={safePage >= totalPages}
              onClick={() =>
                updateParams({
                  page: String(safePage + 1),
                })
              }
              className="cursor-pointer disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      ) : null}

      <div className="mt-6 rounded-2xl border border-[var(--ps-border)] bg-[var(--ps-surface-muted)] p-4">
        <p className="text-xs font-black text-[var(--ps-text)]">Read-only account administration</p>

        <p className="mt-1 text-xs leading-5 text-[var(--ps-text-muted)]">
          The current PowerSync backend exposes account inspection and role filtering here, but does
          not expose a verified user status mutation. PowerSync therefore does not present fake ban,
          delete or role-change controls.
        </p>
      </div>
    </motion.div>
  );
}

function UserCard({ user }: { user: UserRecord }) {
  return (
    <article className="rounded-2xl border border-[var(--ps-border)] bg-[var(--ps-surface)] p-4 sm:rounded-3xl sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--ps-primary-soft)] text-[var(--ps-primary)]">
            <UserRound className="size-4" />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap gap-2">
              <span
                className={cn(
                  "rounded-full px-2.5 py-1 text-[10px] font-black",
                  roleClass(user.role),
                )}
              >
                {formatLabel(user.role)}
              </span>

              <span className="rounded-full bg-[var(--ps-success-soft)] px-2.5 py-1 text-[10px] font-black text-[var(--ps-success)]">
                {formatLabel(user.status)}
              </span>
            </div>

            <h2 className="mt-2 break-words text-base font-black text-[var(--ps-text)]">
              {user.name}
            </h2>

            <p className="mt-1 break-all text-sm text-[var(--ps-text-muted)]">{user.email}</p>
          </div>
        </div>

        <div className="shrink-0 text-xs text-[var(--ps-text-muted)]">
          Joined {formatDate(user.createdAt)}
        </div>
      </div>
    </article>
  );
}

function DebouncedSearch({
  initialValue,
  onSearch,
}: {
  initialValue: string;
  onSearch: (value: string) => void;
}) {
  const [value, setValue] = useState(initialValue);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  function commit(next: string) {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = null;

    if (next.trim() !== initialValue) {
      onSearch(next);
    }
  }

  return (
    <label className="relative block">
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[var(--ps-text-muted)]" />

      <input
        type="search"
        value={value}
        onChange={(event) => {
          const next = event.target.value;

          setValue(next);

          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }

          timeoutRef.current = setTimeout(() => {
            timeoutRef.current = null;

            if (next.trim() !== initialValue) {
              onSearch(next);
            }
          }, 450);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            commit(value);
          }

          if (event.key === "Escape") {
            setValue("");
            commit("");
          }
        }}
        placeholder="Search name, email or status..."
        className="h-11 w-full rounded-xl border border-[var(--ps-border)] bg-[var(--ps-background)] pr-3 pl-10 text-sm text-[var(--ps-text)] outline-none placeholder:text-[var(--ps-text-muted)] focus:border-[var(--ps-primary)]"
      />
    </label>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof UsersRound;
  label: string;
  value: number;
  tone: "primary" | "success" | "warning" | "danger";
}) {
  const tones = {
    primary: "bg-[var(--ps-primary-soft)] text-[var(--ps-primary)]",
    success: "bg-[var(--ps-success-soft)] text-[var(--ps-success)]",
    warning: "bg-[var(--ps-warning-soft)] text-[var(--ps-warning)]",
    danger: "bg-[var(--ps-danger-soft)] text-[var(--ps-danger)]",
  };

  return (
    <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-[var(--ps-border)] bg-[var(--ps-surface)] p-3 sm:p-4">
      <div
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-xl sm:size-10",
          tones[tone],
        )}
      >
        <Icon className="size-4" />
      </div>

      <div className="min-w-0">
        <p className="truncate text-[11px] font-semibold text-[var(--ps-text-muted)] sm:text-xs">
          {label}
        </p>

        <p className="mt-0.5 text-lg font-black text-[var(--ps-text)] sm:text-xl">{value}</p>
      </div>
    </div>
  );
}

function EmptyUsers() {
  return (
    <div className="flex min-h-64 items-center justify-center rounded-3xl border border-dashed border-[var(--ps-border)] bg-[var(--ps-surface)] p-6 text-center">
      <div>
        <UsersRound className="mx-auto size-8 text-[var(--ps-primary)]" />

        <h2 className="mt-4 text-lg font-black text-[var(--ps-text)]">No matching users</h2>

        <p className="mt-2 text-sm text-[var(--ps-text-muted)]">
          Change the search term or role filter.
        </p>
      </div>
    </div>
  );
}

function UsersError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex min-h-[450px] items-center justify-center">
      <div className="max-w-xl rounded-3xl border border-[var(--ps-border)] bg-[var(--ps-surface)] p-8 text-center">
        <CircleAlert className="mx-auto size-7 text-[var(--ps-danger)]" />

        <h2 className="mt-4 text-xl font-black text-[var(--ps-text)]">Unable to load users</h2>

        <Button
          onClick={onRetry}
          className="mt-5 cursor-pointer bg-[var(--ps-primary)] text-white hover:bg-[var(--ps-primary-hover)]"
        >
          Try Again
        </Button>
      </div>
    </div>
  );
}

function UsersLoading() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="h-28 animate-pulse rounded-2xl bg-[var(--ps-surface-muted)]" />
      ))}
    </div>
  );
}

async function getUsers(): Promise<UserRecord[]> {
  const response = await fetch("/api/admin/users", {
    cache: "no-store",
  });

  const payload = (await response.json()) as ApiResponse<UserRecord[]>;

  if (!response.ok) {
    throw new Error(payload.message ?? payload.error ?? "Unable to load users.");
  }

  return payload.data ?? [];
}

function parseRole(value: string | null): "ALL" | "CUSTOMER" | "OPERATOR" | "ADMIN" {
  if (value === "CUSTOMER" || value === "OPERATOR" || value === "ADMIN") {
    return value;
  }

  return "ALL";
}

function parsePositiveInteger(value: string | null, fallback: number) {
  const parsed = Number(value);

  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function roleClass(role: string) {
  switch (role) {
    case "ADMIN":
      return "bg-[var(--ps-danger-soft)] text-[var(--ps-danger)]";

    case "OPERATOR":
      return "bg-[var(--ps-warning-soft)] text-[var(--ps-warning)]";

    default:
      return "bg-[var(--ps-primary-soft)] text-[var(--ps-primary)]";
  }
}

function formatLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDate(value: string) {
  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "Unknown"
    : new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
      }).format(date);
}
