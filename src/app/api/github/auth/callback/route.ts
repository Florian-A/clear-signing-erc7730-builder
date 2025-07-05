import { NextRequest, NextResponse } from "next/server";
import { env } from "~/env.js";

export async function GET(request: NextRequest) {
  console.log("=== GitHub OAuth Callback Started ===");
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  console.log("Callback - Code:", code ? "Present" : "Missing");
  console.log("Callback - State:", state);
  console.log("Callback - Error:", error);

  // Récupérer l'état stocké dans le cookie
  const storedState = request.cookies.get("github_oauth_state")?.value;
  const redirectUri = request.cookies.get("github_oauth_redirect")?.value || "/review";

  console.log("Callback - Stored State:", storedState);
  console.log("Callback - Redirect URI:", redirectUri);

      if (error) {
      console.log("Callback - Error detected, redirecting to:", `${request.nextUrl.origin}${redirectUri}?error=access_denied`);
      return NextResponse.redirect(`${request.nextUrl.origin}${redirectUri}?error=access_denied`);
    }

  if (!code || !state || !storedState || state !== storedState) {
    console.log("Callback - Invalid state or missing code");
    console.log("Callback - Code present:", !!code);
    console.log("Callback - State present:", !!state);
    console.log("Callback - Stored state present:", !!storedState);
    console.log("Callback - State match:", state === storedState);
    return NextResponse.redirect(`${request.nextUrl.origin}${redirectUri}?error=invalid_state`);
  }

  if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) {
    console.log("Callback - OAuth not configured");
    return NextResponse.redirect(`${request.nextUrl.origin}${redirectUri}?error=oauth_not_configured`);
  }

  try {
    // Échanger le code contre un token d'accès
    const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: env.GITHUB_CLIENT_ID,
        client_secret: env.GITHUB_CLIENT_SECRET,
        code,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      console.error("GitHub OAuth error:", tokenData);
      return NextResponse.redirect(`${request.nextUrl.origin}${redirectUri}?error=token_exchange_failed`);
    }

    // Récupérer les informations de l'utilisateur
    const userResponse = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `token ${tokenData.access_token}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    const userData = await userResponse.json();

    if (!userResponse.ok) {
      console.error("GitHub user API error:", userData);
      return NextResponse.redirect(`${request.nextUrl.origin}${redirectUri}?error=user_fetch_failed`);
    }

    // Créer la réponse de redirection
    const response = NextResponse.redirect(`${request.nextUrl.origin}${redirectUri}?success=true`);
    
    // Nettoyer les cookies temporaires
    response.cookies.delete("github_oauth_state");
    response.cookies.delete("github_oauth_redirect");
    
    // Stocker le token et les informations utilisateur dans des cookies sécurisés
    console.log("Callback - Setting cookies for user:", userData.login);
    
    response.cookies.set("github_access_token", tokenData.access_token, {
      httpOnly: false, // Toujours accessible côté client pour le débogage
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 jours
    });

    response.cookies.set("github_user", JSON.stringify({
      id: userData.id,
      login: userData.login,
      name: userData.name,
      avatar_url: userData.avatar_url,
    }), {
      httpOnly: false, // Toujours accessible côté client pour le débogage
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 jours
    });

    console.log("Callback - Cookies set successfully");

    return response;

  } catch (error) {
    console.error("OAuth callback error:", error);
    return NextResponse.redirect(`${request.nextUrl.origin}${redirectUri}?error=server_error`);
  }
} 