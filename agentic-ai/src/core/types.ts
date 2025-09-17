export type Role = 'planner' | 'graph-analyst' | 'property-analyst' | 'map-analyst' | 'reporter';

export interface AgentMessage {
  from: Role;
  to?: Role | 'all';
  content: string;
  data?: unknown;
}

export interface ToolCall {
  name: string;
  args: Record<string, unknown>;
}

export interface PlanStep {
  description: string;
  tool?: ToolCall;
  next?: PlanStep[];
}

export interface Plan {
  goal: string;
  steps: PlanStep[];
}

export interface AgentContext {
  goal: string;
  history: AgentMessage[];
}

export interface Agent {
  role: Role;
  think(ctx: AgentContext): Promise<AgentMessage>;
}

