import { expect, test } from '../fixtures/test.fixture.js';

test('@login @smoke @regression TC-LOCKEDUS-001: Reject a blocked user with valid credentials', async ({ page, loginPage, blockedUserCredentials }) => {
  await loginPage.navigate();
  await expect(page.getByPlaceholder('Username')).toBeVisible();

  await loginPage.login(blockedUserCredentials.username, blockedUserCredentials.password);

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByPlaceholder('Username')).toBeVisible();
  await expect(loginPage.errorMessage()).toBeVisible();
  await expect(loginPage.errorMessage()).toContainText(/blocked|locked out/i);
});
