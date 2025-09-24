import { AgentOrchestrator } from "../orchestrator/AgentOrchestrator.js";
import { PlannerAgent } from "../agents/PlannerAgent.js";
import { CoordinatorAgent } from "../agents/CoordinatorAgent.js";
import { PropertyAnalystAgent } from "../agents/PropertyAnalystAgent.js";
import { GraphAnalystAgent } from "../agents/GraphAnalystAgent.js";
import { MapAnalystAgent } from "../agents/MapAnalystAgent.js";
import { FinanceAnalystAgent } from "../agents/FinanceAnalystAgent.js";
import { ReporterAgent } from "../agents/ReporterAgent.js";
import { DedupeRankingAgent } from "../agents/DedupeRankingAgent.js";
import { ComplianceAgent } from "../agents/ComplianceAgent.js";
import { ZpidFinderAgent } from "../agents/ZpidFinderAgent.js";
import { AnalyticsAnalystAgent } from "../agents/AnalyticsAnalystAgent.js";

/** Run the default orchestrator pipeline for a single goal. */
export async function runMarketResearch(goal: string) {
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
  return await orchestrator.run(goal, 5);
}
