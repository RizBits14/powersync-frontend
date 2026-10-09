"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  Check,
  CheckCheck,
  CircleAlert,
  Megaphone,
  RefreshCw,
  ShieldCheck,
  Trash2,
  Wrench,
  Zap,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface ApiResponse<T> {
  success?: boolean;
  message?: string;
  error?: string;
  data?: T;
  meta?: PaginationMeta;
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  recipientId: string;
  entityType?: string | null;
  entityId?: string | null;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
}

interface NotificationsResult {
  notifications: NotificationItem[];
  meta: PaginationMeta;
}

interface UnreadCount {
  unreadCount: number;
}

const notificationQueryKey = ["operator", "notifications"];

const unreadQueryKey = ["operator", "notifications", "unread-count"];

export function OperatorNotificationsView() {
  const reducedMotion = useReducedMotion();

  const queryClient = useQueryClient();

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const page = parsePage(searchParams.get("page"));

  const notificationsQuery = useQuery({
    queryKey: [...notificationQueryKey, page],
    queryFn: () => getNotifications(page),
  });

  const unreadQuery = useQuery({
    queryKey: unreadQueryKey,
    queryFn: getUnreadCount,
  });

  const markReadMutation = useMutation({
    mutationFn: markNotificationRead,

    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: notificationQueryKey,
        }),
        queryClient.invalidateQueries({
          queryKey: unreadQueryKey,
        }),
      ]);

      toast.success("Notification marked as read.");
    },

    onError: (error) => {
      toast.error(error.message);
    },
  });

  const markAllMutation = useMutation({
    mutationFn: markAllNotificationsRead,

    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: notificationQueryKey,
        }),
        queryClient.invalidateQueries({
          queryKey: unreadQueryKey,
        }),
      ]);

      toast.success("All notifications marked as read.");
    },

    onError: (error) => {
      toast.error(error.message);
    },
  });

  const dismissMutation = useMutation({
    mutationFn: dismissNotification,

    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: notificationQueryKey,
        }),
        queryClient.invalidateQueries({
          queryKey: unreadQueryKey,
        }),
      ]);

      toast.success("Notification dismissed.");
    },

    onError: (error) => {
      toast.error(error.message);
    },
  });

  if (notificationsQuery.isLoading) {
    return <NotificationsSkeleton />;
  }

  if (notificationsQuery.isError) {
    return (
      <NotificationsError
        onRetry={() => {
          void notificationsQuery.refetch();
        }}
      />
    );
  }

  const notifications = notificationsQuery.data?.notifications ?? [];

  const meta = notificationsQuery.data?.meta;

  const unreadCount = unreadQuery.data?.unreadCount ?? 0;

  const readOnPage = notifications.filter((item) => item.isRead).length;

  function changePage(nextPage: number) {
    const params = new URLSearchParams(searchParams.toString());

    if (nextPage <= 1) {
      params.delete("page");
    } else {
      params.set("page", String(nextPage));
    }

    const query = params.toString();

    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  }

  return (
    <motion.div
      className="mx-auto w-full max-w-6xl"
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
        ease: "easeOut",
      }}
    >
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold tracking-[0.12em] text-[var(--ps-primary)] uppercase">
            <Bell className="size-4" />
            Field updates
          </div>

          <h1 className="mt-2 text-3xl font-bold tracking-[-0.04em] text-[var(--ps-text)] sm:text-4xl">
            Notifications
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--ps-text-muted)] sm:text-base">
            Stay updated on incident assignments, restoration work and important PowerSync field
            messages.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          disabled={unreadCount === 0 || markAllMutation.isPending}
          onClick={() => markAllMutation.mutate()}
          className="min-h-11 cursor-pointer disabled:cursor-not-allowed"
        >
          <CheckCheck className="size-4" />

          {markAllMutation.isPending ? "Updating..." : "Mark all read"}
        </Button>
      </div>

      <div className="mt-7 grid gap-4 sm:grid-cols-2">
        <CompactStat
          icon={Bell}
          label="Unread"
          value={unreadCount}
          description="Field notifications needing attention"
          tone="primary"
        />

        <CompactStat
          icon={CheckCheck}
          label="Read on this page"
          value={readOnPage}
          description="Already reviewed notifications"
          tone="success"
        />
      </div>

      <div className="mt-6 max-w-3xl">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm font-semibold text-[var(--ps-text-muted)]">
            {meta?.total ?? 0} {(meta?.total ?? 0) === 1 ? "notification" : "notifications"}
          </p>

          {unreadQuery.isFetching ? (
            <span className="text-xs text-[var(--ps-text-muted)]">Updating…</span>
          ) : null}
        </div>

        {notifications.length > 0 ? (
          <motion.div
            className="space-y-4"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: {
                transition: {
                  staggerChildren: reducedMotion ? 0 : 0.05,
                },
              },
            }}
          >
            {notifications.map((notification) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                reducedMotion={reducedMotion}
                marking={markReadMutation.isPending}
                dismissing={dismissMutation.isPending}
                onMarkRead={() => markReadMutation.mutate(notification.id)}
                onDismiss={() => dismissMutation.mutate(notification.id)}
              />
            ))}
          </motion.div>
        ) : (
          <EmptyNotifications />
        )}
      </div>

      {meta && meta.totalPages > 1 ? (
        <Pagination
          currentPage={meta.page}
          totalPages={meta.totalPages}
          onPageChange={changePage}
        />
      ) : null}
    </motion.div>
  );
}

