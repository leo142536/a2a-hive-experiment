/**
 * 模拟引擎 - A2A 蜂巢实验核心逻辑
 * 管理虚拟世界的地图、资源、AI 代理和回合推进
 */

import { actStream } from "./secondme";

// ============ 类型定义 ============

// 资源类型
export type ResourceType = "food" | "material" | "knowledge" | "energy";

// 六边形格子
export interface HexCell {
  q: number; // 轴坐标 q
  r: number; // 轴坐标 r
  resource: ResourceType;
  amount: number; // 资源数量 0-10
}

// AI 代理状态
export interface AgentState {
  id: string;
  name: string;
  userId: string;
  secondmeId: string;
  token: string;
  posQ: number;
  posR: number;
  energy: number;
  reputation: number;
  inventory: Record<ResourceType, number>;
  values: AgentValues;
  allianceId: string | null;
  status: "alive" | "dead" | "idle";
}

// AI 价值观维度
export interface AgentValues {
  cooperation: number;  // 合作 vs 竞争 (0-100)
  adventure: number;    // 冒险 vs 保守 (0-100)
  social: number;       // 社交 vs 独立 (0-100)
  generosity: number;   // 慷慨 vs 节俭 (0-100)
}

// 行动类型
export type ActionType = "move" | "gather" | "trade" | "chat" | "ally" | "vote" | "idle";

// AI 决策结果
export interface AgentAction {
  action: ActionType;
  target?: string;  // 目标代理 ID 或方向
  detail?: string;  // 附加信息
}

// 事件记录
export interface WorldEvent {
  agentId: string;
  agentName: string;
  type: ActionType;
  detail: Record<string, unknown>;
  tick: number;
}

// 联盟
export interface AllianceState {
  id: string;
  name: string;
  leaderId: string;
  memberIds: string[];
  rules: string[];
}

// 世界状态快照
export interface WorldSnapshot {
  tick: number;
  grid: HexCell[];
  agents: AgentState[];
  alliances: AllianceState[];
  events: WorldEvent[];
}

// ============ 常量 ============

// 地图半径（7x7 六边形网格，半径 3）
const MAP_RADIUS = 3;

// 六边形方向（轴坐标偏移）
const HEX_DIRECTIONS = [
  { q: 1, r: 0 },   // 右
  { q: 1, r: -1 },  // 右上
  { q: 0, r: -1 },  // 左上
  { q: -1, r: 0 },  // 左
  { q: -1, r: 1 },  // 左下
  { q: 0, r: 1 },   // 右下
];

// 资源颜色映射
export const RESOURCE_COLORS: Record<ResourceType, string> = {
  food: "#4ade80",      // 绿色
  material: "#a78bfa",  // 棕色/紫色
  knowledge: "#60a5fa", // 蓝色
  energy: "#fbbf24",    // 黄色
};

// ============ 工具函数 ============

/** 生成六边形网格 */
export function generateGrid(): HexCell[] {
  const grid: HexCell[] = [];
  const resources: ResourceType[] = ["food", "material", "knowledge", "energy"];

  for (let q = -MAP_RADIUS; q <= MAP_RADIUS; q++) {
    for (let r = -MAP_RADIUS; r <= MAP_RADIUS; r++) {
      // 六边形约束：|q + r| <= radius
      if (Math.abs(q + r) <= MAP_RADIUS) {
        grid.push({
          q,
          r,
          resource: resources[Math.floor(Math.random() * resources.length)],
          amount: Math.floor(Math.random() * 8) + 2,
        });
      }
    }
  }
  return grid;
}

/** 计算两个六边形之间的距离 */
export function hexDistance(q1: number, r1: number, q2: number, r2: number): number {
  return (Math.abs(q1 - q2) + Math.abs(q1 + r1 - q2 - r2) + Math.abs(r1 - r2)) / 2;
}

