"use client";

/**
 * 2D 空间可视化组件 - 核心视觉（动画增强版）
 * 深色背景 + 淡六边形网格线 + emoji 代理卡片 + 交互连线 + 资源图标
 * framer-motion: layout 动画、scale 弹入、淡出缩小、呼吸灯、悬停放大
 */

import { useMemo, useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  type HexCell,
  type AgentState,
  type AllianceState,
  type ResourceType,
  hexDistance,
} from "@/lib/simulation";

interface HexGridProps {
  grid: HexCell[];
  agents: AgentState[];
  alliances: AllianceState[];
  onAgentClick?: (agent: AgentState) => void;
  onCellClick?: (cell: HexCell) => void;
}

/* ============ 常量配置 ============ */

const SVG_WIDTH = 800;
const SVG_HEIGHT = 600;
const CENTER_X = SVG_WIDTH / 2;
const CENTER_Y = SVG_HEIGHT / 2;
const HEX_SIZE = 42;

// 代理 emoji 头像池
const AGENT_EMOJIS = ["\u{1F916}", "\u{1F9E0}", "\u{1F4A1}", "\u{1F3AF}", "\u{1F52E}", "\u{1F31F}", "\u{1F3AD}", "\u{1F98A}", "\u{1F41D}", "\u{1F98B}", "\u{1F419}", "\u{1F989}", "\u{1F43A}", "\u{1F985}", "\u{1F432}"];

// 资源图标
const RESOURCE_ICONS: Record<ResourceType, string> = {
  food: "\u{1F33F}",
  material: "\u{1FAA8}",
  knowledge: "\u{1F4DA}",
  energy: "\u26A1",
};

// 资源颜色
const RESOURCE_GLOW: Record<ResourceType, string> = {
  food: "#10b981",
  material: "#78716c",
  knowledge: "#3b82f6",
  energy: "#eab308",
};

// 联盟颜色
const ALLIANCE_COLORS = ["#ef4444", "#3b82f6", "#10b981", "#8b5cf6", "#f97316"];

/** 轴坐标转像素坐标 */
function hexToPixel(q: number, r: number): { x: number; y: number } {
  const x = HEX_SIZE * (Math.sqrt(3) * q + (Math.sqrt(3) / 2) * r);
  const y = HEX_SIZE * ((3 / 2) * r);
  return { x: CENTER_X + x, y: CENTER_Y + y };
}

/** 生成六边形路径点 */
function hexPoints(cx: number, cy: number, size: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 180) * (60 * i - 30);
    pts.push(`${cx + size * Math.cos(angle)},${cy + size * Math.sin(angle)}`);
  }
  return pts.join(" ");
}

/** 根据代理 ID 稳定分配 emoji */
function getAgentEmoji(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash + id.charCodeAt(i)) | 0;
  }
  return AGENT_EMOJIS[Math.abs(hash) % AGENT_EMOJIS.length];
}

