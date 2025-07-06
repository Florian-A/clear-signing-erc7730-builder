"use client";

import { Button } from "~/components/ui/button";
import * as React from "react";

import { ResponsiveDialog } from "~/components/ui/responsiveDialog";
import { useErc7730Store } from "~/store/erc7730Provider";
import { useToast } from "~/hooks/use-toast";
import { Loader2, Github, LogOut } from "lucide-react";
import { useGitHubAuth } from "~/hooks/use-github-auth";

export function ReviewJson() {
  const [open, setOpen] = React.useState(false);
  const [isGeneratingPR, setIsGeneratingPR] = React.useState(false);
  const erc7730 = useErc7730Store((s) => s.finalErc7730);
  const { toast } = useToast();
  const { authStatus, loading: authLoading, login, logout, checkAuthStatus } = useGitHubAuth();

  // Debug: Afficher l'état d'authentification dans la console
  React.useEffect(() => {
    console.log("Auth Status:", authStatus);
    console.log("Auth Loading:", authLoading);
  }, [authStatus, authLoading]);

  const handleCopyToClipboard = () => {
    void navigator.clipboard.writeText(JSON.stringify(erc7730, null, 2));
    toast({
      title: "JSON copied to clipboard!",
    });
  };

  const handleGeneratePR = async () => {
    if (!erc7730) {
      toast({
        title: "Error",
        description: "No JSON to submit",
        variant: "destructive",
      });
      return;
    }

    if (!authStatus.authenticated) {
      toast({
        title: "Authentication required",
        description: "Please connect to GitHub to generate a PR",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingPR(true);
    try {
      const response = await fetch("/api/github/create-pr", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jsonData: erc7730,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast({
          title: "PR created successfully!",
          description: (
            <div>
              <p>The Pull Request was created by @{authStatus.user?.login}.</p>
              <a
                href={data.pullRequestUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 underline"
              >
                View PR on GitHub
              </a>
            </div>
          ),
        });
      } else {
        throw new Error(data.error || "Error creating PR");
      }
    } catch (error) {
      console.error("Error creating PR:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error creating PR",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPR(false);
    }
  };

  return (
    <ResponsiveDialog
      dialogTrigger={<Button variant="outline">Submit</Button>}
      dialogTitle="Submit your JSON"
      open={open}
      setOpen={setOpen}
    >
      <div className="space-y-4 p-4 md:p-0">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Before submitting, please review your JSON. If everything looks good,
            copy it to your clipboard and create a pull request in the following
            repository:
            <a
              href="https://github.com/LedgerHQ/clear-signing-erc7730-registry"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 underline"
            >
              LedgerHQ Clear Signing ERC7730 Registry
            </a>
            .
          </p>
          
          {/* Section d'authentification GitHub */}
          <div className="rounded-lg border p-4">
            <h3 className="mb-3 text-sm font-semibold">GitHub Authentication</h3>
            {authLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Checking connection...</span>
              </div>
            ) : authStatus.authenticated ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {authStatus.user?.avatar_url && (
                    <img
                      src={authStatus.user.avatar_url}
                      alt={authStatus.user.name || authStatus.user.login}
                      className="h-8 w-8 rounded-full"
                    />
                  )}
                  <div>
                    <p className="text-sm font-medium">
                      {authStatus.user?.name || authStatus.user?.login}
                    </p>
                    <p className="text-xs text-gray-500">@{authStatus.user?.login}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={checkAuthStatus}
                    className="flex items-center gap-2"
                  >
                    Refresh
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={logout}
                    className="flex items-center gap-2"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Connect to GitHub to create a PR
                </p>
                <Button
                  onClick={login}
                  className="flex items-center gap-2"
                >
                  <Github className="h-4 w-4" />
                  Login
                </Button>
              </div>
            )}
          </div>
        </div>
        <pre className="max-h-64 overflow-auto rounded border bg-gray-100 p-4 text-sm dark:text-black">
          {JSON.stringify(erc7730, null, 2)}
        </pre>
        <div className="flex gap-2">
          <Button onClick={handleCopyToClipboard}>Copy JSON to Clipboard</Button>
          <Button 
            onClick={handleGeneratePR} 
            disabled={isGeneratingPR || !authStatus.authenticated}
            variant="default"
          >
            {isGeneratingPR ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating PR...
              </>
            ) : (
              "Generate PR"
            )}
          </Button>
        </div>
      </div>
    </ResponsiveDialog>
  );
}

export default ReviewJson;
