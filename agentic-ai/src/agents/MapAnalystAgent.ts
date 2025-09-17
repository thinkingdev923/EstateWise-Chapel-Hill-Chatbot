import { Agent, AgentContext, AgentMessage } from '../core/types.js';

export class MapAnalystAgent implements Agent {
  role: 'map-analyst' = 'map-analyst';

  async think(ctx: AgentContext): Promise<AgentMessage> {
    // Try to build a map link from any ZPIDs mentioned in history.
    const text = ctx.history.map((m) => m.content).join('\n');
    const match = [...text.matchAll(/\b(\d{5,})\b/g)].map((m) => m[1]);
    const ids = Array.from(new Set(match)).slice(0, 50);
    if (ids.length) {
      return {
        from: this.role,
        content: 'Building map link for mentioned ZPIDs',
        data: { tool: { name: 'map.linkForZpids', args: { ids } } },
      };
    }
    // Fallback: build query-based map link
    return {
      from: this.role,
      content: 'Building map link from goal query',
      data: { tool: { name: 'map.buildLinkByQuery', args: { q: ctx.goal } } },
    };
  }
}

