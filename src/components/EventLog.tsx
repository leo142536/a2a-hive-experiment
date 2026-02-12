"use client";

/**
 * 事件日志组件 - 深色主题
 * 每条事件带图标和颜色，涌现事件金色高亮，自动滚动到最新
 */

import { useEffect, useRef } from "react";
import { type WorldEvent, type ActionType } from "@/lib/simulation";

interface EventLogProps {
  events: WorldEvent[];
  maxHeight?: string;
}

/* 事件类型对应的图标和颜色（深色主题适配） */
const EVENT_STYLES: Record<ActionType, { icon: string; color: string }> = {
  move: { icon: "🚶", color: "#94a3b8" },
  gather: { icon: "⛏", color: "#10b981" },
  trade: { icon: "🤝", color: "#3b82f6" },
  chat: { icon: "💬", color: "#a78bfa" },
  ally: { icon: "🏳", color: "#f97316" },
  vote: { icon: "🗳", color: "#ef4444" },
  idle: { icon: "💤", color: "#64748b" },
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
        events.map((event, idx) => {
          const style = EVENT_STYLES[event.type] || EVENT_STYLES.idle;
          const isEmergence = (event.detail as Record<string, unknown>).emergence;

          return (
            <div
              key={idx}
              className="flex items-start gap-2 text-xs py-1.5 px-2 rounded-lg transition-colors"
              style={{
                background: isEmergence
                  ? "rgba(245, 158, 11, 0.1)"
                  : "transparent",
                border: isEmergence
                  ? "1px solid rgba(245, 158, 11, 0.3)"
                  : "1px solid transparent",
                ...(isEmergence ? { animation: "pulse-glow 2s ease-in-out infinite" } : {}),
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
            </div>
          );
        })
      )}
    </div>
  );
}
