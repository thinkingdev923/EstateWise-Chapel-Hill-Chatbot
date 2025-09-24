import { PlannerAgent } from "./agents/PlannerAgent.js";
import { GraphAnalystAgent } from "./agents/GraphAnalystAgent.js";
import { PropertyAnalystAgent } from "./agents/PropertyAnalystAgent.js";
import { MapAnalystAgent } from "./agents/MapAnalystAgent.js";
import { ReporterAgent } from "./agents/ReporterAgent.js";
import { FinanceAnalystAgent } from "./agents/FinanceAnalystAgent.js";
import { ZpidFinderAgent } from "./agents/ZpidFinderAgent.js";
import { AnalyticsAnalystAgent } from "./agents/AnalyticsAnalystAgent.js";
import { CoordinatorAgent } from "./agents/CoordinatorAgent.js";
import { DedupeRankingAgent } from "./agents/DedupeRankingAgent.js";
import { ComplianceAgent } from "./agents/ComplianceAgent.js";
import { AgentOrchestrator } from "./orchestrator/AgentOrchestrator.js";
import { runEstateWiseAgent } from "./lang/graph.js";
import { runCrewAIGoal } from "./crewai/CrewRunner.js";

/**
 * Agentic AI CLI entrypoint.
 * - Default: round-based orchestrator across specialized agents.
 * - --langgraph or AGENT_RUNTIME=langgraph: run LangGraph ReAct agent.
 * - --crewai or AGENT_RUNTIME=crewai: run CrewAI Python flow.
 */

async function main() {
  const argv = process.argv.slice(2);
  const goal =
    argv.filter((a) => !a.startsWith("--")).join(" ") ||
    "Find similar homes near Chapel Hill with 3 beds and explain how 123456 and 654321 are related.";
  const runtimeFlag = argv.find(
    (a) => a === "--langgraph" || a === "--runtime=langgraph",
  );
  const crewFlag = argv.find(
    (a) => a === "--crewai" || a === "--runtime=crewai",
  );
  const threadId = process.env.THREAD_ID;

  if (runtimeFlag || process.env.AGENT_RUNTIME === "langgraph") {
    // LangGraph + LangChain runtime
    // eslint-disable-next-line no-console
    console.log("Using LangGraph runtime...\n");
    const result = await runEstateWiseAgent({ input: goal, threadId });
    const messages = (result as any)?.messages || [];
    for (const msg of messages) {
      const role = msg._getType ? msg._getType() : msg.role || "assistant";
      const content =
        typeof msg.content === "string"
          ? msg.content
          : JSON.stringify(msg.content);
      console.log(`[${role}] ${content}`);
    }
    console.log("\n=== LangGraph Run Complete ===");
    return;
  }

  if (crewFlag || process.env.AGENT_RUNTIME === "crewai") {
    console.log("Using CrewAI runtime...\n");
    const result = await runCrewAIGoal(goal);
    if (result.ok) {
      if (result.json) console.log(JSON.stringify(result.json, null, 2));
      else if (result.output) console.log(result.output);
    } else {
      console.error(result.error || "CrewAI run failed");
      process.exitCode = 1;
    }
    console.log("\n=== CrewAI Run Complete ===");
    return;
  }

  // Default: round-based orchestrator runtime
  const orchestrator = new AgentOrchestrator().register(
    new PlannerAgent(),
    new CoordinatorAgent(),
    new ZpidFinderAgent(),
    new PropertyAnalystAgent(),
    new AnalyticsAnalystAgent(),
    new GraphAnalystAgent(),
    new DedupeRankingAgent(),
    new MapAnalystAgent(),
    new FinanceAnalystAgent(),
    new ComplianceAgent(),
    new ReporterAgent(),
  );

  const history = await orchestrator.run(goal, 5);
  // eslint-disable-next-line no-console
  console.log("\n=== Agentic AI Run Complete ===");
  for (const m of history) {
    console.log(`[${m.from}] ${m.content}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
