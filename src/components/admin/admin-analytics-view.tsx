"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  Activity,
  Banknote,
  BarChart3,
  CheckCircle2,
  CircleAlert,
  Clock3,
  Gauge,
  MapPin,
  RefreshCw,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface ApiResponse<T> {
  success?: boolean;
  message?: string;
  error?: string;
  data?: T;
}

interface AnalyticsOverview {
  analysisWindowDays: number;

  users: {
    customers: number;
    operators: number;
  };

  infrastructure: {
    zones: number;
    substations: number;
    feeders: number;
    areas: number;
  };

  outageOperations: {
    activeIncidents: number;
    pendingOrVerifiedReports: number;
    activeSchedules: number;
    averageRestorationMinutes: number;
  };

  billing: {
    unpaidBills: number;
    unpaidAmount: number | string;

    successfulPaymentsInWindow: number;
  };
}

interface IncidentTrend {
  analysisWindowDays: number;

  trend: Array<{
    date: string;
    opened: number;
    restored: number;
    closed: number;
  }>;
}

interface PriorityQueueItem {
  rank: number;
  incidentId: string;
  incidentCode: string;
  title: string;
  status: string;
  severity: string;
  restorationPriorityScore: number;
  waitingMinutes: number;
  linkedReportCount: number;

  area: {
    id: string;
    name: string;
    code: string;
    priority: string;

    feeder: {
      id: string;
      name: string;
      code: string;
    };
  };
}

interface AreaReliabilityItem {
  area: {
    id: string;
    name: string;
    code: string;
    priority: string;
  };

  feeder: {
    id: string;
    name: string;
    code: string;
  };

  metrics: {
    totalIncidents: number;
    activeIncidents: number;
    restoredIncidents: number;
    averageRestorationMinutes: number;
  };

  reliabilityScore: number;
  riskLevel: string;
}

interface AreaReliability {
  analysisWindowDays: number;

  scoring: {
    maximumScore: number;

    interpretation: Record<string, string>;
  };

  areas: AreaReliabilityItem[];
}

interface FeederReliabilityItem {
  feeder: {
    id: string;
    name: string;
    code: string;
  };

  metrics: {
    areaCount: number;
    totalIncidents: number;
    activeIncidents: number;
    restoredIncidents: number;
    averageRestorationMinutes: number;
  };

  reliabilityScore: number;
  riskLevel: string;
}

interface FeederReliability {
  analysisWindowDays: number;

  feeders: FeederReliabilityItem[];
}

interface AnalyticsData {
  overview: AnalyticsOverview;
  trend: IncidentTrend;
  priorityQueue: PriorityQueueItem[];
  areaReliability: AreaReliability;
  feederReliability: FeederReliability;
}

type AnalyticsWindow = 7 | 30 | 90;

