/**
 * 事件列表路由
 * 返回所有世界事件，支持按类型筛选
 */

import { NextRequest, NextResponse } from "next/server";
import { getWorld } from "@/lib/simulation";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const world = getWorld();

    let events = world.events;

    // 按类型筛选
    if (type && type !== "all") {
      events = events.filter((e) => e.type === type);
    }

    return NextResponse.json({
      success: true,
      events,
      total: events.length,
    });
  } catch (error) {
    console.error("获取事件失败:", error);
    return NextResponse.json(
      { success: false, error: "获取事件失败" },
      { status: 500 }
    );
  }
}
