"use client";

/**
 * 蜂巢主视图 - 深色主题核心页面（动画增强版）
 * 左侧：HexGrid 2D 空间可视化（主区域）
 * 右侧：实时事件日志 + 联盟信息 + 统计
 * 底部：控制栏（添加 AI、推进回合、自动播放、速度控制）
 */

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";
import HexGrid from "@/components/HexGrid";
import AgentCard from "@/components/AgentCard";
import EventLog from "@/components/EventLog";
import NumberTicker from "@/components/ui/number-ticker";
import { type AgentState, type WorldSnapshot } from "@/lib/simulation";

export default function HivePage() {
  const [world, setWorld] = useState<WorldSnapshot | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<AgentState | null>(null);
  const [loading, setLoading] = useState(false);
  const [autoPlay, setAutoPlay] = useState(false);
  const [speed, setSpeed] = useState(2000);
  const [allianceOpen, setAllianceOpen] = useState(true);

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
          {/* 状态栏 - 深色标签 + 计数动画 */}
          <div className="flex items-center gap-3 mb-3 text-sm">
            <span
              className="px-3 py-1.5 rounded-lg font-medium"
              style={{ background: "rgba(245, 158, 11, 0.1)", color: "#f59e0b", border: "1px solid rgba(245, 158, 11, 0.2)" }}
            >
              回合 <span className="font-bold">
                <NumberTicker value={world?.tick || 0} duration={0.5} />
              </span>
            </span>
            <span
              className="px-3 py-1.5 rounded-lg font-medium"
              style={{ background: "rgba(16, 185, 129, 0.1)", color: "#10b981", border: "1px solid rgba(16, 185, 129, 0.2)" }}
            >
              存活 <span className="font-bold">
                <NumberTicker value={aliveCount} duration={0.5} />
              </span>
            </span>
            <span
              className="px-3 py-1.5 rounded-lg font-medium"
              style={{ background: "rgba(139, 92, 246, 0.1)", color: "#8b5cf6", border: "1px solid rgba(139, 92, 246, 0.2)" }}
            >
              联盟 <span className="font-bold">
                <NumberTicker value={allianceCount} duration={0.5} />
              </span>
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
                  <motion.div
                    className="text-4xl mb-3"
                    animate={{ y: [0, -6, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  >
                    {"\u{1F41D}"}
                  </motion.div>
                  <p>加载蜂巢世界中...</p>
                </div>
              </div>
            )}

            {/* 代理详情弹窗 - AnimatePresence */}
            <AnimatePresence>
              {selectedAgent && world && (
                <motion.div
                  className="absolute top-4 right-4 z-10"
                  initial={{ opacity: 0, x: 30, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 30, scale: 0.95 }}
                  transition={{ type: "spring", damping: 20, stiffness: 300 }}
                >
                  <AgentCard
                    agent={selectedAgent}
                    alliances={world.alliances}
                    onClose={() => setSelectedAgent(null)}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 控制栏 - 深色风格 + 按钮动画 */}
          <div
            className="flex items-center gap-3 mt-3 p-3 rounded-xl"
            style={{
              background: "rgba(26, 26, 46, 0.8)",
              border: "1px solid rgba(245, 158, 11, 0.1)",
            }}
          >
            {/* 推进回合按钮 */}
            <motion.button
              onClick={advanceTick}
              disabled={loading}
              className="btn-glow text-sm disabled:opacity-40"
              style={loading ? { background: "#333", boxShadow: "none" } : {}}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {loading ? "推进中..." : "推进回合"}
            </motion.button>

            {/* 自动播放开关 */}
            <motion.button
              onClick={() => setAutoPlay(!autoPlay)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{
                background: autoPlay ? "rgba(239, 68, 68, 0.15)" : "rgba(16, 185, 129, 0.15)",
                color: autoPlay ? "#ef4444" : "#10b981",
                border: `1px solid ${autoPlay ? "rgba(239, 68, 68, 0.3)" : "rgba(16, 185, 129, 0.3)"}`,
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {autoPlay ? "暂停" : "自动播放"}
            </motion.button>

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
            <motion.button
              onClick={joinHive}
              className="ml-auto px-4 py-2 rounded-lg text-sm font-medium"
              style={{
                background: "linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(217, 119, 6, 0.2))",
                color: "#f59e0b",
                border: "1px solid rgba(245, 158, 11, 0.3)",
              }}
              whileHover={{ scale: 1.05, boxShadow: "0 0 15px rgba(245, 158, 11, 0.3)" }}
              whileTap={{ scale: 0.95 }}
            >
              + 添加 AI 代理
            </motion.button>
          </div>
        </div>

        {/* 右侧面板 */}
        <div className="w-full lg:w-80 flex flex-col gap-3">
          {/* 联盟信息 - 可折叠 */}
          {world && world.alliances.length > 0 && (
            <motion.div
              className="rounded-xl overflow-hidden"
              style={{
                background: "rgba(26, 26, 46, 0.8)",
                border: "1px solid rgba(245, 158, 11, 0.1)",
              }}
              layout
            >
              <button
                className="w-full flex items-center justify-between p-4 text-left"
                onClick={() => setAllianceOpen(!allianceOpen)}
              >
                <h2 className="text-sm font-bold" style={{ color: "#e2e8f0" }}>
                  联盟
                </h2>
                <motion.span
                  animate={{ rotate: allianceOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ color: "#64748b", fontSize: "12px" }}
                >
                  {"\u25BC"}
                </motion.span>
              </button>
              <AnimatePresence initial={false}>
                {allianceOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 space-y-2">
                      {world.alliances.map((alliance, idx) => {
                        const color = ["#ef4444", "#3b82f6", "#10b981", "#8b5cf6", "#f97316"][idx % 5];
                        return (
                          <motion.div
                            key={alliance.id}
                            className="flex items-center gap-2 text-xs p-2 rounded-lg"
                            style={{ background: "rgba(255,255,255,0.03)" }}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
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
                          </motion.div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
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
