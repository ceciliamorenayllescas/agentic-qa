# Result Analysis Skill

## Purpose

Analyze Playwright execution results and determine the most likely cause of a test failure without automatically classifying every failure as a product defect.

## Inputs

The skill may receive:

* Test case
* Playwright test result
* Error message
* Stack trace
* Screenshot
* Video
* Trace
* Browser information
* Environment configuration
* Exploratory findings

## Output

Produce a structured analysis containing:

* Test status
* Failure classification
* Confidence
* Evidence
* Reasoning
* Recommended next action

## Failure Classification

Use one of the following classifications:

### PASS

The test completed successfully and all assertions passed.

### APPLICATION_DEFECT

Evidence indicates that the application behavior contradicts a known requirement or expected behavior.

### TEST_DEFECT

The automated test itself is likely incorrect.

Examples:

* Incorrect locator
* Incorrect assertion
* Invalid test assumption
* Incorrect test setup

### ENVIRONMENT_FAILURE

The environment prevented the test from executing correctly.

Examples:

* Application unavailable
* Invalid base URL
* Network failure
* Environment configuration problem

### AUTHENTICATION_FAILURE

The test could not authenticate because of:

* Missing credentials
* Invalid credentials
* Authentication service failure

### TIMING_OR_SYNCHRONIZATION

The failure is likely related to:

* Race condition
* Missing synchronization
* Incorrect waiting strategy
* Unexpected asynchronous behavior

### TOOLING_FAILURE

The failure appears to originate from Playwright, browser infrastructure, or another testing tool.

### UNKNOWN

There is insufficient evidence to determine the cause.

## Analysis Process

When a test fails:

1. Read the failure message.
2. Identify the failed action or assertion.
3. Inspect relevant evidence.
4. Compare actual behavior with expected behavior.
5. Check whether the test assumptions are valid.
6. Check environment and authentication state.
7. Consider timing and synchronization problems.
8. Determine the most likely classification.
9. Assign a confidence level.
10. Recommend the next action.

## Defect Classification

A failure should only be classified as `APPLICATION_DEFECT` when there is sufficient evidence that:

* The application was operating normally.
* The test setup was valid.
* The expected behavior is supported by a requirement or established product rule.
* The observed behavior contradicts that expectation.

If expected behavior is unknown, classify the result as `UNKNOWN` or another appropriate non-defect category.

## Confidence

Use:

* high
* medium
* low

Confidence reflects confidence in the classification, not severity.

## Evidence

Reference relevant artifacts whenever available.

Examples:

* Screenshot
* Trace
* Video
* Console output
* Test output

Do not claim evidence exists if it was not actually generated.

## Recommended Actions

Possible recommendations include:

* Re-run test
* Fix test
* Fix environment
* Investigate application behavior
* Perform exploratory testing
* Collect additional evidence
* Create a bug report

Creating external bugs is outside this skill's responsibility.

## Rules

Do not:

* Automatically convert test failures into bugs.
* Modify the application.
* Create external tickets.
* Hide failures.
* Claim certainty without evidence.
