"use client";

import {
    motion,
    useAnimationFrame,
    useMotionValue,
    useReducedMotion,
    useScroll,
    useSpring,
    useTransform,
    useVelocity,
} from "motion/react";
import { useRef } from "react";

import { cn } from "@/lib/utils";

interface ScrollVelocityProps {
    text: string;
    className?: string;
    defaultVelocity?: number;
    direction?: 1 | -1;
}

const REPEAT_COUNT = 4;

function wrap(min: number, max: number, value: number) {
    const range = max - min;

    return ((((value - min) % range) + range) % range) + min;
}

export function ScrollVelocity({
    text,
    className,
    defaultVelocity = 2,
    direction = 1,
}: ScrollVelocityProps) {
    const baseX = useMotionValue(0);
    const directionFactor = useRef(direction);
    const shouldReduceMotion = useReducedMotion();

    const { scrollY } = useScroll();
    const scrollVelocity = useVelocity(scrollY);

    const smoothVelocity = useSpring(scrollVelocity, {
        damping: 50,
        stiffness: 400,
    });

    const velocityFactor = useTransform(
        smoothVelocity,
        [-1000, 0, 1000],
        [-4, 0, 4],
        {
            clamp: false,
        },
    );

    const x = useTransform(
        baseX,
        (value) => `${wrap(-25, 0, value)}%`,
    );

    useAnimationFrame((_, delta) => {
        if (shouldReduceMotion) {
            return;
        }

        const currentVelocity = velocityFactor.get();

        let moveBy =
            directionFactor.current *
            defaultVelocity *
            (delta / 1000);

        moveBy +=
            directionFactor.current *
            moveBy *
            Math.abs(currentVelocity);

        baseX.set(baseX.get() + moveBy);
    });

    if (shouldReduceMotion) {
        return (
            <p
                className={cn(
                    "text-center font-bold tracking-[0.1em]",
                    className,
                )}
            >
                {text}
            </p>
        );
    }

    return (
        <div className="w-full overflow-hidden">
            <span className="sr-only">{text}</span>

            <motion.div
                aria-hidden="true"
                className="flex w-max whitespace-nowrap"
                style={{ x }}
            >
                {Array.from({ length: REPEAT_COUNT }).map(
                    (_, index) => (
                        <span
                            key={index}
                            className={cn(
                                "shrink-0 pr-12 font-bold tracking-[0.1em]",
                                className,
                            )}
                        >
                            {text}
                        </span>
                    ),
                )}
            </motion.div>
        </div>
    );
}