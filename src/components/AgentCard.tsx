"use client";

/**
 * AI 代理详情卡片组件 - 深色半透明风格
 * 大 emoji 头像 + 属性进度条 + 库存图标 + 价值观条形图
 */

import { type AgentState, type AllianceState } from "@/lib/simulation";

interface AgentCardProps {
  agent: AgentState;
  alliances: AllianceState[];
  onClose: () => void;
}

/* 代理 emoji（与 HexGrid 保持一致的哈希逻辑） */
const AGENT_EMOJIS = ["🤖", "🧠", "💡", "🎯", "🔮", "🌟", "🎭", "🦊", "🐝", "🦋", "🐙", "🦉", "🐺", "🦅", "🐲"];
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

  return (
    <div
      className="w-72 animate-fade-in backdrop-blur-xl"
      style={{
        background: "rgba(26, 26, 46, 0.95)",
        border: `1px solid ${allianceColor || "rgba(245, 158, 11, 0.2)"}`,
        borderRadius: "16px",
        padding: "16px",
        boxShadow: `0 0 30px rgba(0,0,0,0.5), 0 0 15px ${allianceColor || "rgba(245, 158, 11, 0.1)"}`,
      }}
    >
      {/* 头部 - 大 emoji + 名字 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* 大 emoji 头像 */}
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
            style={{
              background: "rgba(245, 158, 11, 0.1)",
              border: `2px solid ${allianceColor || "rgba(245, 158, 11, 0.3)"}`,
            }}
          >
            {getAgentEmoji(agent.id)}
          </div>
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
        <button
          onClick={onClose}
          className="w-6 h-6 rounded-full flex items-center justify-center text-xs transition-colors"
          style={{ background: "rgba(255,255,255,0.05)", color: "#64748b" }}
        >
          x
        </button>
      </div>

      {/* 属性 - 进度条展示 */}
      <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
        {/* 能量 */}
        <div className="rounded-lg p-2" style={{ background: "rgba(255,255,255,0.03)" }}>
          <span style={{ color: "#64748b" }}>能量</span>
          <div className="flex items-center gap-1 mt-1">
            <div className="flex-1 h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.1)" }}>
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${agent.energy}%`,
                  background: agent.energy > 30
                    ? "linear-gradient(90deg, #10b981, #34d399)"
                    : "linear-gradient(90deg, #ef4444, #f87171)",
                }}
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
            { icon: "🌿", value: agent.inventory.food || 0, color: "#10b981" },
            { icon: "🪨", value: agent.inventory.material || 0, color: "#78716c" },
            { icon: "📚", value: agent.inventory.knowledge || 0, color: "#3b82f6" },
            { icon: "⚡", value: agent.inventory.energy || 0, color: "#eab308" },
          ].map((item) => (
            <div
              key={item.icon}
              className="text-center rounded-lg p-1.5"
              style={{ background: "rgba(255,255,255,0.03)" }}
            >
              <div className="text-base">{item.icon}</div>
              <div className="font-bold" style={{ color: item.color }}>{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 价值观 - 条形图 */}
      <div>
        <h4 className="text-xs mb-2" style={{ color: "#64748b" }}>价值观</h4>
        <div className="space-y-2 text-xs">
          {[
            { label: "合作/竞争", value: agent.values.cooperation, color: "#3b82f6" },
            { label: "冒险/保守", value: agent.values.adventure, color: "#f59e0b" },
            { label: "社交/独立", value: agent.values.social, color: "#8b5cf6" },
            { label: "慷慨/节俭", value: agent.values.generosity, color: "#10b981" },
          ].map((v) => (
            <div key={v.label} className="flex items-center gap-2">
              <span className="w-16" style={{ color: "#64748b" }}>{v.label}</span>
              <div className="flex-1 h-2 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${v.value}%`,
                    background: `linear-gradient(90deg, ${v.color}88, ${v.color})`,
                  }}
                />
              </div>
              <span className="w-6 text-right" style={{ color: "#94a3b8" }}>{v.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