export function AdminAnalyticsView() {
  const reducedMotion = useReducedMotion();

  const router = useRouter();

  const pathname = usePathname();

  const searchParams = useSearchParams();

  const days = parseDays(searchParams.get("days"));

  const analyticsQuery = useQuery({
    queryKey: ["admin", "analytics", days],

    queryFn: () => getAnalytics(days),

    placeholderData: keepPreviousData,
  });

  function changeWindow(nextDays: AnalyticsWindow) {
    const params = new URLSearchParams(searchParams.toString());

    if (nextDays === 30) {
      params.delete("days");
    } else {
      params.set("days", String(nextDays));
    }

    const next = params.toString();

    router.replace(next ? `${pathname}?${next}` : pathname, {
      scroll: false,
    });
  }

  if (analyticsQuery.isLoading) {
    return <AnalyticsLoading />;
  }

  if (analyticsQuery.isError || !analyticsQuery.data) {
    return (
      <AnalyticsError
        onRetry={() => {
          void analyticsQuery.refetch();
        }}
      />
    );
  }

  const { overview, trend, priorityQueue, areaReliability, feederReliability } =
    analyticsQuery.data;

  const areas = [...areaReliability.areas].sort(
    (first, second) => first.reliabilityScore - second.reliabilityScore,
  );

  const feeders = [...feederReliability.feeders].sort(
    (first, second) => first.reliabilityScore - second.reliabilityScore,
  );

  const averageAreaReliability = average(areas.map((item) => item.reliabilityScore));

  const averageFeederReliability = average(feeders.map((item) => item.reliabilityScore));

  const highRiskAreas = areas.filter(
    (item) => item.riskLevel === "HIGH_RISK" || item.riskLevel === "CRITICAL",
  ).length;

  const incidentTotals = trend.trend.reduce(
    (totals, item) => ({
      opened: totals.opened + item.opened,

      restored: totals.restored + item.restored,

      closed: totals.closed + item.closed,
    }),

    {
      opened: 0,
      restored: 0,
      closed: 0,
    },
  );

  const feederChartData = feeders.map((item) => ({
    name: item.feeder.code,

    fullName: item.feeder.name,

    reliability: item.reliabilityScore,

    incidents: item.metrics.totalIncidents,
  }));

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
        ease: "easeOut",
      }}
    >
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold tracking-[0.12em] text-[var(--ps-primary)] uppercase">
            <BarChart3 className="size-4" />
            Service intelligence
          </div>

          <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] text-[var(--ps-text)] sm:text-4xl">
            Analytics & Reliability
          </h1>

          <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--ps-text-muted)] sm:text-base">
            Measure outage activity, restoration performance, reliability risk and operational
            priorities across the PowerSync network.
          </p>
        </div>

        <div className="flex items-center gap-1 rounded-2xl border border-[var(--ps-border)] bg-[var(--ps-surface)] p-1">
          {([7, 30, 90] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => changeWindow(option)}
              className={cn(
                "min-h-9 cursor-pointer rounded-xl px-3 text-xs font-black transition-colors",
                days === option
                  ? "bg-[var(--ps-primary)] text-white"
                  : "text-[var(--ps-text-muted)] hover:bg-[var(--ps-primary-soft)] hover:text-[var(--ps-primary)]",
              )}
            >
              {option}D
            </button>
          ))}
        </div>
      </div>

      {analyticsQuery.isFetching ? (
        <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-[var(--ps-primary)]">
          <RefreshCw className="size-3.5 animate-spin" />
          Refreshing analytics...
        </div>
      ) : null}

      <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={Zap}
          label="Active incidents"
          value={overview.outageOperations.activeIncidents}
          description={`${overview.outageOperations.pendingOrVerifiedReports} reports awaiting processing`}
          tone="danger"
        />

        <MetricCard
          icon={Clock3}
          label="Avg. restoration"
          value={`${overview.outageOperations.averageRestorationMinutes} min`}
          description={`Across the last ${overview.analysisWindowDays} days`}
          tone="warning"
        />

        <MetricCard
          icon={Gauge}
          label="Area reliability"
          value={`${averageAreaReliability.toFixed(0)}%`}
          description={`${highRiskAreas} high-risk or critical areas`}
          tone="primary"
        />

        <MetricCard
          icon={Banknote}
          label="Unpaid balance"
          value={formatMoney(overview.billing.unpaidAmount)}
          description={`${overview.billing.unpaidBills} unpaid ${
            overview.billing.unpaidBills === 1 ? "bill" : "bills"
          }`}
          tone="success"
        />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <CompactMetric icon={TrendingUp} label="Opened" value={incidentTotals.opened} />

        <CompactMetric icon={Activity} label="Restored" value={incidentTotals.restored} />

        <CompactMetric icon={CheckCircleIcon} label="Closed" value={incidentTotals.closed} />

        <CompactMetric icon={Users} label="Customers" value={overview.users.customers} />
      </div>

      <div className="mt-7 grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <IncidentTrendChart data={trend.trend} days={days} />

        <ReliabilitySummary
          areas={areas}
          feeders={feeders}
          averageArea={averageAreaReliability}
          averageFeeder={averageFeederReliability}
        />
      </div>

      <div className="mt-7 grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <PriorityQueue items={priorityQueue} />

        <FeederReliabilityChart data={feederChartData} />
      </div>

      <div className="mt-7">
        <AreaReliabilityTable areas={areas} />
      </div>
    </motion.div>
  );
}

