import { test, expect } from "@playwright/test";

test.describe("SPVS flows", () => {
  test("navigates to the requirements explorer and opens ticket modal", async ({
    page
  }) => {
    await page.goto("/spvs/requirements");

    await expect(page.getByRole("heading", { name: /spvs requirements/i })).toBeVisible();

    // Apply a simple search filter to prime the UI.
    await page.getByLabel("Search requirements").fill("Identity");

    // Wait for cards to render and select the first one.
    const firstCard = page.getByRole("button", { name: /v/i }).first();
    await firstCard.click();

    // Open the ticket modal via the bulk action banner.
    await page.getByRole("button", { name: /send to ticket system/i }).click();
    await expect(page.getByRole("dialog")).toBeVisible();

    // Close modal to wrap up the smoke test.
    await page.getByRole("button", { name: /cancel/i }).click();
  });
});
