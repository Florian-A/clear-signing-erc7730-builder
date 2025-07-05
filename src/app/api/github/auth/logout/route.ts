import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const redirectUri = searchParams.get("redirect_uri") || "/review";

  const response = NextResponse.json({ success: true });

  // Supprimer les cookies d'authentification
  response.cookies.delete("github_access_token");
  response.cookies.delete("github_user");

  return response;
} 