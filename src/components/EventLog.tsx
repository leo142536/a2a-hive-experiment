"use client";

/**
 * 事件日志组件 - 深色主题（动画增强版）
 * AnimatePresence 进入动画 + 涌现事件金色脉冲缩放
 */

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { type WorldEvent, type ActionType } from "@/lib/simulation";

interface EventLogProps {
  events: WorldEvent[];
  maxHeight?: string;
}

/* 事件类型对应的图标和颜色 */
const EVENT_STYLES: Record<ActionType, { icon: string; color: string }> = {
  move: { icon: "\u{1F6B6}", color: "#94a3b8" },
  gather: { icon: "\u26CF", color: "#10b981" },
  trade: { icon: "\u{1F91D}", color: "#3b82f6" },
  chat: { icon: "\u{1F4AC}", color: "#a78bfa" },
  ally: { icon: "\u{1F3F3}", color: "#f97316" },
  vote: { icon: "\u{1F5F3}", color: "#ef4444" },
  idle: { icon: "\u{1F4A4}", color: "#64748b" },
};

/** 格式化事件描述 */
function formatEvent(event: WorldEvent): string {
  const detail = event.detail as Record<string, unknown>;
  switch (event.type) {
    case "move":
      return `${event.agentName} 移动到 (${(detail.to as Record<string, number>)?.q}, ${(detail.to as Record<string, number>)?.r})`;
    case "gather":
      return `${event.agentName} 采集了 ${detail.resource} x${detail.amount}`;
    case "trade":
      return detail.success
        ? `${event.agentName} 与 ${detail.with} 完成交易`
        : `${event.agentName} 交易失败: ${detail.reason}`;
    case "chat":
      return `${event.agentName} 对 ${detail.with} 说: "${(detail.message as string)?.slice(0, 30) || "..."}"`;
    case "ally":
      if (detail.emergence) return `[涌现] ${detail.allianceName} 成长为大型联盟 (${detail.size}人)`;
      return `${event.agentName} ${detail.action}: ${detail.allianceName}`;
    case "vote":
      if (detail.emergence) return `[涌现] ${event.agentName} 成为领袖 (声望${detail.reputation})`;
      return `${event.agentName} 投票: ${detail.proposal}`;
    case "idle":
      return `${(detail.message as string) || `${event.agentName} 休息中`}`;
    default:
      return `${event.agentName} 执行了未知行动`;
  }
}

export default function EventLog({ events, maxHeight = "400px" }: EventLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  /* 自动滚动到底部 */
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [events]);

  return (
    <div
      ref={scrollRef}
      className="overflow-y-auto space-y-1 pr-1"
      style={{ maxHeight }}
    >
      {events.length === 0 ? (
        <p className="text-sm text-center py-4" style={{ color: "#4a5568" }}>
          暂无事件，推进回合开始实验
        </p>
      ) : (
        <AnimatePresence initial={false}>
          {events.map((event, idx) => {
            const style = EVENT_STYLES[event.type] || EVENT_STYLES.idle;
            const isEmergence = (event.detail as Record<string, unknown>).emergence;

            return (
              <motion.div
                key={`${event.tick}-${event.agentId}-${idx}`}
                className="flex items-start gap-2 text-xs py-1.5 px-2 rounded-lg"
                style={{
                  background: isEmergence
                    ? "rgba(245, 158, 11, 0.1)"
                    : "transparent",
                  border: isEmergence
                    ? "1px solid rgba(245, 158, 11, 0.3)"
                    : "1px solid transparent",
                }}
                // 新事件从上方滑入
                initial={{ opacity: 0, y: -10, scale: isEmergence ? 0.9 : 1 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  // 涌现事件金色脉冲
                  ...(isEmergence ? {
                    boxShadow: [
                      "0 0 5px rgba(245, 158, 11, 0.3)",
                      "0 0 20px rgba(245, 158, 11, 0.6)",
                      "0 0 5px rgba(245, 158, 11, 0.3)",
                    ],
                  } : {}),
                }}
                transition={{
                  duration: 0.3,
                  ...(isEmergence ? {
                    boxShadow: { duration: 2, repeat: Infinity, ease: "easeInOut" },
                  } : {}),
                }}
              >
                {/* 回合号 */}
                <span className="w-8 shrink-0" style={{ color: "#4a5568" }}>#{event.tick}</span>
                {/* 事件图标 */}
                <span>{style.icon}</span>
                {/* 事件描述 */}
                <span
                  style={{ color: isEmergence ? "#f59e0b" : style.color }}
                  className={isEmergence ? "font-bold" : ""}
                >
                  {formatEvent(event)}
                </span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      )}
    </div>
  );
}
