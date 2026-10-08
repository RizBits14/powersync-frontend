"use client";

import { motion, useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";

interface MarqueeProps {
    children: React.ReactNode;
    className?: string;
    duration?: number;
    reverse?: boolean;
}

export function Marquee({
    children,
    className,
    duration = 28,
    reverse = false,
}: MarqueeProps) {
    const shouldReduceMotion = useReducedMotion();

    if (shouldReduceMotion) {
        return (
            <div
                className={cn(
                    "flex flex-wrap justify-center gap-4",
                    className,
                )}
            >
                {children}
            </div>
        );
    }

    return (
        <div className="w-full overflow-hidden">
            <motion.div
                className={cn(
                    "flex w-max items-stretch",
                    className,
                )}
                animate={{
                    x: reverse
                        ? ["-50%", "0%"]
                        : ["0%", "-50%"],
                }}
                transition={{
                    duration,
                    ease: "linear",
                    repeat: Infinity,
                }}
            >
                <div className="flex shrink-0 gap-4 pr-4">
                    {children}
                </div>

                <div
                    aria-hidden="true"
                    className="flex shrink-0 gap-4 pr-4"
                >
                    {children}
                </div>
            </motion.div>
        </div>
    );
}