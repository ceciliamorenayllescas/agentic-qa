# Test Plan — Checkout with error user

## Traceability

- Feature: `checkout-general` (`config/checkout-error-user.yaml`)
- SUT: SauceDemo, `TEST_BASE_URL`
- Approach: black-box; authenticated as `error_user` using environment credentials
- Automation: `checkout`, regression; evaluate for smoke
- Status: ready for human approval

## Scope and risks

Cover checkout from cart through completion, one or multiple products, product/price/quantity consistency, required personal data, empty cart, boundary values, error handling, recovery and mobile web. Login, logout, product details and cross-session cart persistence are excluded.

Highest risks: checkout navigation unavailable for the target role (Critical); incorrect or lost cart data (High); order confirmation without required data or products (High); validation and recovery gaps (High); mobile usability (Medium).

No formal business rules are provided. Expected outcomes below are based on the feature objective and observable user-facing consistency; uncertain behavior must remain explicitly marked.

## Exploratory charter

**Mission:** investigate whether `error_user` can complete and recover from checkout while preserving cart state, product data and validation rules.

**Heuristics:** state consistency, empty and boundary values, repeated actions, navigation/reload recovery, visible validation and responsive usability.

## Exploration observations and findings

1. `error_user` authenticated successfully and reached `/inventory.html`.
2. The initial observable state showed cart badge `2`, with Backpack and Bike Light selected.
3. Clicking visible `Remove` buttons did not change the badge or button state. Clicking `Add to cart` for Bolt T-Shirt also did not change the badge.
4. Clicking the visible cart link did not navigate away from `/inventory.html`.
5. These are reproducible observations and a **potential defect / needs investigation** for this role. The available knowledge does not define whether `error_user` is intentionally restricted, so this is not a confirmed product defect.

**Evidence:** `artifacts/checkout-error-user-inventory.png`; MCP snapshots/logs under `.playwright-mcp/`. URL remained `https://www.saucedemo.com/inventory.html` after the cart-link action.

## Test cases

### TC-01 — Complete checkout with one product

**Type/Priority:** positive, regression / Critical

**Preconditions:** authenticated as `error_user`; cart can be cleaned through UI.

1. Add one product and open the cart.
2. Verify the product name, price and quantity `1`.
3. Select Checkout.
4. Enter valid first name, last name and postal code; select Continue.
5. Verify the summary and select Finish.

**Expected:** each transition is available, product data remains consistent, total is coherent with the observed price, and completion is visibly confirmed. If the role cannot reach a step, record the exact observable block and classify against the exploration finding.

### TC-02 — Preserve multiple products and prices

**Type/Priority:** positive/validation / High

**Preconditions:** authenticated; cart can be cleaned through UI.

1. Add at least three distinct products.
2. Compare names/prices between inventory and cart.
3. Complete checkout with valid data.
4. Compare the summary items, quantities, subtotal and total with the cart.

**Expected:** no missing, duplicated or substituted items; quantities and calculated values remain coherent.

### TC-03 — Required fields empty or partially empty

**Type/Priority:** negative/validation / High

1. Reach checkout information with one product.
2. Continue with all fields empty, then repeat with each required field empty individually.
3. Observe URL, visible error, focus and retained values.

**Expected:** progression is blocked with a clear visible validation message; cart state is not lost and summary is not reached.

### TC-04 — Null, whitespace, special and boundary values

**Type/Priority:** negative/boundary/validation / Medium

1. Try whitespace-only names and postal code.
2. Try names containing hyphen, apostrophe and Unicode characters.
3. Try alphanumeric, very short and very long postal codes.
4. Record accepted/rejected values and messages.

**Expected:** behavior is consistent and observable. Undocumented input rules are recorded as observations/uncertainties, not assumed defects.

### TC-05 — Empty cart and repeated actions

**Type/Priority:** negative/error_handling / High

1. Remove all products using UI controls.
2. Open the empty cart and inspect Checkout availability.
3. If available, attempt checkout and continue through the flow only as allowed.
4. Repeat cart and product actions once to detect duplicate or stale state.

