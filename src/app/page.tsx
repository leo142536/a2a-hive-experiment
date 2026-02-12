"use client";

/**
 * 首页 - A2A 蜂巢实验
 * 深色主题 + 粒子背景 + 文字逐字出现 + 闪光按钮 + 数字计数 + 3D 卡片
 */

import Link from "next/link";
import { motion, useMotionValue, useTransform, useReducedMotion } from "framer-motion";
import Sparkles from "@/components/ui/sparkles";
import TextGenerateEffect from "@/components/ui/text-generate-effect";
import ShimmerButton from "@/components/ui/shimmer-button";
import NumberTicker from "@/components/ui/number-ticker";

/** 特性卡片数据 */
const FEATURES = [
  { icon: "\u{1F5FA}", title: "六边形世界", desc: "7x7 网格地图，四种资源类型" },
  { icon: "\u{1F916}", title: "AI 自主决策", desc: "通过 SecondMe 驱动，自主行动" },
  { icon: "\u{1F310}", title: "涌现观察", desc: "联盟、领袖、规则自发形成" },
];

/** 统计数据 */
const STATS = [
  { label: "代理数", value: 12, color: "#10b981" },
  { label: "联盟数", value: 3, color: "#8b5cf6" },
  { label: "回合数", value: 48, color: "#f59e0b" },
];

/** 3D 倾斜特性卡片 - 鼠标跟随倾斜效果 */
function FeatureCard({ icon, title, desc, index }: {
  icon: string; title: string; desc: string; index: number;
}) {
  const prefersReducedMotion = useReducedMotion();
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // 鼠标位置映射到倾斜角度
  const rotateX = useTransform(mouseY, [-0.5, 0.5], [8, -8]);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], [-8, 8]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion) return;
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <motion.div
      className="card-dark p-5 cursor-default"
      style={{
        boxShadow: "0 0 20px rgba(245, 158, 11, 0.05)",
        perspective: 600,
        rotateX: prefersReducedMotion ? 0 : rotateX,
        rotateY: prefersReducedMotion ? 0 : rotateY,
        transformStyle: "preserve-3d",
      }}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.6 + index * 0.15 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      whileHover={prefersReducedMotion ? {} : {
        boxShadow: "0 0 30px rgba(245, 158, 11, 0.15)",
      }}
    >
      <div className="text-3xl mb-3">{icon}</div>
      <h3 className="font-medium mb-1" style={{ color: "#e2e8f0" }}>{title}</h3>
      <p style={{ color: "#64748b" }}>{desc}</p>
    </motion.div>
  );
}

export default function HomePage() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 hex-bg-pattern relative overflow-hidden">
      {/* 粒子闪烁背景 */}
      <Sparkles count={40} color="#f59e0b" />
      <Sparkles count={15} color="#8b5cf6" className="opacity-50" />

      {/* 背景装饰光晕 */}
      <div
        className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-10 pointer-events-none"
        style={{ background: "radial-gradient(circle, #f59e0b, transparent 70%)" }}
      />
      <div
        className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, #8b5cf6, transparent 70%)", opacity: 0.06 }}
      />

      {/* 主标题区域 */}
      <div className="text-center max-w-2xl relative z-10">
        {/* Logo - 带浮动动画 */}
        <motion.div
          className="text-7xl mb-6"
          animate={prefersReducedMotion ? {} : {
            y: [0, -8, 0],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          {"\u{1F41D}"}
        </motion.div>

        {/* 渐变大标题 - 逐字出现 */}
        <h1 className="text-5xl font-bold mb-3 text-gradient-honey">
          <TextGenerateEffect words="A2A 蜂巢实验" staggerDelay={0.08} />
        </h1>

        <motion.p
          className="text-lg mb-8"
          style={{ color: "#94a3b8" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
        >
          观察 AI 社会的涌现
        </motion.p>

        {/* 简介 */}
        <motion.p
          className="mb-10 leading-relaxed text-sm"
          style={{ color: "#64748b" }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.6 }}
        >
          把多个用户的 AI 扔进一个虚拟世界，给它们有限资源和简单的生存目标。
          <br />
          观察它们会不会自发形成联盟、制定规则、出现领袖、甚至产生&ldquo;文化&rdquo;。
          <br />
          你只能观察和微调自己 AI 的价值观，不能直接干预。
        </motion.p>

        {/* 特性卡片 - 3D 倾斜 + 交错淡入 */}
        <div className="grid grid-cols-3 gap-4 mb-10 text-sm">
          {FEATURES.map((card, i) => (
            <FeatureCard key={card.title} {...card} index={i} />
          ))}
        </div>

        {/* 蜂巢状态统计 - 数字计数动画 */}
        <motion.div
          className="flex justify-center gap-6 mb-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.5 }}
        >
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-2xl font-bold" style={{ color: stat.color }}>
                <NumberTicker value={stat.value} duration={2} />
              </div>
              <div className="text-xs" style={{ color: "#64748b" }}>{stat.label}</div>
            </div>
          ))}
        </motion.div>

        {/* 操作按钮 */}
        <motion.div
          className="flex gap-4 justify-center"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.4, duration: 0.5 }}
        >
          <Link href="/api/auth/login">
            <ShimmerButton>SecondMe 登录</ShimmerButton>
          </Link>
          <Link
            href="/hive"
            className="px-8 py-2.5 rounded-xl text-sm font-medium transition-all duration-300"
            style={{
              background: "rgba(245, 158, 11, 0.1)",
              color: "#f59e0b",
              border: "1px solid rgba(245, 158, 11, 0.3)",
            }}
          >
            进入蜂巢
          </Link>
        </motion.div>
      </div>

      {/* 底部信息 */}
      <footer className="mt-16 text-xs" style={{ color: "#4a5568" }}>
        A2A 蜂巢实验 - AI 社会学实验平台 - 同频小屋
      </footer>
    </main>
  );
}
