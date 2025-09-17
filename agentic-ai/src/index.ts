import { PlannerAgent } from './agents/PlannerAgent.js';
import { GraphAnalystAgent } from './agents/GraphAnalystAgent.js';
import { PropertyAnalystAgent } from './agents/PropertyAnalystAgent.js';
import { MapAnalystAgent } from './agents/MapAnalystAgent.js';
import { ReporterAgent } from './agents/ReporterAgent.js';
import { AgentOrchestrator } from './orchestrator/AgentOrchestrator.js';

async function main() {
  const goal = process.argv.slice(2).join(' ') || 'Find similar homes near Chapel Hill with 3 beds and explain how 123456 and 654321 are related.';
  const orchestrator = new AgentOrchestrator().register(
    new PlannerAgent(),
    new PropertyAnalystAgent(),
    new GraphAnalystAgent(),
    new MapAnalystAgent(),
    new ReporterAgent(),
  );

  const history = await orchestrator.run(goal, 3);
  // eslint-disable-next-line no-console
  console.log('\n=== Agentic AI Run Complete ===');
  for (const m of history) {
    console.log(`[${m.from}] ${m.content}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

