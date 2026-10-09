"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  ChevronDown,
  CircleAlert,
  LoaderCircle,
  MapPin,
  Network,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type ResourceType = "zones" | "substations" | "feeders" | "areas";

type FormMode = "create" | "edit";

type AreaPriority = "NORMAL" | "HIGH" | "CRITICAL";

interface ApiResponse<T> {
  success?: boolean;
  message?: string;
  error?: string;
  data?: T;
}

interface Zone {
  id: string;
  name: string;
  code: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

interface Substation {
  id: string;
  name: string;
  code: string;
  description: string | null;
  status: string;
  zoneId: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;

  zone?: {
    id: string;
    name: string;
    code: string;
  };
}

interface Feeder {
  id: string;
  name: string;
  code: string;
  description: string | null;
  capacityMw: number | string;
  status: string;
  substationId: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;

  substation?: {
    id: string;
    name: string;
    code: string;

    zone?: {
      id: string;
      name: string;
      code: string;
    };
  };
}

interface Area {
  id: string;
  name: string;
  code: string;
  description: string | null;
  priority: string;
  latitude: number | string;
  longitude: number | string;
  feederId: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;

  feeder?: {
    id: string;
    name: string;
    code: string;

    substation?: {
      id: string;
      name: string;
      code: string;

      zone?: {
        id: string;
        name: string;
        code: string;
      };
    };
  };
}

interface InfrastructureData {
  zones: Zone[];
  substations: Substation[];
  feeders: Feeder[];
  areas: Area[];
}

interface ResourceRow {
  id: string;
  name: string;
  code: string;
  description: string;

  status?: string;

  parentName?: string;
  parentCode?: string;

  capacityMw?: number;

  priority?: string;

  latitude?: number;
  longitude?: number;

  childCount?: number;
  childLabel?: string;
}

interface SaveVariables {
  mode: FormMode;
  resource: ResourceType;
  id?: string;
  payload: Record<string, unknown>;
}

interface DeleteVariables {
  resource: ResourceType;
  id: string;
  label: string;
}

const infrastructureKey = ["admin", "infrastructure"];

const resourceConfig: Record<
  ResourceType,
  {
    label: string;
    singular: string;
    description: string;
    icon: LucideIcon;
  }
> = {
  zones: {
    label: "Zones",
    singular: "Zone",
    description: "Top-level service regions in the PowerSync network.",
    icon: Network,
  },

  substations: {
    label: "Substations",
    singular: "Substation",
    description: "Grid substations assigned to service zones.",
    icon: Building2,
  },

  feeders: {
    label: "Feeders",
    singular: "Feeder",
    description: "Distribution feeders connected to substations.",
    icon: Zap,
  },

  areas: {
    label: "Areas",
    singular: "Area",
    description: "Customer service areas supplied by feeders.",
    icon: MapPin,
  },
};

const baseFormSchema = z.object({
  name: z.string(),
  code: z.string(),
  description: z.string(),
  parentId: z.string(),

  capacityMw: z.string(),

  priority: z.enum(["NORMAL", "HIGH", "CRITICAL"]),

  latitude: z.string(),
  longitude: z.string(),
});

type InfrastructureFormValues = z.infer<typeof baseFormSchema>;

export function AdminInfrastructureView() {
  const reducedMotion = useReducedMotion();

  const router = useRouter();

  const pathname = usePathname();

  const searchParams = useSearchParams();

  const queryClient = useQueryClient();

  const resource = parseResource(searchParams.get("type"));

  const q = searchParams.get("q")?.trim() ?? "";

  const editingId = searchParams.get("edit")?.trim() ?? "";

  const [showCreate, setShowCreate] = useState(false);

  const infrastructureQuery = useQuery({
    queryKey: infrastructureKey,

    queryFn: getInfrastructure,

    placeholderData: keepPreviousData,
  });

  const saveMutation = useMutation({
    mutationFn: saveInfrastructure,

    onSuccess: async (response, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: infrastructureKey,
        }),

        queryClient.invalidateQueries({
          queryKey: ["admin", "overview"],
        }),

        queryClient.invalidateQueries({
          queryKey: ["admin", "analytics"],
        }),
      ]);

      toast.success(
        response.message ?? `${resourceConfig[variables.resource].singular} saved successfully.`,
      );

