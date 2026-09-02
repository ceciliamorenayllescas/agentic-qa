# QA Test Plan — Login (login-general)

## Traceability

- Feature: `config/login-feature.yaml`
- SUT: SauceDemo, `TEST_BASE_URL` (observed URL: `https://www.saucedemo.com/`)
- Approach: external black-box testing through the browser UI
- Functional area: `login`; suites: `regression`; smoke candidate
- Scope exclusions: logout, password recovery, registration, cart, checkout, and product details
- Status: approved (`aprobado`); Cypress JavaScript automation generated and executed

## Knowledge Used

- `knowledge/product.md`: SauceDemo is a web application exposing authentication and shopping workflows; testing is black-box.
- `knowledge/environments.md`: public SauceDemo environment, browser access, `TEST_BASE_URL`, desktop Chromium and mobile Chromium targets, and evidence under `artifacts/`.
- `knowledge/roles.md`: multiple observable SauceDemo test-user behaviors exist; credentials must come from environment configuration and must not be stored in artifacts.
- `knowledge/business-rules.md`: no formally supplied business rules; distinguish observed behavior, assumptions, and potential defects.
- `knowledge/known-issues.md`: no formally registered issues; independent exploration remains required.
- `knowledge/glossary.md`: terminology used here follows the repository definitions for finding, potential defect, evidence, scenario, and exploratory testing.
- `CODEX_ORCHESTRATOR.md` and `.codex/agents/playwright_test_planner.toml`: planner workflow, human approval gate, black-box selectors, and Automation Handoff requirements.

## Assumptions and Unknowns

- Each scenario starts from a blank/fresh browser state at `TEST_BASE_URL`; the test must clear or recreate session state through the UI where applicable.
- The accepted-user list and shared password are public test data rendered by the page, but automation must obtain credentials from environment variables and never persist them.
- No formal requirements define exact error copy, case sensitivity, whitespace rules, maximum lengths, rate limiting, session duration, or the expected behavior of each special test user; these are test questions, not assumed rules.
- The browser session used for exploration was not guaranteed to have a clean prior local-storage/cookie state. The first successful login also showed a pre-existing cart count of `2`; this is evidence that state isolation must be verified by the runner.
- Whether all accepted usernames should authenticate successfully, and what role-specific defects each user intentionally exposes, must be confirmed from product requirements or observed behavior.

## Exploratory Charter

**Mission:** investigate whether a fresh external user can authenticate reliably and receive clear, safe, consistent feedback for valid, invalid, incomplete, boundary, and role-specific credentials.

**Risk focus:** inability to authenticate (critical); unauthorized access or redirect on rejected credentials (critical); blocked users admitted (critical); missing or misleading validation (high); errors that expose secrets or leave an inconsistent session (high); keyboard/mobile usability regressions (medium).

**Heuristics:** state transition consistency, empty/null/equivalent values, case and whitespace variation, repeated submission, keyboard submission, refresh/back navigation, visible validation and accessible naming, and separation of authentication outcome from downstream product behavior.

## Exploratory Findings and Evidence

