"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "~/hooks/use-toast";

interface GitHubUser {
  id: number;
  login: string;
  name: string;
  avatar_url: string;
}

interface AuthStatus {
  authenticated: boolean;
  user?: GitHubUser;
}

export function useGitHubAuth() {
  const [authStatus, setAuthStatus] = useState<AuthStatus>({ authenticated: false });
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const checkAuthStatus = useCallback(async () => {
    try {
      console.log("Checking auth status...");
      const response = await fetch("/api/github/auth/status");
      const data = await response.json();
      console.log("Auth status response:", data);
      setAuthStatus(data);
    } catch (error) {
      console.error("Error checking authentication status:", error);
      setAuthStatus({ authenticated: false });
    } finally {
      setLoading(false);
    }
  }, []);

  // Check authentication status on load
  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  // Gérer les paramètres d'URL après redirection OAuth
  useEffect(() => {
    const error = searchParams.get("error");
    const success = searchParams.get("success");

    console.log("URL params - error:", error, "success:", success);

    if (error) {
      toast({
        title: "Authentication Error",
        description: getErrorMessage(error),
        variant: "destructive",
      });
      // Nettoyer l'URL
      router.replace("/review");
    }

    if (success) {
      toast({
        title: "Success",
        description: "You are now connected with GitHub.",
      });
      // Nettoyer l'URL et recharger le statut
      router.replace("/review");
      // Wait a bit before checking the status to give cookies time to be set
      setTimeout(() => {
        checkAuthStatus();
      }, 1000);
    }
  }, [searchParams, router, toast, checkAuthStatus]);

  const login = () => {
    const currentPath = window.location.pathname + window.location.search;
    window.location.href = `/api/github/auth?redirect_uri=${encodeURIComponent(currentPath)}`;
  };

  const logout = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/github/auth/logout', {
        method: 'POST',
      });

      if (response.ok) {
        setAuthStatus({ authenticated: false });
        toast({
          title: "Success",
          description: "You have been logged out from GitHub.",
        });
      }
    } catch (error) {
      console.error("Error during logout:", error);
      toast({
        title: "Error",
        description: "Error during logout.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getErrorMessage = (error: string) => {
    switch (error) {
      case 'access_denied':
        return "Access denied. Please try again.";
      case 'server_error':
        return "Server error. Please try again.";
      case 'temporarily_unavailable':
        return "Service temporarily unavailable. Please try again.";
      default:
        return "An unexpected error occurred.";
    }
  };

  return {
    authStatus,
    loading,
    login,
    logout,
    checkAuthStatus,
  };
} 