      if (variables.mode === "create") {
        setShowCreate(false);
      } else {
        updateParams({
          edit: null,
        });
      }
    },

    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteInfrastructure,

    onSuccess: async (response, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: infrastructureKey,
        }),

        queryClient.invalidateQueries({
          queryKey: ["admin", "overview"],
        }),

        queryClient.invalidateQueries({
          queryKey: ["admin", "analytics"],
        }),
      ]);

      updateParams({
        edit: null,
      });

      toast.success(response.message ?? `${variables.label} deleted successfully.`);
    },

    onError: (error) => {
      toast.error(error.message);
    },
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

  function selectResource(nextResource: ResourceType) {
    setShowCreate(false);

    updateParams({
      type: nextResource === "zones" ? null : nextResource,

      q: null,

      edit: null,
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

    params.delete("edit");

    const next = params.toString();

    router.replace(next ? `${pathname}?${next}` : pathname, {
      scroll: false,
    });
  }

  if (infrastructureQuery.isLoading) {
    return <InfrastructureLoading />;
  }

  if (infrastructureQuery.isError || !infrastructureQuery.data) {
    return (
      <InfrastructureError
        onRetry={() => {
          void infrastructureQuery.refetch();
        }}
      />
    );
  }

  const data = infrastructureQuery.data;

  const rows = getRows(resource, data);

  const normalizedQ = q.toLowerCase();

  const filteredRows = rows.filter((row) => {
    if (!normalizedQ) {
      return true;
    }

    return [
      row.name,
      row.code,
      row.description,
      row.status ?? "",
      row.parentName ?? "",
      row.parentCode ?? "",
      row.priority ?? "",
    ]
      .join(" ")
      .toLowerCase()
      .includes(normalizedQ);
  });

  const config = resourceConfig[resource];

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
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs font-bold tracking-[0.12em] text-[var(--ps-primary)] uppercase">
            <Network className="size-4 shrink-0" />
            Network administration
          </div>

          <h1 className="mt-2 text-2xl font-black tracking-[-0.04em] text-[var(--ps-text)] sm:text-3xl lg:text-4xl">
            Infrastructure Management
          </h1>

          <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--ps-text-muted)] sm:text-base">
            Manage the complete PowerSync distribution hierarchy from service zones down to
            individual customer areas.
          </p>
        </div>

        <Button
          type="button"
          onClick={() => {
            setShowCreate((current) => !current);

            updateParams({
              edit: null,
            });
          }}
          className="w-full cursor-pointer bg-[var(--ps-primary)] text-white hover:bg-[var(--ps-primary-hover)] sm:w-auto"
        >
          {showCreate ? <ChevronDown className="size-4 rotate-180" /> : <Plus className="size-4" />}

          {showCreate ? "Close form" : `New ${config.singular.toLowerCase()}`}
        </Button>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <SummaryCard icon={Network} label="Zones" value={data.zones.length} tone="primary" />

        <SummaryCard
          icon={Building2}
          label="Substations"
          value={data.substations.length}
          tone="success"
        />

        <SummaryCard icon={Zap} label="Feeders" value={data.feeders.length} tone="warning" />

        <SummaryCard icon={MapPin} label="Areas" value={data.areas.length} tone="danger" />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-2 rounded-2xl border border-[var(--ps-border)] bg-[var(--ps-surface)] p-2 md:grid-cols-4">
        {(Object.keys(resourceConfig) as ResourceType[]).map((item) => {
          const itemConfig = resourceConfig[item];

          const Icon = itemConfig.icon;

          const active = resource === item;

          return (
            <button
              key={item}
              type="button"
              onClick={() => selectResource(item)}
              className={cn(
                "flex min-w-0 cursor-pointer items-center justify-center gap-2 rounded-xl px-3 py-3 text-xs font-black transition-colors sm:text-sm",
                active
                  ? "bg-[var(--ps-primary-soft)] text-[var(--ps-primary)]"
                  : "text-[var(--ps-text-muted)] hover:bg-[var(--ps-surface-muted)] hover:text-[var(--ps-text)]",
              )}
            >
              <Icon className="size-4 shrink-0" />

              <span className="truncate">{itemConfig.label}</span>
            </button>
          );
        })}
      </div>

      {showCreate ? (
        <div className="mt-5">
          <InfrastructureForm
            key={`create-${resource}`}
            mode="create"
            resource={resource}
            data={data}
            saving={
              saveMutation.isPending &&
              saveMutation.variables?.mode === "create" &&
              saveMutation.variables.resource === resource
            }
            onCancel={() => setShowCreate(false)}
            onSubmit={(values) => {
              saveMutation.mutate({
                mode: "create",

                resource,

                payload: buildPayload(resource, "create", values),
              });
            }}
          />
        </div>
      ) : null}

      <div className="mt-5 rounded-2xl border border-[var(--ps-border)] bg-[var(--ps-surface)] p-3 sm:p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-black text-[var(--ps-text)]">{config.label}</p>

            <p className="mt-1 text-xs leading-5 text-[var(--ps-text-muted)]">
              {config.description}
            </p>
          </div>

          <div className="w-full lg:max-w-md">
            <DebouncedSearch
              key={`${resource}-${q}`}
              initialValue={q}
              onSearch={commitSearch}
              placeholder={`Search ${config.label.toLowerCase()}...`}
            />
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-black text-[var(--ps-text)]">{config.label} directory</p>

          <p className="mt-1 text-xs text-[var(--ps-text-muted)]">
            {filteredRows.length} matching{" "}
            {filteredRows.length === 1 ? config.singular.toLowerCase() : config.label.toLowerCase()}
          </p>
        </div>

        {infrastructureQuery.isFetching ? (
          <div className="flex items-center gap-2 text-xs font-bold text-[var(--ps-primary)]">
            <RefreshCw className="size-3.5 animate-spin" />
            Refreshing
          </div>
        ) : null}
      </div>

      <div className="mt-4 space-y-3">
        {filteredRows.length > 0 ? (
          filteredRows.map((row) => {
            const isEditing = editingId === row.id;

            const hasChildren = Boolean(row.childCount && row.childCount > 0);

            const isSaving =
              saveMutation.isPending &&
              saveMutation.variables?.mode === "edit" &&
              saveMutation.variables.resource === resource &&
              saveMutation.variables.id === row.id;

            const isDeleting =
              deleteMutation.isPending &&
              deleteMutation.variables?.resource === resource &&
              deleteMutation.variables.id === row.id;

            return (
              <ResourceCard
                key={row.id}
                resource={resource}
                row={row}
                data={data}
                editing={isEditing}
                saving={isSaving}
                deleting={isDeleting}
                hasChildren={hasChildren}
                onEdit={() => {
                  setShowCreate(false);

                  updateParams({
                    edit: isEditing ? null : row.id,
                  });
                }}
                onCancelEdit={() =>
                  updateParams({
                    edit: null,
                  })
                }
                onSave={(values) => {
                  saveMutation.mutate({
                    mode: "edit",

                    resource,

                    id: row.id,

                    payload: buildPayload(resource, "edit", values),
                  });
                }}
                onDelete={() => {
                  const confirmed = window.confirm(
                    `Delete ${config.singular.toLowerCase()} "${row.name}"? This request will be sent to the real PowerSync backend.`,
                  );

                  if (!confirmed) {
                    return;
                  }

                  deleteMutation.mutate({
                    resource,

                    id: row.id,

                    label: row.name,
                  });
                }}
              />
            );
          })
        ) : (
          <EmptyInfrastructure resource={resource} />
        )}
      </div>

      <div className="mt-6 rounded-2xl border border-[var(--ps-border)] bg-[var(--ps-surface-muted)] p-4">
        <div className="flex items-start gap-3">
          <CircleAlert className="mt-0.5 size-4 shrink-0 text-[var(--ps-primary)]" />

          <div className="min-w-0">
            <p className="text-xs font-black text-[var(--ps-text)]">Hierarchy protection</p>

            <p className="mt-1 text-xs leading-5 text-[var(--ps-text-muted)]">
              PowerSync follows Zone → Substation → Feeder → Area. This UI prevents deleting a
              parent while child infrastructure is still visible beneath it. Area deletion is still
              validated by the backend because customer and operational records may reference that
              area.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function ResourceCard({
  resource,
  row,
  data,
  editing,
  saving,
  deleting,
  hasChildren,
  onEdit,
  onCancelEdit,
  onSave,
  onDelete,
}: {
  resource: ResourceType;
  row: ResourceRow;
  data: InfrastructureData;

  editing: boolean;
  saving: boolean;
  deleting: boolean;
  hasChildren: boolean;

  onEdit: () => void;
  onCancelEdit: () => void;

  onSave: (values: InfrastructureFormValues) => void;

  onDelete: () => void;
}) {
  const config = resourceConfig[resource];

  const Icon = config.icon;

  return (
    <article className="overflow-hidden rounded-2xl border border-[var(--ps-border)] bg-[var(--ps-surface)] sm:rounded-3xl">
      <div className="p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--ps-primary-soft)] text-[var(--ps-primary)]">
              <Icon className="size-4" />
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[var(--ps-surface-muted)] px-2.5 py-1 text-[10px] font-black text-[var(--ps-text-muted)]">
                  {row.code}
                </span>

                {row.status ? (
                  <span className="rounded-full bg-[var(--ps-success-soft)] px-2.5 py-1 text-[10px] font-black text-[var(--ps-success)]">
                    {formatLabel(row.status)}
                  </span>
                ) : null}

                {row.priority ? (
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-1 text-[10px] font-black",
                      priorityClass(row.priority),
                    )}
                  >
                    {formatLabel(row.priority)}
                  </span>
                ) : null}
              </div>

              <h2 className="mt-2 break-words text-base font-black text-[var(--ps-text)] sm:text-lg">
                {row.name}
              </h2>

              <p className="mt-1 max-w-3xl break-words text-sm leading-6 text-[var(--ps-text-muted)]">
                {row.description || "No description provided."}
              </p>
            </div>
          </div>

          <div className="grid w-full grid-cols-2 gap-2 sm:flex lg:w-auto">
            <Button type="button" variant="outline" onClick={onEdit} className="cursor-pointer">
              <Pencil className="size-4" />

              {editing ? "Close" : "Edit"}
            </Button>

            <Button
              type="button"
              variant="outline"
              disabled={hasChildren || deleting}
              onClick={onDelete}
              className="cursor-pointer border-[var(--ps-danger)] text-[var(--ps-danger)] hover:bg-[var(--ps-danger-soft)] hover:text-[var(--ps-danger)] disabled:cursor-not-allowed"
            >
              {deleting ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <Trash2 className="size-4" />
              )}
              Delete
            </Button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {row.parentName ? (
            <MetaItem label="Parent" value={row.parentName} secondary={row.parentCode} />
          ) : null}

          {row.capacityMw !== undefined ? (
            <MetaItem label="Capacity" value={`${row.capacityMw} MW`} />
          ) : null}

          {row.latitude !== undefined && row.longitude !== undefined ? (
            <MetaItem label="Coordinates" value={`${row.latitude}, ${row.longitude}`} />
          ) : null}

          {row.childCount !== undefined ? (
            <MetaItem label={row.childLabel ?? "Children"} value={String(row.childCount)} />
          ) : null}
        </div>

        {hasChildren ? (
          <p className="mt-3 text-xs font-semibold text-[var(--ps-warning)]">
            Delete is disabled while this {config.singular.toLowerCase()} contains child
            infrastructure.
          </p>
        ) : null}
      </div>

      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-300 ease-out",
          editing ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="overflow-hidden">
          <div className="border-t border-[var(--ps-border)] bg-[var(--ps-background)] p-4 sm:p-5">
            <InfrastructureForm
              key={`${resource}-${row.id}`}
              mode="edit"
              resource={resource}
              data={data}
              row={row}
              saving={saving}
              onCancel={onCancelEdit}
              onSubmit={onSave}
            />
          </div>
        </div>
      </div>
    </article>
  );
}

