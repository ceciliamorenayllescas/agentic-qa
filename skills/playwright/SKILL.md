# Playwright Skill

## Purpose

Use Playwright for browser-based testing, automation, evidence collection, and reproducible E2E test execution.

## Two Operating Modes

### Exploration

Use Playwright MCP when the task requires interactive exploration of a live application.

The goal is to:

* Navigate
* Interact
* Observe
* Investigate
* Collect evidence

### Automation

Use Playwright Test when converting a validated scenario into a reproducible automated test.

The goal is to:

* Create `.spec.ts` files
* Execute tests
* Capture results
* Diagnose failures

## Selector Strategy

Prefer selectors based on user-observable characteristics:

1. Accessible role
2. Accessible name
3. Label
4. Placeholder
5. Visible text
6. Stable test identifier when available

Avoid brittle selectors based on:

* Generated CSS classes
* DOM structure
* Implementation-specific details

## Assertions

Assertions should validate observable outcomes.

Prefer meaningful assertions such as:

* Visible text
* URL
* Element visibility
* Element state
* Form state
* User-visible result

Avoid assertions about internal implementation details.

## Evidence

For important failures, preserve:

* Screenshot
* Trace
* Video when configured
* Test output

Store artifacts under `artifacts/`.

## Generated Tests

Generated tests must:

* Be readable
* Be deterministic where practical
* Represent a meaningful test case
* Use stable selectors
* Have clear assertions
* Avoid unnecessary waits

Do not use arbitrary fixed delays unless there is a documented reason.

## Test Execution

Tests should be executed using Playwright Test.

A failed test must be analyzed before being classified as a potential product defect.

Possible causes include:

* Application defect
* Test defect
* Locator problem
* Timing problem
* Environment problem
* Authentication/session problem

## Mobile Web

Use Playwright device emulation for mobile web testing.

Native mobile testing is outside the MVP scope.

## Rules

Do not:

* Access application source code
* Modify the SUT
* Create external records
* Hardcode credentials
* Expose secrets in test output

