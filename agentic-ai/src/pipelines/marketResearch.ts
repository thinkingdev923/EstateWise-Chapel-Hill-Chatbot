import { AgentOrchestrator } from '../orchestrator/AgentOrchestrator.js';
import { PlannerAgent } from '../agents/PlannerAgent.js';
import { PropertyAnalystAgent } from '../agents/PropertyAnalystAgent.js';
import { GraphAnalystAgent } from '../agents/GraphAnalystAgent.js';
import { MapAnalystAgent } from '../agents/MapAnalystAgent.js';
import { FinanceAnalystAgent } from '../agents/FinanceAnalystAgent.js';
import { ReporterAgent } from '../agents/ReporterAgent.js';

export async function runMarketResearch(goal: string) {
  const orchestrator = new AgentOrchestrator().register(
    new PlannerAgent(),
    new PropertyAnalystAgent(),
    new GraphAnalystAgent(),
    new MapAnalystAgent(),
    new FinanceAnalystAgent(),
    new ReporterAgent(),
  );
  return await orchestrator.run(goal, 3);
}

