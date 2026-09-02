# Test Automation Skill

## Purpose

Transform approved test cases into a small, maintainable Cypress JavaScript regression suite.

## Inputs

- Approved plan from `specs/`
- Approved Markdown plan under `specs/`, including its Automation Handoff
- Exploratory selector inventory and POM map in the plan
- Existing Cypress page objects, helpers and configuration

## Rules

- Automate only cases traceable to an approved test case.
- Prefer user-observable roles, labels and text over implementation-specific selectors.
- Reuse existing fixtures and page objects; do not duplicate setup.
- Before writing, map the feature to existing POMs, helpers and specs. Extend the existing functional area when it matches.
- Keep selectors and UI mechanics inside POMs; keep specs focused on business intent and assertions.
- Do not use Playwright MCP again during Automation when the exploration handoff contains the selector inventory.
- Keep tests independent and reproducible.
- Validate generated TypeScript before execution.
- Do not turn a failed test into an application defect without Result Analysis evidence.

## Output

Produce clean Cypress JavaScript tests under `cypress/e2e/<feature>/`, reusing or extending existing page objects and support helpers. Unsupported or uncertain cases remain documented in the plan with a reason.
