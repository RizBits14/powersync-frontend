"use client";

import { LoaderCircle } from "lucide-react";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface GoogleCredentialResponse {
  credential: string;
}

interface GoogleIdentity {
  initialize(options: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
  }): void;

  renderButton(
    parent: HTMLElement,
    options: {
      type?: "standard" | "icon";
      theme?: "outline" | "filled_blue" | "filled_black";
      size?: "large" | "medium" | "small";
      text?: "signin_with" | "signup_with" | "continue_with" | "signin";
      shape?: "rectangular" | "pill" | "circle" | "square";
      logo_alignment?: "left" | "center";
      width?: number;
      locale?: string;
    },
  ): void;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: GoogleIdentity;
      };
    };
  }
}

interface GoogleSignInButtonProps {
  nextPath?: string;
}

export function GoogleSignInButton({ nextPath }: GoogleSignInButtonProps) {
  const router = useRouter();

  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const buttonRef = useRef<HTMLDivElement | null>(null);

  const lastRenderedWidth = useRef<number | null>(null);

  const [googleReady, setGoogleReady] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  const handleCredential = useCallback(
    async (response: GoogleCredentialResponse) => {
      setSubmitting(true);

      try {
        const result = await fetch("/api/auth/google", {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            credential: response.credential,
            ...(nextPath
              ? {
                  next: nextPath,
                }
              : {}),
          }),
        });

        const payload = (await result.json()) as {
          message?: string;
          error?: string;
          redirectTo?: string;
        };

        if (!result.ok) {
          throw new Error(payload.message ?? payload.error ?? "Google authentication failed.");
        }

        toast.success("Signed in with Google successfully.");

        const destination =
          payload.redirectTo ?? (nextPath?.startsWith("/dashboard") ? nextPath : "/dashboard");

        router.replace(destination);
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Google authentication failed.");
      } finally {
        setSubmitting(false);
      }
    },
    [nextPath, router],
  );

  const renderGoogleButton = useCallback(() => {
    const google = window.google?.accounts.id;

    const wrapper = wrapperRef.current;

    const button = buttonRef.current;

    if (!clientId || !google || !wrapper || !button) {
      return;
    }

    const availableWidth = wrapper.getBoundingClientRect().width;

    if (availableWidth <= 0) {
      return;
    }

    /*
     * Google standard buttons support a fixed rendered width.
     * We recalculate it whenever the parent changes size.
     *
     * Desktop: maximum 400px
     * Tablet/mobile: fills available width
     */
    const width = Math.min(Math.floor(availableWidth), 400);

    if (lastRenderedWidth.current === width) {
      return;
    }

    lastRenderedWidth.current = width;

    button.replaceChildren();

    google.renderButton(button, {
      type: "standard",
      theme: "outline",
      size: "large",

      // Force the visible button text to English.
      locale: "en",

      text: "signin_with",
      shape: "rectangular",
      logo_alignment: "left",
      width,
    });
  }, [clientId]);

  const initializeGoogle = useCallback(() => {
    const google = window.google?.accounts.id;

    if (!clientId || !google) {
      return;
    }

    google.initialize({
      client_id: clientId,
      callback: handleCredential,
    });

    setGoogleReady(true);
  }, [clientId, handleCredential]);

  useEffect(() => {
    if (!googleReady) {
      return;
    }

    renderGoogleButton();

    const wrapper = wrapperRef.current;

    if (!wrapper) {
      return;
    }

    const resizeObserver = new ResizeObserver(() => {
      renderGoogleButton();
    });

    resizeObserver.observe(wrapper);

    return () => {
      resizeObserver.disconnect();
    };
  }, [googleReady, renderGoogleButton]);

  if (!clientId) {
    return (
      <div className="w-full rounded-xl border border-[var(--ps-border)] bg-[var(--ps-surface-muted)] px-4 py-3 text-center text-xs font-semibold text-[var(--ps-danger)]">
        Google Sign-In is not configured.
      </div>
    );
  }

  return (
    <div ref={wrapperRef} className="relative flex w-full justify-center overflow-hidden">
      <Script
        id="google-identity-services"
        src="https://accounts.google.com/gsi/client?hl=en"
        strategy="afterInteractive"
        onReady={initializeGoogle}
      />

      <div className="flex w-full max-w-[400px] justify-center">
        <div ref={buttonRef} className="min-h-11 w-full" />
      </div>

      {submitting ? (
        <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-white/90">
          <LoaderCircle className="size-5 animate-spin text-[var(--ps-primary)]" />

          <span className="ml-2 text-sm font-semibold text-[var(--ps-text)]">Signing in...</span>
        </div>
      ) : null}
    </div>
  );
}
