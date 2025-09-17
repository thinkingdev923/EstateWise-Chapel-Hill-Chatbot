import { Agent, AgentContext, AgentMessage } from "../core/types.js";

export class ReporterAgent implements Agent {
  role: "reporter" = "reporter";

  async think(ctx: AgentContext): Promise<AgentMessage> {
    const toolOutputs = ctx.history
      .filter((m) => (m.data as any)?.result)
      .map(
        (m) =>
          (m.data as any).resultText || JSON.stringify((m.data as any).result),
      );

    const summary = [
      `Goal: ${ctx.goal}`,
      "Findings:",
      ...toolOutputs.map(
        (t, i) => `  ${i + 1}. ${t.slice(0, 400)}${t.length > 400 ? "…" : ""}`,
      ),
      "Note: Links may reflect sample subsets. Always verify details.",
    ].join("\n");

    return { from: this.role, content: summary };
  }
}
