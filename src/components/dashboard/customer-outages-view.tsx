"use client";

import { useQuery } from "@tanstack/react-query";
import {
    ArrowRight,
    CalendarDays,
    CheckCircle2,
    CircleAlert,
    Clock3,
    FileText,
    MapPin,
    RefreshCw,
    Search,
    ShieldCheck,
    TriangleAlert,
    Zap,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface ApiResponse<T> {
    success?: boolean;
    message?: string;
    error?: string;
    data?: T;
}

interface OutageArea {
    id: string;
    name: string;
    code: string;
}

interface OutageReport {
    id: string;
    issueType: string;
    description: string;
    status: string;
    customerId: string;
    areaId: string;
    incidentId?: string | null;
    reviewedById?: string | null;
    reviewedAt?: string | null;
    reviewNote?: string | null;
    reportedAt: string;
    updatedAt: string;
    area?: OutageArea;
}

type SortOption = "newest" | "oldest";

const reportsQueryKey = ["customer", "outage-reports"];

const PAGE_SIZE = 5;

export function CustomerOutagesView() {
    const shouldReduceMotion = useReducedMotion();

    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const reportsQuery = useQuery({
        queryKey: reportsQueryKey,
        queryFn: getCustomerOutages,
    });

    const query = searchParams.get("q") ?? "";

    const status = searchParams.get("status") ?? "ALL";

    const sort = parseSortOption(searchParams.get("sort"));

    const requestedPage = parsePage(searchParams.get("page"));

    const reports = useMemo(
        () => reportsQuery.data ?? [],
        [reportsQuery.data]
    )

    const availableStatuses = useMemo(() => {
        return Array.from(new Set(reports.map((report) => report.status)));
    }, [reports]);

    const filteredReports = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase();

        const result = reports.filter((report) => {
            const matchesStatus = status === "ALL" || report.status === status;

            if (!matchesStatus) {
                return false;
            }

            if (!normalizedQuery) {
                return true;
            }

            const searchableText = [
                report.id,
                report.description,
                report.issueType,
                report.status,
                report.area?.name,
                report.area?.code,
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            return searchableText.includes(normalizedQuery);
        });

        return [...result].sort((first, second) => {
            const firstTime = new Date(first.reportedAt).getTime();

            const secondTime = new Date(second.reportedAt).getTime();

            return sort === "oldest" ? firstTime - secondTime : secondTime - firstTime;
        });
    }, [query, reports, sort, status]);

    const totalPages = Math.max(1, Math.ceil(filteredReports.length / PAGE_SIZE));

    const currentPage = Math.min(requestedPage, totalPages);

    const visibleReports = filteredReports.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE,
    );

    const pendingCount = reports.filter((report) => report.status === "PENDING").length;

    const progressedCount = reports.filter((report) => report.status !== "PENDING").length;

    function updateParams(updates: Record<string, string | null>) {
        const params = new URLSearchParams(searchParams.toString());

        Object.entries(updates).forEach(([key, value]) => {
            if (value === null || value === "" || value === "ALL") {
                params.delete(key);
                return;
            }

            params.set(key, value);
        });

        const queryString = params.toString();

        router.replace(queryString ? `${pathname}?${queryString}` : pathname, {
            scroll: false,
        });
    }

    function changeFilter(nextStatus: string) {
        updateParams({
            status: nextStatus === "ALL" ? null : nextStatus,
            page: null,
        });
    }

    if (reportsQuery.isLoading) {
        return <OutagesSkeleton />;
    }

    if (reportsQuery.isError) {
        return (
            <OutagesError
                onRetry={() => {
                    void reportsQuery.refetch();
                }}
            />
        );
    }

    return (
        <motion.div
            className="mx-auto w-full max-w-6xl"
            initial={
                shouldReduceMotion
                    ? false
                    : {
                        opacity: 0,
                        y: 20,
                    }
            }
            animate={{
                opacity: 1,
                y: 0,
            }}
            transition={{
                duration: 0.45,
                ease: "easeOut",
            }}
        >
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <div className="flex items-center gap-2 text-xs font-bold tracking-[0.12em] text-[var(--ps-primary)] uppercase">
                        <Zap className="size-4" />
                        Outage history
                    </div>

                    <h1 className="mt-2 text-3xl font-bold tracking-[-0.04em] text-[var(--ps-text)] sm:text-4xl">
                        My outages
                    </h1>

                    <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--ps-text-muted)] sm:text-base">
                        Track every outage you have reported and follow its progress through PowerSync.
                    </p>
                </div>
            </div>

            {reports.length === 0 ? (
                <EmptyOutages />
            ) : (
                <>
                    <div className="mt-7 grid gap-4 sm:grid-cols-3">
                        <SummaryCard
                            icon={FileText}
                            label="Total reports"
                            value={reports.length}
                            description="All submitted outage reports"
                            tone="primary"
                        />

                        <SummaryCard
                            icon={Clock3}
                            label="Awaiting review"
                            value={pendingCount}
                            description="Reports currently pending"
                            tone="warning"
                        />

                        <SummaryCard
                            icon={ShieldCheck}
                            label="Progressed"
                            value={progressedCount}
                            description="Reports beyond pending review"
                            tone="success"
                        />
                    </div>

                    <section className="mt-6 rounded-3xl border border-[var(--ps-border)] bg-[var(--ps-surface)] p-4 sm:p-5">
                        <div className="flex flex-col gap-4">
                            <div className="flex flex-col gap-3 md:flex-row md:items-center">
                                <div className="relative flex-1">
                                    <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[var(--ps-text-muted)]" />

                                    <Input
                                        value={query}
                                        onChange={(event) => {
                                            updateParams({
                                                q: event.target.value || null,
                                                page: null,
                                            });
                                        }}
                                        placeholder="Search reports, areas or IDs"
                                        className="h-11 rounded-xl bg-[var(--ps-background)] pl-9"
                                    />
                                </div>

                                <select
                                    value={sort}
                                    onChange={(event) => {
                                        updateParams({
                                            sort: event.target.value === "newest" ? null : event.target.value,
                                            page: null,
                                        });
                                    }}
                                    aria-label="Sort outage reports"
                                    className="h-11 cursor-pointer rounded-xl border border-[var(--ps-border)] bg-[var(--ps-background)] px-4 text-sm font-semibold text-[var(--ps-text)] outline-none transition-colors hover:border-[var(--ps-border-strong)] focus:border-[var(--ps-primary)]"
                                >
                                    <option value="newest">Newest first</option>

                                    <option value="oldest">Oldest first</option>
                                </select>
                            </div>

                            <div className="flex gap-2 overflow-x-auto pb-1">
                                <StatusFilterButton active={status === "ALL"} onClick={() => changeFilter("ALL")}>
                                    All
                                </StatusFilterButton>

                                {availableStatuses.map((availableStatus) => (
                                    <StatusFilterButton
                                        key={availableStatus}
                                        active={status === availableStatus}
                                        onClick={() => changeFilter(availableStatus)}
                                    >
                                        {formatLabel(availableStatus)}
                                    </StatusFilterButton>
                                ))}
                            </div>
                        </div>
                    </section>

                    <div className="mt-6">
                        <div className="mb-4 flex items-center justify-between gap-4">
                            <p className="text-sm font-semibold text-[var(--ps-text-muted)]">
                                {filteredReports.length} {filteredReports.length === 1 ? "report" : "reports"}
                            </p>

                            {query || status !== "ALL" ? (
                                <button
                                    type="button"
                                    onClick={() =>
                                        router.replace(pathname, {
                                            scroll: false,
                                        })
                                    }
                                    className="cursor-pointer text-sm font-semibold text-[var(--ps-primary)] transition-colors hover:text-[var(--ps-primary-hover)]"
                                >
                                    Clear filters
                                </button>
                            ) : null}
                        </div>

                        {visibleReports.length > 0 ? (
                            <motion.div
                                className="space-y-4"
                                initial="hidden"
                                animate="visible"
                                variants={{
                                    hidden: {},
                                    visible: {
                                        transition: {
                                            staggerChildren: shouldReduceMotion ? 0 : 0.06,
                                        },
                                    },
                                }}
                            >
                                {visibleReports.map((report) => (
                                    <OutageCard key={report.id} report={report} reducedMotion={shouldReduceMotion} />
                                ))}
                            </motion.div>
                        ) : (
                            <NoFilterResults
                                onClear={() =>
                                    router.replace(pathname, {
                                        scroll: false,
                                    })
                                }
                            />
                        )}
                    </div>

                    {totalPages > 1 ? (
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={(page) => {
                                updateParams({
                                    page: page === 1 ? null : String(page),
                                });
                            }}
                        />
                    ) : null}
                </>
            )}
        </motion.div>
    );
}

