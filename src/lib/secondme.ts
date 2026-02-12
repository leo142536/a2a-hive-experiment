/**
 * SecondMe API 封装
 * 处理 OAuth2 认证和所有 API 调用
 */

const API_BASE = process.env.SECONDME_API_BASE || "https://app.mindos.com/gate/lab";
const OAUTH_URL = process.env.SECONDME_OAUTH_URL || "https://go.second.me/oauth/";
const APP_ID = process.env.SECONDME_APP_ID || "";
const APP_SECRET = process.env.SECONDME_APP_SECRET || "";
const REDIRECT_URI = process.env.SECONDME_REDIRECT_URI || "http://localhost:3000/api/auth/callback";

// 权限范围
const SCOPES = "user.info,user.info.shades,user.info.softmemory,note.add,chat";

/**
 * 生成 OAuth2 授权 URL
 */
export function getAuthUrl(state?: string): string {
  const params = new URLSearchParams({
    app_id: APP_ID,
    redirect_uri: REDIRECT_URI,
    scope: SCOPES,
    state: state || "hive",
  });
  return `${OAUTH_URL}?${params.toString()}`;
}

/**
 * 用授权码换取 access token
 */
export async function exchangeToken(code: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
}> {
  const res = await fetch(`${API_BASE}/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      app_id: APP_ID,
      app_secret: APP_SECRET,
      code,
      grant_type: "authorization_code",
    }),
  });
  const data = await res.json();
  if (!res.ok || data.code !== 0) {
    throw new Error(data.message || "Token 交换失败");
  }
  return data.result;
}

/**
 * 刷新 access token
 */
export async function refreshAccessToken(refreshToken: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
}> {
  const res = await fetch(`${API_BASE}/oauth/refresh_token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      app_id: APP_ID,
      app_secret: APP_SECRET,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  const data = await res.json();
  if (!res.ok || data.code !== 0) {
    throw new Error(data.message || "Token 刷新失败");
  }
  return data.result;
}

/**
 * 获取用户信息
 */
export async function getUserInfo(token: string) {
  const res = await fetch(`${API_BASE}/user/info`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok || data.code !== 0) {
    throw new Error(data.message || "获取用户信息失败");
  }
  return data.result.data;
}

/**
 * 获取用户兴趣标签
 */
export async function getUserShades(token: string) {
  const res = await fetch(`${API_BASE}/user/shades`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok || data.code !== 0) {
    throw new Error(data.message || "获取兴趣标签失败");
  }
  return data.result.data.shades;
}

/**
 * 获取软记忆
 */
export async function getSoftMemory(token: string) {
  const res = await fetch(`${API_BASE}/user/softmemory`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok || data.code !== 0) {
    throw new Error(data.message || "获取软记忆失败");
  }
  return data.result.data.list;
}

/**
 * SSE 流式聊天 - 用于 AI 之间的对话
 */
export async function chatStream(
  token: string,
  secondmeId: string,
  message: string,
  onData: (chunk: string) => void
): Promise<string> {
  const res = await fetch(`${API_BASE}/chat/stream`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      secondme_id: secondmeId,
      message,
    }),
  });

  if (!res.ok) {
    throw new Error("聊天请求失败");
  }

  const reader = res.body?.getReader();
  const decoder = new TextDecoder();
  let fullResponse = "";

  if (!reader) throw new Error("无法读取响应流");

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    // 解析 SSE 数据
    const lines = chunk.split("\n");
    for (const line of lines) {
      if (line.startsWith("data:")) {
        const data = line.slice(5).trim();
        if (data === "[DONE]") break;
        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content || parsed.content || "";
          if (content) {
            fullResponse += content;
            onData(content);
          }
        } catch {
          // 非 JSON 数据，直接拼接
          if (data) {
            fullResponse += data;
            onData(data);
          }
        }
      }
    }
  }

  return fullResponse;
}

/**
 * Act API - 结构化行动决策（SSE 流式）
 * 用于 AI 代理在虚拟世界中做出行动选择
 */
export async function actStream(
  token: string,
  secondmeId: string,
  systemPrompt: string,
  userMessage: string,
  actionControl: object
): Promise<object> {
  const res = await fetch(`${API_BASE}/act/stream`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      secondme_id: secondmeId,
      system_prompt: systemPrompt,
      message: userMessage,
      action_control: actionControl,
    }),
  });

  if (!res.ok) {
    throw new Error("Act 请求失败");
  }

  const reader = res.body?.getReader();
  const decoder = new TextDecoder();
  let fullResponse = "";

  if (!reader) throw new Error("无法读取响应流");

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split("\n");
    for (const line of lines) {
      if (line.startsWith("data:")) {
        const data = line.slice(5).trim();
        if (data === "[DONE]") break;
        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content || parsed.content || "";
          if (content) fullResponse += content;
        } catch {
          if (data) fullResponse += data;
        }
      }
    }
  }

  // 尝试解析为 JSON
  try {
    return JSON.parse(fullResponse);
  } catch {
    return { action: "idle", raw: fullResponse };
  }
}