function NotificationCard({
  notification,
  reducedMotion,
  marking,
  dismissing,
  onMarkRead,
  onDismiss,
}: {
  notification: NotificationItem;
  reducedMotion: boolean | null;
  marking: boolean;
  dismissing: boolean;
  onMarkRead: () => void;
  onDismiss: () => void;
}) {
  const config = getNotificationConfig(notification.type);

  const actionHref = getEntityHref(notification);

  const Icon = config.icon;

  return (
    <motion.article
      variants={{
        hidden: {
          opacity: 0,
          y: reducedMotion ? 0 : 12,
        },
        visible: {
          opacity: 1,
          y: 0,
        },
      }}
      transition={{
        duration: 0.3,
        ease: "easeOut",
      }}
      className={cn(
        "rounded-3xl border bg-[var(--ps-surface)] p-5",
        notification.isRead
          ? "border-[var(--ps-border)]"
          : "border-[var(--ps-border-strong)] shadow-sm",
      )}
    >
      <div className="flex gap-4">
        <div
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-2xl",
            config.iconClass,
          )}
        >
          <Icon className="size-5" />
        </div>

        <div className="min-w-0 flex-1">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold",
                  config.badgeClass,
                )}
              >
                {config.label}
              </span>

              {!notification.isRead ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--ps-primary-soft)] px-2.5 py-1 text-[11px] font-bold text-[var(--ps-primary)]">
                  <span className="size-1.5 rounded-full bg-current" />
                  New
                </span>
              ) : null}
            </div>

            <h2 className="mt-3 text-lg font-bold text-[var(--ps-text)]">{notification.title}</h2>

            <p className="mt-2 text-sm leading-6 text-[var(--ps-text-muted)]">
              {notification.message}
            </p>

            <time className="mt-2 block text-xs font-semibold text-[var(--ps-text-muted)]">
              {formatDateTime(notification.createdAt)}
            </time>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[var(--ps-border)] pt-3">
            {actionHref ? (
              <Link
                href={actionHref}
                className="inline-flex min-h-9 cursor-pointer items-center justify-center rounded-xl border border-[var(--ps-border)] bg-[var(--ps-background)] px-3 text-xs font-bold text-[var(--ps-text)] transition-colors hover:bg-[var(--ps-surface-muted)]"
              >
                View related
              </Link>
            ) : null}

            {!notification.isRead ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={marking}
                onClick={onMarkRead}
                className="cursor-pointer disabled:cursor-not-allowed"
              >
                <Check className="size-4" />
                Mark read
              </Button>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--ps-success)]">
                <Check className="size-3.5" />
                Read
              </span>
            )}

            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={dismissing}
              onClick={onDismiss}
              className="cursor-pointer text-[var(--ps-text-muted)] hover:text-[var(--ps-danger)] disabled:cursor-not-allowed"
            >
              <Trash2 className="size-4" />
              Dismiss
            </Button>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