function InfrastructureForm({
  mode,
  resource,
  data,
  row,
  saving,
  onCancel,
  onSubmit,
}: {
  mode: FormMode;
  resource: ResourceType;
  data: InfrastructureData;
  row?: ResourceRow;
  saving: boolean;

  onCancel: () => void;

  onSubmit: (values: InfrastructureFormValues) => void;
}) {
  const config = resourceConfig[resource];

  const parentOptions = getParentOptions(resource, data);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<InfrastructureFormValues>({
    resolver: zodResolver(buildFormSchema(resource, mode)),

    defaultValues: getDefaultValues(row),
  });

  const noParentAvailable = mode === "create" && resource !== "zones" && parentOptions.length === 0;

  return (
    <section className="rounded-2xl border border-[var(--ps-border)] bg-[var(--ps-surface)] p-4 sm:p-5">
      <div>
        <p className="text-xs font-black tracking-[0.08em] text-[var(--ps-primary)] uppercase">
          {mode === "create" ? `Create ${config.singular}` : `Edit ${config.singular}`}
        </p>

        <h3 className="mt-1 text-base font-black text-[var(--ps-text)] sm:text-lg">
          {mode === "create" ? `Add a new ${config.singular.toLowerCase()}` : row?.name}
        </h3>

        <p className="mt-1 text-xs leading-5 text-[var(--ps-text-muted)]">
          {mode === "create" ? createHelpText(resource) : editHelpText(resource)}
        </p>
      </div>

      {noParentAvailable ? (
        <div className="mt-4 rounded-xl bg-[var(--ps-warning-soft)] p-3 text-xs font-semibold leading-5 text-[var(--ps-warning)]">
          Create the required parent infrastructure first before adding this{" "}
          {config.singular.toLowerCase()}.
        </div>
      ) : null}

      <form onSubmit={handleSubmit(onSubmit)} className="mt-5">
        {mode === "create" ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField label="Name" error={errors.name?.message}>
              <input
                {...register("name")}
                disabled={saving}
                placeholder={`${config.singular} name`}
                className={inputClass}
              />
            </FormField>

            <FormField label="Code" error={errors.code?.message}>
              <input
                {...register("code")}
                disabled={saving}
                placeholder="e.g. DHK-NORTH"
                className={inputClass}
              />
            </FormField>

            {resource !== "zones" ? (
              <FormField label={parentLabel(resource)} error={errors.parentId?.message}>
                <select
                  {...register("parentId")}
                  disabled={saving || noParentAvailable}
                  className={cn(inputClass, "cursor-pointer disabled:cursor-not-allowed")}
                >
                  <option value="">Select {parentLabel(resource).toLowerCase()}</option>

                  {parentOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name} — {option.code}
                    </option>
                  ))}
                </select>
              </FormField>
            ) : null}

            {resource === "feeders" ? (
              <FormField label="Capacity (MW)" error={errors.capacityMw?.message}>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  {...register("capacityMw")}
                  disabled={saving}
                  placeholder="e.g. 16.75"
                  className={inputClass}
                />
              </FormField>
            ) : null}

            {resource === "areas" ? (
              <>
                <FormField label="Priority" error={errors.priority?.message}>
                  <select
                    {...register("priority")}
                    disabled={saving}
                    className={cn(inputClass, "cursor-pointer disabled:cursor-not-allowed")}
                  >
                    <option value="NORMAL">Normal</option>

                    <option value="HIGH">High</option>

                    <option value="CRITICAL">Critical</option>
                  </select>
                </FormField>

                <FormField label="Latitude" error={errors.latitude?.message}>
                  <input
                    type="number"
                    step="any"
                    {...register("latitude")}
                    disabled={saving}
                    placeholder="23.8708"
                    className={inputClass}
                  />
                </FormField>

                <FormField label="Longitude" error={errors.longitude?.message}>
                  <input
                    type="number"
                    step="any"
                    {...register("longitude")}
                    disabled={saving}
                    placeholder="90.3912"
                    className={inputClass}
                  />
                </FormField>
              </>
            ) : null}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {resource === "feeders" ? (
              <FormField label="Capacity (MW)" error={errors.capacityMw?.message}>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  {...register("capacityMw")}
                  disabled={saving}
                  className={inputClass}
                />
              </FormField>
            ) : null}

            {resource === "areas" ? (
              <FormField label="Priority" error={errors.priority?.message}>
                <select
                  {...register("priority")}
                  disabled={saving}
                  className={cn(inputClass, "cursor-pointer disabled:cursor-not-allowed")}
                >
                  <option value="NORMAL">Normal</option>

                  <option value="HIGH">High</option>

                  <option value="CRITICAL">Critical</option>
                </select>
              </FormField>
            ) : null}
          </div>
        )}

        <div
          className={cn(
            mode === "create"
              ? "mt-4"
              : resource === "zones" || resource === "substations"
                ? "mt-0"
                : "mt-4",
          )}
        >
          <FormField label="Description" error={errors.description?.message}>
            <textarea
              rows={4}
              {...register("description")}
              disabled={saving}
              placeholder={`Describe this ${config.singular.toLowerCase()}...`}
              className={cn(inputClass, "h-auto resize-none py-3")}
            />
          </FormField>
        </div>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <Button
            type="submit"
            disabled={saving || noParentAvailable}
            className="w-full cursor-pointer bg-[var(--ps-primary)] text-white hover:bg-[var(--ps-primary-hover)] disabled:cursor-not-allowed sm:w-auto"
          >
            {saving ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : mode === "create" ? (
              <Plus className="size-4" />
            ) : (
              <Pencil className="size-4" />
            )}

            {saving
              ? "Saving..."
              : mode === "create"
                ? `Create ${config.singular.toLowerCase()}`
                : "Save changes"}
          </Button>

          <Button
            type="button"
            variant="outline"
            disabled={saving}
            onClick={onCancel}
            className="w-full cursor-pointer disabled:cursor-not-allowed sm:w-auto"
          >
            Cancel
          </Button>
        </div>
      </form>
    </section>
  );
}

