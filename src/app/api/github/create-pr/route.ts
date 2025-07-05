import { NextRequest, NextResponse } from "next/server";
import { env } from "~/env.js";

const GITHUB_API_BASE = "https://api.github.com";
const REPO_OWNER = "LedgerHQ";
const REPO_NAME = "clear-signing-erc7730-registry";
const BRANCH_NAME = "add-test-json";

export async function POST(request: NextRequest) {
  try {
    const { jsonData } = await request.json();

    // Récupérer le token d'accès de l'utilisateur connecté
    const accessToken = request.cookies.get("github_access_token")?.value;
    const userData = request.cookies.get("github_user")?.value;

    if (!accessToken || !userData) {
      return NextResponse.json(
        { error: "Vous devez être connecté avec GitHub pour créer une PR" },
        { status: 401 }
      );
    }

    const user = JSON.parse(userData);

    // 1. Créer une nouvelle branche
    const branchResponse = await fetch(
      `${GITHUB_API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/git/refs`,
      {
        method: "POST",
        headers: {
          Authorization: `token ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ref: `refs/heads/${BRANCH_NAME}`,
          sha: await getMainBranchSha(accessToken),
        }),
      }
    );

    if (!branchResponse.ok) {
      const error = await branchResponse.text();
      console.error("Erreur lors de la création de la branche:", error);
      return NextResponse.json(
        { error: "Failed to create branch" },
        { status: 500 }
      );
    }

    // 2. Créer le fichier test.json dans le dossier registry
    const fileResponse = await fetch(
      `${GITHUB_API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/contents/registry/test.json`,
      {
        method: "PUT",
        headers: {
          Authorization: `token ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: "Add test.json to registry",
          content: Buffer.from(JSON.stringify(jsonData, null, 2)).toString("base64"),
          branch: BRANCH_NAME,
        }),
      }
    );

    if (!fileResponse.ok) {
      const error = await fileResponse.text();
      console.error("Erreur lors de la création du fichier:", error);
      return NextResponse.json(
        { error: "Failed to create file" },
        { status: 500 }
      );
    }

    // 3. Créer la Pull Request
    const prResponse = await fetch(
      `${GITHUB_API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/pulls`,
      {
        method: "POST",
        headers: {
          Authorization: `token ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: "Add test.json to registry",
          body: `This PR adds a test.json file to the registry directory.\n\nSubmitted by: @${user.login}`,
          head: BRANCH_NAME,
          base: "master",
        }),
      }
    );

    if (!prResponse.ok) {
      const error = await prResponse.text();
      console.error("Erreur lors de la création de la PR:", error);
      return NextResponse.json(
        { error: "Failed to create pull request" },
        { status: 500 }
      );
    }

    const prData = await prResponse.json();

    return NextResponse.json({
      success: true,
      pullRequestUrl: prData.html_url,
      message: "Pull request created successfully",
    });

  } catch (error) {
    console.error("Erreur lors de la création de la PR:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function getMainBranchSha(accessToken: string): Promise<string> {
  const response = await fetch(
    `${GITHUB_API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/git/ref/heads/master`,
    {
      headers: {
        Authorization: `token ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to get main branch SHA");
  }

  const data = await response.json();
  return data.object.sha;
} 