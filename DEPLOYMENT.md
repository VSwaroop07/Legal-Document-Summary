# Deployment guide

This project deploys the Express API to Render, the React client to Vercel, and MongoDB Atlas as the database.

## 1. Prepare the repository

1. Push the repository to GitHub.
2. Confirm that `.env` files are not committed.
3. Keep the production API URL and frontend URL available:
   - API: `https://<render-service>.onrender.com`
   - Client: `https://<vercel-project>.vercel.app`

## 2. Configure MongoDB Atlas

1. Create or select the production Atlas cluster.
2. Create a database user with a strong generated password.
3. In **Network Access**, allow the Render service to connect. For a demo, `0.0.0.0/0` is convenient but less restrictive; use Render's documented outbound IP controls when the plan supports them.
4. Copy the SRV connection string and replace the password safely:
   `mongodb+srv://<user>:<password>@<cluster>/<database>?retryWrites=true&w=majority`
5. In the production database, open the `chunks` collection and create Atlas Vector Search index `chunk_vector_index`:
   - Path: `embedding`
   - Dimensions: `768` (Google Gemini `text-embedding-004`)
   - Similarity: `cosine`
   - Filter fields: `user`, `document`
   - Note: If migrating from OpenAI (1536 dims), re-create the index definition with 768 dimensions and run `npm run migrate:embeddings --prefix server`.
6. Do not use a local/test database URI in Render.

## 3. Deploy the server to Render

Create a **Web Service** from the repository. The checked-in [render.yaml](./render.yaml) contains these settings:

- Root directory: `server/`
- Build command: `npm install`
- Start command: `npm start`
- Health check: `/api/health`

Set these environment variables in Render:

| Variable | Value |
|---|---|
| `PORT` | `10000` |
| `NODE_ENV` | `production` |
| `MONGODB_URI` | Atlas production SRV URI |
| `JWT_SECRET` | Long random secret |
| `JWT_EXPIRES_IN` | `7d` |
| `CLIENT_URL` | Exact Vercel client URL, including `https://` |
| `GEMINI_API_KEY` | Google Gemini API key (from https://aistudio.google.com/apikey) |
| `GEMINI_CHAT_MODEL` | `gemini-1.5-flash` |
| `GEMINI_EMBEDDING_MODEL` | `text-embedding-004` |
| `NEWS_API_KEY` | News API key |
| `NEWS_JOB_ENABLED` | `true` for scheduled news ingestion |
| `GEMINI_DAILY_CALL_LIMIT` | Daily per-user cap, for example `20` |
| `GEMINI_TIMEOUT_MS` | AI request timeout in milliseconds, for example `30000` |

After deployment, open `https://<render-service>.onrender.com/api/health`. It must return the JSON health response.

## 4. Deploy the client to Vercel

1. Import the repository into Vercel.
2. Set **Root Directory** to `client/`.
3. Use the Vite defaults:
   - Build command: `npm run build`
   - Output directory: `dist`
4. Add this environment variable:

| Variable | Value |
|---|---|
| `VITE_API_URL` | `https://<render-service>.onrender.com/api` |

The client uses `VITE_API_URL` for its single Axios API client. Redeploy after changing it. The checked-in [vercel.json](./client/vercel.json) rewrites all routes to `index.html`, so React Router routes work after refresh.

## 5. Post-deploy checklist

1. Open the Vercel URL and register a demo account.
2. Log in, refresh the page, and confirm the session remains active.
3. Upload a text-based PDF and wait for `ready`.
4. Generate the summary and verify the structured sections.
5. Ask a document question and expand its citations.
6. Open **News**, filter by category, search, and open an original article.
7. Use **Explain with AI** on a news article and selected document text.
8. Open `/api/health` directly and confirm Render reports healthy.
9. Open an invalid frontend route and confirm the 404 page appears.
10. Log out and confirm protected routes redirect to `/login`.

## Demo/free-tier limits

- Render free web services sleep after inactivity. The first request after sleeping can be slow; wait for the service to wake before judging it unhealthy.
- Uploaded PDFs are held in Multer memory storage and are not written to disk. Files are limited to 15 MB and are lost after processing.
- The server does not depend on persistent local uploads. Store only database records and generated data in Atlas.
- Gemini usage is capped per user by `GEMINI_DAILY_CALL_LIMIT`; keep the value modest for a demo.
- News ingestion is controlled by `NEWS_JOB_ENABLED` and the scheduled job. Set it to `false` when you do not want scheduled API/LLM usage.
