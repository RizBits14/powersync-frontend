"use client";

import {
    animate,
    motion,
    useInView,
    useMotionValue,
    useReducedMotion,
} from "motion/react";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

interface NumberTickerProps {
    value: number;
    className?: string;
    delay?: number;
    decimalPlaces?: number;
    suffix?: string;
}

export function NumberTicker({
    value,
    className,
    delay = 0,
    decimalPlaces = 0,
    suffix = "",
}: NumberTickerProps) {
    const ref = useRef<HTMLSpanElement>(null);

    const motionValue = useMotionValue(0);
    const isInView = useInView(ref, {
        once: true,
        margin: "-60px",
    });

    const shouldReduceMotion = useReducedMotion();

    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
        if (!isInView || shouldReduceMotion) {
            return;
        }

        let stopSubscription: (() => void) | undefined;
        let animationControls: ReturnType<typeof animate> | undefined;

        const timeoutId = window.setTimeout(() => {
            stopSubscription = motionValue.on("change", (latest) => {
                setDisplayValue(latest);
            });

            animationControls = animate(motionValue, value, {
                duration: 1.4,
                ease: "easeOut",
            });
        }, delay * 1000);

        return () => {
            window.clearTimeout(timeoutId);
            animationControls?.stop();
            stopSubscription?.();
        };
    }, [
        delay,
        isInView,
        motionValue,
        shouldReduceMotion,
        value,
    ]);

    if (shouldReduceMotion) {
        return (
            <span
                ref={ref}
                className={cn("tabular-nums", className)}
            >
                {value.toFixed(decimalPlaces)}
                {suffix}
            </span>
        );
    }

    return (
        <motion.span
            ref={ref}
            className={cn("tabular-nums", className)}
        >
            {displayValue.toFixed(decimalPlaces)}
            {suffix}
        </motion.span>
    );
}