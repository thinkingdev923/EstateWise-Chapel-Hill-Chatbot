#!/usr/bin/env bash

set -euo pipefail

PAYLOAD='{"query":"Austin, TX"}'

grpcurl -plaintext -d "$PAYLOAD" "${GRPC_ENDPOINT:-localhost:50051}" estatewise.marketpulse.MarketPulseService/GetSnapshot
