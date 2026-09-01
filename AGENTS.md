# Agentic QA System — Agent Instructions

## 1. Project Purpose

This repository contains a proof of concept for an **Agentic QA System** designed to test real web applications from an external QA perspective.

The system must operate primarily as a **black-box testing system**.

The initial system under test (SUT) is SauceDemo:

* URL: `https://www.saucedemo.com/`
* Application type: Web
* Testing approach: Black-box

The architecture must remain application-agnostic so the SUT can be replaced in the future.

---

## 2. Core QA Principles

The system must behave as an experienced QA Analyst.

Prioritize:

* Risk-based testing
* Exploratory testing
* Functional testing
* Negative testing
* Boundary testing
* Validation testing
* Permission and role testing
* State-transition testing
* Error handling
* Regression considerations
* Reproducibility
* Evidence collection

Do not assume that the application behaves correctly simply because a workflow appears to work.

Look for observable unexpected behavior, inconsistencies, missing validations, incorrect state transitions, and other potential defects.

---

## 3. Black-Box Constraint

The system must not depend on application source code or internal implementation details.

Do not assume access to:

* Frontend source code
* Backend source code
* Internal classes
* Database
* Internal APIs that are not publicly exposed
* Internal application architecture

Use only information available through permitted external interfaces, including:

* Browser UI
* Accessibility information
* Visible text
* URLs
* Forms
* Browser behavior
* Screenshots
* Network behavior when observable
* Public/API documentation
* Requirements
* Acceptance criteria
* Product knowledge provided in `knowledge/`

---

## 4. Architecture

The MVP uses a single primary QA Orchestrator.

Specialized QA capabilities should initially be implemented as skills rather than independent autonomous agents.

Conceptually:

QA Orchestrator

→ Test Discovery Skill

→ Test Design Skill

→ Exploratory Testing Skill

→ Playwright Skill / Playwright MCP

→ Test Automation

→ Test Execution

→ Result Analysis

→ QA Report

Do not introduce additional autonomous agents unless there is a demonstrated architectural need.

Avoid unnecessary complexity.

---

## 5. Playwright

Playwright is the primary browser automation and E2E testing technology.

Use Playwright for:

* Browser navigation
* UI interaction
* Form interaction
* Assertions
* Screenshots
* Traces
* Test execution
* Generated automated tests
* Responsive/mobile web testing

Use **Playwright MCP** when an agent needs to interact with and explore a live browser application.

Use **Playwright Test** when creating and executing reproducible automated tests.

Keep these responsibilities conceptually separate:

* MCP → agent-driven exploration and interaction
* Playwright Test → deterministic automated test execution

Prefer stable, user-observable selectors and behavior.

Do not rely on implementation-specific selectors when better user-facing selectors are available.

---

## 6. Mobile

The MVP supports **mobile web testing** through Playwright device emulation.

Native mobile application testing is out of scope for the MVP.

Do not introduce Appium, Maestro, Android emulators, or iOS tooling unless explicitly required by a later project phase.

---

## 7. Knowledge

Product knowledge is stored under:

`knowledge/`

Knowledge should be treated as contextual input to QA activities.

Potential knowledge sources include:

* Product description
* Business rules
* Roles
* Environments
* Glossary
* Known issues

Do not place secrets or credentials in knowledge files.

Do not invent business rules when they are not provided or observable.

When information is uncertain, explicitly identify the uncertainty.

---

## 8. Structured Contracts

Communication between QA stages should use structured artifacts whenever practical.

Examples include:

* Feature specification
* Test areas
* Risks
* Test scenarios
* Test cases
* Exploratory charters
* Findings
* Execution results
* Potential defects

Avoid relying exclusively on free-form text when information will be consumed by another stage of the workflow.

Contracts belong under:

`contracts/`

---

## 9. Evidence

Important QA findings should include evidence whenever possible.

Useful evidence includes:

* Screenshots
* Playwright traces
* Videos
* URLs
* Observed messages
* Test execution results
* Reproduction steps

Artifacts should be stored under:

`artifacts/`

A potential defect without sufficient evidence should be clearly identified as unconfirmed.

---

## 10. Credentials and Secrets

Never hardcode credentials.

Never store passwords, access tokens, API keys, or other secrets in:

* Source code
* `AGENTS.md`
* Skills
* Knowledge files
* Test cases
* Reports
* Git-tracked files

Use environment variables or an appropriate secret-management mechanism.

`.env` files containing secrets must not be committed to Git.

Do not expose credentials in logs, screenshots, reports, or generated artifacts when avoidable.