1. **Login surface and public test-data guidance (observed).** The fresh page title is `Swag Labs`; it exposes textboxes labeled `Username` and `Password`, a `Login` button, an accepted-user list, and a shared-password label. Evidence: `.playwright-mcp/page-2026-09-02T14-31-38-956Z.yml` and `.playwright-mcp/page-2026-09-02T14-32-01-543Z.yml`.
2. **One successful standard-user transition (observed once).** An initial standard-user login reached `https://www.saucedemo.com/inventory.html`, with `Products` visible. The inventory snapshot showed a cart badge of `2`, so the resulting browser state was not proven clean. Evidence: `.playwright-mcp/page-2026-09-02T14-31-54-429Z.yml`.
3. **Repeated submissions did not produce visible error copy (observed).** Empty submission, invalid credentials, and later standard-user valid credentials remained at `/`; `.error-message-container` existed but had empty text. Both username and password acquired `input_error` styling after submission. Evidence: `.playwright-mcp/page-2026-09-02T14-32-13-998Z.yml`, `.playwright-mcp/page-2026-09-02T14-32-31-499Z.yml`, and the browser-evaluate DOM result from the same session.
4. **Role/credential matrix was not reliably actionable (observed, unconfirmed).** A repeated browser-loop probe for the listed role usernames, wrong password, empty password, empty username, and valid standard credentials kept the URL at `/` with empty visible error text. This may be a transient public-environment or session/tool condition; it is not a confirmed product defect. Evidence: `.playwright-mcp/console-2026-09-02T14-32-01-387Z.log` and snapshots from the corresponding session.
5. **Console telemetry errors (observed, likely ancillary).** The console reported HTTP 401 responses from `events.backtrace.io` telemetry endpoints. These errors were not shown to the user and are not sufficient to attribute the login inconsistency to the SUT. Evidence: `.playwright-mcp/console-2026-09-02T14-31-38-213Z.log` and `.playwright-mcp/console-2026-09-02T14-32-01-387Z.log`.

## Test Scenarios

All scenarios are independent. Start each one at a fresh `TEST_BASE_URL` page, use only environment-provided credentials, and record URL, visible text, focus, field values, and session state. A scenario succeeds only when the expected observable state and security boundary both hold; otherwise record a failure with evidence. If the expected result is not defined by requirements, classify the result as observed behavior or uncertainty.

### 1. Authenticate a valid standard user

**Type:** positive/regression/smoke  **Priority:** Critical

1. Navigate to `TEST_BASE_URL`.
2. Fill the Username field with the environment value for the standard test user.
3. Fill the Password field with the environment value for the shared test password.
4. Select `Login`.
5. Wait for the page transition and inspect URL, heading, menu, and inventory content.

**Expected:** navigation to `/inventory.html`; a visible `Products` heading and authenticated inventory state; no login error; credentials are not present in the URL or visible after navigation.

**Failure:** remaining on login, a blank/incomplete authenticated page, an error, or any credential disclosure.

### 2. Reject an unknown username and incorrect password

**Type:** negative/error-handling  **Priority:** Critical

1. Open a fresh login page.
2. Enter a syntactically ordinary but unlisted username and an incorrect password.
3. Select `Login`.
4. Inspect the visible error region, field styling, URL, and browser history.

**Expected:** authentication is rejected, URL remains on the login page, a clear non-sensitive error is visible, and no authenticated content or session is created.

**Failure:** access to inventory, no actionable feedback where a requirement requires it, or disclosure of credential details.

### 3. Reject each incomplete required-field combination

**Type:** negative/validation/boundary  **Priority:** High

1. From a fresh page, submit with both fields empty.
2. Repeat with only Username populated.
3. Repeat with only Password populated.
4. For each attempt, inspect focus, error text, field styling, URL, and retained values.

**Expected:** submission is blocked; the missing field is identified clearly and consistently; no authenticated state is entered; entered non-secret text is retained only as appropriate.

**Failure:** navigation without complete credentials, no observable feedback, inconsistent prioritization without an explicit rule, or password leakage.

### 4. Validate whitespace, case, and boundary-length credentials

**Type:** negative/boundary/validation  **Priority:** High

1. Try leading/trailing spaces around a valid username and password.
2. Try usernames and passwords consisting only of spaces.
3. Try case changes in the username and password independently.
4. Try empty strings, one-character values, and progressively long values; include a value at and above any UI or server limit discovered during execution.
5. Submit each variation independently and record the result.

**Expected:** behavior is deterministic and consistent with documented rules. Rejected variants remain unauthenticated and provide safe feedback; accepted variants are documented as observed behavior unless requirements establish equivalence.

**Failure:** truncation without indication, acceptance of a malformed value contrary to requirements, UI breakage, hangs, or authenticated access from an unintended variant.