function DebouncedSearch({
  initialValue,
  onSearch,
  placeholder,
}: {
  initialValue: string;

  onSearch: (value: string) => void;

  placeholder: string;
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

  function clearTimer() {
    if (!timeoutRef.current) {
      return;
    }

    clearTimeout(timeoutRef.current);

    timeoutRef.current = null;
  }

  function runSearch(nextValue: string) {
    clearTimer();

    if (nextValue.trim() === initialValue) {
      return;
    }

    onSearch(nextValue);
  }

  function handleChange(nextValue: string) {
    setValue(nextValue);

    clearTimer();

    if (nextValue.trim() === initialValue) {
      return;
    }

    timeoutRef.current = setTimeout(() => {
      timeoutRef.current = null;

      onSearch(nextValue);
    }, 450);
  }

  return (
    <label className="relative block w-full">
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[var(--ps-text-muted)]" />

      <input
        type="search"
        value={value}
        onChange={(event) => handleChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();

            runSearch(value);
          }

          if (event.key === "Escape") {
            event.preventDefault();

            setValue("");

            runSearch("");
          }
        }}
        placeholder={placeholder}
        autoComplete="off"
        spellCheck={false}
        className="h-11 w-full min-w-0 rounded-xl border border-[var(--ps-border)] bg-[var(--ps-background)] pr-3 pl-10 text-sm text-[var(--ps-text)] outline-none transition-colors placeholder:text-[var(--ps-text-muted)] focus:border-[var(--ps-primary)]"
      />
    </label>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: LucideIcon;
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

function MetaItem({
  label,
  value,
  secondary,
}: {
  label: string;
  value: string;
  secondary?: string;
}) {
  return (
    <div className="min-w-0 rounded-xl bg-[var(--ps-surface-muted)] p-3">
      <p className="text-[10px] font-black tracking-[0.06em] text-[var(--ps-text-muted)] uppercase">
        {label}
      </p>

      <p className="mt-1 break-words text-xs font-black text-[var(--ps-text)]">{value}</p>

      {secondary ? (
        <p className="mt-1 truncate text-[10px] text-[var(--ps-text-muted)]">{secondary}</p>
      ) : null}
    </div>
  );
}

function FormField({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <label className="text-xs font-black text-[var(--ps-text)]">{label}</label>

      <div className="mt-2">{children}</div>

      {error ? (
        <p className="mt-1.5 text-xs font-semibold text-[var(--ps-danger)]">{error}</p>
      ) : null}
    </div>
  );
}

function EmptyInfrastructure({ resource }: { resource: ResourceType }) {
  const config = resourceConfig[resource];

  const Icon = config.icon;

  return (
    <div className="flex min-h-64 items-center justify-center rounded-2xl border border-dashed border-[var(--ps-border)] bg-[var(--ps-surface)] p-6 text-center sm:min-h-72 sm:rounded-3xl">
      <div>
        <Icon className="mx-auto size-8 text-[var(--ps-primary)]" />

        <h2 className="mt-4 text-lg font-black text-[var(--ps-text)]">
          No matching {config.label.toLowerCase()}
        </h2>

        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--ps-text-muted)]">
          Change the search criteria or create a new {config.singular.toLowerCase()}.
        </p>
      </div>
    </div>
  );
}

