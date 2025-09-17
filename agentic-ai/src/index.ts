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

async function main() {
  const goal =
    process.argv.slice(2).join(" ") ||
    "Find similar homes near Chapel Hill with 3 beds and explain how 123456 and 654321 are related.";
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
