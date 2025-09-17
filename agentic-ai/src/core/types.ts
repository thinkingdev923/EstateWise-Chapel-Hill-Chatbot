export type Role =
  | "planner"
  | "coordinator"
  | "graph-analyst"
  | "property-analyst"
  | "map-analyst"
  | "finance-analyst"
  | "zpid-finder"
  | "analytics-analyst"
  | "ranker-analyst"
  | "compliance-analyst"
  | "reporter";

export interface AgentMessage {
  from: Role;
  to?: Role | "all";
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
  key?: string;
  role?: Role;
  status?: "pending" | "running" | "done" | "skipped" | "error";
}

export interface Plan {
  goal: string;
  steps: PlanStep[];
}

export interface Blackboard {
  zpids: number[];
  rankedZpids?: number[];
  plan?: { steps: PlanStep[]; inFlightStepKey?: string };
  parsed?: {
    zpids?: number[];
    zipcode?: string | null;
    city?: string | null;
    state?: string | null;
    beds?: number | null;
    baths?: number | null;
    price?: number | null;
    apr?: number | null;
    years?: number | null;
  };
  analytics?: {
    summary?: Record<string, unknown> | null;
    groups?: Array<Record<string, unknown>> | null;
  };
  mapLink?: string | null;
  mortgage?: Record<string, unknown> | null;
  affordability?: Record<string, unknown> | null;
  pairs?: Array<Record<string, unknown>> | null;
  compliance?: { ok: boolean; issues: string[] } | null;
}

export interface AgentContext {
  goal: string;
  history: AgentMessage[];
  blackboard: Blackboard;
}

export interface Agent {
  role: Role;
  think(ctx: AgentContext): Promise<AgentMessage>;
}