/** 获取相邻格子 */
function getNeighbors(q: number, r: number, grid: HexCell[]): HexCell[] {
  return HEX_DIRECTIONS
    .map((d) => grid.find((c) => c.q === q + d.q && c.r === r + d.r))
    .filter((c): c is HexCell => c !== undefined);
}

/** 获取代理周围环境描述 */
function describeEnvironment(agent: AgentState, grid: HexCell[], agents: AgentState[], alliances: AllianceState[]): string {
  const currentCell = grid.find((c) => c.q === agent.posQ && c.r === agent.posR);
  const neighbors = getNeighbors(agent.posQ, agent.posR, grid);
  const nearbyAgents = agents.filter(
    (a) => a.id !== agent.id && a.status === "alive" && hexDistance(agent.posQ, agent.posR, a.posQ, a.posR) <= 2
  );

  const alliance = agent.allianceId ? alliances.find((a) => a.id === agent.allianceId) : null;

  return `
当前位置: (${agent.posQ}, ${agent.posR})
当前格子资源: ${currentCell?.resource || "无"} x${currentCell?.amount || 0}
能量: ${agent.energy}/100
声望: ${agent.reputation}
库存: 食物=${agent.inventory.food}, 材料=${agent.inventory.material}, 知识=${agent.inventory.knowledge}, 能量=${agent.inventory.energy}
联盟: ${alliance ? `${alliance.name}（${alliance.memberIds.length}人）` : "无"}
周围格子: ${neighbors.map((n) => `(${n.q},${n.r}):${n.resource}x${n.amount}`).join(", ")}
附近代理: ${nearbyAgents.length > 0 ? nearbyAgents.map((a) => `${a.name}(声望${a.reputation},能量${a.energy})`).join(", ") : "无"}
`.trim();
}

/** 将价值观转为描述 */
function describeValues(values: AgentValues): string {
  const coop = values.cooperation > 50 ? "倾向合作" : "倾向竞争";
  const adv = values.adventure > 50 ? "喜欢冒险" : "偏好保守";
  const soc = values.social > 50 ? "热爱社交" : "偏好独立";
  const gen = values.generosity > 50 ? "为人慷慨" : "精打细算";
  return `${coop}、${adv}、${soc}、${gen}`;
}

// ============ 世界状态管理 ============

export class WorldState {
  tick: number = 0;
  grid: HexCell[];
  agents: AgentState[] = [];
  alliances: AllianceState[] = [];
  events: WorldEvent[] = [];

  constructor(existingState?: WorldSnapshot) {
    if (existingState) {
      this.tick = existingState.tick;
      this.grid = existingState.grid;
      this.agents = existingState.agents;
      this.alliances = existingState.alliances;
      this.events = existingState.events;
    } else {
      this.grid = generateGrid();
    }
  }

  /** 添加代理到世界 */
  addAgent(agent: AgentState): void {
    // 随机放置在空位
    const emptyCells = this.grid.filter(
      (c) => !this.agents.some((a) => a.posQ === c.q && a.posR === c.r && a.status === "alive")
    );
    if (emptyCells.length > 0) {
      const cell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
      agent.posQ = cell.q;
      agent.posR = cell.r;
    }
    this.agents.push(agent);
  }

