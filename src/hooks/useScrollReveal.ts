"use client";

/**
 * 滚动展示 Hook
 * 元素进入视口时触发淡入动画，支持交错延迟
 */

import { useRef } from "react";
import { useInView, type UseInViewOptions } from "framer-motion";

interface UseScrollRevealOptions {
  /** 触发一次后不再重复 */
  once?: boolean;
  /** 视口边距 */
  margin?: `${number}px ${number}px ${number}px ${number}px` | `${number}px`;
  /** 触发阈值 */
  amount?: UseInViewOptions["amount"];
}

/**
 * 返回 ref 和 isInView 状态
 * 用于配合 framer-motion 的 animate 属性实现滚动展示
 */
export function useScrollReveal(options: UseScrollRevealOptions = {}) {
  const { once = true, margin = "-80px", amount = 0.2 } = options;
  const ref = useRef(null);
  const isInView = useInView(ref, { once, margin, amount });

  return { ref, isInView };
}
