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

The MVP uses the Playwright Agent Loop as its primary orchestrator. The
repository entry point is a feature file under `config/`; the conversational
agent `.github/agents/agentic-qa-orchestrator.agent.md` coordinates the loop.

The required path is:

`config/<feature>.yaml` → `playwright-test-planner` → human approval → test
cases in `specs/<feature>.md` → exploratory testing →
`playwright-test-generator` → `cypress/e2e/<feature>/*.cy.js` → Cypress execution →
`playwright-test-healer` when needed.

Do not add a second local orchestration engine or duplicate agent implementations.

---

## 5. Browser tooling and automation

Playwright MCP remains the exploration technology. Cypress JavaScript is the
offline automation and E2E execution technology.

Use Playwright MCP for exploration and evidence collection:

* Browser navigation
* UI interaction
* Form interaction
* Assertions
* Screenshots
* Traces
* Live browser interaction
* Responsive/mobile web testing

Use **Playwright MCP** when an agent needs to interact with and explore a live browser application.

Use **Cypress JavaScript** when creating and executing reproducible automated tests.

Keep these responsibilities conceptually separate:

* MCP → agent-driven exploration and interaction
* Cypress → deterministic automated test execution

Prefer stable, user-observable selectors and behavior.

Do not rely on implementation-specific selectors when better user-facing selectors are available.

---

## 6. Mobile

The MVP supports **mobile web testing** through Cypress viewport configuration.

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

The approved Markdown plan under `specs/` is the human-readable contract for
test scenarios and cases. Generated Cypress tests under `cypress/e2e/` are the
executable contract. Do not create parallel JSON/YAML test-case contracts.

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
3. Load relevant product knowledge and skills.
4. Activate `playwright-test-planner` and produce the feature plan.
5. Pause for exact human approval: `approved` or `not approved`.
6. Create happy-path, negative and boundary test cases in the approved plan.
7. During exploration, record a selector inventory, POM/helper reuse map and
   related existing specs in an Automation Handoff section of the plan.
8. Close the browser after exploration, including a best-effort close on error.
9. Activate `playwright-test-generator` using that handoff; do not rediscover
   selectors with MCP. Extend related POMs/specs instead of duplicating them.
10. Execute the Cypress suite.
11. Activate `playwright-test-healer` on failures.
12. Analyze failures and produce the QA report.

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

## 19. Playwright Agent Loop

Codex is the primary AI interface. Read `CODEX_ORCHESTRATOR.md` and use the
Codex agent definitions under `.codex/agents/`:

* `playwright_test_planner`
* `playwright_test_generator`
* `playwright_test_healer`

The planner must pause for human approval before the generator writes tests.
The approved Markdown plan is the only test-plan/test-case contract. Do not
invoke a second local test-design or automation pipeline.

### Test plan language

All newly generated test plans under specs/ must be written in Spanish. The
only exception is the Automation Handoff section: keep its heading and all
of its content in English so the automation handoff remains consistent with
the generator workflow. Technical identifiers, selectors, URLs, code and
literal UI text may remain unchanged when necessary for accuracy.
