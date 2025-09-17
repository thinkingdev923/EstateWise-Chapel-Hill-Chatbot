import { Agent, AgentContext, AgentMessage } from "../core/types.js";
import { ToolClient } from "../mcp/ToolClient.js";

export class AgentOrchestrator {
  private agents: Agent[] = [];
  private toolClient = new ToolClient();

  register(...agents: Agent[]) {
    this.agents.push(...agents);
    return this;
  }

  async run(goal: string, rounds = 4): Promise<AgentMessage[]> {
    await this.toolClient.start();
    const history: AgentMessage[] = [];
    const ctx = ((): AgentContext => ({ goal, history }))();

    for (let i = 0; i < rounds; i++) {
      for (const agent of this.agents) {
        const msg = await agent.think(ctx);
        history.push(msg);

        // If the agent proposes a tool call, execute it via MCP
        const tool = (msg.data as any)?.tool;
        if (tool?.name) {
          try {
            const result = await this.toolClient.callTool(
              tool.name,
              tool.args || {},
            );
            const textBlock =
              result?.content?.find((c: any) => c.type === "text")?.text ||
              JSON.stringify(result);
            history.push({
              from: agent.role,
              content: `Tool ${tool.name} result`,
              data: { result, resultText: textBlock },
            });
          } catch (err: any) {
            history.push({
              from: agent.role,
              content: `Tool ${tool.name} error: ${err?.message || String(err)}`,
            });
          }
        }
      }
    }

    await this.toolClient.stop();
    return history;
  }
}
