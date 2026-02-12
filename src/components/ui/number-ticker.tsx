"use client";

/**
 * 数字计数器组件
 * 用 framer-motion 的 useMotionValue + animate
 * 实现数字从 0 滚动到目标值的动画
 */

import { useEffect, useRef } from "react";
import { useMotionValue, animate, useReducedMotion, useInView } from "framer-motion";

interface NumberTickerProps {
  /** 目标数值 */
  value: number;
  /** 动画时长（秒） */
  duration?: number;
  /** 小数位数 */
  decimals?: number;
  /** 额外类名 */
  className?: string;
  /** 前缀文字 */
  prefix?: string;
  /** 后缀文字 */
  suffix?: string;
}

export default function NumberTicker({
  value,
  duration = 1.5,
  decimals = 0,
  className,
  prefix = "",
  suffix = "",
}: NumberTickerProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(0);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (!isInView) return;

    if (prefersReducedMotion) {
      motionValue.set(value);
      if (ref.current) {
        ref.current.textContent = `${prefix}${value.toFixed(decimals)}${suffix}`;
      }
      return;
    }

    const controls = animate(motionValue, value, {
      duration,
      ease: "easeOut",
    });

    // 订阅值变化，直接更新 DOM
    const unsubscribe = motionValue.on("change", (v) => {
      if (ref.current) {
        ref.current.textContent = `${prefix}${v.toFixed(decimals)}${suffix}`;
      }
    });

    return () => {
      controls.stop();
      unsubscribe();
    };
  }, [value, isInView, duration, motionValue, prefersReducedMotion, prefix, suffix, decimals]);

  return (
    <span ref={ref} className={className}>
      {`${prefix}0${suffix}`}
    </span>
  );
}
