# GCP Deployment Stack

![Google Cloud](https://img.shields.io/badge/Google_Cloud-Cloud-blue?logo=google-cloud) ![Cloud_Run](https://img.shields.io/badge/Cloud_Run-Serverless-blue?logo=google-cloud-run) ![Artifact_Registry](https://img.shields.io/badge/Artifact_Registry-Container_Registry-blue?logo=google-cloud) ![Cloud_Build](https://img.shields.io/badge/Cloud_Build-CI/CD-blue?logo=google-cloud)

This directory now provides an opinionated Google Cloud deployment for EstateWise built around Cloud Run, Artifact Registry, Cloud Build, and declarative infrastructure templates. For the full deployment matrix visit [DEPLOYMENTS.md](../DEPLOYMENTS.md).

## Components

| File | Purpose |
|------|---------|
| `cloudbuild.yaml` | CI/CD pipeline: installs dependencies, runs backend tests, builds/pushes the container, and deploys Cloud Run with secret + VPC integration. |
| `deployment/networking.yaml` | Custom VPC + Cloud NAT + Serverless VPC Access connector. |
| `deployment/service-account.yaml` | Cloud Run service account with logging/monitoring/Secret Manager permissions. |
| `deployment/cloudrun.yaml` | Cloud Run service definition (Gen2 runtime, VPC egress, secret mappings, resource limits). |
| `deployment/storage-bucket.yaml` | Asset bucket with versioning, uniform access, and CORS baseline. |

## Provisioning Workflow

1. **Create infra** (using Deployment Manager or `gcloud deployment-manager`):
   ```bash
   gcloud deployment-manager deployments create estatewise-network --config deployment/networking.yaml
   gcloud deployment-manager deployments create estatewise-service-account --config deployment/service-account.yaml
   gcloud deployment-manager deployments create estatewise-cloudrun --config deployment/cloudrun.yaml
   gcloud deployment-manager deployments create estatewise-bucket --config deployment/storage-bucket.yaml
   ```

2. **Configure secrets** (once per project):
   ```bash
   gcloud secrets create MONGO_URI --data-file=-
   gcloud secrets versions add MONGO_URI --data-file=mongo-uri.txt
   # repeat for PINECONE_API_KEY, GOOGLE_AI_API_KEY, JWT_SECRET
   ```

3. **Run Cloud Build** (adjust `_SERVICE_ACCOUNT` if you renamed the Cloud Run identity):
   ```bash
   gcloud builds submit --config cloudbuild.yaml --substitutions=_REGION=us-east1,_SERVICE_ACCOUNT=estatewise-run@$GOOGLE_CLOUD_PROJECT.iam.gserviceaccount.com
   ```

Prefer a single command? Use the helper script:

```bash
./deploy.sh --project $GOOGLE_CLOUD_PROJECT --region us-east1 --service-account estatewise-run@$GOOGLE_CLOUD_PROJECT.iam.gserviceaccount.com
```

Cloud Build pushes the image to Artifact Registry (`us-east1-docker.pkg.dev/$PROJECT_ID/estatewise/backend`) and performs an in-place Cloud Run deploy with the latest secret versions.

## Runtime Configuration

- CPU throttling disabled (ideal for low-latency requests)
- Min/max instances: 1 ↦ 20
- VPC Access connector for outbound (DocumentDB, etc.)
- Secrets pulled at runtime via `--set-secrets` / secretKeyRef
- `PINECONE_INDEX=estatewise-index` defined as plain env var

## Logging & Monitoring

The Cloud Run service account is granted `roles/logging.logWriter` and `roles/monitoring.metricWriter`; Cloud Run emits logs to Cloud Logging by default. Use Cloud Trace/Profiler by attaching additional agents if required.

## Frontend / CDN

Use the `storage-bucket.yaml` bucket for static assets or map tiles. The bucket is versioned and locked down with uniform access. Configure Cloud CDN or Firebase Hosting separately if serving the frontend via GCP.
