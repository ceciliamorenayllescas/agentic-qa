# Test Discovery Skill

## Purpose

Identify what should be tested for a given feature before detailed test cases or browser automation are created.

The goal is to maximize meaningful QA coverage using risk-based reasoning rather than generating a large number of superficial scenarios.

## Inputs

The skill receives:

* Feature specification
* Acceptance criteria, when available
* Product knowledge
* Business rules
* Roles
* Known issues

## Outputs

The skill must produce structured information containing:

* Test areas
* Risks
* Test scenarios
* Assumptions
* Unknowns

The output should be recorded by `playwright-test-planner` in the Markdown plan under `specs/`.

## Discovery Process

Analyze the feature from multiple perspectives.

### Functional

Identify:

* Main happy paths
* Alternative flows
* State transitions
* Data handling
* Successful completion

### Negative

Identify:

* Invalid inputs
* Missing inputs
* Invalid states
* Failed operations
* Unexpected user actions

### Boundary

Identify:

* Minimum values
* Maximum values
* Empty values
* Very large values
* Special characters
* Length limits

Only propose boundary cases when they are relevant to the feature.

### Validation

Identify:

* Required fields
* Input formats
* Validation messages
* Client-side observable validation
* Server-side observable validation

### Authorization and Roles

Consider:

* Available roles
* Role-specific behavior
* Restricted actions
* Unauthorized access

Do not assume permissions that are not documented or observable.

### Error Handling

Consider:

* Error messages
* Failed requests
* Recovery behavior
* Retry behavior
* Application state after failure

### Regression

Identify existing functionality that could reasonably be affected by the feature.

Do not generate regression scenarios unrelated to the feature.

## Risk Assessment

Risks should be prioritized based on:

* Business impact
* User impact
* Likelihood
* Complexity
* State changes
* Data integrity
* Security or authorization implications

Use the following levels:

* Critical
* High
* Medium
* Low

## Unknowns

Explicitly identify information that cannot be determined from the available context.

Do not convert assumptions into requirements.

## Exploration Candidates

Identify scenarios that are especially suitable for exploratory testing.

Prioritize areas where:

* Requirements are incomplete
* Behavior is uncertain
* Multiple states interact
* Unexpected behavior is plausible
* Risk is high

## Rules

Do not:

* Generate Playwright code
* Execute the application
* Assume implementation details
* Invent business rules
* Treat assumptions as requirements

The output of this skill is an input to Test Design and Exploratory Testing.
