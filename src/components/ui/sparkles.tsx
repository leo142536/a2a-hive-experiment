"use client";

/**
 * 粒子闪烁效果组件
 * 用 CSS + framer-motion 实现小粒子闪烁，用于首页背景装饰
 * 绝对定位的小圆点 + 随机动画，不使用 canvas
 */

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SparklesProps {
  /** 粒子数量 */
  count?: number;
  /** 容器类名 */
  className?: string;
  /** 粒子颜色 */
  color?: string;
}

interface Particle {
  id: number;
  x: number;   // 百分比位置
  y: number;
  size: number; // 粒子大小 px
  duration: number; // 动画周期
  delay: number;
}

/** 生成随机粒子数据 */
function generateParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 3 + 1,
    duration: Math.random() * 3 + 2,
    delay: Math.random() * 3,
  }));
}

export default function Sparkles({
  count = 30,
  className,
  color = "#f59e0b",
}: SparklesProps) {
  const prefersReducedMotion = useReducedMotion();
  const [particles, setParticles] = useState<Particle[]>([]);

  // 客户端生成粒子，避免 SSR 不一致
  useEffect(() => {
    setParticles(generateParticles(count));
  }, [count]);

  if (particles.length === 0) return null;

  return (
    <div className={cn("absolute inset-0 overflow-hidden pointer-events-none", className)}>
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            backgroundColor: color,
          }}
          animate={
            prefersReducedMotion
              ? { opacity: 0.3 }
              : {
                  opacity: [0, 0.8, 0],
                  scale: [0.5, 1.2, 0.5],
                }
          }
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