function IncidentTrendChart({ data, days }: { data: IncidentTrend["trend"]; days: number }) {
  return (
    <section className="rounded-3xl border border-[var(--ps-border)] bg-[var(--ps-surface)] p-5 sm:p-6">
      <div>
        <p className="text-xs font-bold tracking-[0.12em] text-[var(--ps-primary)] uppercase">
          Incident activity
        </p>

        <h2 className="mt-1 text-xl font-black tracking-[-0.03em] text-[var(--ps-text)]">
          Outage trend
        </h2>

        <p className="mt-1 text-xs text-[var(--ps-text-muted)]">
          Opened, restored and closed incidents over the last {days} days.
        </p>
      </div>

      <div className="mt-6 h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{
              top: 10,
              right: 12,
              left: -18,
              bottom: 0,
            }}
          >
            <CartesianGrid stroke="var(--ps-border)" strokeDasharray="4 4" vertical={false} />

            <XAxis
              dataKey="date"
              tickFormatter={formatChartDate}
              tick={{
                fill: "var(--ps-text-muted)",
                fontSize: 11,
              }}
              axisLine={{
                stroke: "var(--ps-border)",
              }}
              tickLine={false}
              minTickGap={24}
            />

            <YAxis
              allowDecimals={false}
              tick={{
                fill: "var(--ps-text-muted)",
                fontSize: 11,
              }}
              axisLine={false}
              tickLine={false}
            />

            <Tooltip
              labelFormatter={(label) => formatFullDate(String(label))}
              contentStyle={{
                borderRadius: "12px",
                border: "1px solid var(--ps-border)",
                backgroundColor: "var(--ps-surface)",
                color: "var(--ps-text)",
                fontSize: "12px",
              }}
            />

            <Line
              type="monotone"
              dataKey="opened"
              name="Opened"
              stroke="var(--ps-primary)"
              strokeWidth={2.5}
              dot={false}
              activeDot={{
                r: 4,
              }}
            />

            <Line
              type="monotone"
              dataKey="restored"
              name="Restored"
              stroke="var(--ps-success)"
              strokeWidth={2.5}
              dot={false}
              activeDot={{
                r: 4,
              }}
            />

            <Line
              type="monotone"
              dataKey="closed"
              name="Closed"
              stroke="var(--ps-text-muted)"
              strokeWidth={2}
              dot={false}
              activeDot={{
                r: 4,
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 flex flex-wrap gap-4 border-t border-[var(--ps-border)] pt-4">
        <ChartLegend label="Opened" className="bg-[var(--ps-primary)]" />

        <ChartLegend label="Restored" className="bg-[var(--ps-success)]" />

        <ChartLegend label="Closed" className="bg-[var(--ps-text-muted)]" />
      </div>
    </section>
  );
}

function ReliabilitySummary({
  areas,
  feeders,
  averageArea,
  averageFeeder,
}: {
  areas: AreaReliabilityItem[];
  feeders: FeederReliabilityItem[];
  averageArea: number;
  averageFeeder: number;
}) {
  const critical = areas.filter((item) => item.riskLevel === "CRITICAL").length;

  const highRisk = areas.filter((item) => item.riskLevel === "HIGH_RISK").length;

  const watch = areas.filter((item) => item.riskLevel === "WATCH").length;

  const reliable = areas.filter((item) => item.riskLevel === "RELIABLE").length;

  return (
    <section className="rounded-3xl border border-[var(--ps-border)] bg-[var(--ps-surface)] p-5 sm:p-6">
      <p className="text-xs font-bold tracking-[0.12em] text-[var(--ps-primary)] uppercase">
        Reliability
      </p>

      <h2 className="mt-1 text-xl font-black tracking-[-0.03em] text-[var(--ps-text)]">
        Network health
      </h2>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <ReliabilityMetric label="Area average" value={averageArea} />

        <ReliabilityMetric label="Feeder average" value={averageFeeder} />
      </div>

      <div className="mt-5 space-y-2.5">
        <RiskRow label="Critical" value={critical} tone="danger" />

        <RiskRow label="High risk" value={highRisk} tone="warning" />

        <RiskRow label="Watch" value={watch} tone="primary" />

        <RiskRow label="Reliable" value={reliable} tone="success" />
      </div>

      <div className="mt-5 rounded-2xl bg-[var(--ps-surface-muted)] p-4">
        <p className="text-xs font-black text-[var(--ps-text)]">Coverage</p>

        <p className="mt-2 text-sm font-black text-[var(--ps-text)]">
          {areas.length} areas · {feeders.length} feeders
        </p>

        <p className="mt-1 text-xs leading-5 text-[var(--ps-text-muted)]">
          Reliability is calculated from incident activity and restoration performance.
        </p>
      </div>
    </section>
  );
}

