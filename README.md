# DonutDrop

Full-stack casino-style game platform with JWT auth, MongoDB persistence, a provably fair system, and a React/Tailwind/Framer Motion frontend.

## Structure

- `client/` React + Vite frontend
- `server/` Express + MongoDB backend

## Setup

1. Install dependencies in both `client` and `server`.
2. Copy `server/.env.example` to `server/.env` and fill in secrets.
3. Start MongoDB.
4. Run the server, then the client.

## Deploy

If your host deploys from the repo root, use these commands:

- Install command: `npm run install:all`
- Build command: `npm run build`
- Start command: `npm run start`

This root config builds the Vite frontend from `client/` and starts the Express backend from `server/`.

If your platform supports separate frontend/backend services, you can also point them directly at:

- Frontend root: `client/`
- Backend root: `server/`
