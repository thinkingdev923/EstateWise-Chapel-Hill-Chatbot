import { MemorySaver } from '@langchain/langgraph';

// For production, swap to a persistent checkpointer (e.g., Redis/Postgres).
export function getCheckpointer() {
  // Placeholder for future pluggable backends
  return new MemorySaver();
}

