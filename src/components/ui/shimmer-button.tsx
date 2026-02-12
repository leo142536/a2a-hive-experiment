"use client";

/**
 * 闪光按钮组件
 * 带闪光扫过效果的按钮，用于重要 CTA
 */

import { type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ShimmerButtonProps {
  children: ReactNode;
  /** 闪光颜色 */
  shimmerColor?: string;
  /** 按钮背景 */
  background?: string;
  /** 额外类名 */
  className?: string;
  /** 点击事件 */
  onClick?: () => void;
  /** 禁用状态 */
  disabled?: boolean;
}

export default function ShimmerButton({
  children,
  shimmerColor = "rgba(255,255,255,0.3)",
  background = "linear-gradient(135deg, #f59e0b, #d97706)",
  className,
  onClick,
  disabled,
}: ShimmerButtonProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.button
      className={cn(
        "relative overflow-hidden rounded-xl px-8 py-2.5 text-sm font-semibold text-white cursor-pointer",
        className
      )}
      style={{
        background,
        boxShadow: "0 0 15px rgba(245, 158, 11, 0.3)",
      }}
      whileHover={prefersReducedMotion ? {} : { scale: 1.03, boxShadow: "0 0 25px rgba(245, 158, 11, 0.5)" }}
      whileTap={prefersReducedMotion ? {} : { scale: 0.97 }}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
      {/* 闪光扫过层 */}
      {!prefersReducedMotion && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `linear-gradient(105deg, transparent 40%, ${shimmerColor} 50%, transparent 60%)`,
          }}
          animate={{ x: ["-100%", "200%"] }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            repeatDelay: 1.5,
            ease: "easeInOut",
          }}
        />
      )}
    </motion.button>
  );
}