interface SummaryCardProps {
    icon: typeof FileText;
    label: string;
    value: number;
    description: string;
    tone: "primary" | "warning" | "success";
}

function SummaryCard({ icon: Icon, label, value, description, tone }: SummaryCardProps) {
    const toneClasses = {
        primary: "bg-[var(--ps-primary-soft)] text-[var(--ps-primary)]",
        warning: "bg-[var(--ps-warning-soft)] text-[var(--ps-warning)]",
        success: "bg-[var(--ps-success-soft)] text-[var(--ps-success)]",
    };

    return (
        <div className="rounded-3xl border border-[var(--ps-border)] bg-[var(--ps-surface)] p-5">
            <div
                className={cn("flex size-11 items-center justify-center rounded-2xl", toneClasses[tone])}
            >
                <Icon className="size-5" />
            </div>

            <p className="mt-5 text-2xl font-bold tracking-[-0.03em] text-[var(--ps-text)]">{value}</p>

            <p className="mt-1 text-sm font-bold text-[var(--ps-text)]">{label}</p>

            <p className="mt-1 text-xs leading-5 text-[var(--ps-text-muted)]">{description}</p>
        </div>
    );
}

interface StatusFilterButtonProps {
    children: React.ReactNode;
    active: boolean;
    onClick: () => void;
}

