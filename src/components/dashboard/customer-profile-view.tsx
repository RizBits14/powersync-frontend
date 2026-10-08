"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Building2,
  CheckCircle2,
  CircleAlert,
  LoaderCircle,
  MapPin,
  Pencil,
  Phone,
  RadioTower,
  Save,
  ShieldCheck,
  UserRound,
  Zap,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";

const createProfileSchema = z.object({
  areaId: z.string().min(1, "Select your service area."),
  phone: z
    .string()
    .trim()
    .min(7, "Enter a valid phone number.")
    .max(20, "Phone number is too long."),
  address: z
    .string()
    .trim()
    .min(5, "Address must be at least 5 characters.")
    .max(250, "Address is too long."),
});

const updateProfileSchema = z.object({
  phone: z
    .string()
    .trim()
    .min(7, "Enter a valid phone number.")
    .max(20, "Phone number is too long."),
  address: z
    .string()
    .trim()
    .min(5, "Address must be at least 5 characters.")
    .max(250, "Address is too long."),
});

type CreateProfileValues = z.infer<typeof createProfileSchema>;

type UpdateProfileValues = z.infer<typeof updateProfileSchema>;

interface ApiResponse<T> {
  success?: boolean;
  message?: string;
  error?: string;
  data?: T;
}

interface CustomerUser {
  id: string;
  name: string;
  email: string;
  role: "CUSTOMER";
  status: string;
}

interface Zone {
  id: string;
  name: string;
  code: string;
}

interface Substation {
  id: string;
  name: string;
  code: string;
  zone?: Zone;
}

interface Feeder {
  id: string;
  name: string;
  code: string;
  substation?: Substation;
}

interface ServiceArea {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  priority?: string;
  latitude?: number | null;
  longitude?: number | null;
  feederId?: string;
  feeder?: Feeder;
}

interface CustomerProfile {
  id: string;
  phone: string;
  address: string;
  userId: string;
  areaId: string;
  createdAt: string;
  updatedAt: string;
  user?: CustomerUser;
  area?: ServiceArea;
}

interface AreasResponse {
  success?: boolean;
  message?: string;
  error?: string;
  data?: ServiceArea[];
}

const profileQueryKey = ["customer", "profile"];

const areasQueryKey = ["service", "areas"];

export function CustomerProfileView() {
  const profileQuery = useQuery({
    queryKey: profileQueryKey,
    queryFn: getCustomerProfile,
    retry: false,
  });

  const areasQuery = useQuery({
    queryKey: areasQueryKey,
    queryFn: getServiceAreas,
    staleTime: 5 * 60 * 1000,
    enabled: profileQuery.isSuccess && profileQuery.data === null,
  });

  if (profileQuery.isLoading) {
    return <ProfileSkeleton />;
  }

  if (profileQuery.isError) {
    return (
      <ProfileErrorState
        onRetry={() => {
          void profileQuery.refetch();
        }}
      />
    );
  }

  const profile = profileQuery.data;

  return (
    <div className="mx-auto w-full max-w-6xl">
      <PageHeader hasProfile={Boolean(profile)} />

      {profile ? (
        <ExistingProfile key={profile.updatedAt} profile={profile} />
      ) : (
        <CreateProfile
          areas={areasQuery.data ?? []}
          isLoadingAreas={areasQuery.isLoading}
          areasError={areasQuery.isError}
          onRetryAreas={() => {
            void areasQuery.refetch();
          }}
        />
      )}
    </div>
  );
}

interface PageHeaderProps {
  hasProfile: boolean;
}

