/**
 * AI 加入蜂巢路由
 * 创建一个新的 AI 代理并加入虚拟世界
 */

import { NextResponse } from "next/server";
import { getWorld, type AgentState } from "@/lib/simulation";

// 随机中文名字生成
const NAMES = [
  "星辰", "月影", "风铃", "云雀", "晨曦",
  "暮光", "霜降", "春雷", "秋水", "夏蝉",
  "冬雪", "朝露", "晚霞", "松风", "竹韵",
  "梅香", "兰心", "菊隐", "荷清", "桃夭",
];

let nameIndex = 0;

export async function POST() {
  try {
    const world = getWorld();

    // 生成代理
    const name = NAMES[nameIndex % NAMES.length];
    nameIndex++;

    const agent: AgentState = {
      id: `agent_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name,
      userId: "demo_user",
      secondmeId: "18e8f797-77da-49ef-8f80-88ce1dbbe26d",
      token: "demo_token",
      posQ: 0,
      posR: 0,
      energy: 100,
      reputation: 0,
      inventory: { food: 0, material: 0, knowledge: 0, energy: 0 },
      values: {
        cooperation: Math.floor(Math.random() * 100),
        adventure: Math.floor(Math.random() * 100),
        social: Math.floor(Math.random() * 100),
        generosity: Math.floor(Math.random() * 100),
      },
      allianceId: null,
      status: "alive",
    };

    world.addAgent(agent);

    return NextResponse.json({
      success: true,
      agent: { id: agent.id, name: agent.name },
    });
  } catch (error) {
    console.error("加入蜂巢失败:", error);
    return NextResponse.json(
      { success: false, error: "加入失败" },
      { status: 500 }
    );
  }
}
