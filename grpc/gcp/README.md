# Google Cloud Run Deployment

Use `cloudrun.yaml` to deploy the gRPC service to Cloud Run for Anthos or Cloud Run (fully managed) with gRPC enabled.

## Prerequisites

- gcloud CLI authenticated (`gcloud auth login`).
- Artifact Registry repository containing the container image.

## Deploy

```bash
gcloud run services replace cloudrun.yaml \
  --region=us-central1 \
  --project=estatewise-prod
```

Adjust `metadata.namespace`, `spec.template.spec.containers[0].image`, and resource sizing before applying.