### 5. Handle a blocked user

**Type:** negative/permission/error-handling  **Priority:** Critical

1. Open a fresh page.
2. Enter the environment-provided blocked-user credential pair.
3. Select `Login`.
4. Inspect URL, visible error, focus, and whether an authenticated page can be reached by refresh or back/forward navigation.

**Expected:** access is denied with a clear safe message; the user remains unauthenticated and cannot reach inventory by refresh or browser navigation alone.

**Failure:** blocked user reaches inventory, receives no usable feedback, or obtains a partially authenticated session.

### 6. Exercise all documented role-specific test users

**Type:** positive/negative/regression  **Priority:** High

1. Run an independent login attempt for every username rendered in the accepted-user list, using the environment password.
2. For each result, record URL, page heading, visible inventory behavior, error state, load duration, and any obvious product-listing anomaly.
3. Do not classify role behavior as a defect without a stated expected role contract.

**Expected:** each user produces its documented or agreed observable behavior; authentication outcome is stable across repetitions; no role can access a state outside its authorization.

**Failure:** result differs between identical clean attempts without environmental explanation, a denied user is admitted, or a user cannot complete its intended documented flow.

### 7. Submit using keyboard and repeat safely

**Type:** positive/validation/regression  **Priority:** Medium

1. Focus Username, enter a valid pair, and submit with Enter from Password.
2. Repeat by activating Login repeatedly and by pressing Enter twice rapidly.
3. Observe duplicate navigation, loading state, errors, and final URL.

**Expected:** keyboard submission matches button submission; repeated input does not create duplicate sessions or unstable navigation; controls remain usable while any loading state is active.

**Failure:** keyboard path fails while button path works, multiple inconsistent transitions occur, or a stale click authenticates after a rejected attempt.

### 8. Recover from refresh and browser navigation

**Type:** error-handling/state-transition  **Priority:** Medium

1. Submit valid credentials and, after authentication, refresh the resulting page.
2. Navigate back to the login URL and forward again.
3. Repeat after a rejected login.

**Expected:** authenticated and unauthenticated states remain coherent; a rejected attempt cannot be bypassed by navigation; no sensitive values appear in history or URL.

**Failure:** stale content crosses the authentication boundary, refresh produces a broken page, or navigation grants access without a valid session.

### 9. Verify responsive login usability

**Type:** regression/accessibility  **Priority:** Medium

1. Emulate mobile Chromium at 390x844 and open a fresh login page.
2. Verify both fields, Login, accepted-user guidance, and error region are visible or reachable without horizontal scrolling.
3. Execute one valid and one invalid/incomplete attempt.
4. Repeat at a desktop Chromium viewport.

**Expected:** controls remain labeled, focusable, readable, and actionable; feedback is visible in both viewports; no overlap or clipping changes the authentication outcome.

**Failure:** controls are inaccessible, labels are absent, errors are clipped, or behavior differs without a documented responsive rule.

## Classification and Exit Criteria

- **Pass:** expected observable state and security boundary are satisfied.
- **Fail:** reproducible deviation with sufficient URL, steps, observed text/state, and evidence.
- **Finding/uncertainty:** behavior observed without a formal rule or with insufficient reproducibility.
- **Potential defect:** reproducible behavior that conflicts with an explicit requirement or a clear authentication/security expectation; do not file external tickets automatically.

Exit when the critical paths, all negative and required-field combinations, blocked-user behavior, at least one boundary family, keyboard path, navigation recovery, and mobile presentation have been covered or explicitly marked blocked by environment conditions.

## Evidence References

Primary evidence is stored in `.playwright-mcp/` by the browser session. Preserve relevant snapshots, console logs, URLs, visible messages, and reproduction steps under `artifacts/` when executing this plan. Do not capture or store passwords, tokens, or complete credential values. The current exploration used snapshot references listed in Exploratory Findings; no screenshot was necessary.

