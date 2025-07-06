# Clear signing erc7730 builder

This project as to goal to build an erc7730 json for clear signing

# How It Works

## Python API
The Python/FastAPI server is mapped into to Next.js app under `/api/`.

This is implemented using [`next.config.js` rewrites](https://github.com/digitros/nextjs-fastapi/blob/main/next.config.js) to map any request to `/api/py/:path*` to the FastAPI API, which is hosted in the `/api` folder.

Also, the app/api routes are available on the same domain, so you can use NextJs Route Handlers and make requests to `/api/...`.

On localhost, the rewrite will be made to the `127.0.0.1:8000` port, which is where the FastAPI server is running.

In production, the FastAPI server is hosted as [Python serverless functions](https://vercel.com/docs/concepts/functions/serverless-functions/runtimes/python) on Vercel.

### GitHub OAuth Authentication

To use this feature, you need to configure GitHub OAuth authentication:

1. Create a GitHub OAuth App in your GitHub account settings
2. Set the callback URL to `http://localhost:3000/api/github/auth/callback` (for development)
3. Add the client ID and client secret to your environment variables

### Features

- **Generate ERC7730 JSON**: Create ERC7730 clear signing descriptors from contract addresses or ABIs
- **GitHub Authentication**: Secure OAuth integration with GitHub
- **Automatic PR Creation**: 
  - Creates a fork if you don't have push access to the repository
  - Generates a unique branch name to avoid conflicts
  - Adds the ERC7730 JSON file to the registry
  - Creates a Pull Request in your name with a summary of the smart contract functions

## Getting Started

- Clone the repository
- Install dependencies: `npm install`
- Set up environment variables (see `.env.example`)
- Run the development server: `npm run dev`
- Open [http://localhost:3000](http://localhost:3000)

## Web project

The project is runing with this core technologies

- [Next.js](https://nextjs.org)
- [Tailwind CSS](https://tailwindcss.com)
- [tRPC](https://trpc.io)
- [shadcn](https://ui.shadcn.com/)
- [tanstack](https://tanstack.com/)
- [zustand](https://zustand-demo.pmnd.rs/)

## Copyright and license

This code is Copyright LEDGER SAS 2024 and published under the Apache-2.0 license.
