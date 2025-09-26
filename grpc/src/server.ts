import path from "node:path";
import {
  Server,
  ServerCredentials,
  loadPackageDefinition,
} from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import pino from "pino";

import { env } from "./config/env";
import { createMarketPulseHandlers } from "./services/marketPulseService";

const logger = pino({ level: env.logLevel });

const protoPath = path.resolve(__dirname, "..", "proto", "market_pulse.proto");
const packageDefinition = protoLoader.loadSync(protoPath, {
  longs: Number,
  enums: String,
  defaults: true,
  arrays: true,
  keepCase: false,
});

const descriptor = loadPackageDefinition(
  packageDefinition,
) as unknown as ProtoGrpcType;

const server = new Server();

server.addService(
  descriptor.estatewise.marketpulse.MarketPulseService.service,
  createMarketPulseHandlers(logger.child({ module: "MarketPulseService" })),
);

server.bindAsync(
  `${env.host}:${env.port}`,
  ServerCredentials.createInsecure(),
  (err, port) => {
    if (err) {
      logger.error({ err }, "Failed to bind gRPC server");
      process.exitCode = 1;
      return;
    }

    server.start();
    logger.info({ port }, "EstateWise gRPC Market Pulse server is running");
  },
);

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

function shutdown(signal: NodeJS.Signals): void {
  logger.info({ signal }, "Received shutdown signal");
  server.tryShutdown((error) => {
    if (error) {
      logger.error({ error }, "Graceful shutdown failed, forcing exit");
      server.forceShutdown();
    }
    process.exit(0);
  });
}

type ProtoGrpcType = {
  estatewise: {
    marketpulse: {
      MarketPulseService: {
        service: Parameters<Server["addService"]>[0];
      };
    };
  };
};
