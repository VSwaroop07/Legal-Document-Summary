# AI-Based Legal Document Summarizer and Legal News Aggregation Platform

This monorepo contains the React client and Express server for the final-year engineering project.

## Development

Install dependencies in the root, client, and server directories. Copy
`server/.env.example` to `server/.env` and fill in all required values, then
run:

```bash
npm run dev
```

The client runs on the Vite development port and the API runs on `http://localhost:5000`.

Health check:

```text
GET http://localhost:5000/api/health
```
