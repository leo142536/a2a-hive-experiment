/**
 * AI 价值观设置路由
 * GET: 获取当前价值观设置
 * POST: 更新价值观设置
 */

import { NextRequest, NextResponse } from "next/server";
import { getWorld } from "@/lib/simulation";

// GET - 获取第一个代理的价值观（演示用）
export async function GET() {
  try {
    const world = getWorld();
    const agent = world.agents.find((a) => a.status === "alive");

    if (!agent) {
      return NextResponse.json({
        success: true,
        values: {
          cooperation: 50,
          adventure: 50,
          social: 50,
          generosity: 50,
        },
      });
    }

    return NextResponse.json({
      success: true,
      values: agent.values,
    });
  } catch (error) {
    console.error("获取设置失败:", error);
    return NextResponse.json(
      { success: false, error: "获取设置失败" },
      { status: 500 }
    );
  }
}

// POST - 更新价值观
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { values } = body;

    if (!values) {
      return NextResponse.json(
        { success: false, error: "缺少 values 参数" },
        { status: 400 }
      );
    }

    const world = getWorld();
    // 更新所有属于当前用户的代理的价值观
    const updated: string[] = [];
    for (const agent of world.agents) {
      if (agent.status === "alive") {
        agent.values = {
          cooperation: values.cooperation ?? agent.values.cooperation,
          adventure: values.adventure ?? agent.values.adventure,
          social: values.social ?? agent.values.social,
          generosity: values.generosity ?? agent.values.generosity,
        };
        updated.push(agent.id);
      }
    }

    return NextResponse.json({
      success: true,
      updated: updated.length,
    });
  } catch (error) {
    console.error("更新设置失败:", error);
    return NextResponse.json(
      { success: false, error: "更新设置失败" },
      { status: 500 }
    );
  }
}