**Expected:** an order cannot be confirmed without products, or the application presents a coherent blocked state; no stale badge or unintended item is introduced.

### TC-06 — Navigation/reload recovery and mobile checkout

**Type/Priority:** error_handling/regression / Medium

1. From each reachable checkout step, use Cancel, browser back/forward and reload.
2. Verify URL, cart, form and summary state after each action.
3. Repeat the reachable flow at a 390×844 mobile viewport.

**Expected:** no accidental confirmation, no lost or duplicated state, and reachable controls/messages remain usable without horizontal overflow.

## Automation Handoff

### Selector inventory

- Login precondition: `[data-test="username"]`, `[data-test="password"]`, `[data-test="login-button"]`.
- Inventory/cart: `[data-test="inventory-item"]`, `[data-test="inventory-item-name"]`, `[data-test="inventory-item-price"]`, buttons whose accessible name is `Add to cart` or `Remove`, `[data-test="shopping-cart-link"]`, `[data-test="shopping-cart-badge"]`, `[data-test="checkout"]`.
- Checkout: `[placeholder="First Name"]`, `[placeholder="Last Name"]`, `[placeholder="Zip/Postal Code"]`, `[data-test="continue"]`, `[data-test="cancel"]`, `[data-test="finish"]`, `[data-test="error"]`, `[data-test="complete-header"]`, `[data-test="inventory-item"]`, `[data-test="subtotal-label"]`, `[data-test="total-label"]`.
- URLs: `/inventory.html`, `/cart.html`, `/checkout-step-one.html`, `/checkout-step-two.html`, `/checkout-complete.html`.

### POM/helper reuse map

- Reuse and extend `cypress/support/authentication.js` for role-based environment credentials; it exposes standard-user and error-user login helpers.
- Reuse/extend `cypress/pages/InventoryPage.js`, `cypress/pages/CartPage.js` and `cypress/pages/CheckoutPage.js`; keep raw locators there. `cypress/pages/LoginPage.js` owns login mechanics.
- Reuse `cypress/support/data.js`; add only approved boundary data.
- General checkout spec: `cypress/e2e/checkout/checkout.cy.js`. Role-specific additions: `cypress/e2e/checkout/checkout-error-user.cy.js`. Extend these specs when cases match; create a new functional spec when the functionality is not covered.
- Cypress shared setup belongs in `cypress/support/commands.js` and `cypress/support/e2e.js`; fixtures belong in `cypress/fixtures/`.

### Expected UI states

Authenticated inventory; cart with zero/one/multiple items; checkout information with empty/partial/valid fields; summary with items and totals; completion confirmation; role-specific blocked controls are an observed state requiring investigation.

## Approval gate

Reply exactly `approved` or `not approved`.

## Automation execution update

The approved Cypress specs `cypress/e2e/checkout/checkout.cy.js` and `cypress/e2e/checkout/checkout-error-user.cy.js` were executed against the configured SauceDemo environment.

- Passed: 3/5
- Failed: 2/5
- Skipped: 0
- Evidence: `artifacts/cypress/screenshots/checkout.cy.js/` and `artifacts/cypress/videos/checkout.cy.js.mp4`

### Result analysis

- TC-01: **APPLICATION_DEFECT or role-specific behavior, medium confidence.** The test reached `/checkout-step-one.html`, then the application raised `TypeError: Cannot read properties of undefined (reading 'value')` while typing the last name. The test setup and selectors reached the intended visible fields; no test change can safely preserve the intended checkout assertion while avoiding the application exception.
- TC-02: **APPLICATION_DEFECT or role-specific behavior, medium confidence.** The application raised `Failed to add item to the cart` while adding the third visible product. This matches the exploratory observation that cart actions for `error_user` were not reflected in the UI.
- TC-03, TC-05 and TC-06: PASS.

The failures are not classified as confirmed product defects because no formal rule states that `error_user` must support a complete successful checkout. They are reproducible potential defects/needs for product clarification.
