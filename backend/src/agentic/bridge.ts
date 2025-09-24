import { spawn } from "node:child_process";
import path from "node:path";

export type AgentRuntime = "orchestrator" | "langgraph" | "crewai";

export interface RunOptions {
  runtime?: AgentRuntime;
  cwd?: string;
  env?: NodeJS.ProcessEnv;
  timeoutMs?: number;
  preferBuild?: boolean; // if true, run dist/* entries; else try tsx sources
  pythonBin?: string; // for CrewAI runtime
}

export interface RunResult {
  ok: boolean;
  output: string;
  code?: number | null;
  error?: string;
}

function repoRootFromHere(): string {
  // backend/src/agentic -> repo root
  return path.resolve(__dirname, "../../..");
}

function collect(
  child: ReturnType<typeof spawn>,
  timeoutMs?: number,
): Promise<RunResult> {
  return new Promise((resolve) => {
    let out = "";
    let err = "";
    const timer = timeoutMs
      ? setTimeout(() => child.kill("SIGKILL"), timeoutMs)
      : null;
    child.stdout?.on("data", (d) => (out += d.toString()));
    child.stderr?.on("data", (d) => (err += d.toString()));
    child.once("close", (code) => {
      if (timer) clearTimeout(timer);
      resolve({
        ok: code === 0,
        output: out.trim(),
        code,
        error: err.trim() || undefined,
      });
    });
    child.once("error", (e) => {
      if (timer) clearTimeout(timer);
      resolve({ ok: false, output: out.trim(), error: String(e) });
    });
  });
}

/**
 * Run the agentic-ai CLI with the selected runtime.
 * - Orchestrator (default): no flags
 * - LangGraph: --langgraph
 * - CrewAI: --crewai (requires Python and OPENAI_API_KEY in the CrewAI venv)
 */
export async function runAgentGoal(
  goal: string,
  opts: RunOptions = {},
): Promise<RunResult> {
  const runtime: AgentRuntime = opts.runtime || "orchestrator";
  const root = repoRootFromHere();
  const agentDir = path.join(root, "agentic-ai");
  const env = { ...process.env, ...opts.env };

  const args: string[] = [];
  if (runtime === "langgraph") args.push("--langgraph");
  if (runtime === "crewai") args.push("--crewai");
  if (goal && goal.length) args.push(goal);

  // Prefer built files if present; otherwise fall back to tsx from sources
  const useBuild = opts.preferBuild ?? false;
  const nodeCmd = process.execPath;
  const runFromDist = () =>
    spawn(nodeCmd, ["dist/index.js", ...args], { cwd: agentDir, env });
  const runFromSrc = () =>
    spawn(nodeCmd, ["node_modules/.bin/tsx", "src/index.ts", ...args], {
      cwd: agentDir,
      env,
    });

  const child = useBuild ? runFromDist() : runFromSrc();
  return await collect(child, opts.timeoutMs ?? 180_000);
}

/**
 * List available MCP tools by delegating to the mcp client.
 * Requires `mcp` to be built (npm run build) or tsx available.
 */
export async function mcpListTools(
  opts: {
    parseJsonText?: boolean;
    preferBuild?: boolean;
    timeoutMs?: number;
  } = {},
) {
  const root = repoRootFromHere();
  const mcpDir = path.join(root, "mcp");
  const env = { ...process.env };
  const nodeCmd = process.execPath;
  const useBuild = opts.preferBuild ?? false;
  const child = useBuild
    ? spawn(nodeCmd, ["dist/client.js", "list"], { cwd: mcpDir, env })
    : spawn(nodeCmd, ["node_modules/.bin/tsx", "src/client.ts", "list"], {
        cwd: mcpDir,
        env,
      });
  return await collect(child, opts.timeoutMs ?? 60_000);
}

/**
 * Call an MCP tool via the provided name and JSON-serializable args.
 * If parseJsonText is true, the client will try to parse the returned text as JSON for readability.
 */
export async function mcpCallTool(
  name: string,
  args: Record<string, unknown> = {},
  opts: {
    parseJsonText?: boolean;
    preferBuild?: boolean;
    timeoutMs?: number;
  } = {},
) {
  const root = repoRootFromHere();
  const mcpDir = path.join(root, "mcp");
  const env = { ...process.env };
  const nodeCmd = process.execPath;
  const useBuild = opts.preferBuild ?? false;
  const parseFlag = opts.parseJsonText ? ["--parse"] : [];
  const argsJson = JSON.stringify(args);
  const child = useBuild
    ? spawn(nodeCmd, ["dist/client.js", "call", name, argsJson, ...parseFlag], {
        cwd: mcpDir,
        env,
      })
    : spawn(
        nodeCmd,
        [
          "node_modules/.bin/tsx",
          "src/client.ts",
          "call",
          name,
          argsJson,
          ...parseFlag,
        ],
        {
          cwd: mcpDir,
          env,
        },
      );
  return await collect(child, opts.timeoutMs ?? 120_000);
}

// Optional: tiny CLI for manual testing without integrating the main backend
if (require.main === module) {
  (async () => {
    const argv = process.argv.slice(2);
    const mode = argv[0];
    if (mode === "run") {
      const runtime = (argv
        .find((a) => a.startsWith("--runtime="))
        ?.split("=")[1] || "orchestrator") as AgentRuntime;
      const goal = argv
        .slice(1)
        .filter((a) => !a.startsWith("--runtime="))
        .join(" ");
      const res = await runAgentGoal(goal, { runtime });
      // eslint-disable-next-line no-console
      console.log(res.output || res.error || "");
    } else if (mode === "tools") {
      const res = await mcpListTools();
      // eslint-disable-next-line no-console
      console.log(res.output || res.error || "");
    } else if (mode === "call") {
      const name = argv[1];
      const json = argv[2] ? JSON.parse(argv[2]) : {};
      const res = await mcpCallTool(name, json, { parseJsonText: true });
      // eslint-disable-next-line no-console
      console.log(res.output || res.error || "");
    } else {
      // eslint-disable-next-line no-console
      console.log(
        "Usage: ts-node-dev src/agentic/bridge.ts run <goal> [--runtime=langgraph|crewai]",
      );
      // eslint-disable-next-line no-console
      console.log("       ts-node-dev src/agentic/bridge.ts tools");
      // eslint-disable-next-line no-console
      console.log(
        "       ts-node-dev src/agentic/bridge.ts call <tool> <json>",
      );
    }
  })();
}
