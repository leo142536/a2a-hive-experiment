"use client";

/**
 * AI 代理详情卡片组件 - 深色半透明风格（动画增强版）
 * slide-up + fade-in 入场、属性进度条动画、价值观条形图交错动画
 */

import { motion } from "framer-motion";
import { type AgentState, type AllianceState } from "@/lib/simulation";

interface AgentCardProps {
  agent: AgentState;
  alliances: AllianceState[];
  onClose: () => void;
}

/* 代理 emoji（与 HexGrid 保持一致的哈希逻辑） */
const AGENT_EMOJIS = ["\u{1F916}", "\u{1F9E0}", "\u{1F4A1}", "\u{1F3AF}", "\u{1F52E}", "\u{1F31F}", "\u{1F3AD}", "\u{1F98A}", "\u{1F41D}", "\u{1F98B}", "\u{1F419}", "\u{1F989}", "\u{1F43A}", "\u{1F985}", "\u{1F432}"];
function getAgentEmoji(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash + id.charCodeAt(i)) | 0;
  }
  return AGENT_EMOJIS[Math.abs(hash) % AGENT_EMOJIS.length];
}

/* 联盟颜色 */
const ALLIANCE_COLORS = ["#ef4444", "#3b82f6", "#10b981", "#8b5cf6", "#f97316"];

export default function AgentCard({ agent, alliances, onClose }: AgentCardProps) {
  const alliance = agent.allianceId
    ? alliances.find((a) => a.id === agent.allianceId)
    : null;

  const allianceIdx = alliance ? alliances.findIndex((a) => a.id === alliance.id) : -1;
  const allianceColor = allianceIdx >= 0 ? ALLIANCE_COLORS[allianceIdx % ALLIANCE_COLORS.length] : null;

  /* 价值观维度 */
  const valueDims = [
    { label: "合作/竞争", value: agent.values.cooperation, color: "#3b82f6" },
    { label: "冒险/保守", value: agent.values.adventure, color: "#f59e0b" },
    { label: "社交/独立", value: agent.values.social, color: "#8b5cf6" },
    { label: "慷慨/节俭", value: agent.values.generosity, color: "#10b981" },
  ];

  return (
    <motion.div
      className="w-72 backdrop-blur-xl"
      style={{
        background: "rgba(26, 26, 46, 0.95)",
        border: `1px solid ${allianceColor || "rgba(245, 158, 11, 0.2)"}`,
        borderRadius: "16px",
        padding: "16px",
        boxShadow: `0 0 30px rgba(0,0,0,0.5), 0 0 15px ${allianceColor || "rgba(245, 158, 11, 0.1)"}`,
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", damping: 20, stiffness: 300 }}
    >
      {/* 头部 - 大 emoji + 名字 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <motion.div
            className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
            style={{
              background: "rgba(245, 158, 11, 0.1)",
              border: `2px solid ${allianceColor || "rgba(245, 158, 11, 0.3)"}`,
            }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.1 }}
          >
            {getAgentEmoji(agent.id)}
          </motion.div>
          <div>
            <h3 className="font-bold text-sm" style={{ color: "#e2e8f0" }}>{agent.name}</h3>
            <span
              className="text-xs font-medium"
              style={{ color: agent.status === "alive" ? "#10b981" : "#ef4444" }}
            >
              {agent.status === "alive" ? "存活中" : "已退出"}
            </span>
          </div>
        </div>
        <motion.button
          onClick={onClose}
          className="w-6 h-6 rounded-full flex items-center justify-center text-xs transition-colors"
          style={{ background: "rgba(255,255,255,0.05)", color: "#64748b" }}
          whileHover={{ scale: 1.2, background: "rgba(255,255,255,0.1)" }}
          whileTap={{ scale: 0.9 }}
        >
          x
        </motion.button>
      </div>

      {/* 属性 - 进度条展示 + 动画 */}
      <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
        {/* 能量 */}
        <div className="rounded-lg p-2" style={{ background: "rgba(255,255,255,0.03)" }}>
          <span style={{ color: "#64748b" }}>能量</span>
          <div className="flex items-center gap-1 mt-1">
            <div className="flex-1 h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.1)" }}>
              <motion.div
                className="h-full rounded-full"
                style={{
                  background: agent.energy > 30
                    ? "linear-gradient(90deg, #10b981, #34d399)"
                    : "linear-gradient(90deg, #ef4444, #f87171)",
                }}
                initial={{ width: 0 }}
                animate={{ width: `${agent.energy}%` }}
                transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
              />
            </div>
            <span className="font-bold" style={{ color: "#e2e8f0" }}>{agent.energy}</span>
          </div>
        </div>
        {/* 声望 */}
        <div className="rounded-lg p-2" style={{ background: "rgba(255,255,255,0.03)" }}>
          <span style={{ color: "#64748b" }}>声望</span>
          <p className="font-bold mt-1" style={{ color: "#f59e0b" }}>{agent.reputation}</p>
        </div>
        {/* 位置 */}
        <div className="rounded-lg p-2" style={{ background: "rgba(255,255,255,0.03)" }}>
          <span style={{ color: "#64748b" }}>位置</span>
          <p className="font-bold mt-1" style={{ color: "#e2e8f0" }}>({agent.posQ}, {agent.posR})</p>
        </div>
        {/* 联盟 */}
        <div className="rounded-lg p-2" style={{ background: "rgba(255,255,255,0.03)" }}>
          <span style={{ color: "#64748b" }}>联盟</span>
          <p className="font-bold mt-1 truncate" style={{ color: allianceColor || "#64748b" }}>
            {alliance?.name || "无"}
          </p>
        </div>
      </div>

      {/* 库存 - 小图标 */}
      <div className="mb-4">
        <h4 className="text-xs mb-2" style={{ color: "#64748b" }}>资源库存</h4>
        <div className="grid grid-cols-4 gap-1 text-xs">
          {[
            { icon: "\u{1F33F}", value: agent.inventory.food || 0, color: "#10b981" },
            { icon: "\u{1FAA8}", value: agent.inventory.material || 0, color: "#78716c" },
            { icon: "\u{1F4DA}", value: agent.inventory.knowledge || 0, color: "#3b82f6" },
            { icon: "\u26A1", value: agent.inventory.energy || 0, color: "#eab308" },
          ].map((item, i) => (
            <motion.div
              key={item.icon}
              className="text-center rounded-lg p-1.5"
              style={{ background: "rgba(255,255,255,0.03)" }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + i * 0.05 }}
            >
              <div className="text-base">{item.icon}</div>
              <div className="font-bold" style={{ color: item.color }}>{item.value}</div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* 价值观 - 条形图 + 交错动画 */}
      <div>
        <h4 className="text-xs mb-2" style={{ color: "#64748b" }}>价值观</h4>
        <div className="space-y-2 text-xs">
          {valueDims.map((v, i) => (
            <div key={v.label} className="flex items-center gap-2">
              <span className="w-16" style={{ color: "#64748b" }}>{v.label}</span>
              <div className="flex-1 h-2 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    background: `linear-gradient(90deg, ${v.color}88, ${v.color})`,
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: `${v.value}%` }}
                  transition={{ duration: 0.6, delay: 0.4 + i * 0.1, ease: "easeOut" }}
                />
              </div>
              <span className="w-6 text-right" style={{ color: "#94a3b8" }}>{v.value}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
