import { test, expect } from "@playwright/test";

test.describe("SPVS search filter", () => {
  test("filters requirements when a keyword is entered", async ({ page }) => {
    await page.goto("/spvs/requirements");

    const searchInput = page.getByLabel("Search requirements");
    await expect(searchInput).toBeVisible();

    // capture the first card before filtering
    const initialFirstCard = page.locator("article[role='button']").first();
    const initialText = await initialFirstCard.textContent();

    await searchInput.fill("Identity");
    await page.waitForTimeout(500); // allow fetch + rerender

    const filteredFirstCard = page.locator("article[role='button']").first();
    await expect(filteredFirstCard).toContainText("Identity");

    if (initialText && initialText.includes("Identity")) {
      await expect(page.getByText("Identity", { exact: false }).first()).toBeVisible();
    } else {
      await expect(filteredFirstCard).not.toHaveText(initialText ?? "");
    }
  });
});
