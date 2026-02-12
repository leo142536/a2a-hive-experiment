"use client";

/**
 * 价值观滑块组件 - 深色主题
 * 渐变色轨道 + 自定义滑块 + 当前值显示
 */

interface ValueSliderProps {
  label: string;
  leftLabel: string;
  rightLabel: string;
  value: number;
  onChange: (value: number) => void;
}

export default function ValueSlider({
  label,
  leftLabel,
  rightLabel,
  value,
  onChange,
}: ValueSliderProps) {
  return (
    <div className="mb-6">
      {/* 标签和当前值 */}
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium" style={{ color: "#e2e8f0" }}>{label}</span>
        <span
          className="text-sm font-bold px-2 py-0.5 rounded"
          style={{
            color: "#f59e0b",
            background: "rgba(245, 158, 11, 0.1)",
          }}
        >
          {value}
        </span>
      </div>
      {/* 滑块区域 */}
      <div className="flex items-center gap-3">
        <span className="text-xs w-12 text-right" style={{ color: "#64748b" }}>{leftLabel}</span>
        <input
          type="range"
          min="0"
          max="100"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="flex-1 cursor-pointer"
        />
        <span className="text-xs w-12" style={{ color: "#64748b" }}>{rightLabel}</span>
      </div>
    </div>
  );
}
