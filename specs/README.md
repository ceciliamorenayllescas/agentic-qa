# Playwright Agent Loop

The project is driven from `config/<feature>.yaml` by Codex. The orchestration
instructions are in `CODEX_ORCHESTRATOR.md` and the agent definitions are in
`.codex/agents/`.

Required path:

```text
feature config -> Codex orchestrator -> playwright_test_planner -> specs/<feature>.md
-> human replies approved / not approved -> test cases in the approved plan
-> exploratory testing -> playwright-test-generator -> tests/<feature>/
-> Playwright execution -> playwright-test-healer when a test fails
```

The approved Markdown plan is the only test-plan and test-case contract. It
must cover happy paths, negative cases and relevant boundaries. Automated tests
remain runnable with `npm test` without Codex.

Keep feature suites organized under `tests/<feature>/` and plans under
`specs/<feature>.md`. Do not add parallel local orchestrators, test-design
workers or JSON/YAML contracts.
