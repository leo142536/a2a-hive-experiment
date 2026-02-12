/**
 * 世界状态路由
 * 返回当前世界的完整快照
 */

import { NextResponse } from "next/server";
import { getWorld } from "@/lib/simulation";

export async function GET() {
  try {
    const world = getWorld();
    return NextResponse.json({
      success: true,
      world: world.toSnapshot(),
    });
  } catch (error) {
    console.error("获取状态失败:", error);
    return NextResponse.json(
      { success: false, error: "获取状态失败" },
      { status: 500 }
    );
  }
}