function InfrastructureError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="mx-auto flex min-h-[440px] w-full max-w-3xl items-center justify-center">
      <div className="w-full rounded-2xl border border-[var(--ps-border)] bg-[var(--ps-surface)] p-6 text-center sm:rounded-3xl sm:p-8">
        <CircleAlert className="mx-auto size-6 text-[var(--ps-danger)]" />

        <h1 className="mt-4 text-xl font-black text-[var(--ps-text)]">
          Unable to load infrastructure
        </h1>

        <p className="mt-2 text-sm leading-6 text-[var(--ps-text-muted)]">
          PowerSync could not retrieve the network hierarchy.
        </p>

        <Button
          type="button"
          onClick={onRetry}
          className="mt-5 w-full cursor-pointer bg-[var(--ps-primary)] text-white hover:bg-[var(--ps-primary-hover)] sm:w-auto"
        >
          <RefreshCw className="size-4" />
          Try Again
        </Button>
      </div>
    </div>
  );
}

function InfrastructureLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <div className="space-y-3">
        <Skeleton className="h-9 w-72 max-w-full" />

        <Skeleton className="h-5 w-full max-w-2xl" />
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {Array.from({
          length: 4,
        }).map((_, index) => (
          <Skeleton key={index} className="h-24 rounded-2xl" />
        ))}
      </div>

      <Skeleton className="h-28 rounded-2xl" />

      <div className="space-y-3">
        {Array.from({
          length: 4,
        }).map((_, index) => (
          <Skeleton key={index} className="h-40 rounded-3xl" />
        ))}
      </div>
    </div>
  );
}

