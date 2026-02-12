"use client";

/**
 * 蜂巢主视图 - 深色主题核心页面
 * 左侧：HexGrid 2D 空间可视化（主区域）
 * 右侧：实时事件日志 + 联盟信息 + 统计
 * 底部：控制栏（添加 AI、推进回合、自动播放、速度控制）
 */

import { useState, useEffect, useCallback } from "react";
import Navbar from "@/components/Navbar";
import HexGrid from "@/components/HexGrid";
import AgentCard from "@/components/AgentCard";
import EventLog from "@/components/EventLog";
import { type AgentState, type WorldSnapshot } from "@/lib/simulation";

export default function HivePage() {
  const [world, setWorld] = useState<WorldSnapshot | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<AgentState | null>(null);
  const [loading, setLoading] = useState(false);
  const [autoPlay, setAutoPlay] = useState(false);
  const [speed, setSpeed] = useState(2000);

  /* 获取世界状态 */
  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/hive/status");
      const data = await res.json();
      if (data.success) {
        setWorld(data.world);
      }
    } catch (err) {
      console.error("获取状态失败:", err);
    }
  }, []);

  /* 推进一个回合 */
  const advanceTick = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/hive/tick", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setWorld(data.world);
      }
    } catch (err) {
      console.error("推进回合失败:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  /* 加入蜂巢（添加演示代理） */
  const joinHive = async () => {
    try {
      const res = await fetch("/api/hive/join", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        await fetchStatus();
      }
    } catch (err) {
      console.error("加入失败:", err);
    }
  };

  /* 初始化 */
  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  /* 自动播放 */
  useEffect(() => {
    if (!autoPlay) return;
    const timer = setInterval(advanceTick, speed);
    return () => clearInterval(timer);
  }, [autoPlay, speed, advanceTick]);

  const aliveCount = world?.agents.filter((a) => a.status === "alive").length || 0;
  const allianceCount = world?.alliances.length || 0;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#0a0a1a" }}>
      <Navbar />

      <div className="flex-1 flex flex-col lg:flex-row gap-4 p-4 max-w-7xl mx-auto w-full">
        {/* 左侧：地图主区域 */}
        <div className="flex-1 flex flex-col">
          {/* 状态栏 - 深色标签 */}
          <div className="flex items-center gap-3 mb-3 text-sm">
            <span
              className="px-3 py-1.5 rounded-lg font-medium"
              style={{ background: "rgba(245, 158, 11, 0.1)", color: "#f59e0b", border: "1px solid rgba(245, 158, 11, 0.2)" }}
            >
              回合 <span className="font-bold">#{world?.tick || 0}</span>
            </span>
            <span
              className="px-3 py-1.5 rounded-lg font-medium"
              style={{ background: "rgba(16, 185, 129, 0.1)", color: "#10b981", border: "1px solid rgba(16, 185, 129, 0.2)" }}
            >
              存活 <span className="font-bold">{aliveCount}</span>
            </span>
            <span
              className="px-3 py-1.5 rounded-lg font-medium"
              style={{ background: "rgba(139, 92, 246, 0.1)", color: "#8b5cf6", border: "1px solid rgba(139, 92, 246, 0.2)" }}
            >
              联盟 <span className="font-bold">{allianceCount}</span>
            </span>
          </div>

          {/* 2D 空间地图 */}
          <div
            className="flex-1 relative rounded-2xl overflow-hidden"
            style={{
              background: "#0d0d24",
              border: "1px solid rgba(245, 158, 11, 0.1)",
              boxShadow: "0 0 40px rgba(0,0,0,0.3), inset 0 0 60px rgba(245, 158, 11, 0.02)",
              minHeight: "500px",
            }}
          >
            {world ? (
              <HexGrid
                grid={world.grid}
                agents={world.agents}
                alliances={world.alliances}
                onAgentClick={(agent) => setSelectedAgent(agent)}
              />
            ) : (
              <div className="h-full flex items-center justify-center" style={{ color: "#4a5568", minHeight: "500px" }}>
                <div className="text-center">
                  <div className="text-4xl mb-3 animate-float">🐝</div>
                  <p>加载蜂巢世界中...</p>
                </div>
              </div>
            )}

            {/* 代理详情弹窗 */}
            {selectedAgent && world && (
              <div className="absolute top-4 right-4 z-10">
                <AgentCard
                  agent={selectedAgent}
                  alliances={world.alliances}
                  onClose={() => setSelectedAgent(null)}
                />
              </div>
            )}
          </div>

          {/* 控制栏 - 深色风格 */}
          <div
            className="flex items-center gap-3 mt-3 p-3 rounded-xl"
            style={{
              background: "rgba(26, 26, 46, 0.8)",
              border: "1px solid rgba(245, 158, 11, 0.1)",
            }}
          >
            {/* 推进回合按钮 */}
            <button
              onClick={advanceTick}
              disabled={loading}
              className="btn-glow text-sm disabled:opacity-40"
              style={loading ? { background: "#333", boxShadow: "none" } : {}}
            >
              {loading ? "推进中..." : "推进回合"}
            </button>

            {/* 自动播放开关 */}
            <button
              onClick={() => setAutoPlay(!autoPlay)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                background: autoPlay ? "rgba(239, 68, 68, 0.15)" : "rgba(16, 185, 129, 0.15)",
                color: autoPlay ? "#ef4444" : "#10b981",
                border: `1px solid ${autoPlay ? "rgba(239, 68, 68, 0.3)" : "rgba(16, 185, 129, 0.3)"}`,
              }}
            >
              {autoPlay ? "暂停" : "自动播放"}
            </button>

            {/* 速度控制 */}
            <select
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="rounded-lg px-3 py-2 text-sm cursor-pointer"
              style={{
                background: "rgba(255,255,255,0.05)",
                color: "#94a3b8",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <option value={3000}>慢速</option>
              <option value={2000}>正常</option>
              <option value={1000}>快速</option>
              <option value={500}>极速</option>
            </select>

            {/* 添加 AI 按钮 */}
            <button
              onClick={joinHive}
              className="ml-auto px-4 py-2 rounded-lg text-sm font-medium transition-all animate-breathe"
              style={{
                background: "linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(217, 119, 6, 0.2))",
                color: "#f59e0b",
                border: "1px solid rgba(245, 158, 11, 0.3)",
              }}
            >
              + 添加 AI 代理
            </button>
          </div>
        </div>

        {/* 右侧面板 */}
        <div className="w-full lg:w-80 flex flex-col gap-3">
          {/* 联盟信息 */}
          {world && world.alliances.length > 0 && (
            <div
              className="rounded-xl p-4"
              style={{
                background: "rgba(26, 26, 46, 0.8)",
                border: "1px solid rgba(245, 158, 11, 0.1)",
              }}
            >
              <h2 className="text-sm font-bold mb-3" style={{ color: "#e2e8f0" }}>
                联盟
              </h2>
              <div className="space-y-2">
                {world.alliances.map((alliance, idx) => {
                  const color = ["#ef4444", "#3b82f6", "#10b981", "#8b5cf6", "#f97316"][idx % 5];
                  return (
                    <div
                      key={alliance.id}
                      className="flex items-center gap-2 text-xs p-2 rounded-lg"
                      style={{ background: "rgba(255,255,255,0.03)" }}
                    >
                      <div
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ background: color }}
                      />
                      <span className="truncate" style={{ color: "#e2e8f0" }}>
                        {alliance.name}
                      </span>
                      <span className="ml-auto shrink-0" style={{ color: "#64748b" }}>
                        {alliance.memberIds.length}人
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 事件日志 */}
          <div
            className="flex-1 rounded-xl p-4"
            style={{
              background: "rgba(26, 26, 46, 0.8)",
              border: "1px solid rgba(245, 158, 11, 0.1)",
            }}
          >
            <h2 className="text-sm font-bold mb-3" style={{ color: "#e2e8f0" }}>
              实时事件
            </h2>
            <EventLog events={world?.events || []} maxHeight="calc(100vh - 320px)" />
          </div>
        </div>
      </div>
    </div>
  );
}
