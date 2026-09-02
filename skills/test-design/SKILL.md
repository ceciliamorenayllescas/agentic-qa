# Test Design Skill

## Purpose

Transform discovered test scenarios into structured, reproducible test cases inside the approved Playwright Markdown plan.

## Inputs

* Feature specification
* Test areas
* Risks
* Test scenarios
* Product knowledge

## Output

Produce test cases compatible with:

the approved `specs/<feature>.md` plan consumed by `playwright-test-generator`.

Each scenario must contain:

* Clear title
* Type and priority when relevant
* Preconditions
* Steps
* Expected results

## Test Case Design

Each test case should answer:

1. What are we testing?
2. Under what conditions?
3. What actions are performed?
4. What should happen?

Steps must be clear enough for another QA Analyst to reproduce manually.

## Test Types

Use only relevant types:

* positive
* negative
* boundary
* validation
* permission
* error_handling
* regression

## Prioritization

Prioritize scenarios based on risk.

Prefer a small set of high-value test cases over large numbers of redundant cases.

## Independence

Tests should be independent whenever practical.

Avoid unnecessary dependencies between test cases.

## Traceability

When possible, maintain traceability between:

Feature
→ Test Area
→ Scenario
→ Test Case

## Rules

Do not:

* Generate Playwright code
* Create a parallel JSON contract
* Execute tests
* Invent expected behavior
* Assume undocumented business rules

If expected behavior cannot be determined, mark the uncertainty explicitly.

## Quality Criteria

A good test case should be:

* Clear
* Reproducible
* Observable
* Independent
* Risk-relevant
* Automation-friendly when appropriate