function StatusFilterButton({ children, active, onClick }: StatusFilterButtonProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "shrink-0 cursor-pointer rounded-full border px-4 py-2 text-xs font-bold transition-colors",
                active
                    ? "border-[var(--ps-primary)] bg-[var(--ps-primary-soft)] text-[var(--ps-primary)]"
                    : "border-[var(--ps-border)] bg-[var(--ps-background)] text-[var(--ps-text-muted)] hover:border-[var(--ps-border-strong)] hover:text-[var(--ps-text)]",
            )}
        >
            {children}
        </button>
    );
}

interface OutageCardProps {
    report: OutageReport;
    reducedMotion: boolean | null;
}

function OutageCard({ report, reducedMotion }: OutageCardProps) {
    return (
        <motion.article
            variants={{
                hidden: {
                    opacity: 0,
                    y: reducedMotion ? 0 : 14,
                },
                visible: {
                    opacity: 1,
                    y: 0,
                },
            }}
            transition={{
                duration: 0.35,
                ease: "easeOut",
            }}
            whileHover={
                reducedMotion
                    ? undefined
                    : {
                        y: -2,
                    }
            }
            className="rounded-3xl border border-[var(--ps-border)] bg-[var(--ps-surface)] p-5 transition-shadow hover:shadow-sm sm:p-6"
        >
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge status={report.status} />

                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--ps-background)] px-3 py-1.5 text-xs font-bold text-[var(--ps-text-soft)]">
                            {report.issueType === "TOTAL_OUTAGE" ? (
                                <Zap className="size-3.5" />
                            ) : (
                                <TriangleAlert className="size-3.5" />
                            )}

                            {getIssueTypeLabel(report.issueType)}
                        </span>
                    </div>

                    <h2 className="mt-4 text-lg font-bold text-[var(--ps-text)] sm:text-xl">
                        {report.area?.name ?? "Service area"}
                    </h2>

                    <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--ps-text-muted)]">
                        {report.description}
                    </p>
                </div>

                <Link
                    href={`/dashboard/outages/${report.id}`}
                    className="inline-flex min-h-10 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl border border-[var(--ps-border)] bg-[var(--ps-background)] px-4 text-sm font-semibold text-[var(--ps-text)] transition-colors hover:border-[var(--ps-border-strong)] hover:bg-[var(--ps-surface-muted)]"
                >
                    View details
                    <ArrowRight className="size-4" />
                </Link>
            </div>

            <div className="mt-6 grid gap-4 border-t border-[var(--ps-border)] pt-5 sm:grid-cols-2 lg:grid-cols-4">
                <ReportDetail
                    icon={MapPin}
                    label="Area"
                    value={report.area ? `${report.area.name} (${report.area.code})` : "Not available"}
                />

                <ReportDetail
                    icon={CalendarDays}
                    label="Reported"
                    value={formatDateTime(report.reportedAt)}
                />

                <ReportDetail icon={Clock3} label="Last updated" value={formatDateTime(report.updatedAt)} />

                <ReportDetail
                    icon={report.incidentId ? CheckCircle2 : FileText}
                    label="Incident"
                    value={report.incidentId ? "Linked" : "Not linked"}
                />
            </div>

            {report.reviewNote ? (
                <div className="mt-5 rounded-2xl bg-[var(--ps-background)] p-4">
                    <p className="text-xs font-bold tracking-[0.06em] text-[var(--ps-text-muted)] uppercase">
                        Review note
                    </p>

                    <p className="mt-2 text-sm leading-6 text-[var(--ps-text-soft)]">{report.reviewNote}</p>
                </div>
            ) : null}
        </motion.article>
    );
}

