# Codex QA Orchestrator

Codex is the primary AI interface for this repository. Start every QA run from
one feature definition under `config/`, for example:

```text
config/plp-feature.yaml
```

Follow this path in order:

1. Read `AGENTS.md`, the feature YAML, `knowledge/` and the relevant skills.
2. Use the `playwright_test_planner` agent to explore the SUT and save
   `specs/<feature>.md`.
   The plan must include an `Automation Handoff` section with a selector
   inventory, POM/helper reuse map, related existing specs and expected UI
   states. Close the browser after saving the handoff.
3. Stop and ask the human: `Test Plan ready. Reply approved or not approved.`
4. Continue only on the exact reply `approved` or `aprobado`; revise and ask again on
   `not approved`.
5. Treat the approved Markdown plan as the test-case contract. It must cover
   happy paths, negative cases and relevant boundaries.
6. Before generating, inspect `pages/`, `helpers/` and existing feature specs.
   Extend related POMs/specs instead of duplicating them. Use the selector
   inventory from the approved plan; do not rediscover selectors with MCP.
   Keep raw locators inside POMs and keep specs clean.
7. Use `playwright_test_generator` to create tests under `tests/<feature>/`.
8. Execute the tests with Playwright. They must run later with `npm test`
   without Codex.
9. On a failure, immediately use `playwright_test_healer`, preserving the
   report, trace, screenshots and the original assertion intent.

Do not revive the deleted local orchestrator, scripts, contracts or feature
test generators. The only persistent test artifacts are the approved Markdown
plan and the Playwright tests.
