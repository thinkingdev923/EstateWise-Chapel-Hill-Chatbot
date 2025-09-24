import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

export interface CrewRunResult {
  ok: boolean;
  output?: string;
  json?: unknown;
  error?: string;
}

/**
 * Run the Python CrewAI runner with a goal and return a structured result.
 */
export async function runCrewAIGoal(
  goal: string,
  opts?: { python?: string; cwd?: string; timeoutMs?: number },
) {
  const python = opts?.python || process.env.PYTHON_BIN || "python3";
  const here = path.dirname(fileURLToPath(import.meta.url));
  const cwd = opts?.cwd || path.resolve(here, "../../crewai");
  const script = path.join(cwd, "runner.py");
  const env = { ...process.env };
  return await runPythonJson(
    python,
    script,
    { goal },
    { cwd, env, timeoutMs: opts?.timeoutMs ?? 180_000 },
  );
}

/** Spawn a Python script with a JSON payload and parse its JSON stdout. */
function runPythonJson(
  python: string,
  scriptPath: string,
  payload: unknown,
  opts: { cwd?: string; env?: NodeJS.ProcessEnv; timeoutMs?: number },
): Promise<CrewRunResult> {
  return new Promise((resolve) => {
    const child = spawn(python, [scriptPath], {
      cwd: opts.cwd,
      env: opts.env,
      stdio: ["pipe", "pipe", "pipe"],
    });
    const timer = opts.timeoutMs
      ? setTimeout(() => child.kill("SIGKILL"), opts.timeoutMs)
      : null;
    let out = "";
    let err = "";
    child.stdout.on("data", (d) => (out += d.toString())).once("end", () => {});
    child.stderr.on("data", (d) => (err += d.toString())).once("end", () => {});
    child.once("error", (e) => {
      if (timer) clearTimeout(timer);
      resolve({ ok: false, error: String(e) });
    });
    child.once("close", () => {
      if (timer) clearTimeout(timer);
      const trimmed = out.trim();
      try {
        const json = JSON.parse(trimmed);
        resolve({ ok: true, json, output: trimmed });
      } catch {
        resolve({
          ok: err.length === 0,
          output: trimmed,
          error: err || undefined,
        });
      }
    });
    child.stdin.write(JSON.stringify(payload));
    child.stdin.end();
  });
}