function StatusBadge({ status }: { status: string }) {
    const styles = getStatusStyles(status);

    return (
        <span
            className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold",
                styles,
            )}
        >
            <span className="size-1.5 rounded-full bg-current" />

            {formatLabel(status)}
        </span>
    );
}

function ReportDetail({
    icon: Icon,
    label,
    value,
}: {
    icon: typeof MapPin;
    label: string;
    value: string;
}) {
    return (
        <div className="flex gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[var(--ps-background)] text-[var(--ps-primary)]">
                <Icon className="size-4" />
            </div>

            <div className="min-w-0">
                <p className="text-[11px] font-semibold tracking-[0.06em] text-[var(--ps-text-muted)] uppercase">
                    {label}
                </p>

                <p className="mt-0.5 break-words text-sm font-semibold text-[var(--ps-text)]">{value}</p>
            </div>
        </div>
    );
}

function EmptyOutages() {
    return (
        <div className="mt-7 flex min-h-[430px] items-center justify-center rounded-3xl border border-[var(--ps-border)] bg-[var(--ps-surface)] p-7 text-center">
            <div className="max-w-lg">
                <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-[var(--ps-primary-soft)] text-[var(--ps-primary)]">
                    <Zap className="size-6" />
                </div>

                <h2 className="mt-5 text-2xl font-bold tracking-[-0.03em] text-[var(--ps-text)]">
                    No outage reports yet
                </h2>

                <p className="mt-2 text-sm leading-6 text-[var(--ps-text-muted)]">
                    When you report a power interruption, its status and service information will appear here.
                </p>

                <Link
                    href="/dashboard/report-outage"
                    className="mt-6 inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[var(--ps-primary)] px-5 text-sm font-semibold text-white transition-colors hover:bg-[var(--ps-primary-hover)]"
                >
                    Report an Outage
                    <ArrowRight className="size-4" />
                </Link>
            </div>
        </div>
    );
}