---

## 11. Human Approval

The following actions require explicit human approval:

* Creating external bug tickets
* Creating or modifying external records
* Destructive actions
* Changes outside the project workspace
* Actions that could affect production systems
* External integrations that modify data

The MVP must generate local QA and bug-report artifacts rather than automatically creating Phabricator tickets.

---

## 12. Phabricator

Phabricator integration is out of scope for the MVP.

Do not assume:

* Phabricator version
* API implementation
* Authentication mechanism
* Available permissions
* Ticket workflow

Any future integration must first be investigated against the actual Phabricator environment.

---

## 13. Test Generation

Generated automated tests must be:

* Readable
* Maintainable
* Reproducible
* Independent when practical
* Based on observable application behavior
* Traceable to a test case or scenario

Do not generate large numbers of tests simply to increase test count.

Prefer a small number of meaningful tests that demonstrate coverage.

---

## 14. Exploration

Exploratory testing should be intentional and risk-based.

Before exploration, define a testing mission or charter when practical.

During exploration, look for:

* Unexpected behavior
* Inconsistent states
* Validation gaps
* Error handling problems
* Navigation problems
* Data persistence problems
* Boundary conditions
* Permission issues
* Workflow inconsistencies

Record findings separately from confirmed defects.

---

## 15. Agent Behavior

When executing a QA workflow:

1. Understand the requested feature.
2. Identify assumptions and missing information.
3. Load relevant product knowledge.
4. Identify risks and test areas.
5. Generate structured test scenarios/cases.
6. Explore the application when appropriate.
7. Collect evidence.
8. Select meaningful scenarios for automation.
9. Generate Playwright tests.
10. Execute the tests.
11. Analyze failures.
12. Distinguish test failures from potential application defects.
13. Produce a QA report.

Do not skip directly to automation when exploratory investigation would provide useful information.

---

## 16. Failure Analysis

A failed automated test is not automatically a product defect.

Before classifying a failure as a potential defect, consider:

* Test implementation errors
* Incorrect assumptions
* Environment problems
* Authentication/session issues
* Timing issues
* Locator problems
* Application behavior

The QA system should explain the reasoning behind a potential defect classification.

---

## 17. Scope Control

Do not introduce new frameworks, databases, vector stores, agents, MCP servers, or external services without a demonstrated need.

Prefer:

1. Existing project capabilities
2. Playwright
3. TypeScript
4. Local files
5. Skills
6. MCP tools when they provide clear value

The goal of the PoC is to demonstrate feasibility, not to build a production-grade platform.

---

## 18. Change Discipline

Work incrementally.

Before implementing a significant architectural change:

* Explain the reason
* Identify alternatives
* Consider the impact
* Prefer the simplest viable solution

Do not implement future roadmap features prematurely.

The current priority is the MVP.

## 19. Codex Test Design

The default Test Design mode is `codex_cli`. The local Node workflow never calls
an OpenAI API, never reads `OPENAI_API_KEY`, never handles OAuth tokens, and does
not use the `openai` package. It invokes the locally authenticated Codex CLI
through `codex exec` for one non-interactive Test Design task.

The workflow runs Discovery and Exploratory, then writes a compact request to
`artifacts/test-design/<feature>.request.json`. In `codex_cli`, the worker reads
that request and produces only `contracts/<feature>.test-cases.json`; the
workflow then performs deterministic schema/quality validation and continues
without pausing. Codex output is recorded in the compact
`artifacts/test-design/<feature>.codex.log` log. The worker does not generate
Automation, Playwright code, or selectors, does not run the full workflow, and
must not modify framework source, feature YAML, tests, or package files.

The worker may read the request, its referenced Feature/Discovery/Exploratory
artifacts, `contracts/test-cases.schema.json`, and this file. Its only intended
write is the Test Design contract. The CLI uses a conservative workspace-write
sandbox because that output is inside the repository; the prompt explicitly
restricts the task to that artifact and the workflow validates the result
before marking `test_design` completed. `CODEX_TEST_DESIGN_TIMEOUT_MS` controls
the child-process timeout. Missing CLI, authentication, rate-limit, timeout,
non-zero exit, missing output, and validation errors fail Test Design; there is
no silent fallback.

`TEST_DESIGN_MODE=codex_checkpoint` remains the manual debugging/fallback mode:
the request is created and the workflow becomes `paused` until the artifact is
provided and resumed with `--resume <workflow-state>`. `TEST_DESIGN_MODE=deterministic`
is available only for explicit development or regression runs.
