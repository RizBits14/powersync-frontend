"use client";

import { motion, useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";

interface TextBlurRevealProps {
    text: string;
    className?: string;
    delay?: number;
}

export function TextBlurReveal({
    text,
    className,
    delay = 0.08,
}: TextBlurRevealProps) {
    const shouldReduceMotion = useReducedMotion();

    const letters = Array.from(text);

    if (shouldReduceMotion) {
        return <span className={className}>{text}</span>;
    }

    return (
        <span
            className={cn("inline-flex", className)}
            aria-label={text}
        >
            <span className="sr-only">{text}</span>

            {letters.map((letter, index) => (
                <motion.span
                    key={`${letter}-${index}`}
                    aria-hidden="true"
                    initial={{
                        opacity: 0,
                        filter: "blur(10px)",
                        y: 12,
                    }}
                    animate={{
                        opacity: 1,
                        filter: "blur(0px)",
                        y: 0,
                    }}
                    transition={{
                        duration: 0.5,
                        delay: index * delay,
                        ease: "easeOut",
                    }}
                >
                    {letter}
                </motion.span>
            ))}
        </span>
    );
}