import type { Locator, Page } from '@playwright/test';

export class LoginPage {
  constructor(private readonly page: Page) {}
  async navigate(): Promise<void> { await this.page.goto('/'); }
  async fillCredentials(username: string, password: string): Promise<void> {
    await this.page.getByPlaceholder('Username').fill(username);
    await this.page.getByPlaceholder('Password').fill(password);
  }
  async submit(): Promise<void> { await this.page.getByRole('button', { name: 'Login' }).click(); }
  async login(username: string, password: string): Promise<void> {
    await this.fillCredentials(username, password);
    await this.submit();
  }
  errorMessage(): Locator { return this.page.locator('[data-test="error"]'); }
}
