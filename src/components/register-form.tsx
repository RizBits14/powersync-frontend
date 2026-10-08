"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Check, Eye, EyeOff, LoaderCircle } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ReactNode, useState } from "react";
import { type UseFormRegisterReturn, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

const registerSchema = z
  .object({
    name: z.string().trim().min(2, "Name must be at least 2 characters."),
    email: z.string().trim().min(1, "Email is required.").email("Enter a valid email address."),
    password: z.string().min(8, "Password must be at least 8 characters."),
    confirmPassword: z.string().min(1, "Please confirm your password."),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

type RegisterValues = z.infer<typeof registerSchema>;

interface RegisterResponse {
  success?: boolean;
  message?: string;
  error?: string;
}

export function RegisterForm() {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();

  const [showPassword, setShowPassword] = useState(false);

  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const password = useWatch({
    control,
    name: "password",
    defaultValue: "",
  });

  const hasMinimumLength = password.length >= 8;

  async function submitRegistration(values: RegisterValues) {
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: values.name,
          email: values.email,
          password: values.password,
        }),
      });

      const data = (await response.json()) as RegisterResponse;

      if (!response.ok) {
        toast.error(getErrorMessage(data, "Unable to create your account. Please try again."));

        return;
      }

      toast.success("Account created successfully. Sign in to continue.");

      router.replace("/login");
    } catch {
      toast.error("PowerSync could not be reached. Please try again.");
    }
  }

  return (
    <motion.form
      onSubmit={handleSubmit(submitRegistration)}
      className="flex flex-col gap-6"
      noValidate
      initial={
        shouldReduceMotion
          ? false
          : {
              opacity: 0,
              y: 24,
            }
      }
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration: 0.55,
        ease: "easeOut",
      }}
    >
      <FieldGroup>
        <motion.div
          className="flex flex-col gap-2"
          initial={
            shouldReduceMotion
              ? false
              : {
                  opacity: 0,
                  y: 14,
                }
          }
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.45,
            delay: 0.1,
          }}
        >
          <p className="text-xs font-bold tracking-[0.14em] text-[var(--ps-primary)] uppercase">
            Join PowerSync
          </p>

          <h1 className="text-3xl font-bold tracking-[-0.04em] text-[var(--ps-text)] sm:text-4xl">
            Create your account
          </h1>

          <p className="text-sm leading-6 text-[var(--ps-text-muted)]">
            Get access to outage reporting, restoration updates, schedules, and service information.
          </p>
        </motion.div>

        <AnimatedField delay={0.18} reducedMotion={shouldReduceMotion}>
          <Field>
            <FieldLabel htmlFor="name">Full name</FieldLabel>

            <Input
              id="name"
              type="text"
              autoComplete="name"
              placeholder="Enter your full name"
              aria-invalid={errors.name ? true : undefined}
              className="bg-[var(--ps-surface)] transition-[border-color,box-shadow,transform] duration-200 focus:scale-[1.005]"
              {...register("name")}
            />

            {errors.name ? (
              <FieldDescription className="text-[var(--ps-danger)]">
                {errors.name.message}
              </FieldDescription>
            ) : null}
          </Field>
        </AnimatedField>

        <AnimatedField delay={0.25} reducedMotion={shouldReduceMotion}>
          <Field>
            <FieldLabel htmlFor="email">Email address</FieldLabel>

            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              aria-invalid={errors.email ? true : undefined}
              className="bg-[var(--ps-surface)] transition-[border-color,box-shadow,transform] duration-200 focus:scale-[1.005]"
              {...register("email")}
            />

            {errors.email ? (
              <FieldDescription className="text-[var(--ps-danger)]">
                {errors.email.message}
              </FieldDescription>
            ) : null}
          </Field>
        </AnimatedField>

        <AnimatedField delay={0.32} reducedMotion={shouldReduceMotion}>
          <Field>
            <FieldLabel htmlFor="password">Password</FieldLabel>

            <PasswordInput
              id="password"
              visible={showPassword}
              onToggle={() => setShowPassword((current) => !current)}
              error={errors.password ? true : undefined}
              autoComplete="new-password"
              placeholder="Create a password"
              registration={register("password")}
            />

            {errors.password ? (
              <FieldDescription className="text-[var(--ps-danger)]">
                {errors.password.message}
              </FieldDescription>
            ) : (
              <div className="flex items-center gap-2 text-[11px] text-[var(--ps-text-muted)]">
                <span
                  className={`flex size-4 items-center justify-center rounded-full ${
                    hasMinimumLength
                      ? "bg-[var(--ps-success-soft)] text-[var(--ps-success)]"
                      : "bg-[var(--ps-surface-muted)]"
                  }`}
                >
                  <Check className="size-2.5" />
                </span>
                At least 8 characters
              </div>
            )}
          </Field>
        </AnimatedField>

        <AnimatedField delay={0.39} reducedMotion={shouldReduceMotion}>
          <Field>
            <FieldLabel htmlFor="confirmPassword">Confirm password</FieldLabel>

            <PasswordInput
              id="confirmPassword"
              visible={showConfirmPassword}
              onToggle={() => setShowConfirmPassword((current) => !current)}
              error={errors.confirmPassword ? true : undefined}
              autoComplete="new-password"
              placeholder="Re-enter your password"
              registration={register("confirmPassword")}
            />

            {errors.confirmPassword ? (
              <FieldDescription className="text-[var(--ps-danger)]">
                {errors.confirmPassword.message}
              </FieldDescription>
            ) : null}
          </Field>
        </AnimatedField>

        <motion.div
          initial={
            shouldReduceMotion
              ? false
              : {
                  opacity: 0,
                  y: 12,
                }
          }
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.4,
            delay: 0.46,
          }}
        >
          <Field>
            <motion.div
              whileHover={
                shouldReduceMotion
                  ? undefined
                  : {
                      y: -2,
                    }
              }
              whileTap={
                shouldReduceMotion
                  ? undefined
                  : {
                      scale: 0.985,
                    }
              }
            >
              <Button
                type="submit"
                disabled={isSubmitting}
                className="min-h-11 w-full bg-[var(--ps-primary)] text-white hover:bg-[var(--ps-primary-hover)]"
              >
                {isSubmitting ? (
                  <>
                    <LoaderCircle className="size-4 animate-spin" />
                    Creating account
                  </>
                ) : (
                  <>
                    Create Account
                    <motion.span
                      animate={
                        shouldReduceMotion
                          ? undefined
                          : {
                              x: [0, 3, 0],
                            }
                      }
                      transition={{
                        duration: 1.4,
                        repeat: Infinity,
                        repeatDelay: 2,
                      }}
                    >
                      <ArrowRight className="size-4" />
                    </motion.span>
                  </>
                )}
              </Button>
            </motion.div>
          </Field>
        </motion.div>

        <motion.div
          initial={
            shouldReduceMotion
              ? false
              : {
                  opacity: 0,
                }
          }
          animate={{
            opacity: 1,
          }}
          transition={{
            duration: 0.4,
            delay: 0.54,
          }}
        >
          <FieldDescription className="text-center text-sm">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold text-[var(--ps-primary)] underline-offset-4 hover:underline"
            >
              Sign in
            </Link>
          </FieldDescription>
        </motion.div>
      </FieldGroup>
    </motion.form>
  );
}

