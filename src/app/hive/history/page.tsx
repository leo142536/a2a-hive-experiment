"use client";

/**
 * 事件历史页面 - 深色主题（动画增强版）
 * 滚动展示 + 事件卡片交错淡入 + 筛选切换 AnimatePresence 过渡
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { type WorldEvent, type ActionType } from "@/lib/simulation";

/* 事件类型标签配置 */
const EVENT_TYPES: { value: ActionType | "all"; label: string; icon: string; color: string }[] = [
  { value: "all", label: "全部", icon: "\u{1F4CB}", color: "#f59e0b" },
  { value: "move", label: "移动", icon: "\u{1F6B6}", color: "#94a3b8" },
  { value: "gather", label: "采集", icon: "\u26CF", color: "#10b981" },
  { value: "trade", label: "交易", icon: "\u{1F91D}", color: "#3b82f6" },
  { value: "chat", label: "对话", icon: "\u{1F4AC}", color: "#a78bfa" },
  { value: "ally", label: "结盟", icon: "\u{1F3F3}", color: "#f97316" },
  { value: "vote", label: "投票", icon: "\u{1F5F3}", color: "#ef4444" },
];

const EVENT_ICONS: Record<string, string> = {
  move: "\u{1F6B6}", gather: "\u26CF", trade: "\u{1F91D}",
  chat: "\u{1F4AC}", ally: "\u{1F3F3}", vote: "\u{1F5F3}", idle: "\u{1F4A4}",
};

const EVENT_COLORS: Record<string, string> = {
  move: "#94a3b8", gather: "#10b981", trade: "#3b82f6",
  chat: "#a78bfa", ally: "#f97316", vote: "#ef4444", idle: "#64748b",
};

/** 回合分组组件 - 带滚动展示 */
function TickGroup({ tick, events }: { tick: number; events: WorldEvent[] }) {
  const { ref, isInView } = useScrollReveal();

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      {/* 回合标记 */}
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold"
          style={{
            background: "linear-gradient(135deg, #f59e0b, #d97706)",
            color: "white",
            boxShadow: "0 0 12px rgba(245, 158, 11, 0.3)",
          }}
        >
          {tick}
        </div>
        <span className="text-sm font-medium" style={{ color: "#e2e8f0" }}>
          第 {tick} 回合
        </span>
        <span
          className="text-xs px-2 py-0.5 rounded"
          style={{ background: "rgba(245, 158, 11, 0.1)", color: "#f59e0b" }}
        >
          {events.length} 个事件
        </span>
      </div>

      {/* 事件列表 - 交错淡入 */}
      <div
        className="ml-4 pl-6 space-y-2"
        style={{ borderLeft: "2px solid rgba(245, 158, 11, 0.15)" }}
      >
        {events.map((event, idx) => {
          const isEmergence = Boolean((event.detail as Record<string, unknown>).emergence);
          const eventColor = EVENT_COLORS[event.type] || "#64748b";

          return (
            <motion.div
              key={idx}
              className="p-3 rounded-xl text-sm"
              style={{
                background: isEmergence
                  ? "rgba(245, 158, 11, 0.08)"
                  : "rgba(26, 26, 46, 0.6)",
                border: isEmergence
                  ? "1px solid rgba(245, 158, 11, 0.4)"
                  : "1px solid rgba(255,255,255,0.04)",
              }}
              initial={{ opacity: 0, x: -15 }}
              animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -15 }}
              transition={{ duration: 0.3, delay: idx * 0.06 }}
              {...(isEmergence ? {
                // 涌现事件脉冲
                whileInView: {
                  boxShadow: [
                    "0 0 5px rgba(245, 158, 11, 0.2)",
                    "0 0 15px rgba(245, 158, 11, 0.4)",
                    "0 0 5px rgba(245, 158, 11, 0.2)",
                  ],
                },
              } : {})}
            >
              <div className="flex items-center gap-2">
                <span>{EVENT_ICONS[event.type] || "?"}</span>
                <span className="font-medium" style={{ color: "#e2e8f0" }}>
                  {event.agentName}
                </span>
                <span
                  className="text-xs px-2 py-0.5 rounded"
                  style={{
                    background: `${eventColor}15`,
                    color: eventColor,
                  }}
                >
                  {event.type}
                </span>
                {isEmergence && (
                  <motion.span
                    className="text-xs px-2 py-0.5 rounded font-bold"
                    style={{
                      background: "rgba(245, 158, 11, 0.2)",
                      color: "#f59e0b",
                    }}
                    animate={{
                      boxShadow: [
                        "0 0 4px rgba(245, 158, 11, 0.2)",
                        "0 0 12px rgba(245, 158, 11, 0.5)",
                        "0 0 4px rgba(245, 158, 11, 0.2)",
                      ],
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    涌现
                  </motion.span>
                )}
              </div>
              <p className="mt-1 text-xs" style={{ color: "#64748b" }}>
                {JSON.stringify(event.detail)}
              </p>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

export default function HistoryPage() {
  const [events, setEvents] = useState<WorldEvent[]>([]);
  const [filter, setFilter] = useState<ActionType | "all">("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/hive/events")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setEvents(data.events || []);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  /* 筛选事件 */
  const filtered = filter === "all" ? events : events.filter((e) => e.type === filter);

  /* 按回合分组 */
  const grouped = filtered.reduce<Record<number, WorldEvent[]>>((acc, event) => {
    if (!acc[event.tick]) acc[event.tick] = [];
    acc[event.tick].push(event);
    return acc;
  }, {});

  const ticks = Object.keys(grouped)
    .map(Number)
    .sort((a, b) => b - a);

  return (
    <div className="min-h-screen" style={{ background: "#0a0a1a" }}>
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 py-8">
        <motion.h1
          className="text-2xl font-bold mb-2 text-gradient-honey"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          事件历史
        </motion.h1>
        <motion.p
          className="text-sm mb-6"
          style={{ color: "#64748b" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          查看虚拟世界中发生的所有事件，关键涌现事件会高亮显示。
        </motion.p>

        {/* 筛选栏 - 标签按钮 + 动画 */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {EVENT_TYPES.map((type) => {
            const isActive = filter === type.value;
            return (
              <motion.button
                key={type.value}
                onClick={() => setFilter(type.value)}
                className="px-3 py-1.5 rounded-lg text-sm"
                style={{
                  background: isActive
                    ? `${type.color}22`
                    : "rgba(255,255,255,0.03)",
                  color: isActive ? type.color : "#64748b",
                  border: `1px solid ${isActive ? `${type.color}44` : "rgba(255,255,255,0.06)"}`,
                  fontWeight: isActive ? 600 : 400,
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                layout
              >
                <span className="mr-1">{type.icon}</span>
                {type.label}
              </motion.button>
            );
          })}
        </div>

        {/* 时间线 - AnimatePresence 筛选过渡 */}
        {loading ? (
          <div className="text-center py-8">
            <motion.div
              className="text-3xl mb-2"
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              {"\u{1F41D}"}
            </motion.div>
            <p style={{ color: "#4a5568" }}>加载中...</p>
          </div>
        ) : ticks.length === 0 ? (
          <p className="text-center py-8" style={{ color: "#4a5568" }}>暂无事件记录</p>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={filter}
              className="space-y-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              {ticks.map((tick) => (
                <TickGroup key={tick} tick={tick} events={grouped[tick]} />
              ))}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
