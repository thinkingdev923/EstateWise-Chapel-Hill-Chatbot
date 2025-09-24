#!/usr/bin/env python3
"""
CrewAI runner for EstateWise Agentic AI.

Reads a JSON payload from stdin: { "goal": "..." }
Runs a simple crew with planner, analysts, and reporter.
Prints a JSON object to stdout: { "ok": true, "result": "...", "artifacts": {...} }

Requires: Python 3.10+, crewai, langchain, langchain-openai
"""
import json
import os
import sys
from typing import Any, Dict


def _read_json_stdin() -> Dict[str, Any]:
    data = sys.stdin.read()
    try:
        return json.loads(data or '{}')
    except Exception:
        return {}


def _safe_print_json(obj: Dict[str, Any]):
    sys.stdout.write(json.dumps(obj, ensure_ascii=False))
    sys.stdout.flush()


def _run_crewai(goal: str) -> Dict[str, Any]:
    try:
        from crewai import Agent, Task, Crew, Process
        # Prefer langchain-openai for model wrapper
        try:
            from langchain_openai import ChatOpenAI
        except Exception as e:  # pragma: no cover
            return {"ok": False, "error": f"Missing langchain_openai: {e}"}

        openai_key = os.environ.get('OPENAI_API_KEY')
        if not openai_key:
            return {"ok": False, "error": "OPENAI_API_KEY is required for CrewAI runtime"}

        model = os.environ.get('OPENAI_MODEL', 'gpt-4o-mini')
        llm = ChatOpenAI(model=model, temperature=0.2)

        # Define agents
        planner = Agent(
            role="Planner",
            goal="Draft a concise, actionable plan to satisfy the real-estate research goal.",
            backstory=(
                "You break goals into concrete steps (search, lookup, analyze, graph, map, finance)."
                " You prioritize tool-grounded outputs and avoid speculation."
            ),
            llm=llm,
            allow_delegation=False,
            verbose=False,
        )

        analyst = Agent(
            role="Property Analyst",
            goal="Search and summarize matching properties; extract important attributes.",
            backstory="You synthesize results and produce short JSON-like summaries when possible.",
            llm=llm,
            allow_delegation=False,
            verbose=False,
        )

        graphie = Agent(
            role="Graph Analyst",
            goal="Explain relationships and similarities among properties; propose Cypher queries if needed.",
            backstory="You think in terms of ZPIDs, neighborhoods, and similarity edges.",
            llm=llm,
            allow_delegation=False,
            verbose=False,
        )

        financier = Agent(
            role="Finance Analyst",
            goal="Estimate mortgage payments and affordability; keep calculations clear and conservative.",
            backstory="You output rounded, labeled numbers and assumptions.",
            llm=llm,
            allow_delegation=False,
            verbose=False,
        )

        reporter = Agent(
            role="Reporter",
            goal="Compose a concise final answer with key bullets and links.",
            backstory="You cite tool-derived facts and avoid fluff.",
            llm=llm,
            allow_delegation=False,
            verbose=False,
        )

        # Define tasks
        t_plan = Task(
            description=f"Plan steps for: {goal} — Include search, analysis, graph insights, map link, and finance.",
            agent=planner,
            expected_output="A 4-8 step plan with brief rationale.",
        )
        t_search = Task(
            description=(
                "Identify candidate properties matching the goal. Include reasoned filters (beds/baths/price/city/ZIP)."
                " Output top considerations in concise JSON bullets."
            ),
            agent=analyst,
            expected_output="A short JSON-like list of candidates and filters.",
        )
        t_graph = Task(
            description=(
                "Explain relationships between any specified ZPIDs (or inferred top candidates)."
                " Propose Cypher or features that justify similarities."
            ),
            agent=graphie,
            expected_output="1-3 bullets explaining relationships and a sample Cypher if useful.",
        )
        t_fin = Task(
            description=(
                "Estimate mortgage payment and affordability given any price/rate context in the goal."
                " Provide clear numbers and assumptions."
            ),
            agent=financier,
            expected_output="Monthly payment estimate and brief assumptions.",
        )
        t_report = Task(
            description="Create the final user-facing answer; be concise, factual, and include a map link placeholder.",
            agent=reporter,
            expected_output="A short, polished answer with bullets and a 'View on Map' placeholder.",
        )

        crew = Crew(
            agents=[planner, analyst, graphie, financier, reporter],
            tasks=[t_plan, t_search, t_graph, t_fin, t_report],
            process=Process.sequential,
            verbose=False,
        )
        result = crew.kickoff()

        return {
            "ok": True,
            "result": str(result),
            "artifacts": {
                "plan": getattr(t_plan, 'output', None),
                "search": getattr(t_search, 'output', None),
                "graph": getattr(t_graph, 'output', None),
                "finance": getattr(t_fin, 'output', None),
            },
        }
    except Exception as e:
        return {"ok": False, "error": f"CrewAI runtime error: {e}"}


def main():
    payload = _read_json_stdin()
    goal = payload.get('goal') or ''
    if not goal:
        _safe_print_json({"ok": False, "error": "Missing goal"})
        return
    res = _run_crewai(goal)
    _safe_print_json(res)


if __name__ == '__main__':
    main()