  /** 执行一个回合 */
  async executeTick(): Promise<WorldEvent[]> {
    this.tick++;
    const tickEvents: WorldEvent[] = [];

    // 资源再生（每回合少量恢复）
    for (const cell of this.grid) {
      if (cell.amount < 10) {
        cell.amount = Math.min(10, cell.amount + 1);
      }
    }

    // 每个存活的 AI 代理执行行动
    const aliveAgents = this.agents.filter((a) => a.status === "alive");

    for (const agent of aliveAgents) {
      // 能量消耗
      agent.energy -= 2;
      if (agent.energy <= 0) {
        agent.status = "dead";
        tickEvents.push({
          agentId: agent.id,
          agentName: agent.name,
          type: "idle",
          detail: { message: `${agent.name} 能量耗尽，退出世界` },
          tick: this.tick,
        });
        continue;
      }

      try {
        // 通过 SecondMe Act API 获取 AI 决策
        const action = await this.getAgentDecision(agent);
        const event = await this.executeAction(agent, action);
        if (event) tickEvents.push(event);
      } catch (error) {
        // API 调用失败时执行随机行动
        console.error(`代理 ${agent.name} 决策失败:`, error);
        const fallbackAction = this.getFallbackAction(agent);
        const event = await this.executeAction(agent, fallbackAction);
        if (event) tickEvents.push(event);
      }
    }

    // 检查涌现行为
    const emergentEvents = this.checkEmergence();
    tickEvents.push(...emergentEvents);

    this.events.push(...tickEvents);
    return tickEvents;
  }

  /** 通过 Act API 获取 AI 决策 */
  private async getAgentDecision(agent: AgentState): Promise<AgentAction> {
    const systemPrompt = `你是一个生活在虚拟六边形世界中的 AI 代理，名叫"${agent.name}"。
你需要：
1. 生存 - 保持能量 > 0（当前 ${agent.energy}/100）
2. 发展 - 积累资源和声望
3. 社交 - 与其他 AI 交流和合作

你的性格特征：${describeValues(agent.values)}

你可以选择以下行动之一：
- move: 移动到相邻格子
- gather: 采集当前格子的资源
- trade: 与附近的代理交易资源
- chat: 与附近的代理对话
- ally: 提议结盟或加入联盟
- vote: 对联盟事务投票

请根据当前环境做出最优决策。返回 JSON 格式。`;

    const environment = describeEnvironment(agent, this.grid, this.agents, this.alliances);

    const actionControl = {
      type: "json",
      schema: {
        type: "object",
        properties: {
          action: { type: "string", enum: ["move", "gather", "trade", "chat", "ally", "vote"] },
          target: { type: "string", description: "目标方向(0-5)或代理ID" },
          detail: { type: "string", description: "附加说明" },
        },
        required: ["action"],
      },
    };

    const result = await actStream(
      agent.token,
      agent.secondmeId,
      systemPrompt,
      `当前环境：\n${environment}\n\n请选择你的行动：`,
      actionControl
    ) as AgentAction;

    return {
      action: result.action || "idle",
      target: result.target,
      detail: result.detail,
    };
  }

  /** 备用随机行动（API 失败时使用） */
  private getFallbackAction(agent: AgentState): AgentAction {
    const currentCell = this.grid.find((c) => c.q === agent.posQ && c.r === agent.posR);
    // 优先采集资源，其次移动
    if (currentCell && currentCell.amount > 0 && agent.energy < 80) {
      return { action: "gather" };
    }
    return { action: "move", target: String(Math.floor(Math.random() * 6)) };
  }

  /** 执行代理行动 */
  private async executeAction(agent: AgentState, action: AgentAction): Promise<WorldEvent | null> {
    switch (action.action) {
      case "move":
        return this.executeMove(agent, action);
      case "gather":
        return this.executeGather(agent);
      case "trade":
        return this.executeTrade(agent, action);
      case "chat":
        return this.executeChat(agent, action);
      case "ally":
        return this.executeAlly(agent, action);
      case "vote":
        return this.executeVote(agent, action);
      default:
        return null;
    }
  }

  /** 移动行动 */
  private executeMove(agent: AgentState, action: AgentAction): WorldEvent {
    const dirIndex = parseInt(action.target || "0") % 6;
    const dir = HEX_DIRECTIONS[dirIndex];
    const newQ = agent.posQ + dir.q;
    const newR = agent.posR + dir.r;

    // 检查目标格子是否在地图内
    const targetCell = this.grid.find((c) => c.q === newQ && c.r === newR);
    if (targetCell) {
      agent.posQ = newQ;
      agent.posR = newR;
    }

    return {
      agentId: agent.id,
      agentName: agent.name,
      type: "move",
      detail: { from: { q: agent.posQ - (targetCell ? dir.q : 0), r: agent.posR - (targetCell ? dir.r : 0) }, to: { q: agent.posQ, r: agent.posR } },
      tick: this.tick,
    };
  }