## Automation Handoff

### Stable observable selector inventory

- Username: `getByRole('textbox', { name: 'Username' })` or `getByPlaceholder('Username')`; stable observed attribute: `[data-test="username"]`; DOM id observed: `#user-name`.
- Password: `getByRole('textbox', { name: 'Password' })` or `getByPlaceholder('Password')`; stable observed attribute: `[data-test="password"]`; DOM id observed: `#password`.
- Submit: `getByRole('button', { name: 'Login' })`; stable observed attribute: `[data-test="login-button"]`; DOM id observed: `#login-button`.
- Error region: `[data-test="error"]` when present in the application contract; during exploration the rendered `.error-message-container` existed but contained no text. Assert visibility/text only when the approved requirement defines the copy.
- Authenticated destination: URL path `/inventory.html`, visible `Products` heading, and `Open Menu` control.
- Login guidance: visible headings `Accepted usernames are:` and `Password for all users:`; use these as content assertions, not as credential sources.
- Avoid snapshot refs (`e11e11`, etc.), CSS classes such as `input_error`, and implementation-only React structure as primary locators.

### Expected UI states

1. Fresh login: URL `/`, empty Username and Password controls, Login available, public guidance visible.
2. Incomplete/rejected login: URL remains `/`; login form remains present; safe error is visible if required; no inventory content; password remains masked.
3. Successful login: URL `/inventory.html`; `Products` visible; login controls absent; authenticated navigation available.
4. Blocked/role-specific login: expected state must be supplied by the product contract; otherwise record observed outcome and do not infer a defect.
5. Mobile login: the same semantic controls and outcome as desktop, with no clipping or horizontal-scroll dependency.

### POM/helper reuse map

- No `pages/` directory or login page object was found in the repository.
- No existing login spec was found. Existing related plans are `specs/plp-general.md` and `specs/checkout-general.md`; they use authentication as a precondition and should consume a shared login helper once one is introduced.
- `helpers/test-data.ts` exists; inspect and extend it only for non-secret test-data labels/variants. Never add passwords or tokens.
- Create a focused `LoginPage` POM only after approval if the generator workflow requires it; keep raw locators there and keep Cypress specs behavior-focused.
- Reuse a shared authentication helper for downstream PLP/checkout setup rather than duplicating login steps. Read credentials from `TEST_USERNAME`/`TEST_PASSWORD` or the repository’s approved environment names at runtime and fail fast if absent.

### Related specs and dependencies

- `specs/plp-general.md`: authentication is a precondition; successful login should establish `/inventory.html` before PLP checks.
- `specs/checkout-general.md`: authentication is a precondition; checkout tests must not own login coverage.
- `tests/plp/product-listing.cy.js` and `tests/checkout/checkout.cy.js`: inspect their current setup before generator work; do not modify them in this planning phase.
- No login-specific executable test exists as of exploration.

### Cypress JavaScript automation notes

- Use `cy.visit(Cypress.env('TEST_BASE_URL'))` and environment-provided credentials; never hardcode or log secrets.
- Prefer `cy.get('[data-test="username"]')`, `cy.get('[data-test="password"]')`, and `cy.get('[data-test="login-button"]')`, or accessible queries if the project’s Cypress setup supports them.
- Assert `cy.location('pathname').should('eq', '/inventory.html')` and visible `Products` for the positive path.
- For negatives, assert the login URL and absence of authenticated content; assert exact error copy only after a clean exploration confirms the contract.
- Use independent `beforeEach` setup and avoid relying on cart/session residue. Clear cookies/local storage only through approved test setup mechanisms, not application-internal APIs.
- Keep slow-user timing assertions tolerant for `performance_glitch_user`; validate eventual state rather than a brittle fixed duration.
- Do not automate role-specific visual/product anomalies as login defects unless the expected behavior is documented.

## Approval Gate

Approval received: `aprobado`. The generator workflow created Cypress tests only after this gate.
