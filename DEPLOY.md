Render (Backend) environment variables

Set these in your Render service > Environment:

- MYSQL_PUBLIC_URL: mysql://<DB_USER>:<DB_PASSWORD>@<RAILWAY_TCP_PROXY_DOMAIN>:<RAILWAY_TCP_PROXY_PORT>/<DB_NAME>
  - Example: mysql://root:gKFTLGKCypVGvDwBlkiqmHvwQUFFWHaH@shinkansen.proxy.rlwy.net:39132/railway
  - Make sure this is the *public TCP proxy* host and port from Railway, not the private domain.

- JWT_SECRET: a secure random string (already present in your .env example)
- JWT_EXPIRE: 7d (optional)
- UPLOAD_PATH: ./uploads
- (Optional) If you prefer separate vars instead of a connection string:
  - DB_HOST = <RAILWAY_TCP_PROXY_DOMAIN>
  - DB_PORT = <RAILWAY_TCP_PROXY_PORT>
  - DB_USER = root
  - DB_PASSWORD = <password>
  - DB_NAME = railway

After updating envs, redeploy the Render service and check logs for a successful DB connection and server start.


Vercel (Frontend) environment variables

Set in your Vercel project > Settings > Environment Variables:

- VITE_API_URL = https://<your-render-service>.onrender.com/api
  - Make sure to include the trailing `/api` so the frontend's `api` client calls the correct base path.

Redeploy the frontend after setting this variable.


Local development

- Backend:
  - Copy `.env.example` (if present) to `.env` in `backend/` and fill values.
  - Run:
    cd backend
    npm install
    npm start

- Frontend:
  - In `frontend/`, create `.env` (or set env in your shell) with:
    VITE_API_URL=http://localhost:5000/api
  - Run:
    cd frontend
    npm install
    npm run dev


Notes & troubleshooting

- If you see `ERR_INVALID_URL` in logs, you have template placeholders like `${{RAILWAY_TCP_PROXY_DOMAIN}}` in the Render env. Replace with actual values.
- If you see `ECONNREFUSED`, ensure you're using the Railway public TCP proxy host and port (Render must be able to reach it).
- If login returns a 500 and logs show `secretOrPrivateKey must have a value`, set `JWT_SECRET`.

If you want, I can:
- Prepare the exact `MYSQL_PUBLIC_URL` string if you paste the Railway TCP proxy host and port (I already have the root password from your `.env`).
- Walk you step-by-step through the Render and Vercel dashboards.
