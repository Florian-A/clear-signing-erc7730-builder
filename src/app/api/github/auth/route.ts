import { NextRequest, NextResponse } from "next/server";
import { env } from "~/env.js";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const redirectUri = searchParams.get("redirect_uri") || "/review";

  if (!env.GITHUB_CLIENT_ID) {
    return NextResponse.json(
      { error: "GitHub OAuth not configured" },
      { status: 500 }
    );
  }

  const state = Math.random().toString(36).substring(7);
  const callbackUri = `${request.nextUrl.origin}/api/github/auth/callback`;
  
  // Log pour déboguer l'URL de callback
  console.log("GitHub OAuth Callback URL:", callbackUri);
  
  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${env.GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(
    callbackUri
  )}&state=${state}&scope=repo,workflow`;

  const response = NextResponse.redirect(githubAuthUrl);
  
  // Stocker l'état et l'URI de redirection dans un cookie
  response.cookies.set("github_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 10, // 10 minutes
  });
  
  response.cookies.set("github_oauth_redirect", redirectUri, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 10, // 10 minutes
  });

  return response;
} 