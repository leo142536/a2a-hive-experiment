"use client";

/**
 * 导航栏组件 - 深色半透明风格
 * 蜂巢 logo + 导航链接 + hover 发光效果
 */

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();

  /* 导航链接配置 */
  const links = [
    { href: "/", label: "首页", icon: "🏠" },
    { href: "/hive", label: "蜂巢", icon: "🗺" },
    { href: "/hive/settings", label: "价值观", icon: "⚙" },
    { href: "/hive/history", label: "历史", icon: "📜" },
  ];

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-xl"
      style={{
        background: "rgba(10, 10, 26, 0.85)",
        borderBottom: "1px solid rgba(245, 158, 11, 0.1)",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo 区域 */}
        <Link href="/" className="flex items-center gap-2 group">
          <span className="text-2xl group-hover:scale-110 transition-transform">🐝</span>
          <span className="font-bold text-gradient-honey text-lg">
            A2A 蜂巢实验
          </span>
        </Link>

        {/* 导航链接 */}
        <div className="flex items-center gap-1">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-1.5 rounded-lg text-sm transition-all duration-200"
                style={{
                  background: isActive
                    ? "rgba(245, 158, 11, 0.15)"
                    : "transparent",
                  color: isActive ? "#f59e0b" : "#94a3b8",
                  fontWeight: isActive ? 600 : 400,
                  boxShadow: isActive
                    ? "0 0 10px rgba(245, 158, 11, 0.1)"
                    : "none",
                }}
              >
                <span className="mr-1">{link.icon}</span>
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
