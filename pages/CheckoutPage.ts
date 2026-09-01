import type { Page } from '@playwright/test';

export class CheckoutPage {
  constructor(private readonly page: Page) {}
  async fillInformation(firstName: string, lastName: string, postalCode: string): Promise<void> {
    await this.page.getByPlaceholder('First Name').fill(firstName);
    await this.page.getByPlaceholder('Last Name').fill(lastName);
    await this.page.getByPlaceholder('Zip/Postal Code').fill(postalCode);
  }
  async continue(): Promise<void> { await this.page.getByRole('button', { name: 'Continue' }).click(); }
  async finish(): Promise<void> { await this.page.getByRole('button', { name: 'Finish' }).click(); }
  async getProductNames(): Promise<string[]> {
    return (await this.page.locator('[data-test="inventory-item-name"]').allTextContents()).map((value) => value.trim());
  }
  async getProductSnapshots(): Promise<{ name: string }[]> { return (await this.getProductNames()).map((name) => ({ name })); }
  async getConfirmationMessage(): Promise<string> {
    return (await this.page.locator('[data-test="complete-header"]').innerText()).trim();
  }
}
