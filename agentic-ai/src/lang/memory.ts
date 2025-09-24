import { MemorySaver } from "@langchain/langgraph";

/**
 * Returns a checkpointer for LangGraph runs.
 * For production, swap to a persistent backend (Redis/Postgres/etc.).
 */
export function getCheckpointer() {
  return new MemorySaver();
}
