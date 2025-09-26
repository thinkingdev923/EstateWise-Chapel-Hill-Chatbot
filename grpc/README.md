# EstateWise gRPC Market Pulse Service

This package exposes EstateWise market intelligence via a high-performance gRPC interface tailored for partner integrations, data science workloads, and forthcoming marketplace features. The service mirrors the Market Pulse scoring logic available in the web client while remaining fully standalone — no wiring into the existing backend or frontend is required.

## Features

- **GetSnapshot**: Unary RPC returning curated demand, inventory, pricing, and risk metrics for the best matching metro.
- **StreamHotZips**: Server-streaming RPC that emits ZIP code opportunities filtered by rent yield.
- **ListMarkets**: Lightweight lookup across curated metros and their aliases.
- **Fallback awareness**: Responses clearly indicate when a requested metro falls back to the nearest curated dataset.
- **Deployment ready**: Dockerfile, docker-compose, CI pipeline, and cloud templates for AWS ECS, Azure Container Apps, and Google Cloud Run.

## Project structure

```
grpc/
├── proto/market_pulse.proto      # gRPC contract used by server & clients
├── src/                          # TypeScript source
│   ├── config/                   # Environment loading
│   ├── data/                     # Curated metro datasets
│   ├── services/                 # Business logic & gRPC handlers
│   └── utils/                    # Shared helpers
├── Dockerfile                    # Multi-stage production image
├── Jenkinsfile                   # CI pipeline blueprint
├── aws | azure | gcp             # Deployment templates per cloud
└── README.md                     # (this file)
```

## Getting started

```bash
cd grpc
npm install
npm run dev        # Starts the service with ts-node-dev on :50051

# In another terminal, test the service using grpcurl
grpcurl -plaintext -d '{"query":"Austin, TX"}' localhost:50051 estatewise.marketpulse.MarketPulseService/GetSnapshot
```

## Scripts

- `npm run lint` – ESLint with TypeScript rules.
- `npm test` – Vitest unit tests covering dataset resolution and scoring heuristics.
- `npm run build` – Compiles TypeScript into `dist/`.
- `npm run proto:check` – Runs `buf lint` against the proto definition.

## Configuration

Environment variables (optional, defaults shown):

| Variable    | Default  | Description                          |
|-------------|----------|--------------------------------------|
| `GRPC_HOST` | 0.0.0.0  | Bind address for the gRPC server.    |
| `GRPC_PORT` | 50051    | gRPC listen port.                    |
| `LOG_LEVEL` | info     | Pino log level.                      |

Add a `.env` file in the `grpc/` directory to override values locally.

## Deployment

- **Docker**: `docker build -t estatewise/market-pulse-grpc . && docker run -p 50051:50051 estatewise/market-pulse-grpc`
- **AWS ECS**: see `aws/README.md` and `aws/ecs-task-definition.json`.
- **Azure Container Apps**: see `azure/README.md` and `azure/container-app.bicep`.
- **Google Cloud Run**: see `gcp/README.md` and `gcp/cloudrun.yaml`.

## CI/CD

`grpc/Jenkinsfile` defines a pipeline with `npm ci`, lint/test, TypeScript compilation, and optional Docker image creation for the main branch. Wire this into an existing Jenkins multi-branch setup without altering the primary application pipeline.

## Roadmap ideas

- Add client SDK generation (TypeScript, Go, Python) using `buf` plugins.
- Publish histogram snapshots to BigQuery or S3 for offline analytics.
- Integrate authentication once the downstream consumers are defined.

For questions or integration requests, create an issue referencing the `grpc` package.