function PriorityQueue({ items }: { items: PriorityQueueItem[] }) {
  return (
    <section className="rounded-3xl border border-[var(--ps-border)] bg-[var(--ps-surface)] p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold tracking-[0.12em] text-[var(--ps-primary)] uppercase">
            Restoration
          </p>

          <h2 className="mt-1 text-xl font-black tracking-[-0.03em] text-[var(--ps-text)]">
            Priority queue
          </h2>
        </div>

        <span className="rounded-full bg-[var(--ps-warning-soft)] px-3 py-1 text-xs font-black text-[var(--ps-warning)]">
          {items.length}
        </span>
      </div>

      <div className="mt-5 space-y-3">
        {items.length > 0 ? (
          items.map((item) => (
            <div
              key={item.incidentId}
              className="rounded-2xl border border-[var(--ps-border)] bg-[var(--ps-background)] p-4"
            >
              <div className="flex items-start gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[var(--ps-danger-soft)] text-xs font-black text-[var(--ps-danger)]">
                  #{item.rank}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-xs font-black text-[var(--ps-primary)]">
                      {item.incidentCode}
                    </p>

                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-black",
                        riskBadge(item.severity),
                      )}
                    >
                      {formatLabel(item.severity)}
                    </span>
                  </div>

                  <p className="mt-1 text-sm font-black text-[var(--ps-text)]">{item.title}</p>

                  <p className="mt-1 text-xs text-[var(--ps-text-muted)]">
                    {item.area.name} · {item.area.feeder.name}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-bold text-[var(--ps-text-muted)]">
                    <span className="rounded-lg bg-[var(--ps-surface-muted)] px-2 py-1">
                      Score {item.restorationPriorityScore}
                    </span>

                    <span className="rounded-lg bg-[var(--ps-surface-muted)] px-2 py-1">
                      Waiting {formatMinutes(item.waitingMinutes)}
                    </span>

                    <span className="rounded-lg bg-[var(--ps-surface-muted)] px-2 py-1">
                      {item.linkedReportCount} reports
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="rounded-2xl border border-dashed border-[var(--ps-border)] p-8 text-center text-sm text-[var(--ps-text-muted)]">
            No active incidents currently require restoration prioritization.
          </p>
        )}
      </div>
    </section>
  );
}

function FeederReliabilityChart({
  data,
}: {
  data: Array<{
    name: string;
    fullName: string;
    reliability: number;
    incidents: number;
  }>;
}) {
  return (
    <section className="rounded-3xl border border-[var(--ps-border)] bg-[var(--ps-surface)] p-5 sm:p-6">
      <p className="text-xs font-bold tracking-[0.12em] text-[var(--ps-primary)] uppercase">
        Distribution grid
      </p>

      <h2 className="mt-1 text-xl font-black tracking-[-0.03em] text-[var(--ps-text)]">
        Feeder reliability
      </h2>

      <p className="mt-1 text-xs text-[var(--ps-text-muted)]">
        Comparative reliability scores across distribution feeders.
      </p>

      {data.length > 0 ? (
        <div className="mt-6 h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{
                top: 10,
                right: 12,
                left: -18,
                bottom: 0,
              }}
            >
              <CartesianGrid stroke="var(--ps-border)" strokeDasharray="4 4" vertical={false} />

              <XAxis
                dataKey="name"
                tick={{
                  fill: "var(--ps-text-muted)",
                  fontSize: 11,
                }}
                axisLine={{
                  stroke: "var(--ps-border)",
                }}
                tickLine={false}
              />

              <YAxis
                domain={[0, 100]}
                tick={{
                  fill: "var(--ps-text-muted)",
                  fontSize: 11,
                }}
                axisLine={false}
                tickLine={false}
              />

              <Tooltip
                formatter={(value) => [`${Number(value)}%`, "Reliability"]}
                labelFormatter={(label) => {
                  const row = data.find((item) => item.name === label);

                  return row?.fullName ?? String(label);
                }}
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid var(--ps-border)",
                  backgroundColor: "var(--ps-surface)",
                  color: "var(--ps-text)",
                  fontSize: "12px",
                }}
              />

              <Bar
                dataKey="reliability"
                name="Reliability"
                fill="var(--ps-primary)"
                radius={[7, 7, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="mt-6 rounded-2xl border border-dashed border-[var(--ps-border)] p-8 text-center text-sm text-[var(--ps-text-muted)]">
          No feeder reliability data is available.
        </p>
      )}
    </section>
  );
}