async function getInfrastructure(): Promise<InfrastructureData> {
  const response = await fetch("/api/admin/infrastructure", {
    cache: "no-store",
  });

  const result = (await response.json()) as ApiResponse<InfrastructureData>;

  if (!response.ok || !result.data) {
    throw new Error(result.message ?? result.error ?? "Unable to load infrastructure.");
  }

  return result.data;
}

async function saveInfrastructure(variables: SaveVariables): Promise<ApiResponse<unknown>> {
  const response = await fetch("/api/admin/infrastructure", {
    method: variables.mode === "create" ? "POST" : "PATCH",

    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify({
      resource: variables.resource,

      id: variables.id,

      payload: variables.payload,
    }),
  });

  const result = (await response.json()) as ApiResponse<unknown>;

  if (!response.ok) {
    throw new Error(result.message ?? result.error ?? "Unable to save infrastructure resource.");
  }

  return result;
}

async function deleteInfrastructure(variables: DeleteVariables): Promise<ApiResponse<unknown>> {
  const response = await fetch("/api/admin/infrastructure", {
    method: "DELETE",

    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify({
      resource: variables.resource,

      id: variables.id,
    }),
  });

  const result = (await response.json()) as ApiResponse<unknown>;

  if (!response.ok) {
    throw new Error(result.message ?? result.error ?? "Unable to delete infrastructure resource.");
  }

  return result;
}

