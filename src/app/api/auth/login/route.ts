/**
 * OAuth2 登录路由
 * 重定向到 SecondMe 授权页面
 */

import { NextResponse } from "next/server";
import { getAuthUrl } from "@/lib/secondme";

export async function GET() {
  try {
    const authUrl = getAuthUrl("hive_login");
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error("登录重定向失败:", error);
    return NextResponse.json(
      { success: false, error: "登录失败" },
      { status: 500 }
    );
  }
}