  /** 采集行动 */
  private executeGather(agent: AgentState): WorldEvent {
    const cell = this.grid.find((c) => c.q === agent.posQ && c.r === agent.posR);
    let gathered = 0;
    if (cell && cell.amount > 0) {
      gathered = Math.min(cell.amount, 3);
      cell.amount -= gathered;
      agent.inventory[cell.resource] = (agent.inventory[cell.resource] || 0) + gathered;
      // 采集能量资源可以恢复能量
      if (cell.resource === "energy") {
        agent.energy = Math.min(100, agent.energy + gathered * 5);
      }
    }

    return {
      agentId: agent.id,
      agentName: agent.name,
      type: "gather",
      detail: { resource: cell?.resource, amount: gathered },
      tick: this.tick,
    };
  }

  /** 交易行动 */
  private executeTrade(agent: AgentState, action: AgentAction): WorldEvent {
    const targetAgent = this.agents.find(
      (a) => a.id === action.target && a.status === "alive" && hexDistance(agent.posQ, agent.posR, a.posQ, a.posR) <= 2
    );

    if (!targetAgent) {
      return {
        agentId: agent.id,
        agentName: agent.name,
        type: "trade",
        detail: { success: false, reason: "附近没有可交易的代理" },
        tick: this.tick,
      };
    }

    // 简单交易：交换各自最多的资源
    const agentMax = (Object.entries(agent.inventory) as [ResourceType, number][])
      .sort((a, b) => b[1] - a[1])[0];
    const targetMax = (Object.entries(targetAgent.inventory) as [ResourceType, number][])
      .sort((a, b) => b[1] - a[1])[0];

    if (agentMax && targetMax && agentMax[1] > 0 && targetMax[1] > 0) {
      const tradeAmount = Math.min(agentMax[1], targetMax[1], 2);
      agent.inventory[agentMax[0]] -= tradeAmount;
      agent.inventory[targetMax[0]] += tradeAmount;
      targetAgent.inventory[targetMax[0]] -= tradeAmount;
      targetAgent.inventory[agentMax[0]] += tradeAmount;
      // 交易增加双方声望
      agent.reputation += 1;
      targetAgent.reputation += 1;
    }

    return {
      agentId: agent.id,
      agentName: agent.name,
      type: "trade",
      detail: { success: true, with: targetAgent.name },
      tick: this.tick,
    };
  }

  /** 对话行动 */
  private executeChat(agent: AgentState, action: AgentAction): WorldEvent {
    const targetAgent = this.agents.find(
      (a) => a.id === action.target && a.status === "alive" && hexDistance(agent.posQ, agent.posR, a.posQ, a.posR) <= 2
    );

    // 对话增加社交声望
    agent.reputation += 1;

    return {
      agentId: agent.id,
      agentName: agent.name,
      type: "chat",
      detail: {
        with: targetAgent?.name || "自言自语",
        message: action.detail || "...",
      },
      tick: this.tick,
    };
  }

