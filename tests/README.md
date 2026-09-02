# Automated suites

Generated and maintained Playwright tests are organized by feature:

```text
tests/<feature>/*.spec.ts
```

These tests run independently of the AI agents with `npm test`. The seed file
is kept for the Playwright planner and generator.
