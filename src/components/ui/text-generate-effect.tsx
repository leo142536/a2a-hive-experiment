"use client";

/**
 * 文字逐字出现效果组件
 * 用 framer-motion 实现文字逐字淡入动画
 */

import { useEffect } from "react";
import { motion, stagger, useAnimate, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface TextGenerateEffectProps {
  /** 要显示的文字 */
  words: string;
  /** 容器类名 */
  className?: string;
  /** 每个字的延迟间隔（秒） */
  staggerDelay?: number;
}

export default function TextGenerateEffect({
  words,
  className,
  staggerDelay = 0.05,
}: TextGenerateEffectProps) {
  const [scope, animate] = useAnimate();
  const prefersReducedMotion = useReducedMotion();
  const chars = words.split("");

  useEffect(() => {
    if (prefersReducedMotion) {
      // 无障碍：直接显示全部文字
      animate("span", { opacity: 1, filter: "blur(0px)" }, { duration: 0 });
    } else {
      animate(
        "span",
        { opacity: 1, filter: "blur(0px)" },
        { duration: 0.3, delay: stagger(staggerDelay) }
      );
    }
  }, [animate, prefersReducedMotion, staggerDelay]);

  return (
    <motion.div ref={scope} className={cn("inline-block", className)}>
      {chars.map((char, i) => (
        <motion.span
          key={`${char}-${i}`}
          style={{ opacity: 0, filter: "blur(8px)", display: "inline-block" }}
        >
          {char === " " ? "\u00A0" : char}
        </motion.span>
      ))}
    </motion.div>
  );
}
