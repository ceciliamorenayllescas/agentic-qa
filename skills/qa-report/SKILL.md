# QA Report Skill

## Purpose

Produce a concise QA report summarizing the testing performed for a feature.

## Inputs

The report may receive:

* Feature specification
* Test areas
* Test cases
* Exploratory charter
* Exploratory findings
* Automated test results
* Evidence
* Potential defects

## Output

Generate a Markdown QA report under:

`artifacts/reports/`

## Report Structure

The report should contain:

### Feature

What was tested.

### Scope

Areas covered.

### Test Cases

Summary of designed and executed cases.

### Exploratory Testing

Include:

* Charter
* Areas explored
* Findings

### Automation

Include:

* Tests generated
* Tests executed
* Passed
* Failed

### Findings

Separate:

* Observations
* Potential defects
* Confirmed defects
* Unresolved questions

### Evidence

Reference relevant artifacts.

### Risks

Identify important remaining risks.

### Conclusion

Provide a concise assessment of the tested feature.

## Rules

Do not claim that the feature is defect-free.

Do not classify failures as defects without analysis.

Clearly distinguish:

* Tested
* Not tested
* Observed
* Confirmed
* Unknown

The report must be understandable by both QA and non-QA stakeholders.