function buildFormSchema(resource: ResourceType, mode: FormMode) {
  return baseFormSchema.superRefine((values, context) => {
    if (mode === "create") {
      requireText(context, "name", values.name, "Name must be at least 2 characters.", 2);

      requireText(context, "code", values.code, "Code must be at least 2 characters.", 2);

      if (!/^[A-Za-z0-9-]+$/.test(values.code.trim())) {
        context.addIssue({
          code: "custom",
          path: ["code"],
          message: "Use letters, numbers and hyphens only.",
        });
      }

      if (resource !== "zones" && !values.parentId) {
        context.addIssue({
          code: "custom",
          path: ["parentId"],
          message: `Select a ${parentLabel(resource).toLowerCase()}.`,
        });
      }
    }

    requireText(
      context,
      "description",
      values.description,
      "Description must be at least 4 characters.",
      4,
    );

    if (resource === "feeders") {
      const capacity = Number(values.capacityMw);

      if (!Number.isFinite(capacity) || capacity <= 0) {
        context.addIssue({
          code: "custom",
          path: ["capacityMw"],
          message: "Enter a valid capacity greater than 0 MW.",
        });
      }
    }

    if (resource === "areas" && mode === "create") {
      const latitude = Number(values.latitude);

      const longitude = Number(values.longitude);

      if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
        context.addIssue({
          code: "custom",
          path: ["latitude"],
          message: "Latitude must be between -90 and 90.",
        });
      }

      if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
        context.addIssue({
          code: "custom",
          path: ["longitude"],
          message: "Longitude must be between -180 and 180.",
        });
      }
    }
  });
}

function requireText(
  context: z.RefinementCtx,
  field: "name" | "code" | "description",
  value: string,
  message: string,
  minimum: number,
) {
  if (value.trim().length < minimum) {
    context.addIssue({
      code: "custom",
      path: [field],
      message,
    });
  }
}

function buildPayload(
  resource: ResourceType,
  mode: FormMode,
  values: InfrastructureFormValues,
): Record<string, unknown> {
  if (mode === "edit") {
    switch (resource) {
      case "zones":
      case "substations":
        return {
          description: values.description.trim(),
        };

      case "feeders":
        return {
          description: values.description.trim(),

          capacityMw: Number(values.capacityMw),
        };

      case "areas":
        return {
          description: values.description.trim(),

          priority: values.priority,
        };
    }
  }

  switch (resource) {
    case "zones":
      return {
        name: values.name.trim(),

        code: values.code.trim().toUpperCase(),

        description: values.description.trim(),
      };

    case "substations":
      return {
        name: values.name.trim(),

        code: values.code.trim().toUpperCase(),

        description: values.description.trim(),

        zoneId: values.parentId,
      };

    case "feeders":
      return {
        name: values.name.trim(),

        code: values.code.trim().toUpperCase(),

        description: values.description.trim(),

        capacityMw: Number(values.capacityMw),

        substationId: values.parentId,
      };

    case "areas":
      return {
        name: values.name.trim(),

        code: values.code.trim().toUpperCase(),

        description: values.description.trim(),

        priority: values.priority,

        latitude: Number(values.latitude),

        longitude: Number(values.longitude),

        feederId: values.parentId,
      };
  }
}