function CompactStat({
  icon: Icon,
  label,
  value,
  description,
  tone,
}: {
  icon: typeof Bell;
  label: string;
  value: number;
  description: string;
  tone: "primary" | "success";
}) {
  const styles = {
    primary: "bg-[var(--ps-primary-soft)] text-[var(--ps-primary)]",
    success: "bg-[var(--ps-success-soft)] text-[var(--ps-success)]",
  };

  return (
    <div className="rounded-2xl border border-[var(--ps-border)] bg-[var(--ps-surface)] p-4">
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-xl",
            styles[tone],
          )}
        >
          <Icon className="size-4" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-[var(--ps-text)]">{label}</p>

          <p className="mt-0.5 text-xs text-[var(--ps-text-muted)]">{description}</p>
        </div>

        <p className="text-2xl font-bold tracking-[-0.04em] text-[var(--ps-text)]">{value}</p>
      </div>
    </div>
  );
}

function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <div className="mt-6 flex items-center justify-between rounded-2xl border border-[var(--ps-border)] bg-[var(--ps-surface)] p-4">
      <Button
        type="button"
        variant="outline"
        disabled={currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
        className="cursor-pointer disabled:cursor-not-allowed"
      >
        Previous
      </Button>

      <p className="text-sm font-semibold text-[var(--ps-text-muted)]">
        Page {currentPage} of {totalPages}
      </p>

      <Button
        type="button"
        variant="outline"
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className="cursor-pointer disabled:cursor-not-allowed"
      >
        Next
      </Button>
    </div>
  );
}

function EmptyNotifications() {
  return (
    <div className="flex min-h-[380px] items-center justify-center rounded-3xl border border-[var(--ps-border)] bg-[var(--ps-surface)] p-8 text-center">
      <div className="max-w-md">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-[var(--ps-primary-soft)] text-[var(--ps-primary)]">
          <Bell className="size-6" />
        </div>

        <h2 className="mt-5 text-xl font-bold text-[var(--ps-text)]">You’re all caught up</h2>

        <p className="mt-2 text-sm leading-6 text-[var(--ps-text-muted)]">
          New assignments, incident updates and field-operation messages will appear here.
        </p>
      </div>
    </div>
  );
}

function NotificationsError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="mx-auto flex min-h-[480px] w-full max-w-3xl items-center justify-center">
      <div className="w-full rounded-3xl border border-[var(--ps-border)] bg-[var(--ps-surface)] p-8 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-[var(--ps-danger-soft)] text-[var(--ps-danger)]">
          <CircleAlert className="size-5" />
        </div>

        <h1 className="mt-5 text-xl font-bold text-[var(--ps-text)]">
          Unable to load notifications
        </h1>

        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--ps-text-muted)]">
          PowerSync could not retrieve your latest field updates.
        </p>

        <Button
          type="button"
          onClick={onRetry}
          className="mt-5 cursor-pointer bg-[var(--ps-primary)] text-white hover:bg-[var(--ps-primary-hover)]"
        >
          <RefreshCw className="size-4" />
          Try Again
        </Button>
      </div>
    </div>
  );
}

function NotificationsSkeleton() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <div className="space-y-3">
        <Skeleton className="h-4 w-32" />

        <Skeleton className="h-10 w-72" />

        <Skeleton className="h-5 w-full max-w-2xl" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Skeleton className="h-24 rounded-2xl" />

        <Skeleton className="h-24 rounded-2xl" />
      </div>

      <div className="max-w-3xl space-y-4">
        {Array.from({
          length: 4,
        }).map((_, index) => (
          <Skeleton key={index} className="h-40 rounded-3xl" />
        ))}
      </div>
    </div>
  );
}

