"use client";

import { useEffect, useState } from "react";

export default function TestCookiesPage() {
  const [cookies, setCookies] = useState<string>("");
  const [authStatus, setAuthStatus] = useState<any>(null);

  useEffect(() => {
    // Afficher tous les cookies
    const allCookies = document.cookie;
    setCookies(allCookies);

    // Tester l'API de statut
    fetch("/api/github/auth/status")
      .then(res => res.json())
      .then(data => {
        console.log("Auth status from test page:", data);
        setAuthStatus(data);
      })
      .catch(err => {
        console.error("Error fetching auth status:", err);
        setAuthStatus({ error: err.message });
      });
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Test des Cookies</h1>
      
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Tous les cookies :</h2>
        <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
          {cookies || "Aucun cookie trouvé"}
        </pre>
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Statut d'authentification :</h2>
        <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
          {JSON.stringify(authStatus, null, 2)}
        </pre>
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Actions :</h2>
        <div className="space-x-4">
          <button
            onClick={() => window.location.href = "/api/github/auth?redirect_uri=/test-cookies"}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Se connecter avec GitHub
          </button>
          <button
            onClick={() => {
              fetch("/api/github/auth/logout", { method: "POST" })
                .then(() => window.location.reload());
            }}
            className="bg-red-500 text-white px-4 py-2 rounded"
          >
            Se déconnecter
          </button>
          <button
            onClick={() => window.location.reload()}
            className="bg-gray-500 text-white px-4 py-2 rounded"
          >
            Actualiser
          </button>
        </div>
      </div>
    </div>
  );
} 