import type { Locator, Page } from '@playwright/test';

export class CheckoutPage {
  constructor(private readonly page: Page) {}
  async fillInformation(firstName: string, lastName: string, postalCode: string): Promise<void> {
    await this.page.getByPlaceholder('First Name').fill(firstName);
    await this.page.getByPlaceholder('Last Name').fill(lastName);
    await this.page.getByPlaceholder('Zip/Postal Code').fill(postalCode);
  }
  async continue(): Promise<void> { await this.page.getByRole('button', { name: 'Continue' }).click(); }
  async finish(): Promise<void> { await this.page.getByRole('button', { name: 'Finish' }).click(); }
  informationForm(): Locator { return this.page.getByText('Checkout: Your Information', { exact: true }); }
  validationMessage(): Locator { return this.page.locator('[data-test="error"]'); }
  async getValidationMessageText(): Promise<string> { return (await this.validationMessage().innerText()).trim(); }
  async getProductNames(): Promise<string[]> {
    return (await this.page.locator('[data-test="inventory-item-name"]').allTextContents()).map((value) => value.trim());
  }
  async getProductSnapshots(): Promise<{ name: string }[]> { return (await this.getProductNames()).map((name) => ({ name })); }
  async getConfirmationMessage(): Promise<string> {
    return (await this.page.locator('[data-test="complete-header"]').innerText()).trim();
  }
  async getSummaryItemCount(): Promise<number> { return this.page.locator('[data-test="inventory-item"]').count(); }
  async getSummarySubtotal(): Promise<string> { return (await this.page.locator('[data-test="subtotal-label"]').innerText()).trim(); }
  async getSummaryTotal(): Promise<string> { return (await this.page.locator('[data-test="total-label"]').innerText()).trim(); }
}
