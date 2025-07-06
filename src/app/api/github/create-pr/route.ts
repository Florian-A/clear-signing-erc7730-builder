import { NextRequest, NextResponse } from "next/server";
import { env } from "~/env.js";
import { analyzeErc7730WithAI } from "~/lib/analyze-erc7730";

const GITHUB_API_BASE = "https://api.github.com";
const REPO_OWNER = "LedgerHQ";
const REPO_NAME = "clear-signing-erc7730-registry";

export async function POST(request: NextRequest) {
  try {
    const { jsonData } = await request.json();

    // Get the access token of the connected user
    const accessToken = request.cookies.get("github_access_token")?.value;
    const userData = request.cookies.get("github_user")?.value;

    if (!accessToken || !userData) {
      return NextResponse.json(
        { error: "You must be connected to GitHub to create a PR" },
        { status: 401 }
      );
    }

    const user = JSON.parse(userData);

    // Extract owner and ID from JSON data
    const owner = jsonData.metadata?.owner;
    const contextId = jsonData.context?.$id;
    
    if (!owner) {
      return NextResponse.json(
        { error: "Missing metadata.owner in JSON data" },
        { status: 400 }
      );
    }
    
    if (!contextId) {
      return NextResponse.json(
        { error: "Missing context.$id in JSON data" },
        { status: 400 }
      );
    }

    // Convert to lowercase and replace spaces with hyphens
    const ownerPath = owner.toLowerCase().replace(/\s+/g, '-');
    const idPath = contextId.toLowerCase().replace(/\s+/g, '-');
    const filePath = `registry/${ownerPath}/${idPath}.json`;

    // Generate AI analysis
    const aiAnalysis = await analyzeErc7730WithAI(jsonData);
    console.log("AI Analysis completed");

    // 0. Check user permissions
    console.log("Checking user permissions for repository...");
    const permissionsResponse = await fetch(
      `${GITHUB_API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}`,
      {
        headers: {
          Authorization: `token ${accessToken}`,
        },
      }
    );

    if (!permissionsResponse.ok) {
      return NextResponse.json(
        { error: "Failed to check repository permissions" },
        { status: 500 }
      );
    }

    const repoData = await permissionsResponse.json();

    // Function to generate a unique branch name
    const generateBranchName = () => {
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 8);
      return `add-${ownerPath}-${idPath}-${user.login}-${timestamp}-${random}`;
    };

    const branchName = generateBranchName();
    console.log("Generated branch name:", branchName);

    // Check if the user has push permissions
    if (!repoData.permissions.push) {
      console.log("User doesn't have push permissions, creating fork...");
      
      // Create a fork of the repository
      const forkResponse = await fetch(
        `${GITHUB_API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/forks`,
        {
          method: "POST",
          headers: {
            Authorization: `token ${accessToken}`,
          },
        }
      );

      if (!forkResponse.ok) {
        const error = await forkResponse.text();
        console.error("Failed to create fork:", error);
        return NextResponse.json(
          { error: `Unable to create repository fork: ${error}` },
          { status: 500 }
        );
      }

      const forkData = await forkResponse.json();
      console.log("Fork created successfully:", forkData.full_name);
      
      // Use the fork for subsequent operations
      const forkOwner = forkData.owner.login;
      const forkName = forkData.name;

      // Wait a bit for the fork to be fully created
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 1. Create a branch in the fork
      console.log("Creating branch in fork:", branchName);
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
            ref: `refs/heads/${branchName}`,
            sha: mainBranchSha,
          }),
        }
      );

      console.log("Branch creation response status:", branchResponse.status);
      
      if (!branchResponse.ok) {
        const error = await branchResponse.text();
        console.error("Error creating branch:", error);
        return NextResponse.json(
          { error: `Failed to create branch: ${error}` },
          { status: 500 }
        );
      }
      
      console.log("Branch created successfully in fork");
      
      // 2. Create the file in the fork
      const fileResponse = await fetch(
        `${GITHUB_API_BASE}/repos/${forkOwner}/${forkName}/contents/${filePath}`,
        {
          method: "PUT",
          headers: {
            Authorization: `token ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: `Add ${filePath} to registry`,
            content: Buffer.from(JSON.stringify(jsonData, null, 2)).toString("base64"),
            branch: branchName,
          }),
        }
      );

      if (!fileResponse.ok) {
        const error = await fileResponse.text();
        console.error("Error creating file:", error);
        return NextResponse.json(
          { error: "Failed to create file" },
          { status: 500 }
        );
      }

      // 3. Create the Pull Request from the fork to the original repository
      const prResponse = await fetch(
        `${GITHUB_API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/pulls`,
        {
          method: "POST",
          headers: {
            Authorization: `token ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: `Add ${filePath} to registry`,
            body: `${aiAnalysis}\n\n_Generated with [ERC7730 JSON Builder](https://github.com/LedgerHQ/clear-signing-erc7730-builder)_`,
            head: `${forkOwner}:${branchName}`,
            base: defaultBranch,
          }),
        }
      );

      if (!prResponse.ok) {
        const error = await prResponse.text();
        console.error("Error creating PR:", error);
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

    // If the user has push permissions, use the original repository
    console.log("User has push permissions, using original repository");
    
    // 1. Get the main branch and create a new branch
    console.log("Creating branch:", branchName);
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
          ref: `refs/heads/${branchName}`,
          sha: mainBranchSha,
        }),
      }
    );

    console.log("Branch creation response status:", branchResponse.status);
    
    if (!branchResponse.ok) {
      const error = await branchResponse.text();
      console.error("Error creating branch:", error);
      return NextResponse.json(
        { error: "Failed to create branch" },
        { status: 500 }
      );
    }
    
    console.log("Branch created successfully");
    
    // 2. Create the file in the registry directory
    const fileResponse = await fetch(
      `${GITHUB_API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/contents/${filePath}`,
      {
        method: "PUT",
        headers: {
          Authorization: `token ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: `Add ${filePath} to registry`,
          content: Buffer.from(JSON.stringify(jsonData, null, 2)).toString("base64"),
          branch: branchName,
        }),
      }
    );

    if (!fileResponse.ok) {
      const error = await fileResponse.text();
      console.error("Error creating file:", error);
      return NextResponse.json(
        { error: "Failed to create file" },
        { status: 500 }
      );
    }

    // 3. Create the Pull Request
    const prResponse = await fetch(
      `${GITHUB_API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/pulls`,
      {
        method: "POST",
        headers: {
          Authorization: `token ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: `Add ${filePath} to registry`,
          body: `This PR adds ${filePath} to the registry directory.\n\nSubmitted by: @${user.login}\n\n## Smart Contract Analysis\n\n${aiAnalysis}\n\n_Generated with [ERC7730 JSON Builder](https://github.com/LedgerHQ/clear-signing-erc7730-builder)_`,
          head: branchName,
          base: defaultBranch,
        }),
      }
    );

    if (!prResponse.ok) {
      const error = await prResponse.text();
      console.error("Error creating PR:", error);
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
    console.error("Error creating PR:", error);
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