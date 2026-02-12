/**
 * 推进回合路由
 * 执行一个世界回合，所有 AI 代理做出决策并行动
 */

import { NextResponse } from "next/server";
import { getWorld } from "@/lib/simulation";

export async function POST() {
  try {
    const world = getWorld();

    // 如果没有代理，返回提示
    if (world.agents.length === 0) {
      return NextResponse.json({
        success: false,
        error: "世界中没有 AI 代理，请先添加代理",
      });
    }

    // 执行一个回合
    const events = await world.executeTick();

    return NextResponse.json({
      success: true,
      tick: world.tick,
      events,
      world: world.toSnapshot(),
    });
  } catch (error) {
    console.error("推进回合失败:", error);
    return NextResponse.json(
      { success: false, error: "回合推进失败" },
      { status: 500 }
    );
  }
}
