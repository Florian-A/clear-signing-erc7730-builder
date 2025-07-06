import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  console.log("=== Status API Called ===");
  
  // Lister tous les cookies pour le débogage
  const allCookies = request.cookies.getAll();
  console.log("Status API - All cookies:", allCookies.map(c => ({ name: c.name, value: c.value ? "Present" : "Missing" })));
  
  const accessToken = request.cookies.get("github_access_token")?.value;
  const userData = request.cookies.get("github_user")?.value;

  console.log("Status API - Access Token:", accessToken ? "Present" : "Missing");
  console.log("Status API - User Data:", userData ? "Present" : "Missing");

  if (!accessToken || !userData) {
    console.log("Status API - Returning: { authenticated: false }");
    return NextResponse.json({ authenticated: false });
  }

  try {
    const user = JSON.parse(userData);
    console.log("Status API - Parsed user:", user);
    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        login: user.login,
        name: user.name,
        avatar_url: user.avatar_url,
      },
    });
  } catch (error) {
    console.error("Error parsing user data:", error);
    return NextResponse.json({ authenticated: false });
  }
} 