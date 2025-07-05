# Clear signing erc7730 builder

This project as to goal to build an erc7730 json for clear signing

## Nouvelles fonctionnalités

### Génération automatique de Pull Request

Le projet inclut maintenant une fonctionnalité pour générer automatiquement une Pull Request sur le repository [LedgerHQ/clear-signing-erc7730-registry](https://github.com/LedgerHQ/clear-signing-erc7730-registry).

#### Configuration requise

Pour utiliser cette fonctionnalité, vous devez configurer l'authentification GitHub OAuth :

1. Créez une application OAuth GitHub sur [GitHub Settings > Developer settings > OAuth Apps](https://github.com/settings/developers)
2. Configurez l'URL de callback : `http://localhost:3000/api/github/auth/callback` (développement) ou votre domaine de production
3. Ajoutez les variables d'environnement dans votre fichier `.env.local` :
   ```
   GITHUB_CLIENT_ID=your_github_oauth_client_id
   GITHUB_CLIENT_SECRET=your_github_oauth_client_secret
   ```

#### Utilisation

1. Générez votre JSON ERC7730 dans l'application
2. Allez dans la section "Review"
3. Connectez-vous avec votre compte GitHub en cliquant sur "Se connecter"
4. Une fois connecté, cliquez sur le bouton "Générer une PR" à côté du bouton "Copy JSON to Clipboard"
5. Le système créera automatiquement :
   - Une nouvelle branche `add-test-json`
   - Un fichier `test.json` dans le dossier `registry/`
   - Une Pull Request au nom de votre compte GitHub pour fusionner ces changements

# How It Works

## python api
The Python/FastAPI server is mapped into to Next.js app under `/api/`.

This is implemented using [`next.config.js` rewrites](https://github.com/digitros/nextjs-fastapi/blob/main/next.config.js) to map any request to `/api/py/:path*` to the FastAPI API, which is hosted in the `/api` folder.

Also, the app/api routes are available on the same domain, so you can use NextJs Route Handlers and make requests to `/api/...`.

On localhost, the rewrite will be made to the `127.0.0.1:8000` port, which is where the FastAPI server is running.

In production, the FastAPI server is hosted as [Python serverless functions](https://vercel.com/docs/concepts/functions/serverless-functions/runtimes/python) on Vercel.

## web project

The project is runing with this core technologies

- [Next.js](https://nextjs.org)
- [Tailwind CSS](https://tailwindcss.com)
- [tRPC](https://trpc.io)
- [shadcn](https://ui.shadcn.com/)
- [tanstack](https://tanstack.com/)
- [zustand](https://zustand-demo.pmnd.rs/)

# Copyright and license

This code is Copyright LEDGER SAS 2024 and published under the Apache-2.0 license.