function NoFilterResults({ onClear }: { onClear: () => void }) {
    return (
        <div className="rounded-3xl border border-[var(--ps-border)] bg-[var(--ps-surface)] p-8 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-[var(--ps-background)] text-[var(--ps-text-muted)]">
                <Search className="size-5" />
            </div>

            <h2 className="mt-4 text-lg font-bold text-[var(--ps-text)]">No matching reports</h2>

            <p className="mt-2 text-sm text-[var(--ps-text-muted)]">
                Try changing your search or status filter.
            </p>

            <Button type="button" variant="outline" onClick={onClear} className="mt-5 cursor-pointer">
                Clear Filters
            </Button>
        </div>
    );
}

function OutagesError({ onRetry }: { onRetry: () => void }) {
    return (
        <div className="mx-auto flex min-h-[480px] w-full max-w-3xl items-center justify-center">
            <div className="w-full rounded-3xl border border-[var(--ps-border)] bg-[var(--ps-surface)] p-8 text-center">
                <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-[var(--ps-danger-soft)] text-[var(--ps-danger)]">
                    <CircleAlert className="size-5" />
                </div>

                <h1 className="mt-5 text-xl font-bold text-[var(--ps-text)]">
                    Unable to load your outages
                </h1>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--ps-text-muted)]">
                    PowerSync could not retrieve your outage history. Try loading it again.
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
        <div className="mt-6 flex items-center justify-between rounded-3xl border border-[var(--ps-border)] bg-[var(--ps-surface)] p-4">
            <Button
                type="button"
                variant="outline"
                disabled={currentPage === 1}
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
                disabled={currentPage === totalPages}
                onClick={() => onPageChange(currentPage + 1)}
                className="cursor-pointer disabled:cursor-not-allowed"
            >
                Next
            </Button>
        </div>
    );
}

function OutagesSkeleton() {
    return (
        <div className="mx-auto w-full max-w-6xl space-y-6">
            <div className="space-y-3">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-10 w-72 max-w-full" />
                <Skeleton className="h-5 w-full max-w-2xl" />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
                {Array.from({
                    length: 3,
                }).map((_, index) => (
                    <Skeleton key={index} className="h-28 rounded-3xl" />
                ))}
            </div>

            <Skeleton className="h-20 rounded-3xl" />

            <div className="space-y-4">
                {Array.from({
                    length: 3,
                }).map((_, index) => (
                    <Skeleton key={index} className="h-52 rounded-3xl" />
                ))}
            </div>
        </div>
    );
}

async function getCustomerOutages(): Promise<OutageReport[]> {
    const response = await fetch("/api/customer/outage-reports", {
        method: "GET",
        cache: "no-store",
    });

    const payload = (await response.json()) as ApiResponse<OutageReport[]>;

    if (!response.ok) {
        throw new Error(payload.message ?? payload.error ?? "Unable to load outage reports.");
    }

    return payload.data ?? [];
}

function parseSortOption(value: string | null): SortOption {
    return value === "oldest" ? "oldest" : "newest";
}

function parsePage(value: string | null) {
    const page = Number(value);

    if (!Number.isInteger(page) || page < 1) {
        return 1;
    }

    return page;
}

function getIssueTypeLabel(issueType: string) {
    if (issueType === "TOTAL_OUTAGE") {
        return "Complete outage";
    }

    if (issueType === "PARTIAL_OUTAGE") {
        return "Partial outage";
    }

    return formatLabel(issueType);
}

function getStatusStyles(status: string) {
    switch (status) {
        case "PENDING":
            return "bg-[var(--ps-warning-soft)] text-[var(--ps-warning)]";

        case "VERIFIED":
            return "bg-[var(--ps-success-soft)] text-[var(--ps-success)]";

        case "LINKED":
            return "bg-[var(--ps-primary-soft)] text-[var(--ps-primary)]";

        case "REJECTED":
            return "bg-[var(--ps-danger-soft)] text-[var(--ps-danger)]";

        default:
            return "bg-[var(--ps-background)] text-[var(--ps-text-soft)]";
    }
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
        return "Not available";
    }

    return value
        .toLowerCase()
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
}
