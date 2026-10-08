"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  CircleAlert,
  Clock3,
  FileText,
  LoaderCircle,
  MapPin,
  RadioTower,
  ShieldCheck,
  TriangleAlert,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { useForm, useWatch, type FieldErrors, type UseFormRegister } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";

const outageReportSchema = z.object({
  issueType: z.enum(["TOTAL_OUTAGE", "PARTIAL_OUTAGE"]),
  description: z
    .string()
    .trim()
    .min(10, "Please provide at least 10 characters.")
    .max(500, "Description cannot exceed 500 characters."),
});

type OutageReportValues = z.infer<typeof outageReportSchema>;

type OutageIssueType = OutageReportValues["issueType"];

type WizardStep = 1 | 2 | 3 | 4;

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
  priority?: string;
  feeder?: Feeder;
}

interface CustomerProfile {
  id: string;
  phone: string;
  address: string;
  userId: string;
  areaId: string;
  user?: CustomerUser;
  area?: ServiceArea;
}

interface OutageReport {
  id: string;
  issueType: string;
  description: string;
  status: string;
  customerId: string;
  areaId: string;
  incidentId?: string | null;
  reportedAt: string;
  updatedAt: string;
  area?: {
    id: string;
    name: string;
    code: string;
    priority?: string;
  };
  customer?: {
    id: string;
    name: string;
    email: string;
  };
}

const steps = [
  {
    id: 1,
    label: "Service",
    description: "Confirm location",
  },
  {
    id: 2,
    label: "Outage",
    description: "Describe the issue",
  },
  {
    id: 3,
    label: "Review",
    description: "Check & submit",
  },
] as const;

const issueTypes = [
  {
    value: "TOTAL_OUTAGE" as const,
    title: "Complete outage",
    description:
      "Electricity is completely unavailable at your connection or surrounding location.",
    icon: Zap,
  },
  {
    value: "PARTIAL_OUTAGE" as const,
    title: "Partial outage",
    description:
      "Only part of the property or some nearby electricity connections appear affected.",
    icon: TriangleAlert,
  },
];

const profileQueryKey = ["customer", "profile"];

const outageReportsQueryKey = ["customer", "outage-reports"];

export function OutageReportWizard() {
  const shouldReduceMotion = useReducedMotion();

  const [step, setStep] = useState<WizardStep>(1);

  const profileQuery = useQuery({
    queryKey: profileQueryKey,
    queryFn: getCustomerProfile,
    retry: false,
  });

  if (profileQuery.isLoading) {
    return <WizardSkeleton />;
  }

  if (profileQuery.isError) {
    return (
      <ProfileLoadError
        onRetry={() => {
          void profileQuery.refetch();
        }}
      />
    );
  }

  if (!profileQuery.data) {
    return <ProfileRequiredState />;
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
        duration: 0.5,
        ease: "easeOut",
      }}
    >
      <PageHeader />

      <WizardProgress currentStep={step} />

      <OutageWizardContent
        profile={profileQuery.data}
        step={step}
        setStep={setStep}
        reducedMotion={shouldReduceMotion}
      />
    </motion.div>
  );
}

function PageHeader() {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 text-xs font-bold tracking-[0.12em] text-[var(--ps-primary)] uppercase">
        <Zap className="size-4" />
        Outage reporting
      </div>

      <h1 className="mt-2 text-3xl font-bold tracking-[-0.04em] text-[var(--ps-text)] sm:text-4xl">
        Report a power outage
      </h1>

      <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--ps-text-muted)] sm:text-base">
        Confirm your service location, tell us what is happening, and review the information before
        sending your outage report.
      </p>
    </div>
  );
}

interface WizardProgressProps {
  currentStep: WizardStep;
}

