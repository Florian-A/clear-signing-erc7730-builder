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
      console.error("Erreur lors de la vérification du statut d'authentification:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Vérifier le statut d'authentification au chargement
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
        title: "Erreur d'authentification",
        description: getErrorMessage(error),
        variant: "destructive",
      });
      // Nettoyer l'URL
      router.replace("/review");
    }

    if (success) {
      toast({
        title: "Connexion réussie !",
        description: "Vous êtes maintenant connecté avec GitHub.",
      });
      // Nettoyer l'URL et recharger le statut
      router.replace("/review");
      // Attendre un peu avant de vérifier le statut pour laisser le temps aux cookies d'être définis
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
      await fetch("/api/github/auth/logout", { method: "POST" });
      setAuthStatus({ authenticated: false });
      toast({
        title: "Déconnexion réussie",
        description: "Vous avez été déconnecté de GitHub.",
      });
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la déconnexion.",
        variant: "destructive",
      });
    }
  };

  const getErrorMessage = (error: string): string => {
    switch (error) {
      case "access_denied":
        return "L'accès a été refusé. Veuillez autoriser l'application.";
      case "invalid_state":
        return "Erreur de sécurité. Veuillez réessayer.";
      case "oauth_not_configured":
        return "L'authentification GitHub n'est pas configurée.";
      case "token_exchange_failed":
        return "Erreur lors de l'échange du token. Veuillez réessayer.";
      case "user_fetch_failed":
        return "Erreur lors de la récupération des informations utilisateur.";
      case "server_error":
        return "Erreur serveur. Veuillez réessayer.";
      default:
        return "Une erreur inattendue s'est produite.";
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