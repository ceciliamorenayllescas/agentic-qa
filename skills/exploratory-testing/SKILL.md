# Exploratory Testing Skill

## Purpose

Guide agent-driven exploratory testing of a real application using a defined testing mission and browser interaction tools.

Exploratory testing combines learning, test design, and execution.

## Inputs

* Feature specification
* Test scenarios
* Test cases
* Product knowledge
* Risks
* Unknowns

## Output

Produce:

* Exploratory charter
* Observations
* Findings
* Evidence
* Uncovered questions
* Selector inventory for automation
* POM design and reuse map

Findings and the Automation Handoff should be recorded in the approved
Markdown plan under `specs/`.

## Charter

Before exploration, define:

* Mission
* Scope
* Main risks
* Areas to investigate
* Relevant heuristics

Example:

> Investigate the product-to-cart workflow, focusing on state consistency, validation, duplicate actions, and unexpected navigation behavior.

## Exploration Principles

Use risk-based exploration.

Prioritize:

* High-risk workflows
* Unknown behavior
* State transitions
* Validation
* Error handling
* Boundary conditions
* Repeated actions
* Navigation
* Session behavior

## Browser Interaction

When browser interaction is required, use Playwright MCP.

The agent should:

1. Navigate to the relevant area.
2. Observe the current state.
3. Perform an intentional action.
4. Observe the resulting state.
5. Compare behavior with known requirements.
6. Investigate unexpected behavior.
7. Collect evidence when appropriate.

Do not perform random clicking without a testing purpose.

## Findings

A finding can be:

* observation
* potential_defect
* confirmed_defect
* not_a_defect
* needs_investigation

Do not automatically classify an observation as a defect.

## Evidence

When relevant, capture:

* Screenshot
* URL
* Visible message
* Browser state
* Reproduction steps
* Playwright trace

Evidence should be stored under `artifacts/`.

## Defect Reasoning

Before identifying a potential defect, consider:

* Explicit requirements
* Acceptance criteria
* Known business rules
* Observable expected behavior
* Environment problems
* Authentication problems
* Test/tool problems

If expected behavior cannot be established, report the uncertainty. Before
ending the session, record stable selectors, component boundaries, states and
the POM/helper method that should own each interaction.

## Exploration Discipline

The agent should maintain awareness of:

* Current page
* Current application state
* Current user/role
* Actions already performed
* Findings already recorded

Avoid repeating identical actions without a testing reason. Close the browser
session after the handoff is saved, including a best-effort close on failure.

## Rules

Do not:

* Access source code
* Access databases
* Perform destructive actions without approval
* Create external tickets
* Invent requirements
* Execute arbitrary actions unrelated to the testing mission
