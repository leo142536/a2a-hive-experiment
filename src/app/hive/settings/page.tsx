"use client";

/**
 * AI 价值观设置页面 - 深色主题（动画增强版）
 * 滑块平滑过渡 + 性格预览动画 + 保存按钮成功状态动画
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";
import ValueSlider from "@/components/ValueSlider";

interface Values {
  cooperation: number;
  adventure: number;
  social: number;
  generosity: number;
}

export default function SettingsPage() {
  const [values, setValues] = useState<Values>({
    cooperation: 50,
    adventure: 50,
    social: 50,
    generosity: 50,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  /* 加载当前设置 */
  useEffect(() => {
    fetch("/api/hive/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.values) {
          setValues(data.values);
        }
      })
      .catch(console.error);
  }, []);

  /* 保存设置 */
  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/hive/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ values }),
      });
      const data = await res.json();
      if (data.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch (err) {
      console.error("保存失败:", err);
    } finally {
      setSaving(false);
    }
  };

  /* 性格维度配置 */
  const dimensions = [
    { key: "cooperation" as const, label: "合作倾向", left: "竞争", right: "合作", color: "#3b82f6" },
    { key: "adventure" as const, label: "冒险倾向", left: "保守", right: "冒险", color: "#f59e0b" },
    { key: "social" as const, label: "社交倾向", left: "独立", right: "社交", color: "#8b5cf6" },
    { key: "generosity" as const, label: "慷慨倾向", left: "节俭", right: "慷慨", color: "#10b981" },
  ];

  return (
    <div className="min-h-screen" style={{ background: "#0a0a1a" }}>
      <Navbar />

      <div className="max-w-xl mx-auto px-4 py-8">
        <motion.h1
          className="text-2xl font-bold mb-2 text-gradient-honey"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          AI 价值观设置
        </motion.h1>
        <motion.p
          className="text-sm mb-8"
          style={{ color: "#64748b" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          调节你的 AI 代理的价值观维度，这将影响它在虚拟世界中的决策倾向。
        </motion.p>

        {/* 设置卡片 */}
        <motion.div
          className="rounded-2xl p-6"
          style={{
            background: "rgba(26, 26, 46, 0.8)",
            border: "1px solid rgba(245, 158, 11, 0.1)",
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {/* 滑块 */}
          {dimensions.map((dim, i) => (
            <motion.div
              key={dim.key}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.08 }}
            >
              <ValueSlider
                label={dim.label}
                leftLabel={dim.left}
                rightLabel={dim.right}
                value={values[dim.key]}
                onChange={(v) => setValues({ ...values, [dim.key]: v })}
              />
            </motion.div>
          ))}

          {/* 性格预览 - 条形可视化 + 动画过渡 */}
          <motion.div
            className="mt-4 p-4 rounded-xl"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(245, 158, 11, 0.08)" }}
            layout
          >
            <span className="text-xs font-medium" style={{ color: "#94a3b8" }}>AI 性格预览</span>
            <div className="mt-3 space-y-2">
              {dimensions.map((dim) => (
                <div key={dim.key} className="flex items-center gap-2">
                  <span className="text-xs w-20" style={{ color: "#64748b" }}>{dim.label}</span>
                  <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                    {/* 用 motion.div 实现滑块值变化时的平滑过渡 */}
                    <motion.div
                      className="h-full rounded-full"
                      style={{
                        background: `linear-gradient(90deg, ${dim.color}66, ${dim.color})`,
                      }}
                      animate={{ width: `${values[dim.key]}%` }}
                      transition={{ type: "spring", damping: 20, stiffness: 200 }}
                    />
                  </div>
                </div>
              ))}
            </div>
            {/* 性格描述 - 带动画过渡 */}
            <AnimatePresence mode="wait">
              <motion.p
                key={`${values.cooperation > 50}-${values.adventure > 50}-${values.social > 50}-${values.generosity > 50}`}
                className="mt-3 text-xs"
                style={{ color: "#94a3b8" }}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.2 }}
              >
                {values.cooperation > 50 ? "倾向合作" : "倾向竞争"}、
                {values.adventure > 50 ? "喜欢冒险" : "偏好保守"}、
                {values.social > 50 ? "热爱社交" : "偏好独立"}、
                {values.generosity > 50 ? "为人慷慨" : "精打细算"}
              </motion.p>
            </AnimatePresence>
          </motion.div>

          {/* 保存按钮 - 成功状态动画 */}
          <motion.button
            onClick={handleSave}
            disabled={saving}
            className="mt-6 w-full py-3 rounded-xl font-medium text-sm"
            style={{
              color: "white",
            }}
            animate={{
              background: saved
                ? "linear-gradient(135deg, #10b981, #059669)"
                : saving
                  ? "#333333"
                  : "linear-gradient(135deg, #f59e0b, #d97706)",
              boxShadow: saved
                ? "0 0 20px rgba(16, 185, 129, 0.3)"
                : saving
                  ? "none"
                  : "0 0 20px rgba(245, 158, 11, 0.3)",
            }}
            transition={{ duration: 0.3 }}
            whileHover={!saving && !saved ? { scale: 1.02, boxShadow: "0 0 25px rgba(245, 158, 11, 0.5)" } : {}}
            whileTap={!saving ? { scale: 0.98 } : {}}
          >
            <AnimatePresence mode="wait">
              {saving ? (
                <motion.span
                  key="saving"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  保存中...
                </motion.span>
              ) : saved ? (
                <motion.span
                  key="saved"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center justify-center gap-2"
                >
                  {"\u2713"} 已保存
                </motion.span>
              ) : (
                <motion.span
                  key="save"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  保存设置
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