async function getNotifications(page: number): Promise<NotificationsResult> {
  const response = await fetch(`/api/operator/notifications?page=${page}`, {
    cache: "no-store",
  });

  const payload = (await response.json()) as ApiResponse<NotificationItem[]>;

  if (!response.ok) {
    throw new Error(payload.message ?? payload.error ?? "Unable to load notifications.");
  }

  return {
    notifications: payload.data ?? [],
    meta: payload.meta ?? {
      page,
      limit: 10,
      total: payload.data?.length ?? 0,
      totalPages: 1,
    },
  };
}

async function getUnreadCount(): Promise<UnreadCount> {
  const response = await fetch("/api/operator/notifications/unread-count", {
    cache: "no-store",
  });

  const payload = (await response.json()) as ApiResponse<UnreadCount>;

  if (!response.ok) {
    throw new Error(payload.message ?? payload.error ?? "Unable to load unread count.");
  }

  return (
    payload.data ?? {
      unreadCount: 0,
    }
  );
}

async function markNotificationRead(notificationId: string) {
  const response = await fetch(
    `/api/operator/notifications/${encodeURIComponent(notificationId)}/read`,
    {
      method: "PATCH",
    },
  );

  const payload = (await response.json()) as ApiResponse<unknown>;

  if (!response.ok) {
    throw new Error(payload.message ?? payload.error ?? "Unable to mark notification as read.");
  }

  return payload;
}

async function markAllNotificationsRead() {
  const response = await fetch("/api/operator/notifications/read-all", {
    method: "PATCH",
  });

  const payload = (await response.json()) as ApiResponse<unknown>;

  if (!response.ok) {
    throw new Error(
      payload.message ?? payload.error ?? "Unable to mark all notifications as read.",
    );
  }

  return payload;
}

async function dismissNotification(notificationId: string) {
  const response = await fetch(
    `/api/operator/notifications/${encodeURIComponent(notificationId)}`,
    {
      method: "DELETE",
    },
  );

  const payload = (await response.json()) as ApiResponse<unknown>;

  if (!response.ok) {
    throw new Error(payload.message ?? payload.error ?? "Unable to dismiss notification.");
  }

  return payload;
}

function getNotificationConfig(type: string) {
  switch (type) {
    case "ASSIGNMENT":
      return {
        icon: Wrench,
        label: "Assignment",
        iconClass: "bg-[var(--ps-warning-soft)] text-[var(--ps-warning)]",
        badgeClass: "bg-[var(--ps-warning-soft)] text-[var(--ps-warning)]",
      };

    case "INCIDENT":
      return {
        icon: Zap,
        label: "Incident",
        iconClass: "bg-[var(--ps-primary-soft)] text-[var(--ps-primary)]",
        badgeClass: "bg-[var(--ps-primary-soft)] text-[var(--ps-primary)]",
      };

    case "RESTORATION":
      return {
        icon: ShieldCheck,
        label: "Restoration",
        iconClass: "bg-[var(--ps-success-soft)] text-[var(--ps-success)]",
        badgeClass: "bg-[var(--ps-success-soft)] text-[var(--ps-success)]",
      };

    case "OUTAGE_REPORT":
      return {
        icon: Zap,
        label: "Outage",
        iconClass: "bg-[var(--ps-warning-soft)] text-[var(--ps-warning)]",
        badgeClass: "bg-[var(--ps-warning-soft)] text-[var(--ps-warning)]",
      };

    default:
      return {
        icon: Megaphone,
        label: formatLabel(type),
        iconClass: "bg-[var(--ps-primary-soft)] text-[var(--ps-primary)]",
        badgeClass: "bg-[var(--ps-background)] text-[var(--ps-text-soft)]",
      };
  }
}

function getEntityHref(notification: NotificationItem) {
  if (notification.entityType === "INCIDENT" && notification.entityId) {
    return `/operator/assignments?q=${encodeURIComponent(notification.entityId)}`;
  }

  return null;
}

function parsePage(value: string | null) {
  const page = Number(value);

  if (!Number.isInteger(page) || page < 1) {
    return 1;
  }

  return page;
}

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatLabel(value?: string) {
  if (!value) {
    return "System";
  }

  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
