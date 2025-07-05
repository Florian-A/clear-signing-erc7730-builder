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

    // 0. Vérifier les permissions de l'utilisateur
    console.log("Checking user permissions for repository...");
    const permissionsResponse = await fetch(
      `${GITHUB_API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}`,
      {
        headers: {
          Authorization: `token ${accessToken}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );

    if (!permissionsResponse.ok) {
      const error = await permissionsResponse.text();
      console.error("Repository access error:", error);
      return NextResponse.json(
        { error: `Vous n'avez pas accès au repository ou il n'existe pas: ${error}` },
        { status: 403 }
      );
    }

    const repoData = await permissionsResponse.json();
    console.log("Repository access successful:", { 
      name: repoData.name, 
      default_branch: repoData.default_branch,
      permissions: repoData.permissions 
    });

    // Vérifier si l'utilisateur a les permissions push
    if (!repoData.permissions.push) {
      console.log("User doesn't have push permissions, creating fork...");
      
      // Créer un fork du repository
      const forkResponse = await fetch(
        `${GITHUB_API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/forks`,
        {
          method: "POST",
          headers: {
            Authorization: `token ${accessToken}`,
            Accept: "application/vnd.github.v3+json",
          },
        }
      );

      if (!forkResponse.ok) {
        const error = await forkResponse.text();
        console.error("Failed to create fork:", error);
        return NextResponse.json(
          { error: `Impossible de créer un fork du repository: ${error}` },
          { status: 500 }
        );
      }

      const forkData = await forkResponse.json();
      console.log("Fork created successfully:", forkData.full_name);
      
      // Utiliser le fork pour les opérations suivantes
      const forkOwner = forkData.owner.login;
      const forkName = forkData.name;
      
      // Attendre un peu que le fork soit prêt
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 1. Créer une branche dans le fork
      console.log("Creating branch in fork:", BRANCH_NAME);
      const defaultBranch = repoData.default_branch;
      console.log("Default branch:", defaultBranch);
      const mainBranchSha = await getMainBranchSha(accessToken, defaultBranch, forkOwner, forkName);
      console.log("Main branch SHA:", mainBranchSha);
      
      const branchResponse = await fetch(
        `${GITHUB_API_BASE}/repos/${forkOwner}/${forkName}/git/refs`,
        {
          method: "POST",
          headers: {
            Authorization: `token ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ref: `refs/heads/${BRANCH_NAME}`,
            sha: mainBranchSha,
          }),
        }
      );

      console.log("Branch creation response status:", branchResponse.status);
      
      if (!branchResponse.ok) {
        const error = await branchResponse.text();
        console.error("Erreur lors de la création de la branche:", error);
        return NextResponse.json(
          { error: `Failed to create branch: ${error}` },
          { status: 500 }
        );
      }
      
      console.log("Branch created successfully in fork");
      
      // 2. Créer le fichier dans le fork
      const fileResponse = await fetch(
        `${GITHUB_API_BASE}/repos/${forkOwner}/${forkName}/contents/registry/test.json`,
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

      // 3. Créer la Pull Request depuis le fork vers le repository original
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
            head: `${forkOwner}:${BRANCH_NAME}`,
            base: defaultBranch,
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
        message: "Pull request created successfully from fork",
      });
    }

    // Si l'utilisateur a les permissions push, utiliser le repository original
    console.log("User has push permissions, using original repository");
    
    // 1. Obtenir la branche principale et créer une nouvelle branche
    console.log("Creating branch:", BRANCH_NAME);
    const defaultBranch = repoData.default_branch;
    console.log("Default branch:", defaultBranch);
    const mainBranchSha = await getMainBranchSha(accessToken, defaultBranch);
    console.log("Main branch SHA:", mainBranchSha);
    
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
          sha: mainBranchSha,
        }),
      }
    );

    console.log("Branch creation response status:", branchResponse.status);
    
    if (!branchResponse.ok) {
      const error = await branchResponse.text();
      console.error("Erreur lors de la création de la branche:", error);
      console.error("Branch creation response headers:", Object.fromEntries(branchResponse.headers.entries()));
      return NextResponse.json(
        { error: `Failed to create branch: ${error}` },
        { status: 500 }
      );
    }
    
    console.log("Branch created successfully");

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
          base: defaultBranch,
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

async function getMainBranchSha(accessToken: string, branchName: string, owner?: string, repo?: string): Promise<string> {
  const repoOwner = owner || REPO_OWNER;
  const repoName = repo || REPO_NAME;
  
  console.log("Getting main branch SHA for branch:", branchName, "in repo:", `${repoOwner}/${repoName}`);
  const response = await fetch(
    `${GITHUB_API_BASE}/repos/${repoOwner}/${repoName}/git/ref/heads/${branchName}`,
    {
      headers: {
        Authorization: `token ${accessToken}`,
      },
    }
  );

  console.log("Main branch SHA response status:", response.status);

  if (!response.ok) {
    const error = await response.text();
    console.error("Failed to get main branch SHA:", error);
    throw new Error(`Failed to get main branch SHA: ${error}`);
  }

  const data = await response.json();
  console.log("Main branch SHA data:", data);
  return data.object.sha;
} 