function WizardProgress({ currentStep }: WizardProgressProps) {
  return (
    <div className="mb-6 rounded-3xl border border-[var(--ps-border)] bg-[var(--ps-surface)] px-4 py-5 sm:px-6">
      <div className="grid grid-cols-3 gap-2 sm:gap-6">
        {steps.map((stepItem, index) => {
          const complete = currentStep > stepItem.id;

          const active = currentStep === stepItem.id;

          return (
            <div key={stepItem.id} className="relative">
              {index < steps.length - 1 ? (
                <div
                  className={`absolute top-5 left-[calc(50%+22px)] hidden h-px w-[calc(100%-44px)] sm:block ${
                    complete ? "bg-[var(--ps-primary)]" : "bg-[var(--ps-border)]"
                  }`}
                />
              ) : null}

              <div className="relative z-10 flex flex-col items-center text-center">
                <motion.div
                  animate={{
                    scale: active ? 1.05 : 1,
                  }}
                  transition={{
                    duration: 0.2,
                  }}
                  className={`flex size-10 items-center justify-center rounded-full border text-sm font-bold transition-colors ${
                    complete
                      ? "border-[var(--ps-primary)] bg-[var(--ps-primary)] text-white"
                      : active
                        ? "border-[var(--ps-primary)] bg-[var(--ps-primary-soft)] text-[var(--ps-primary)]"
                        : "border-[var(--ps-border)] bg-[var(--ps-background)] text-[var(--ps-text-muted)]"
                  }`}
                >
                  {complete ? <Check className="size-4" /> : stepItem.id}
                </motion.div>

                <p
                  className={`mt-2 text-xs font-bold sm:text-sm ${
                    active || complete ? "text-[var(--ps-text)]" : "text-[var(--ps-text-muted)]"
                  }`}
                >
                  {stepItem.label}
                </p>

                <p className="mt-0.5 hidden text-[11px] text-[var(--ps-text-muted)] sm:block">
                  {stepItem.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface OutageWizardContentProps {
  profile: CustomerProfile;
  step: WizardStep;
  setStep: (step: WizardStep) => void;
  reducedMotion: boolean | null;
}

function OutageWizardContent({ profile, step, setStep, reducedMotion }: OutageWizardContentProps) {
  const queryClient = useQueryClient();

  const {
    register,
    control,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<OutageReportValues>({
    resolver: zodResolver(outageReportSchema),
    defaultValues: {
      issueType: "TOTAL_OUTAGE",
      description: "",
    },
    mode: "onChange",
  });

  const issueType = useWatch({
    control,
    name: "issueType",
  });

  const description = useWatch({
    control,
    name: "description",
    defaultValue: "",
  });

  const submitMutation = useMutation({
    mutationFn: submitOutageReport,

    onSuccess: async () => {
      setStep(4);

      toast.success("Outage report submitted successfully.");

      await queryClient.invalidateQueries({
        queryKey: outageReportsQueryKey,
      });
    },

    onError: (error) => {
      toast.error(getErrorMessage(error, "Unable to submit your outage report."));
    },
  });

  async function moveToReview() {
    const valid = await trigger(["issueType", "description"]);

    if (!valid) {
      return;
    }

    setStep(3);
  }

  function submitReport() {
    submitMutation.mutate({
      issueType,
      description,
    });
  }

  if (submitMutation.isSuccess && submitMutation.data) {
    return <SuccessState report={submitMutation.data} reducedMotion={reducedMotion} />;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <section className="min-w-0 rounded-3xl border border-[var(--ps-border)] bg-[var(--ps-surface)] p-5 sm:p-6 lg:p-8">
        <AnimatePresence mode="wait" initial={false}>
          {step === 1 ? (
            <WizardMotion key="service" reducedMotion={reducedMotion}>
              <ServiceStep profile={profile} onContinue={() => setStep(2)} />
            </WizardMotion>
          ) : null}

          {step === 2 ? (
            <WizardMotion key="outage" reducedMotion={reducedMotion}>
              <OutageDetailsStep
                issueType={issueType}
                description={description}
                errors={errors}
                register={register}
                onIssueTypeChange={(value) => {
                  setValue("issueType", value, {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                }}
                onBack={() => setStep(1)}
                onContinue={moveToReview}
              />
            </WizardMotion>
          ) : null}

          {step === 3 ? (
            <WizardMotion key="review" reducedMotion={reducedMotion}>
              <ReviewStep
                profile={profile}
                issueType={issueType}
                description={description}
                submitting={submitMutation.isPending}
                onBack={() => setStep(2)}
                onSubmit={submitReport}
              />
            </WizardMotion>
          ) : null}
        </AnimatePresence>
      </section>

      <WizardSidebar profile={profile} step={step} />
    </div>
  );
}

interface WizardMotionProps {
  children: ReactNode;
  reducedMotion: boolean | null;
}

function WizardMotion({ children, reducedMotion }: WizardMotionProps) {
  return (
    <motion.div
      initial={
        reducedMotion
          ? false
          : {
              opacity: 0,
              x: 18,
            }
      }
      animate={{
        opacity: 1,
        x: 0,
      }}
      exit={
        reducedMotion
          ? undefined
          : {
              opacity: 0,
              x: -12,
            }
      }
      transition={{
        duration: 0.32,
        ease: "easeOut",
      }}
    >
      {children}
    </motion.div>
  );
}

interface ServiceStepProps {
  profile: CustomerProfile;
  onContinue: () => void;
}

function ServiceStep({ profile, onContinue }: ServiceStepProps) {
  const area = profile.area;

  const feeder = area?.feeder;

  return (
    <div>
      <StepHeading
        eyebrow="Step 1 of 3"
        title="Confirm your service location"
        description="Your outage will automatically be associated with the service area already connected to your PowerSync profile."
      />

      <div className="mt-7 rounded-3xl border border-[var(--ps-border)] bg-[var(--ps-background)] p-5 sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-4">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--ps-primary-soft)] text-[var(--ps-primary)]">
              <MapPin className="size-5" />
            </div>

            <div>
              <p className="text-xs font-bold tracking-[0.08em] text-[var(--ps-text-muted)] uppercase">
                Service area
              </p>

              <h3 className="mt-1 text-lg font-bold text-[var(--ps-text)]">
                {area?.name ?? "Service area"}
              </h3>

              <p className="mt-1 text-sm text-[var(--ps-text-muted)]">
                {area?.code ?? "Area code unavailable"}
              </p>
            </div>
          </div>

          <div className="inline-flex w-fit items-center gap-2 rounded-full bg-[var(--ps-success-soft)] px-3 py-1.5 text-xs font-bold text-[var(--ps-success)]">
            <ShieldCheck className="size-3.5" />
            Profile verified
          </div>
        </div>

        <div className="mt-6 grid gap-4 border-t border-[var(--ps-border)] pt-6 sm:grid-cols-2">
          <ServiceDetail label="Service address" value={profile.address} />

          <ServiceDetail label="Contact number" value={profile.phone} />

          <ServiceDetail
            label="Feeder"
            value={feeder ? `${feeder.name} (${feeder.code})` : "Not available"}
          />

          <ServiceDetail label="Area priority" value={formatLabel(area?.priority)} />
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <Button
          type="button"
          onClick={onContinue}
          className="min-h-11 cursor-pointer bg-[var(--ps-primary)] px-5 text-white hover:bg-[var(--ps-primary-hover)]"
        >
          Continue
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}

interface ServiceDetailProps {
  label: string;
  value: string;
}

function ServiceDetail({ label, value }: ServiceDetailProps) {
  return (
    <div>
      <p className="text-xs font-semibold tracking-[0.06em] text-[var(--ps-text-muted)] uppercase">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-semibold text-[var(--ps-text)]">{value}</p>
    </div>
  );
}

interface OutageDetailsStepProps {
  issueType: OutageIssueType;
  description: string;
  errors: FieldErrors<OutageReportValues>;
  register: UseFormRegister<OutageReportValues>;
  onIssueTypeChange: (value: OutageIssueType) => void;
  onBack: () => void;
  onContinue: () => void;
}

function OutageDetailsStep({
  issueType,
  description,
  errors,
  register,
  onIssueTypeChange,
  onBack,
  onContinue,
}: OutageDetailsStepProps) {
  return (
    <div>
      <StepHeading
        eyebrow="Step 2 of 3"
        title="Tell us what is happening"
        description="Choose the outage type that best matches the situation and briefly describe what you are experiencing."
      />

      <div className="mt-7">
        <Field>
          <FieldLabel>Outage type</FieldLabel>

          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            {issueTypes.map((type) => {
              const Icon = type.icon;

              const selected = issueType === type.value;

              return (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => onIssueTypeChange(type.value)}
                  className={`cursor-pointer rounded-2xl border p-5 text-left transition-[border-color,background-color,transform,box-shadow] duration-200 hover:-translate-y-0.5 ${
                    selected
                      ? "border-[var(--ps-primary)] bg-[var(--ps-primary-soft)] shadow-sm"
                      : "border-[var(--ps-border)] bg-[var(--ps-background)] hover:border-[var(--ps-border-strong)]"
                  }`}
                >
                  <div
                    className={`flex size-10 items-center justify-center rounded-xl ${
                      selected
                        ? "bg-[var(--ps-primary)] text-white"
                        : "bg-[var(--ps-surface-muted)] text-[var(--ps-text-soft)]"
                    }`}
                  >
                    <Icon className="size-4.5" />
                  </div>

                  <div className="mt-4 flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-[var(--ps-text)]">{type.title}</p>

                      <p className="mt-2 text-xs leading-5 text-[var(--ps-text-muted)]">
                        {type.description}
                      </p>
                    </div>

                    <div
                      className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border ${
                        selected
                          ? "border-[var(--ps-primary)] bg-[var(--ps-primary)] text-white"
                          : "border-[var(--ps-border-strong)]"
                      }`}
                    >
                      {selected ? <Check className="size-3" /> : null}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {errors.issueType ? (
            <FieldDescription className="text-[var(--ps-danger)]">
              {errors.issueType.message}
            </FieldDescription>
          ) : null}
        </Field>

        <Field className="mt-6">
          <div className="flex items-center justify-between gap-4">
            <FieldLabel htmlFor="outage-description">What are you experiencing?</FieldLabel>

            <span className="text-xs text-[var(--ps-text-muted)]">
              {description.length}
              /500
            </span>
          </div>

          <Textarea
            id="outage-description"
            placeholder="For example: Power went out suddenly around the entire building and nearby houses also appear to be without electricity."
            aria-invalid={errors.description ? true : undefined}
            className="min-h-36 resize-none bg-[var(--ps-background)] leading-6"
            {...register("description")}
          />

          {errors.description ? (
            <FieldDescription className="text-[var(--ps-danger)]">
              {errors.description.message}
            </FieldDescription>
          ) : (
            <FieldDescription>
              Include only information that helps describe the electricity interruption.
            </FieldDescription>
          )}
        </Field>
      </div>

      <div className="mt-7 flex flex-col-reverse justify-between gap-3 sm:flex-row">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          className="min-h-11 cursor-pointer"
        >
          <ArrowLeft className="size-4" />
          Back
        </Button>

        <Button
          type="button"
          onClick={onContinue}
          className="min-h-11 cursor-pointer bg-[var(--ps-primary)] px-5 text-white hover:bg-[var(--ps-primary-hover)]"
        >
          Review Report
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}

interface ReviewStepProps {
  profile: CustomerProfile;
  issueType: OutageIssueType;
  description: string;
  submitting: boolean;
  onBack: () => void;
  onSubmit: () => void;
}

function ReviewStep({
  profile,
  issueType,
  description,
  submitting,
  onBack,
  onSubmit,
}: ReviewStepProps) {
  return (
    <div>
      <StepHeading
        eyebrow="Step 3 of 3"
        title="Review your outage report"
        description="Check the information below. Once submitted, PowerSync will send the report into the outage review workflow."
      />

      <div className="mt-7 space-y-4">
        <ReviewCard
          icon={MapPin}
          label="Service area"
          value={profile.area ? `${profile.area.name} (${profile.area.code})` : "Not available"}
        />

        <ReviewCard icon={Zap} label="Outage type" value={getIssueTypeLabel(issueType)} />

        <ReviewCard icon={FileText} label="Description" value={description} />
      </div>

      <div className="mt-6 rounded-2xl bg-[var(--ps-warning-soft)] p-4">
        <div className="flex gap-3">
          <Clock3 className="mt-0.5 size-5 shrink-0 text-[var(--ps-warning)]" />

          <div>
            <p className="text-sm font-bold text-[var(--ps-text)]">What happens next?</p>

            <p className="mt-1 text-sm leading-6 text-[var(--ps-text-soft)]">
              Your report will enter the PowerSync review process. Its status will initially be
              shown as pending.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-7 flex flex-col-reverse justify-between gap-3 sm:flex-row">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={submitting}
          className="min-h-11 cursor-pointer disabled:cursor-not-allowed"
        >
          <ArrowLeft className="size-4" />
          Back
        </Button>

        <Button
          type="button"
          onClick={onSubmit}
          disabled={submitting}
          className="min-h-11 cursor-pointer bg-[var(--ps-primary)] px-5 text-white hover:bg-[var(--ps-primary-hover)] disabled:cursor-not-allowed"
        >
          {submitting ? (
            <>
              <LoaderCircle className="size-4 animate-spin" />
              Submitting Report
            </>
          ) : (
            <>
              <Zap className="size-4" />
              Submit Outage Report
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

interface ReviewCardProps {
  icon: typeof MapPin;
  label: string;
  value: string;
}

function ReviewCard({ icon: Icon, label, value }: ReviewCardProps) {
  return (
    <div className="rounded-2xl border border-[var(--ps-border)] bg-[var(--ps-background)] p-5">
      <div className="flex gap-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--ps-primary-soft)] text-[var(--ps-primary)]">
          <Icon className="size-4" />
        </div>

        <div className="min-w-0">
          <p className="text-xs font-bold tracking-[0.06em] text-[var(--ps-text-muted)] uppercase">
            {label}
          </p>

          <p className="mt-1 break-words text-sm font-semibold leading-6 text-[var(--ps-text)]">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

interface StepHeadingProps {
  eyebrow: string;
  title: string;
  description: string;
}

function StepHeading({ eyebrow, title, description }: StepHeadingProps) {
  return (
    <div>
      <p className="text-xs font-bold tracking-[0.1em] text-[var(--ps-primary)] uppercase">
        {eyebrow}
      </p>

      <h2 className="mt-2 text-2xl font-bold tracking-[-0.03em] text-[var(--ps-text)]">{title}</h2>

      <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--ps-text-muted)]">{description}</p>
    </div>
  );
}

interface WizardSidebarProps {
  profile: CustomerProfile;
  step: WizardStep;
}

function WizardSidebar({ profile, step }: WizardSidebarProps) {
  const area = profile.area;

  const helperContent =
    step === 1
      ? {
          title: "Location matters",
          description: "PowerSync uses your assigned service area when processing outage reports.",
          icon: MapPin,
        }
      : step === 2
        ? {
            title: "Describe what you see",
            description:
              "A clear description helps the outage review process understand the reported interruption.",
            icon: FileText,
          }
        : {
            title: "Ready for review",
            description: "After submission, you can follow the report from the My Outages page.",
            icon: ShieldCheck,
          };

  const HelperIcon = helperContent.icon;

  return (
    <aside className="space-y-4">
      <div className="rounded-3xl border border-[var(--ps-border)] bg-[var(--ps-surface)] p-5">
        <div className="flex size-11 items-center justify-center rounded-2xl bg-[var(--ps-primary-soft)] text-[var(--ps-primary)]">
          <HelperIcon className="size-5" />
        </div>

        <h3 className="mt-5 font-bold text-[var(--ps-text)]">{helperContent.title}</h3>

        <p className="mt-2 text-sm leading-6 text-[var(--ps-text-muted)]">
          {helperContent.description}
        </p>
      </div>

      <div className="rounded-3xl border border-[var(--ps-border)] bg-[var(--ps-surface)] p-5">
        <p className="text-xs font-bold tracking-[0.08em] text-[var(--ps-text-muted)] uppercase">
          Connected service
        </p>

        <div className="mt-5 space-y-4">
          <CompactDetail icon={MapPin} label="Area" value={area?.name ?? "Not available"} />

          <CompactDetail icon={Zap} label="Feeder" value={area?.feeder?.name ?? "Not available"} />

          <CompactDetail
            icon={Building2}
            label="Substation"
            value={area?.feeder?.substation?.name ?? "Not available"}
          />

          <CompactDetail
            icon={RadioTower}
            label="Zone"
            value={area?.feeder?.substation?.zone?.name ?? "Not available"}
          />
        </div>
      </div>
    </aside>
  );
}

interface CompactDetailProps {
  icon: typeof MapPin;
  label: string;
  value: string;
}

function CompactDetail({ icon: Icon, label, value }: CompactDetailProps) {
  return (
    <div className="flex gap-3">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[var(--ps-background)] text-[var(--ps-primary)]">
        <Icon className="size-4" />
      </div>

      <div className="min-w-0">
        <p className="text-[11px] font-semibold tracking-[0.06em] text-[var(--ps-text-muted)] uppercase">
          {label}
        </p>

        <p className="mt-0.5 truncate text-sm font-semibold text-[var(--ps-text)]">{value}</p>
      </div>
    </div>
  );
}

interface SuccessStateProps {
  report: OutageReport;
  reducedMotion: boolean | null;
}

function SuccessState({ report, reducedMotion }: SuccessStateProps) {
  return (
    <motion.div
      initial={
        reducedMotion
          ? false
          : {
              opacity: 0,
              y: 20,
              scale: 0.98,
            }
      }
      animate={{
        opacity: 1,
        y: 0,
        scale: 1,
      }}
      transition={{
        duration: 0.45,
        ease: "easeOut",
      }}
      className="rounded-3xl border border-[var(--ps-border)] bg-[var(--ps-surface)] p-6 sm:p-8 lg:p-10"
    >
      <div className="mx-auto max-w-2xl text-center">
        <motion.div
          initial={
            reducedMotion
              ? false
              : {
                  scale: 0.7,
                  opacity: 0,
                }
          }
          animate={{
            scale: 1,
            opacity: 1,
          }}
          transition={{
            type: "spring",
            stiffness: 220,
            damping: 16,
            delay: 0.1,
          }}
          className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-[var(--ps-success-soft)] text-[var(--ps-success)]"
        >
          <CheckCircle2 className="size-8" />
        </motion.div>

        <p className="mt-6 text-xs font-bold tracking-[0.12em] text-[var(--ps-success)] uppercase">
          Report submitted
        </p>

        <h2 className="mt-2 text-3xl font-bold tracking-[-0.04em] text-[var(--ps-text)]">
          Your outage report is now in the queue
        </h2>

        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[var(--ps-text-muted)]">
          PowerSync received your report successfully. You can monitor its status from My Outages as
          it moves through the review and restoration workflow.
        </p>
      </div>

      <div className="mx-auto mt-8 grid max-w-3xl gap-3 sm:grid-cols-3">
        <SuccessDetail label="Status" value={formatLabel(report.status)} />

        <SuccessDetail label="Area" value={report.area?.name ?? "Service area"} />

        <SuccessDetail label="Report ID" value={report.id} mono />
      </div>

      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <Link
          href="/dashboard/outages"
          className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[var(--ps-primary)] px-5 text-sm font-semibold text-white transition-colors hover:bg-[var(--ps-primary-hover)]"
        >
          View My Outages
          <ArrowRight className="size-4" />
        </Link>

        <Link
          href="/dashboard"
          className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-xl border border-[var(--ps-border)] bg-[var(--ps-surface)] px-5 text-sm font-semibold text-[var(--ps-text)] transition-colors hover:bg-[var(--ps-background)]"
        >
          Back to Dashboard
        </Link>
      </div>
    </motion.div>
  );
}

interface SuccessDetailProps {
  label: string;
  value: string;
  mono?: boolean;
}

function SuccessDetail({ label, value, mono = false }: SuccessDetailProps) {
  return (
    <div className="rounded-2xl bg-[var(--ps-background)] p-4 text-left">
      <p className="text-xs font-semibold tracking-[0.06em] text-[var(--ps-text-muted)] uppercase">
        {label}
      </p>

      <p
        className={`mt-1 break-all text-sm font-bold text-[var(--ps-text)] ${
          mono ? "font-mono text-xs" : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function ProfileRequiredState() {
  return (
    <div className="mx-auto flex min-h-[520px] w-full max-w-3xl items-center justify-center">
      <div className="w-full rounded-3xl border border-[var(--ps-border)] bg-[var(--ps-surface)] p-7 text-center sm:p-10">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-[var(--ps-warning-soft)] text-[var(--ps-warning)]">
          <CircleAlert className="size-6" />
        </div>

        <p className="mt-6 text-xs font-bold tracking-[0.12em] text-[var(--ps-warning)] uppercase">
          Profile required
        </p>

        <h1 className="mt-2 text-2xl font-bold tracking-[-0.03em] text-[var(--ps-text)] sm:text-3xl">
          Complete your service profile first
        </h1>

        <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-[var(--ps-text-muted)]">
          PowerSync needs a verified service area, phone number, and address before an outage can be
          associated with your electricity connection.
        </p>

        <Link
          href="/dashboard/profile"
          className="mt-6 inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[var(--ps-primary)] px-5 text-sm font-semibold text-white transition-colors hover:bg-[var(--ps-primary-hover)]"
        >
          Complete Profile
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </div>
  );
}

interface ProfileLoadErrorProps {
  onRetry: () => void;
}

function ProfileLoadError({ onRetry }: ProfileLoadErrorProps) {
  return (
    <div className="mx-auto flex min-h-[480px] w-full max-w-3xl items-center justify-center">
      <div className="w-full rounded-3xl border border-[var(--ps-border)] bg-[var(--ps-surface)] p-8 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-[var(--ps-danger-soft)] text-[var(--ps-danger)]">
          <AlertTriangle className="size-5" />
        </div>

        <h1 className="mt-5 text-xl font-bold text-[var(--ps-text)]">
          Unable to verify your profile
        </h1>

        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--ps-text-muted)]">
          Your service information could not be loaded. Retry before submitting an outage report.
        </p>

        <Button
          type="button"
          onClick={onRetry}
          className="mt-5 cursor-pointer bg-[var(--ps-primary)] text-white hover:bg-[var(--ps-primary-hover)]"
        >
          Try Again
        </Button>
      </div>
    </div>
  );
}

function WizardSkeleton() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <div className="space-y-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-10 w-80 max-w-full" />
        <Skeleton className="h-5 w-full max-w-2xl" />
      </div>

      <Skeleton className="h-20 w-full rounded-3xl" />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Skeleton className="h-[460px] rounded-3xl" />
        <Skeleton className="h-[360px] rounded-3xl" />
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

async function submitOutageReport(values: OutageReportValues): Promise<OutageReport> {
  const response = await fetch("/api/customer/outage-reports", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(values),
  });

  const payload = (await response.json()) as ApiResponse<OutageReport>;

  if (!response.ok) {
    throw new Error(payload.message ?? payload.error ?? "Unable to submit outage report.");
  }

  if (!payload.data) {
    throw new Error("Outage report response did not include report data.");
  }

  return payload.data;
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

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}
