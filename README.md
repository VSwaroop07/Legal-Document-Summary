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

Document semantic search:

```text
GET http://localhost:5000/api/documents/:id/search?q=search+topic
Authorization: Bearer YOUR_JWT_TOKEN
```

Uploaded document chunks are embedded with the configured OpenAI embedding
model and searched through the Atlas Vector Search index
`chunk_vector_index`.
