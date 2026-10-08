"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowRight,
  Eye,
  EyeOff,
  LoaderCircle,
  ShieldCheck,
  UserRound,
  Wrench,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

const loginSchema = z.object({
  email: z.string().trim().min(1, "Email is required.").email("Enter a valid email address."),
  password: z.string().min(1, "Password is required."),
});

type LoginValues = z.infer<typeof loginSchema>;

type DemoRole = "CUSTOMER" | "OPERATOR" | "ADMIN";

interface AuthResponse {
  redirectTo?: string;
  message?: string;
  error?: string;
}

const demoRoles = [
  {
    role: "CUSTOMER",
    label: "Customer",
    icon: UserRound,
    tone: "bg-[var(--ps-primary-soft)] text-[var(--ps-primary)]",
  },
  {
    role: "OPERATOR",
    label: "Operator",
    icon: Wrench,
    tone: "bg-[var(--ps-warning-soft)] text-[var(--ps-warning)]",
  },
  {
    role: "ADMIN",
    label: "Admin",
    icon: ShieldCheck,
    tone: "bg-[var(--ps-lavender-soft)] text-[#7667BB]",
  },
] as const;

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [demoLoadingRole, setDemoLoadingRole] = useState<DemoRole | null>(null);

  const shouldReduceMotion = useReducedMotion();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  function getNextPath() {
    if (typeof window === "undefined") {
      return null;
    }

    return new URLSearchParams(window.location.search).get("next");
  }

  async function submitLogin(values: LoginValues) {
    try {
      const nextPath = getNextPath();

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...values,
          ...(nextPath ? { next: nextPath } : {}),
        }),
      });

      const data = (await response.json()) as AuthResponse;

      if (!response.ok) {
        toast.error(
          getErrorMessage(data, "Unable to sign in. Check your credentials and try again."),
        );

        return;
      }

      toast.success("Signed in successfully.");

      window.location.assign(data.redirectTo ?? "/dashboard");
    } catch {
      toast.error("PowerSync could not be reached. Please try again.");
    }
  }

  async function loginAsDemo(role: DemoRole) {
    setDemoLoadingRole(role);

    try {
      const nextPath = getNextPath();

      const response = await fetch("/api/auth/demo-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          role,
          ...(nextPath ? { next: nextPath } : {}),
        }),
      });

      const data = (await response.json()) as AuthResponse;

      if (!response.ok) {
        toast.error(getErrorMessage(data, "Demo login is temporarily unavailable."));

        return;
      }

      toast.success(`${formatRole(role)} demo opened.`);

      window.location.assign(data.redirectTo ?? getRoleHome(role));
    } catch {
      toast.error("PowerSync could not be reached. Please try again.");
    } finally {
      setDemoLoadingRole(null);
    }
  }

  return (
    <motion.form
      onSubmit={handleSubmit(submitLogin)}
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
          initial={shouldReduceMotion ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.45,
            delay: 0.1,
          }}
        >
          <p className="text-xs font-bold tracking-[0.14em] text-[var(--ps-primary)] uppercase">
            Welcome back
          </p>

          <h1 className="text-3xl font-bold tracking-[-0.04em] text-[var(--ps-text)] sm:text-4xl">
            Sign in to PowerSync
          </h1>

          <p className="text-sm leading-6 text-[var(--ps-text-muted)]">
            Enter your account credentials to continue.
          </p>
        </motion.div>

        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.4,
            delay: 0.2,
          }}
        >
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
        </motion.div>

        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.4,
            delay: 0.27,
          }}
        >
          <Field>
            <FieldLabel htmlFor="password">Password</FieldLabel>

            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Enter your password"
                aria-invalid={errors.password ? true : undefined}
                className="bg-[var(--ps-surface)] pr-11 transition-[border-color,box-shadow,transform] duration-200 focus:scale-[1.005]"
                {...register("password")}
              />

              <motion.button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                whileTap={
                  shouldReduceMotion
                    ? undefined
                    : {
                        scale: 0.88,
                      }
                }
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute top-1/2 right-1 flex size-9 -translate-y-1/2 items-center justify-center rounded-lg text-[var(--ps-text-muted)] transition-colors hover:bg-[var(--ps-surface-muted)] hover:text-[var(--ps-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ps-primary)]"
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </motion.button>
            </div>

            {errors.password ? (
              <FieldDescription className="text-[var(--ps-danger)]">
                {errors.password.message}
              </FieldDescription>
            ) : null}
          </Field>
        </motion.div>

        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.4,
            delay: 0.34,
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
                disabled={isSubmitting || demoLoadingRole !== null}
                className="min-h-11 w-full bg-[var(--ps-primary)] text-white hover:bg-[var(--ps-primary-hover)]"
              >
                {isSubmitting ? (
                  <>
                    <LoaderCircle className="size-4 animate-spin" />
                    Signing in
                  </>
                ) : (
                  <>
                    Sign In
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
          initial={shouldReduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            duration: 0.4,
            delay: 0.42,
          }}
        >
          <FieldDescription className="text-center text-sm">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="font-semibold text-[var(--ps-primary)] underline-offset-4 hover:underline"
            >
              Create account
            </Link>
          </FieldDescription>
        </motion.div>

        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            duration: 0.4,
            delay: 0.48,
          }}
        >
          <FieldSeparator>Demo access</FieldSeparator>
        </motion.div>

        <Field>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {demoRoles.map((demo, index) => {
              const Icon = demo.icon;
              const isLoading = demoLoadingRole === demo.role;

              return (
                <motion.button
                  key={demo.role}
                  type="button"
                  disabled={isSubmitting || demoLoadingRole !== null}
                  onClick={() => loginAsDemo(demo.role)}
                  initial={
                    shouldReduceMotion
                      ? false
                      : {
                          opacity: 0,
                          y: 18,
                          scale: 0.96,
                        }
                  }
                  animate={{
                    opacity: 1,
                    y: 0,
                    scale: 1,
                  }}
                  transition={{
                    duration: 0.4,
                    delay: 0.55 + index * 0.07,
                  }}
                  whileHover={
                    shouldReduceMotion
                      ? undefined
                      : {
                          y: -4,
                          scale: 1.02,
                        }
                  }
                  whileTap={
                    shouldReduceMotion
                      ? undefined
                      : {
                          scale: 0.96,
                        }
                  }
                  className="cursor-pointer group flex min-h-[92px] flex-col items-center justify-center rounded-2xl border border-[var(--ps-border)] bg-[var(--ps-surface)] px-2 py-3 text-center transition-colors duration-200 hover:border-[var(--ps-border-strong)] hover:bg-[var(--ps-background-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ps-primary)] disabled:pointer-events-none disabled:opacity-60 sm:min-h-[100px]"
                >
                  <motion.span
                    whileHover={
                      shouldReduceMotion
                        ? undefined
                        : {
                            rotate: 5,
                            scale: 1.08,
                          }
                    }
                    className={`flex size-9 items-center justify-center rounded-xl sm:size-10 ${demo.tone}`}
                  >
                    {isLoading ? (
                      <LoaderCircle className="size-4 animate-spin" />
                    ) : (
                      <Icon className="size-4 sm:size-[18px]" />
                    )}
                  </motion.span>

                  <span className="mt-2.5 text-[11px] font-bold text-[var(--ps-text)] sm:text-xs">
                    {demo.label}
                  </span>
                </motion.button>
              );
            })}
          </div>

          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{
              delay: 0.8,
              duration: 0.4,
            }}
          ></motion.div>
        </Field>
      </FieldGroup>
    </motion.form>
  );
}

function getErrorMessage(response: AuthResponse, fallback: string) {
  return response.message ?? response.error ?? fallback;
}

function getRoleHome(role: DemoRole) {
  switch (role) {
    case "ADMIN":
      return "/admin";
    case "OPERATOR":
      return "/operator";
    case "CUSTOMER":
      return "/dashboard";
  }
}

function formatRole(role: DemoRole) {
  return role.charAt(0) + role.slice(1).toLowerCase();
}