/** 单个代理 SVG 组件 - 支持动画 */
function AgentNode({
  agent,
  x,
  y,
  allianceColor,
  emoji,
  onClick,
}: {
  agent: AgentState;
  x: number;
  y: number;
  allianceColor: string | null;
  emoji: string;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  // 用于追踪上一次位置，实现平滑移动
  const prevPos = useRef({ x, y });

  useEffect(() => {
    prevPos.current = { x, y };
  }, [x, y]);

  const scale = hovered ? 1.25 : 1;
  const isDead = agent.status === "dead";

  return (
    <motion.g
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="cursor-pointer"
      filter="url(#glow-agent)"
      // layout 动画：位置变化时平滑过渡
      initial={{ opacity: 0, scale: 0 }}
      animate={{
        opacity: isDead ? 0 : 1,
        scale: isDead ? 0 : scale,
        x: x - prevPos.current.x === 0 ? undefined : 0,
        y: y - prevPos.current.y === 0 ? undefined : 0,
      }}
      exit={{ opacity: 0, scale: 0, transition: { duration: 0.3 } }}
      transition={{
        type: "spring",
        damping: 15,
        stiffness: 200,
        scale: { duration: 0.2 },
      }}
      style={{ originX: `${x}px`, originY: `${y}px` }}
    >
      {/* 联盟光晕圈 */}
      {allianceColor && (
        <circle
          cx={x}
          cy={y}
          r="26"
          fill="none"
          stroke={allianceColor}
          strokeWidth="1.5"
          strokeOpacity="0.4"
          strokeDasharray="4,3"
        />
      )}

      {/* 代理背景圆 */}
      <circle
        cx={x}
        cy={y}
        r="20"
        fill="rgba(26, 26, 46, 0.9)"
        stroke={allianceColor || "rgba(245, 158, 11, 0.3)"}
        strokeWidth="1.5"
      />

      {/* Emoji 头像 */}
      <text
        x={x}
        y={y + 1}
        textAnchor="middle"
        fontSize="18"
        dominantBaseline="middle"
      >
        {emoji}
      </text>

      {/* 代理名字标签 */}
      <rect
        x={x - 22}
        y={y - 36}
        width="44"
        height="14"
        rx="7"
        fill="rgba(10, 10, 26, 0.85)"
        stroke={allianceColor || "rgba(245, 158, 11, 0.2)"}
        strokeWidth="0.5"
      />
      <text
        x={x}
        y={y - 28}
        textAnchor="middle"
        fontSize="8"
        fill="#e2e8f0"
        fontWeight="600"
        dominantBaseline="middle"
      >
        {agent.name.slice(0, 5)}
      </text>

      {/* 能量条背景 */}
      <rect
        x={x - 14}
        y={y + 23}
        width="28"
        height="3"
        rx="1.5"
        fill="rgba(255,255,255,0.1)"
      />
      {/* 能量条填充 - 动画宽度 */}
      <motion.rect
        x={x - 14}
        y={y + 23}
        animate={{ width: Math.max(0, (agent.energy / 100) * 28) }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        height="3"
        rx="1.5"
        fill={agent.energy > 50 ? "#10b981" : agent.energy > 25 ? "#eab308" : "#ef4444"}
      />
    </motion.g>
  );
}

export default function HexGrid({ grid, agents, alliances, onAgentClick, onCellClick }: HexGridProps) {
  // 获取联盟颜色
  const getAllianceColor = (allianceId: string | null) => {
    if (!allianceId) return null;
    const idx = alliances.findIndex((a) => a.id === allianceId);
    return idx >= 0 ? ALLIANCE_COLORS[idx % ALLIANCE_COLORS.length] : null;
  };

  // 存活代理
  const aliveAgents = useMemo(() => agents.filter((a) => a.status === "alive"), [agents]);

  // 计算代理之间的交互连线
  const connections = useMemo(() => {
    const lines: { x1: number; y1: number; x2: number; y2: number; color: string }[] = [];
    for (let i = 0; i < aliveAgents.length; i++) {
      for (let j = i + 1; j < aliveAgents.length; j++) {
        const a = aliveAgents[i];
        const b = aliveAgents[j];
        if (
          a.allianceId && a.allianceId === b.allianceId &&
          hexDistance(a.posQ, a.posR, b.posQ, b.posR) <= 3
        ) {
          const p1 = hexToPixel(a.posQ, a.posR);
          const p2 = hexToPixel(b.posQ, b.posR);
          const color = getAllianceColor(a.allianceId) || "#f59e0b";
          lines.push({ x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y, color });
        }
      }
    }
    return lines;
  }, [aliveAgents, alliances]);

  return (
    <svg
      viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
      className="w-full h-full"
      style={{ background: "#0d0d24", borderRadius: "16px" }}
    >
      {/* 定义滤镜和渐变 */}
      <defs>
        <filter id="glow-agent" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="glow-resource" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        {ALLIANCE_COLORS.map((color, i) => (
          <linearGradient key={i} id={`line-grad-${i}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={color} stopOpacity="0.6" />
            <stop offset="50%" stopColor={color} stopOpacity="0.2" />
            <stop offset="100%" stopColor={color} stopOpacity="0.6" />
          </linearGradient>
        ))}
      </defs>

      {/* 背景淡六边形网格线 */}
      {grid.map((cell) => {
        const { x, y } = hexToPixel(cell.q, cell.r);
        return (
          <polygon
            key={`bg-${cell.q},${cell.r}`}
            points={hexPoints(x, y, HEX_SIZE - 1)}
            fill="none"
            stroke="rgba(245, 158, 11, 0.06)"
            strokeWidth="1"
          />
        );
      })}

      {/* 资源格子 - 带呼吸灯效果 */}
      {grid.map((cell) => {
        const { x, y } = hexToPixel(cell.q, cell.r);
        const glowColor = RESOURCE_GLOW[cell.resource];
        const baseOpacity = 0.03 + (cell.amount / 10) * 0.08;

        return (
          <g
            key={`cell-${cell.q},${cell.r}`}
            onClick={() => onCellClick?.(cell)}
            className="cursor-pointer"
          >
            {/* 资源区域填充 - 呼吸灯 */}
            <motion.polygon
              points={hexPoints(x, y, HEX_SIZE - 2)}
              fill={glowColor}
              animate={{ fillOpacity: [baseOpacity, baseOpacity * 1.5, baseOpacity] }}
              transition={{ duration: 3 + Math.random() * 2, repeat: Infinity, ease: "easeInOut" }}
            />
            {/* 资源图标 */}
            {cell.amount > 0 && (
              <text
                x={x}
                y={y + 2}
                textAnchor="middle"
                fontSize="13"
                dominantBaseline="middle"
                filter="url(#glow-resource)"
                opacity={0.4 + (cell.amount / 10) * 0.5}
              >
                {RESOURCE_ICONS[cell.resource]}
              </text>
            )}
            {/* 资源数量 */}
            {cell.amount > 3 && (
              <text
                x={x}
                y={y + 16}
                textAnchor="middle"
                fontSize="8"
                fill={glowColor}
                fillOpacity="0.5"
                dominantBaseline="middle"
              >
                x{cell.amount}
              </text>
            )}
          </g>
        );
      })}

      {/* 联盟成员连线 - 虚线动画 */}
      {connections.map((line, idx) => {
        const colorIdx = ALLIANCE_COLORS.indexOf(line.color);
        const gradId = colorIdx >= 0 ? `line-grad-${colorIdx}` : `line-grad-0`;
        return (
          <line
            key={`conn-${idx}`}
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
            stroke={`url(#${gradId})`}
            strokeWidth="1.5"
            strokeDasharray="6,4"
            className="animate-dash"
            opacity="0.6"
          />
        );
      })}

      {/* AI 代理 - 带 AnimatePresence 进出动画 */}
      <AnimatePresence>
        {aliveAgents.map((agent) => {
          const { x, y } = hexToPixel(agent.posQ, agent.posR);
          const allianceColor = getAllianceColor(agent.allianceId);
          const emoji = getAgentEmoji(agent.id);

          return (
            <AgentNode
              key={agent.id}
              agent={agent}
              x={x}
              y={y}
              allianceColor={allianceColor}
              emoji={emoji}
              onClick={() => onAgentClick?.(agent)}
            />
          );
        })}
      </AnimatePresence>
    </svg>
  );
}