function PageHeader({ hasProfile }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <div className="flex items-center gap-2 text-xs font-bold tracking-[0.12em] text-[var(--ps-primary)] uppercase">
          <UserRound className="size-4" />
          Customer profile
        </div>

        <h1 className="mt-2 text-3xl font-bold tracking-[-0.04em] text-[var(--ps-text)] sm:text-4xl">
          {hasProfile ? "Your service profile" : "Complete your service profile"}
        </h1>

        <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--ps-text-muted)] sm:text-base">
          {hasProfile
            ? "Manage your contact information and review the electricity service infrastructure connected to your account."
            : "PowerSync needs your service area and contact details before you can report an electricity outage."}
        </p>
      </div>

      <div
        className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-2 text-xs font-bold ${
          hasProfile
            ? "bg-[var(--ps-success-soft)] text-[var(--ps-success)]"
            : "bg-[var(--ps-warning-soft)] text-[var(--ps-warning)]"
        }`}
      >
        {hasProfile ? <CheckCircle2 className="size-4" /> : <CircleAlert className="size-4" />}

        {hasProfile ? "Profile complete" : "Setup required"}
      </div>
    </div>
  );
}

interface CreateProfileProps {
  areas: ServiceArea[];
  isLoadingAreas: boolean;
  areasError: boolean;
  onRetryAreas: () => void;
}

function CreateProfile({ areas, isLoadingAreas, areasError, onRetryAreas }: CreateProfileProps) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CreateProfileValues>({
    resolver: zodResolver(createProfileSchema),
    defaultValues: {
      areaId: "",
      phone: "",
      address: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: createCustomerProfile,
    onSuccess: async () => {
      toast.success("Customer profile created successfully.");

      await queryClient.invalidateQueries({
        queryKey: profileQueryKey,
      });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Unable to create your profile."));
    },
  });

  function submit(values: CreateProfileValues) {
    createMutation.mutate(values);
  }

  const submitting = isSubmitting || createMutation.isPending;

  return (
    <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
      <section className="rounded-3xl border border-[var(--ps-border)] bg-[var(--ps-surface)] p-5 sm:p-6 lg:p-8">
        <div>
          <p className="text-xs font-bold tracking-[0.1em] text-[var(--ps-primary)] uppercase">
            Step 1
          </p>

          <h2 className="mt-1 text-xl font-bold tracking-[-0.03em] text-[var(--ps-text)]">
            Connect your service location
          </h2>

          <p className="mt-2 text-sm leading-6 text-[var(--ps-text-muted)]">
            Your selected area is used to associate outage reports with the correct electricity
            network.
          </p>
        </div>

        <form onSubmit={handleSubmit(submit)} className="mt-7 space-y-5" noValidate>
          <Field>
            <FieldLabel>Service area</FieldLabel>

            {isLoadingAreas ? (
              <Skeleton className="h-11 w-full rounded-xl" />
            ) : areasError ? (
              <div className="rounded-2xl border border-[var(--ps-danger)]/20 bg-[var(--ps-danger-soft)] p-4">
                <p className="text-sm font-semibold text-[var(--ps-danger)]">
                  Service areas could not be loaded.
                </p>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onRetryAreas}
                  className="mt-3"
                >
                  Try again
                </Button>
              </div>
            ) : (
              <Controller
                control={control}
                name="areaId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger
                      className="min-h-11 w-full bg-[var(--ps-surface)]"
                      aria-invalid={errors.areaId ? true : undefined}
                    >
                      <SelectValue placeholder="Select your service area" />
                    </SelectTrigger>

                    <SelectContent>
                      {areas.map((area) => (
                        <SelectItem key={area.id} value={area.id}>
                          {area.name} · {area.code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            )}

            {errors.areaId ? (
              <FieldDescription className="text-[var(--ps-danger)]">
                {errors.areaId.message}
              </FieldDescription>
            ) : (
              <FieldDescription>
                Service area cannot be changed after profile creation.
              </FieldDescription>
            )}
          </Field>

          <Field>
            <FieldLabel htmlFor="phone">Phone number</FieldLabel>

            <Input
              id="phone"
              type="tel"
              autoComplete="tel"
              placeholder="017XXXXXXXX"
              aria-invalid={errors.phone ? true : undefined}
              className="min-h-11 bg-[var(--ps-surface)]"
              {...register("phone")}
            />

            {errors.phone ? (
              <FieldDescription className="text-[var(--ps-danger)]">
                {errors.phone.message}
              </FieldDescription>
            ) : null}
          </Field>

          <Field>
            <FieldLabel htmlFor="address">Service address</FieldLabel>

            <Textarea
              id="address"
              placeholder="Enter the address where your electricity connection is located"
              aria-invalid={errors.address ? true : undefined}
              className="min-h-28 resize-none bg-[var(--ps-surface)]"
              {...register("address")}
            />

            {errors.address ? (
              <FieldDescription className="text-[var(--ps-danger)]">
                {errors.address.message}
              </FieldDescription>
            ) : null}
          </Field>

          <Button
            type="submit"
            disabled={submitting || isLoadingAreas || areasError || areas.length === 0}
            className="min-h-11 w-full bg-[var(--ps-primary)] text-white hover:bg-[var(--ps-primary-hover)] sm:w-auto"
          >
            {submitting ? (
              <>
                <LoaderCircle className="size-4 animate-spin" />
                Saving profile
              </>
            ) : (
              <>
                <ShieldCheck className="size-4" />
                Complete Profile
              </>
            )}
          </Button>
        </form>
      </section>

      <ProfileSetupInfo />
    </div>
  );
}

function ProfileSetupInfo() {
  return (
    <aside className="rounded-3xl border border-[var(--ps-border)] bg-[var(--ps-surface)] p-5 sm:p-6">
      <div className="flex size-12 items-center justify-center rounded-2xl bg-[var(--ps-primary-soft)] text-[var(--ps-primary)]">
        <Zap className="size-5" />
      </div>

      <h2 className="mt-5 text-lg font-bold text-[var(--ps-text)]">Why PowerSync needs this</h2>

      <p className="mt-2 text-sm leading-6 text-[var(--ps-text-muted)]">
        Outage reports are linked to the area supplying your electricity connection.
      </p>

      <div className="mt-6 space-y-4">
        <InfoRow
          icon={MapPin}
          title="Correct service area"
          description="Routes your report to the electricity infrastructure serving your location."
        />

        <InfoRow
          icon={Phone}
          title="Reliable contact details"
          description="Keeps your account information ready for outage and service workflows."
        />

        <InfoRow
          icon={RadioTower}
          title="Network association"
          description="Connects your account with the appropriate feeder, substation, and zone."
        />
      </div>
    </aside>
  );
}

interface ExistingProfileProps {
  profile: CustomerProfile;
}

function ExistingProfile({ profile }: ExistingProfileProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <UpdateProfileForm profile={profile} />

        <AccountSummary profile={profile} />
      </div>

      <ServiceInfrastructure area={profile.area} />
    </div>
  );
}

interface UpdateProfileFormProps {
  profile: CustomerProfile;
}

function UpdateProfileForm({ profile }: UpdateProfileFormProps) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<UpdateProfileValues>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      phone: profile.phone ?? "",
      address: profile.address ?? "",
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateCustomerProfile,
    onSuccess: async () => {
      toast.success("Profile updated successfully.");

      reset({
        phone: profile.phone ?? "",
        address: profile.address ?? "",
      });

      await queryClient.invalidateQueries({
        queryKey: profileQueryKey,
      });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Unable to update your profile."));
    },
  });

  function submit(values: UpdateProfileValues) {
    updateMutation.mutate(values, {
      onSuccess: () => {
        reset(values);
      },
    });
  }

  const submitting = isSubmitting || updateMutation.isPending;

  return (
    <section className="rounded-3xl border border-[var(--ps-border)] bg-[var(--ps-surface)] p-5 sm:p-6 lg:p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold tracking-[0.1em] text-[var(--ps-primary)] uppercase">
            <Pencil className="size-3.5" />
            Contact details
          </div>

          <h2 className="mt-2 text-xl font-bold text-[var(--ps-text)]">
            Keep your information current
          </h2>
        </div>

        <div className="rounded-full bg-[var(--ps-success-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--ps-success)]">
          Active
        </div>
      </div>

      <form onSubmit={handleSubmit(submit)} className="mt-7 space-y-5" noValidate>
        <Field>
          <FieldLabel htmlFor="profile-phone">Phone number</FieldLabel>

          <Input
            id="profile-phone"
            type="tel"
            autoComplete="tel"
            aria-invalid={errors.phone ? true : undefined}
            className="min-h-11 bg-[var(--ps-surface)]"
            {...register("phone")}
          />

          {errors.phone ? (
            <FieldDescription className="text-[var(--ps-danger)]">
              {errors.phone.message}
            </FieldDescription>
          ) : null}
        </Field>

        <Field>
          <FieldLabel htmlFor="profile-address">Service address</FieldLabel>

          <Textarea
            id="profile-address"
            aria-invalid={errors.address ? true : undefined}
            className="min-h-28 resize-none bg-[var(--ps-surface)]"
            {...register("address")}
          />

          {errors.address ? (
            <FieldDescription className="text-[var(--ps-danger)]">
              {errors.address.message}
            </FieldDescription>
          ) : null}
        </Field>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="submit"
            disabled={submitting || !isDirty}
            className="min-h-11 bg-[var(--ps-primary)] text-white hover:bg-[var(--ps-primary-hover)]"
          >
            {submitting ? (
              <>
                <LoaderCircle className="size-4 animate-spin" />
                Saving changes
              </>
            ) : (
              <>
                <Save className="size-4" />
                Save Changes
              </>
            )}
          </Button>

          {isDirty ? (
            <Button type="button" variant="outline" onClick={() => reset()} disabled={submitting}>
              Cancel
            </Button>
          ) : null}
        </div>
      </form>
    </section>
  );
}

interface AccountSummaryProps {
  profile: CustomerProfile;
}

function AccountSummary({ profile }: AccountSummaryProps) {
  const user = profile.user;
  const area = profile.area;

  return (
    <aside className="rounded-3xl border border-[var(--ps-border)] bg-[var(--ps-surface)] p-5 sm:p-6">
      <div className="flex size-12 items-center justify-center rounded-2xl bg-[var(--ps-primary-soft)] text-[var(--ps-primary)]">
        <UserRound className="size-5" />
      </div>

      <h2 className="mt-5 text-lg font-bold text-[var(--ps-text)]">Account summary</h2>

      <div className="mt-6 space-y-4">
        <SummaryRow label="Customer" value={user?.name ?? "PowerSync customer"} />

        <SummaryRow label="Email" value={user?.email ?? "—"} />

        <SummaryRow label="Service area" value={area ? `${area.name} (${area.code})` : "—"} />

        <SummaryRow label="Area priority" value={formatLabel(area?.priority) ?? "—"} />

        <SummaryRow label="Account status" value={formatLabel(user?.status) ?? "Active"} />
      </div>

      <div className="mt-6 rounded-2xl bg-[var(--ps-primary-soft)] p-4">
        <div className="flex gap-3">
          <ShieldCheck className="mt-0.5 size-5 shrink-0 text-[var(--ps-primary)]" />

          <p className="text-sm leading-6 text-[var(--ps-text-soft)]">
            Your service area is fixed after profile creation. Phone number and address can still be
            updated.
          </p>
        </div>
      </div>
    </aside>
  );
}

interface ServiceInfrastructureProps {
  area?: ServiceArea;
}

function ServiceInfrastructure({ area }: ServiceInfrastructureProps) {
  const feeder = area?.feeder;

  const substation = feeder?.substation;

  const zone = substation?.zone;

  const infrastructure = [
    {
      label: "Service area",
      value: area?.name,
      code: area?.code,
      icon: MapPin,
    },
    {
      label: "Feeder",
      value: feeder?.name,
      code: feeder?.code,
      icon: Zap,
    },
    {
      label: "Substation",
      value: substation?.name,
      code: substation?.code,
      icon: Building2,
    },
    {
      label: "Zone",
      value: zone?.name,
      code: zone?.code,
      icon: RadioTower,
    },
  ];

  return (
    <section className="rounded-3xl border border-[var(--ps-border)] bg-[var(--ps-surface)] p-5 sm:p-6 lg:p-8">
      <div>
        <p className="text-xs font-bold tracking-[0.1em] text-[var(--ps-primary)] uppercase">
          Electricity network
        </p>

        <h2 className="mt-1 text-xl font-bold text-[var(--ps-text)]">
          Your service infrastructure
        </h2>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--ps-text-muted)]">
          PowerSync associates your account with this network path when processing outage and
          service information.
        </p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {infrastructure.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.label}
              className="rounded-2xl border border-[var(--ps-border)] bg-[var(--ps-background)] p-5"
            >
              <div className="flex size-10 items-center justify-center rounded-xl bg-[var(--ps-primary-soft)] text-[var(--ps-primary)]">
                <Icon className="size-4.5" />
              </div>

              <p className="mt-4 text-xs font-semibold tracking-[0.08em] text-[var(--ps-text-muted)] uppercase">
                {item.label}
              </p>

              <p className="mt-1 font-bold text-[var(--ps-text)]">
                {item.value ?? "Not available"}
              </p>

              <p className="mt-1 text-xs text-[var(--ps-text-muted)]">
                {item.code ?? "No code available"}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

interface InfoRowProps {
  icon: typeof MapPin;
  title: string;
  description: string;
}

function InfoRow({ icon: Icon, title, description }: InfoRowProps) {
  return (
    <div className="flex gap-3">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[var(--ps-surface-muted)] text-[var(--ps-primary)]">
        <Icon className="size-4" />
      </div>

      <div>
        <p className="text-sm font-bold text-[var(--ps-text)]">{title}</p>

        <p className="mt-1 text-xs leading-5 text-[var(--ps-text-muted)]">{description}</p>
      </div>
    </div>
  );
}

interface SummaryRowProps {
  label: string;
  value: string;
}

function SummaryRow({ label, value }: SummaryRowProps) {
  return (
    <div className="border-b border-[var(--ps-border)] pb-4 last:border-0 last:pb-0">
      <p className="text-xs font-semibold tracking-[0.06em] text-[var(--ps-text-muted)] uppercase">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-semibold text-[var(--ps-text)]">{value}</p>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <div className="space-y-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-10 w-72 max-w-full" />
        <Skeleton className="h-5 w-full max-w-xl" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <Skeleton className="h-[480px] rounded-3xl" />
        <Skeleton className="h-[420px] rounded-3xl" />
      </div>
    </div>
  );
}

interface ProfileErrorStateProps {
  onRetry: () => void;
}

function ProfileErrorState({ onRetry }: ProfileErrorStateProps) {
  return (
    <div className="mx-auto flex min-h-[420px] w-full max-w-3xl items-center justify-center">
      <div className="w-full rounded-3xl border border-[var(--ps-border)] bg-[var(--ps-surface)] p-8 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-[var(--ps-danger-soft)] text-[var(--ps-danger)]">
          <CircleAlert className="size-5" />
        </div>

        <h1 className="mt-5 text-xl font-bold text-[var(--ps-text)]">Profile unavailable</h1>

        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--ps-text-muted)]">
          PowerSync could not load your profile information. Try again before continuing.
        </p>

        <Button
          type="button"
          onClick={onRetry}
          className="mt-5 bg-[var(--ps-primary)] text-white hover:bg-[var(--ps-primary-hover)]"
        >
          Try Again
        </Button>
      </div>
    </div>
  );
}

async function getCustomerProfile(): Promise<CustomerProfile | null> {
  const response = await fetch("/api/customer/profile", {
    method: "GET",
    cache: "no-store",
  });

  if (response.status === 404) {
    return null;
  }

  const payload = (await response.json()) as ApiResponse<CustomerProfile>;

  if (!response.ok) {
    throw new Error(payload.message ?? payload.error ?? "Unable to load customer profile.");
  }

  return payload.data ?? null;
}

async function getServiceAreas(): Promise<ServiceArea[]> {
  const response = await fetch("/api/areas", {
    method: "GET",
    cache: "no-store",
  });

  const payload = (await response.json()) as AreasResponse;

  if (!response.ok) {
    throw new Error(payload.message ?? payload.error ?? "Unable to load service areas.");
  }

  return payload.data ?? [];
}

async function createCustomerProfile(values: CreateProfileValues) {
  const response = await fetch("/api/customer/profile", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(values),
  });

  const payload = (await response.json()) as ApiResponse<CustomerProfile>;

  if (!response.ok) {
    throw new Error(payload.message ?? payload.error ?? "Unable to create customer profile.");
  }

  return payload.data;
}

async function updateCustomerProfile(values: UpdateProfileValues) {
  const response = await fetch("/api/customer/profile", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(values),
  });

  const payload = (await response.json()) as ApiResponse<CustomerProfile>;

  if (!response.ok) {
    throw new Error(payload.message ?? payload.error ?? "Unable to update customer profile.");
  }

  return payload.data;
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function formatLabel(value?: string) {
  if (!value) {
    return undefined;
  }

  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