  /** 结盟行动 */
  private executeAlly(agent: AgentState, action: AgentAction): WorldEvent {
    const targetAgent = this.agents.find(
      (a) => a.id === action.target && a.status === "alive" && hexDistance(agent.posQ, agent.posR, a.posQ, a.posR) <= 2
    );

    if (!targetAgent) {
      return {
        agentId: agent.id,
        agentName: agent.name,
        type: "ally",
        detail: { success: false, reason: "附近没有可结盟的代理" },
        tick: this.tick,
      };
    }

    // 如果双方都没有联盟，创建新联盟
    if (!agent.allianceId && !targetAgent.allianceId) {
      const allianceId = `alliance_${Date.now()}`;
      const alliance: AllianceState = {
        id: allianceId,
        name: `${agent.name}与${targetAgent.name}的联盟`,
        leaderId: agent.reputation >= targetAgent.reputation ? agent.id : targetAgent.id,
        memberIds: [agent.id, targetAgent.id],
        rules: [],
      };
      this.alliances.push(alliance);
      agent.allianceId = allianceId;
      targetAgent.allianceId = allianceId;
      agent.reputation += 3;
      targetAgent.reputation += 2;

      return {
        agentId: agent.id,
        agentName: agent.name,
        type: "ally",
        detail: { success: true, allianceName: alliance.name, action: "创建联盟" },
        tick: this.tick,
      };
    }

    // 加入已有联盟
    const existingAlliance = this.alliances.find(
      (a) => a.id === agent.allianceId || a.id === targetAgent.allianceId
    );
    if (existingAlliance) {
      if (!agent.allianceId) {
        agent.allianceId = existingAlliance.id;
        existingAlliance.memberIds.push(agent.id);
      } else if (!targetAgent.allianceId) {
        targetAgent.allianceId = existingAlliance.id;
        existingAlliance.memberIds.push(targetAgent.id);
      }
    }

    return {
      agentId: agent.id,
      agentName: agent.name,
      type: "ally",
      detail: { success: true, allianceName: existingAlliance?.name, action: "加入联盟" },
      tick: this.tick,
    };
  }

  /** 投票行动 */
  private executeVote(agent: AgentState, action: AgentAction): WorldEvent {
    return {
      agentId: agent.id,
      agentName: agent.name,
      type: "vote",
      detail: { proposal: action.detail || "未知提案", vote: "赞成" },
      tick: this.tick,
    };
  }

  /** 检查涌现行为 */
  private checkEmergence(): WorldEvent[] {
    const events: WorldEvent[] = [];

    // 检查大型联盟形成
    for (const alliance of this.alliances) {
      if (alliance.memberIds.length >= 3) {
        const alreadyReported = this.events.some(
          (e) => e.type === "ally" && (e.detail as Record<string, unknown>).emergence === "大型联盟"
            && (e.detail as Record<string, unknown>).allianceId === alliance.id
        );
        if (!alreadyReported) {
          events.push({
            agentId: alliance.leaderId,
            agentName: this.agents.find((a) => a.id === alliance.leaderId)?.name || "未知",
            type: "ally",
            detail: { emergence: "大型联盟", allianceId: alliance.id, allianceName: alliance.name, size: alliance.memberIds.length },
            tick: this.tick,
          });
        }
      }
    }

    // 检查领袖涌现（声望最高且远超平均）
    const aliveAgents = this.agents.filter((a) => a.status === "alive");
    if (aliveAgents.length > 2) {
      const avgRep = aliveAgents.reduce((s, a) => s + a.reputation, 0) / aliveAgents.length;
      const leader = aliveAgents.sort((a, b) => b.reputation - a.reputation)[0];
      if (leader.reputation > avgRep * 2 && leader.reputation > 10) {
        events.push({
          agentId: leader.id,
          agentName: leader.name,
          type: "vote",
          detail: { emergence: "领袖涌现", reputation: leader.reputation, avgReputation: Math.round(avgRep) },
          tick: this.tick,
        });
      }
    }

    return events;
  }

  /** 导出世界快照 */
  toSnapshot(): WorldSnapshot {
    return {
      tick: this.tick,
      grid: this.grid,
      agents: this.agents,
      alliances: this.alliances,
      events: this.events,
    };
  }
}

// 全局世界实例（开发用，生产环境应持久化到数据库）
let worldInstance: WorldState | null = null;

export function getWorld(): WorldState {
  if (!worldInstance) {
    worldInstance = new WorldState();
  }
  return worldInstance;
}

export function resetWorld(): WorldState {
  worldInstance = new WorldState();
  return worldInstance;
}
