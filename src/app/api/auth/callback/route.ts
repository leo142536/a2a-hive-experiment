/**
 * OAuth2 回调路由
 * 处理 SecondMe 授权回调，交换 token 并创建用户
 */

import { NextRequest, NextResponse } from "next/server";
import { exchangeToken, getUserInfo } from "@/lib/secondme";
import prisma from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");

    if (!code) {
      return NextResponse.redirect(new URL("/?error=no_code", request.url));
    }

    // 用授权码换取 token
    const tokenData = await exchangeToken(code);

    // 获取用户信息
    const userInfo = await getUserInfo(tokenData.access_token);

    // 创建或更新用户
    const user = await prisma.user.upsert({
      where: { secondmeId: userInfo.id || userInfo.secondme_id },
      update: {
        name: userInfo.name || userInfo.nickname || "未知用户",
        avatar: userInfo.avatar || null,
        token: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
      },
      create: {
        secondmeId: userInfo.id || userInfo.secondme_id,
        name: userInfo.name || userInfo.nickname || "未知用户",
        avatar: userInfo.avatar || null,
        token: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
      },
    });

    // 设置 cookie 并重定向到蜂巢页面
    const response = NextResponse.redirect(new URL("/hive", request.url));
    response.cookies.set("user_id", user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 天
    });

    return response;
  } catch (error) {
    console.error("OAuth 回调处理失败:", error);
    return NextResponse.redirect(new URL("/?error=auth_failed", request.url));
  }
}