function getDefaultValues(row?: ResourceRow): InfrastructureFormValues {
  return {
    name: row?.name ?? "",

    code: row?.code ?? "",

    description: row?.description ?? "",

    parentId: "",

    capacityMw: row?.capacityMw !== undefined ? String(row.capacityMw) : "",

    priority: parsePriority(row?.priority),

    latitude: row?.latitude !== undefined ? String(row.latitude) : "",

    longitude: row?.longitude !== undefined ? String(row.longitude) : "",
  };
}

function getParentOptions(resource: ResourceType, data: InfrastructureData) {
  switch (resource) {
    case "zones":
      return [];

    case "substations":
      return data.zones.map((zone) => ({
        id: zone.id,

        name: zone.name,

        code: zone.code,
      }));

    case "feeders":
      return data.substations.map((substation) => ({
        id: substation.id,

        name: substation.name,

        code: substation.code,
      }));

    case "areas":
      return data.feeders.map((feeder) => ({
        id: feeder.id,

        name: feeder.name,

        code: feeder.code,
      }));
  }
}

function getRows(resource: ResourceType, data: InfrastructureData): ResourceRow[] {
  switch (resource) {
    case "zones":
      return data.zones.map((zone) => ({
        id: zone.id,

        name: zone.name,

        code: zone.code,

        description: zone.description ?? "",

        childCount: data.substations.filter((substation) => substation.zoneId === zone.id).length,

        childLabel: "Substations",
      }));

    case "substations":
      return data.substations.map((substation) => ({
        id: substation.id,

        name: substation.name,

        code: substation.code,

        description: substation.description ?? "",

        status: substation.status,

        parentName: substation.zone?.name,

        parentCode: substation.zone?.code,

        childCount: data.feeders.filter((feeder) => feeder.substationId === substation.id).length,

        childLabel: "Feeders",
      }));

    case "feeders":
      return data.feeders.map((feeder) => ({
        id: feeder.id,

        name: feeder.name,

        code: feeder.code,

        description: feeder.description ?? "",

        status: feeder.status,

        parentName: feeder.substation?.name,

        parentCode: feeder.substation?.code,

        capacityMw: Number(feeder.capacityMw),

        childCount: data.areas.filter((area) => area.feederId === feeder.id).length,

        childLabel: "Areas",
      }));

    case "areas":
      return data.areas.map((area) => ({
        id: area.id,

        name: area.name,

        code: area.code,

        description: area.description ?? "",

        parentName: area.feeder?.name,

        parentCode: area.feeder?.code,

        priority: area.priority,

        latitude: Number(area.latitude),

        longitude: Number(area.longitude),
      }));
  }
}

function parseResource(value: string | null): ResourceType {
  switch (value) {
    case "substations":
      return "substations";

    case "feeders":
      return "feeders";

    case "areas":
      return "areas";

    default:
      return "zones";
  }
}

function parsePriority(value: string | undefined): AreaPriority {
  switch (value) {
    case "HIGH":
      return "HIGH";

    case "CRITICAL":
      return "CRITICAL";

    default:
      return "NORMAL";
  }
}

function parentLabel(resource: ResourceType) {
  switch (resource) {
    case "substations":
      return "Zone";

    case "feeders":
      return "Substation";

    case "areas":
      return "Feeder";

    default:
      return "Parent";
  }
}

function createHelpText(resource: ResourceType) {
  switch (resource) {
    case "zones":
      return "Create a top-level service zone.";

    case "substations":
      return "Create a substation and assign it to an existing zone.";

    case "feeders":
      return "Create a feeder with its capacity and parent substation.";

    case "areas":
      return "Create a service area with priority, coordinates and parent feeder.";
  }
}

function editHelpText(resource: ResourceType) {
  switch (resource) {
    case "zones":
      return "The verified backend update contract currently exposes the zone description.";

    case "substations":
      return "The verified backend update contract currently exposes the substation description.";

    case "feeders":
      return "Update the feeder description and capacity.";

    case "areas":
      return "Update the service-area description and priority.";
  }
}

function priorityClass(priority: string) {
  switch (priority) {
    case "CRITICAL":
      return "bg-[var(--ps-danger-soft)] text-[var(--ps-danger)]";

    case "HIGH":
      return "bg-[var(--ps-warning-soft)] text-[var(--ps-warning)]";

    default:
      return "bg-[var(--ps-success-soft)] text-[var(--ps-success)]";
  }
}

function formatLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

const inputClass =
  "h-11 w-full min-w-0 rounded-xl border border-[var(--ps-border)] bg-[var(--ps-background)] px-3 text-sm text-[var(--ps-text)] outline-none transition-colors placeholder:text-[var(--ps-text-muted)] focus:border-[var(--ps-primary)] disabled:cursor-not-allowed disabled:opacity-60";
