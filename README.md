# New Regent Guest House

The app is split into two independent projects:

- `frontend/` — React and Vite application
- `backend/` — Express and MongoDB API

## Install and run

Open two terminals. Install dependencies and start each app from its own folder:

```sh
cd backend
npm install
npm run dev
```

```sh
cd frontend
npm install
npm run dev
```

The frontend runs on port 3000 and the API on port 5000 by default. Keep backend secrets and database settings in `backend/.env` (ignored by Git).

## Deploy frontend and backend to Vercel

This repository is a monorepo. Create **two Vercel projects** from the same Git repository:

1. Import the repository and set the first project's **Root Directory** to `backend`. Vercel detects the Express app in `server.js`; the project uses `npm install` and `npm start` defaults. Add these backend environment variables under **Project Settings → Environment Variables** for Production (and Preview if needed):
   - `MONGODB_URI` — MongoDB Atlas connection string. Create a database user and allow Vercel's outbound IPs in Atlas Network Access, or use `0.0.0.0/0` if you accept the security trade-off of allowing connections from any IP.
   - `JWT_SECRET` — a long, random secret. Generate a different value from any database or payment credentials.
   - `FRONTEND_URLS` — comma-separated exact browser origins allowed by CORS, for example `https://your-site.vercel.app`. Add your production custom domain too if you use one. For preview deployments, add the exact preview URL(s) you need, or use a stable preview domain. Do not include a path or trailing slash.
   - `NODE_ENV=production`.
   - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` — needed only for admin room image uploads. Create these in Cloudinary; keep the API secret server-side.
   - `DNS_SERVERS` is optional and only needed if MongoDB Atlas SRV DNS lookup fails on the host.

2. Create the second Vercel project from the same repository and set its **Root Directory** to `frontend`. Set `VITE_API_URL` to the backend production URL plus `/api`, e.g. `https://your-api.vercel.app/api`. This is a public frontend build setting, not a secret. Set it for Production and for Preview if preview builds should call a preview API. Redeploy after changing it because Vite embeds it at build time. The included `frontend/vercel.json` supports client-side routes on refresh.

3. Deploy the backend first, then set its final URL in the frontend's `VITE_API_URL` and deploy the frontend. Copy the frontend's final origin into backend `FRONTEND_URLS`, then redeploy the backend. Check `https://your-api.vercel.app/api/health` and open the frontend.

Use **Settings → Environment Variables** in each Vercel project; the variables are not shared between the projects. Never add backend secrets to the frontend project or commit `.env` files. `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME`, and `ADMIN_PHONE` are only used by the one-off `npm run create-admin` script; do not leave the admin password as a permanent production environment variable. To create an admin, use a secure local `backend/.env` with those values and the production `MONGODB_URI`, run `npm run create-admin` from `backend`, then remove the temporary admin variables. See `backend/.env.example` for the backend variable template.