function AreaReliabilityTable({ areas }: { areas: AreaReliabilityItem[] }) {
  return (
    <section className="overflow-hidden rounded-3xl border border-[var(--ps-border)] bg-[var(--ps-surface)]">
      <div className="border-b border-[var(--ps-border)] p-5 sm:p-6">
        <div className="flex items-center gap-2">
          <MapPin className="size-4 text-[var(--ps-primary)]" />

          <p className="text-xs font-bold tracking-[0.12em] text-[var(--ps-primary)] uppercase">
            Service areas
          </p>
        </div>

        <h2 className="mt-2 text-xl font-black tracking-[-0.03em] text-[var(--ps-text)]">
          Reliability ranking
        </h2>

        <p className="mt-1 text-xs text-[var(--ps-text-muted)]">
          Lowest reliability is shown first so operational risk is immediately visible.
        </p>
      </div>

      {areas.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] border-collapse">
            <thead>
              <tr className="bg-[var(--ps-surface-muted)] text-left text-[11px] font-black tracking-[0.06em] text-[var(--ps-text-muted)] uppercase">
                <th className="px-5 py-3">Area</th>

                <th className="px-5 py-3">Feeder</th>

                <th className="px-5 py-3">Reliability</th>

                <th className="px-5 py-3">Risk</th>

                <th className="px-5 py-3">Incidents</th>

                <th className="px-5 py-3">Active</th>

                <th className="px-5 py-3">Avg. restoration</th>
              </tr>
            </thead>

            <tbody>
              {areas.map((item) => (
                <tr key={item.area.id} className="border-t border-[var(--ps-border)] text-sm">
                  <td className="px-5 py-4">
                    <p className="font-black text-[var(--ps-text)]">{item.area.name}</p>

                    <p className="mt-0.5 text-xs text-[var(--ps-text-muted)]">{item.area.code}</p>
                  </td>

                  <td className="px-5 py-4">
                    <p className="font-semibold text-[var(--ps-text-soft)]">{item.feeder.name}</p>

                    <p className="mt-0.5 text-xs text-[var(--ps-text-muted)]">{item.feeder.code}</p>
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-20 overflow-hidden rounded-full bg-[var(--ps-surface-muted)]">
                        <div
                          className="h-full rounded-full bg-[var(--ps-primary)]"
                          style={{
                            width: `${clampScore(item.reliabilityScore)}%`,
                          }}
                        />
                      </div>

                      <span className="font-black text-[var(--ps-text)]">
                        {item.reliabilityScore}
                      </span>
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2.5 py-1 text-[10px] font-black",
                        riskBadge(item.riskLevel),
                      )}
                    >
                      {formatLabel(item.riskLevel)}
                    </span>
                  </td>

                  <td className="px-5 py-4 font-bold text-[var(--ps-text)]">
                    {item.metrics.totalIncidents}
                  </td>

                  <td className="px-5 py-4 font-bold text-[var(--ps-text)]">
                    {item.metrics.activeIncidents}
                  </td>

                  <td className="px-5 py-4 font-semibold text-[var(--ps-text-soft)]">
                    {item.metrics.averageRestorationMinutes > 0
                      ? `${item.metrics.averageRestorationMinutes} min`
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="p-8 text-center text-sm text-[var(--ps-text-muted)]">
          No area reliability data is available.
        </p>
      )}
    </section>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  description,
  tone,
}: {
  icon: typeof Zap;
  label: string;
  value: string | number;
  description: string;
  tone: "primary" | "warning" | "danger" | "success";
}) {
  const styles = {
    primary: "bg-[var(--ps-primary-soft)] text-[var(--ps-primary)]",

    warning: "bg-[var(--ps-warning-soft)] text-[var(--ps-warning)]",

    danger: "bg-[var(--ps-danger-soft)] text-[var(--ps-danger)]",

    success: "bg-[var(--ps-success-soft)] text-[var(--ps-success)]",
  };

  return (
    <div className="rounded-2xl border border-[var(--ps-border)] bg-[var(--ps-surface)] p-4">
      <div className={cn("flex size-10 items-center justify-center rounded-xl", styles[tone])}>
        <Icon className="size-4" />
      </div>

      <p className="mt-4 text-2xl font-black tracking-[-0.04em] text-[var(--ps-text)]">{value}</p>

      <p className="mt-1 text-sm font-black text-[var(--ps-text)]">{label}</p>

      <p className="mt-1 text-xs leading-5 text-[var(--ps-text-muted)]">{description}</p>
    </div>
  );
}

function CompactMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Activity;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-[var(--ps-border)] bg-[var(--ps-surface)] p-4">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[var(--ps-primary-soft)] text-[var(--ps-primary)]">
        <Icon className="size-4" />
      </div>

      <div>
        <p className="text-lg font-black text-[var(--ps-text)]">{value}</p>

        <p className="text-xs font-semibold text-[var(--ps-text-muted)]">{label}</p>
      </div>
    </div>
  );
}

function ReliabilityMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-[var(--ps-background)] p-4">
      <p className="text-2xl font-black tracking-[-0.04em] text-[var(--ps-text)]">
        {value.toFixed(0)}%
      </p>

      <p className="mt-1 text-xs font-semibold text-[var(--ps-text-muted)]">{label}</p>
    </div>
  );
}

function RiskRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "primary" | "warning" | "danger" | "success";
}) {
  const styles = {
    primary: "bg-[var(--ps-primary-soft)] text-[var(--ps-primary)]",

    warning: "bg-[var(--ps-warning-soft)] text-[var(--ps-warning)]",

    danger: "bg-[var(--ps-danger-soft)] text-[var(--ps-danger)]",

    success: "bg-[var(--ps-success-soft)] text-[var(--ps-success)]",
  };

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-[var(--ps-border)] p-3">
      <span className="text-xs font-bold text-[var(--ps-text-soft)]">{label}</span>

      <span
        className={cn("min-w-8 rounded-lg px-2 py-1 text-center text-xs font-black", styles[tone])}
      >
        {value}
      </span>
    </div>
  );
}

function ChartLegend({ label, className }: { label: string; className: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--ps-text-muted)]">
      <span className={cn("size-2 rounded-full", className)} />

      {label}
    </span>
  );
}

function AnalyticsError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="mx-auto flex min-h-[500px] max-w-3xl items-center justify-center">
      <div className="w-full rounded-3xl border border-[var(--ps-border)] bg-[var(--ps-surface)] p-8 text-center">
        <CircleAlert className="mx-auto size-6 text-[var(--ps-danger)]" />

        <h1 className="mt-4 text-xl font-black text-[var(--ps-text)]">Unable to load analytics</h1>

        <p className="mt-2 text-sm text-[var(--ps-text-muted)]">
          PowerSync could not retrieve the latest service intelligence.
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

function AnalyticsLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <Skeleton className="h-10 w-72" />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({
          length: 4,
        }).map((_, index) => (
          <Skeleton key={index} className="h-36 rounded-2xl" />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Skeleton className="h-[420px] rounded-3xl" />

        <Skeleton className="h-[420px] rounded-3xl" />
      </div>
    </div>
  );
}

const CheckCircleIcon = CheckCircle2;

async function getAnalytics(days: AnalyticsWindow): Promise<AnalyticsData> {
  const response = await fetch(`/api/admin/analytics?days=${days}`, {
    cache: "no-store",
  });

  const payload = (await response.json()) as ApiResponse<AnalyticsData>;

  if (!response.ok || !payload.data) {
    throw new Error(payload.message ?? payload.error ?? "Unable to load analytics.");
  }

  return payload.data;
}

function parseDays(value: string | null): AnalyticsWindow {
  const number = Number(value);

  if (number === 7 || number === 90) {
    return number;
  }

  return 30;
}

function average(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((total, value) => total + value, 0) / values.length;
}

function clampScore(value: number) {
  return Math.min(100, Math.max(0, value));
}

function riskBadge(value: string) {
  switch (value) {
    case "CRITICAL":
      return "bg-[var(--ps-danger-soft)] text-[var(--ps-danger)]";

    case "HIGH":
    case "HIGH_RISK":
      return "bg-[var(--ps-warning-soft)] text-[var(--ps-warning)]";

    case "WATCH":
    case "MEDIUM":
      return "bg-[var(--ps-primary-soft)] text-[var(--ps-primary)]";

    case "RELIABLE":
    case "LOW":
      return "bg-[var(--ps-success-soft)] text-[var(--ps-success)]";

    default:
      return "bg-[var(--ps-surface-muted)] text-[var(--ps-text-muted)]";
  }
}

function formatMoney(value: number | string) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "BDT 0";
  }

  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatMinutes(minutes: number) {
  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);

  const remaining = minutes % 60;

  return remaining > 0 ? `${hours}h ${remaining}m` : `${hours}h`;
}

function formatChartDate(value: string) {
  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(date);
}

function formatFullDate(value: string) {
  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
  }).format(date);
}

function formatLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
