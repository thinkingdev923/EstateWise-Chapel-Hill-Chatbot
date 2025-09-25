# MCP Server on Google Cloud Run

Deploy the MCP stdio server as a Cloud Run revision. It is typically invoked by another container (Agentic AI) using `gcloud run services proxy` or `exec` to attach STDIN/STDOUT.

## Deploy

```
gcloud deployment-manager deployments create estatewise-mcp \
  --config mcp/gcp/cloudrun.yaml \
  --properties \"region=us-east1,image=us-east1-docker.pkg.dev/$PROJECT_ID/estatewise/mcp:latest,serviceAccount=estatewise-run@$PROJECT_ID.iam.gserviceaccount.com,apiBaseUrl=https://estatewise-backend.vercel.app,frontendBaseUrl=https://estatewise.vercel.app,cacheTtlMs=30000,cacheMax=200\"
```

Adjust `cacheTtlMs`/`cacheMax` to tune caching behavior. Scale limits via `gcloud run services update estatewise-mcp --max-instances 5`.

## Usage Pattern

Since MCP relies on stdio, pair this service with a client that forwards STDIN/STDOUT over a secure channel (e.g., Cloud Run job, Cloud Functions, or a sidecar container). Alternatively use Cloud Run’s `gcloud run services proxy` to tunnel traffic when testing locally.

Logs and metrics are available via Cloud Logging and Cloud Monitoring.
