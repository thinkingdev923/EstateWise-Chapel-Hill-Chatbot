import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { mcpToolset, startMcp, stopMcp } from './tools.js';
import { getChatModel } from './llm.js';
import { getCheckpointer } from './memory.js';

export type RunInput = {
  input: string;
  threadId?: string;
};

/** Construct a LangGraph ReAct agent wired with EstateWise tools and memory. */
export function createEstateWiseAgentGraph() {
  const llm = getChatModel();
  const tools = mcpToolset();
  const checkpointer = getCheckpointer();

  const systemPrompt = `
You are EstateWise, a real-estate research and analysis agent.
Use tools to:
- search/lookup properties (by query or zpid),
- analyze and group results, build map links,
- query the Neo4j knowledge graph (explanations, similarities, Cypher QA),
- do mortgage/affordability calculations,
- use vector search for semantic matches.

Guidelines:
- Prefer precise, factual answers sourced via tools.
- Keep responses concise; include links (map) and key figures.
- If you need specific zpids but only have text, search first; then refine.
- Always sanity-check tool outputs. If a tool fails, try an alternative path.
`;

  const app = createReactAgent({ llm, tools, messageModifier: systemPrompt, checkpointer });
  return { app, tools, checkpointer };
}

/**
 * Run a single LangGraph agent turn with MCP tools started around the call.
 */
export async function runEstateWiseAgent({ input, threadId }: RunInput) {
  await startMcp();
  try {
    const { app } = createEstateWiseAgentGraph();
    const config = { configurable: { thread_id: threadId || 'default' } } as any;
    const result = await app.invoke({ messages: [{ role: 'user', content: input }] }, config);
    return result;
  } finally {
    await stopMcp();
  }
}
