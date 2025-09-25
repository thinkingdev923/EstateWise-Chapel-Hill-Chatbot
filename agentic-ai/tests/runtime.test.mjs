import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { __langTestUtils } from "../dist/lang/graph.js";
import { __crewTestUtils } from "../dist/crewai/CrewRunner.js";

describe("LangGraph prompt utilities", () => {
  it("formats context and instructions", () => {
    const context = { location: "Chapel Hill", budget: { max: 850000 } };
    const prompt = __langTestUtils.buildSystemPrompt(
      "Base",
      context,
      "Focus on schools",
    );
    assert.match(prompt, /Base/);
    assert.match(prompt, /Context:/);
    assert.match(prompt, /location/);
    assert.match(prompt, /Focus on schools/);
  });

  it("serializes plain string context", () => {
    const text = __langTestUtils.serializeContext("Consider recent comps");
    assert.equal(text, "Consider recent comps");
  });
});

describe("CrewAI payload helpers", () => {
  it("builds payload with include defaults and filters empty", () => {
    const payload = __crewTestUtils.buildPayload("Find homes", {
      includeFinance: false,
      hints: ["prefer single-story"],
    });
    assert.equal(payload.goal, "Find homes");
    assert.deepEqual(payload.include, {
      planner: true,
      analysis: true,
      graph: true,
      finance: false,
      reporter: true,
    });
    assert.deepEqual(payload.hints, ["prefer single-story"]);
    assert.ok(!("context" in payload));
  });

  it("extracts structured timeline", () => {
    const json = {
      ok: true,
      summary: "Final report",
      sections: { report: "Report text" },
      timeline: [
        { agent: "Planner", task: "plan", output: "Plan output" },
        { agent: "Reporter", task: "report", output: "Report text" },
      ],
      artifacts: { report: "Report text" },
      metadata: { include: { planner: true } },
    };
    const structured = __crewTestUtils.extractStructured(json);
    assert.ok(structured);
    assert.equal(structured.summary, "Final report");
    assert.equal(structured.report, "Report text");
    assert.equal(structured.timeline.length, 2);
    assert.equal(structured.timeline[0].agent, "Planner");
  });
});