interface AnimatedFieldProps {
  children: ReactNode;
  delay: number;
  reducedMotion: boolean | null;
}

function AnimatedField({ children, delay, reducedMotion }: AnimatedFieldProps) {
  return (
    <motion.div
      initial={
        reducedMotion
          ? false
          : {
              opacity: 0,
              y: 12,
            }
      }
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration: 0.4,
        delay,
      }}
    >
      {children}
    </motion.div>
  );
}

interface PasswordInputProps {
  id: string;
  visible: boolean;
  onToggle: () => void;
  error?: boolean;
  placeholder: string;
  autoComplete: string;
  registration: UseFormRegisterReturn;
}

function PasswordInput({
  id,
  visible,
  onToggle,
  error,
  placeholder,
  autoComplete,
  registration,
}: PasswordInputProps) {
  return (
    <div className="relative">
      <Input
        id={id}
        type={visible ? "text" : "password"}
        autoComplete={autoComplete}
        placeholder={placeholder}
        aria-invalid={error ? true : undefined}
        className="bg-[var(--ps-surface)] pr-11 transition-[border-color,box-shadow,transform] duration-200 focus:scale-[1.005]"
        {...registration}
      />

      <button
        type="button"
        onClick={onToggle}
        aria-label={visible ? "Hide password" : "Show password"}
        className="absolute top-1/2 right-1 flex size-9 -translate-y-1/2 items-center justify-center rounded-lg text-[var(--ps-text-muted)] transition-colors hover:bg-[var(--ps-surface-muted)] hover:text-[var(--ps-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ps-primary)]"
      >
        {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}

function getErrorMessage(response: RegisterResponse, fallback: string) {
  return response.message ?? response.error ?? fallback;
}
