import type {
  ServerUnaryCall,
  sendUnaryData,
  ServerWritableStream,
  ServiceError,
} from "@grpc/grpc-js";
import { status } from "@grpc/grpc-js";
import type { Logger } from "pino";
import { z } from "zod";

import { buildScorecard } from "../utils/scoring";
import { listDatasets, resolveDataset } from "./datasetResolver";
import type { HotZip } from "../types";

const snapshotInput = z.object({
  query: z.string().trim().min(2, "query must be at least 2 characters"),
});
const listMarketsInput = z.object({ search: z.string().optional() });
const hotZipInput = z.object({
  query: z.string().trim().min(2, "query must be at least 2 characters"),
  minRentYield: z.number().optional().default(0),
});

type SnapshotRequest = { query?: string };
type HotZipRequest = { query?: string; minRentYield?: number };
type ListMarketsRequest = { search?: string };

export function createMarketPulseHandlers(logger: Logger): MarketPulseHandlers {
  return {
    GetSnapshot(
      call: ServerUnaryCall<SnapshotRequest, unknown>,
      callback: sendUnaryData<unknown>,
    ) {
      const parsed = snapshotInput.safeParse({
        query: call.request.query ?? "",
      });
      if (!parsed.success) {
        callback(
          invalidArgument(
            parsed.error.errors.map((issue) => issue.message).join("; "),
          ),
          null,
        );
        return;
      }

      const { dataset, fallbackNotice } = resolveDataset(parsed.data.query);
      const scorecard = buildScorecard(dataset);
      const [latest] = dataset.timeline.slice(-1);

      const response = {
        metadata: {
          datasetId: dataset.id,
          datasetVersion: dataset.datasetVersion,
          marketLabel: dataset.name,
          summary: dataset.summary,
          metrics: dataset.metrics,
          latestDemandIndex: latest?.demandIndex ?? 0,
          fallbackNotice,
        },
        scorecard,
        timeline: dataset.timeline.map((point, index, arr) => {
          const prior = arr[index - 1] ?? point;
          return {
            month: point.month,
            demandIndex: point.demandIndex,
            absorptionRate: point.absorptionRate,
            delta: Number(
              (point.absorptionRate - prior.absorptionRate).toFixed(2),
            ),
          };
        }),
        topZips: dataset.topZips,
        opportunities: dataset.opportunities.map((text) => ({ text })),
        risks: dataset.risks.map((text) => ({ text })),
        actions: dataset.actions,
      };

      logger.debug(
        { query: parsed.data.query, dataset: dataset.id },
        "getSnapshot served",
      );
      callback(null, response);
    },

    StreamHotZips(stream: ServerWritableStream<HotZipRequest, HotZip>) {
      const parsed = hotZipInput.safeParse({
        query: stream.request.query ?? "",
        minRentYield: stream.request.minRentYield ?? 0,
      });

      if (!parsed.success) {
        stream.emit(
          "error",
          invalidArgument(
            parsed.error.errors.map((issue) => issue.message).join("; "),
          ),
        );
        stream.end();
        return;
      }

      const { dataset } = resolveDataset(parsed.data.query);
      const filtered = dataset.topZips
        .filter((zip) => zip.rentYield >= parsed.data.minRentYield)
        .sort((a, b) => b.rentYield - a.rentYield || b.yoy - a.yoy);

      filtered.forEach((zip) => {
        stream.write(zip);
      });

      stream.end();
    },

    ListMarkets(
      call: ServerUnaryCall<ListMarketsRequest, unknown>,
      callback: sendUnaryData<unknown>,
    ) {
      const parsed = listMarketsInput.safeParse({
        search: call.request.search ?? "",
      });
      if (!parsed.success) {
        callback(
          invalidArgument(
            parsed.error.errors.map((issue) => issue.message).join("; "),
          ),
          null,
        );
        return;
      }

      const datasets = listDatasets(parsed.data.search);
      const response = {
        markets: datasets.map((dataset) => ({
          datasetId: dataset.id,
          marketLabel: dataset.name,
          aliases: dataset.aliases,
        })),
      };

      callback(null, response);
    },
  };
}

type MarketPulseHandlers = {
  GetSnapshot: (
    call: ServerUnaryCall<SnapshotRequest, unknown>,
    callback: sendUnaryData<unknown>,
  ) => void;
  StreamHotZips: (stream: ServerWritableStream<HotZipRequest, HotZip>) => void;
  ListMarkets: (
    call: ServerUnaryCall<ListMarketsRequest, unknown>,
    callback: sendUnaryData<unknown>,
  ) => void;
};

function invalidArgument(details: string): ServiceError {
  const error = new Error(details) as ServiceError;
  error.code = status.INVALID_ARGUMENT;
  return error;
}
