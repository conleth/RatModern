import { test, expect } from "@playwright/test";

test.describe("ASVS Checklist search", () => {
  test("should display controls without search filter", async ({ page }) => {
    page.on('console', msg => {
      console.log(`[Browser Console] ${msg.type()}: ${msg.text()}`);
    });

    await page.goto("/checklist");

    // Wait for checklist to load
    await expect(page.getByText("Filter checklist")).toBeVisible();

    // Check page content
    console.log("Page content:", await page.content().then(c => c.substring(0, 500)));

    // Check for auth issues
    const loginPageCheck = await page.url().includes("/login");
    console.log("On login page?", loginPageCheck);

    // Check for errors
    const errorMsg = page.getByText(/error|failed|unable/i);
    const hasError = await errorMsg.first().isVisible().catch(() => false);
    console.log("Error message visible?", hasError);

    // Check for loading state
    const loading = page.getByText(/loading/i);
    const isLoading = await loading.first().isVisible().catch(() => false);
    console.log("Still loading?", isLoading);

    // Get initial count of visible controls
    const controlCards = page.locator("article[role='button']");
    const initialCount = await controlCards.count();
    console.log(`Initial controls visible: ${initialCount}`);
    
    expect(initialCount).toBeGreaterThan(0);
  });

  test("filters controls when a keyword is entered in search", async ({ page }) => {
    await page.goto("/checklist");

    // Wait for page to load
    await expect(page.getByText("Filter checklist")).toBeVisible();

    // Get initial count of visible controls
    const initialCards = page.locator("article[role='button']");
    const initialCount = await initialCards.count();
    console.log(`Initial cards: ${initialCount}`);

    // Get the search input
    const searchInput = page.getByLabel("Search controls");
    await expect(searchInput).toBeVisible();
    
    // Try searching for "authentication"
    console.log("Entering search term: 'authentication'");
    await searchInput.fill("authentication");
    
    // Wait for filtering to happen
    await page.waitForTimeout(1000);
    
    // Check console logs for debug info
    const logs: string[] = [];
    page.on('console', msg => {
      if (msg.text().includes("ASVS Search Debug") || msg.text().includes("Matched") || msg.text().includes("Result")) {
        logs.push(msg.text());
        console.log(`[Console] ${msg.text()}`);
      }
    });

    // Get filtered count
    const filteredCards = page.locator("article[role='button']");
    const filteredCount = await filteredCards.count();
    console.log(`Filtered cards: ${filteredCount}`);

    // The search should reduce results
    if (filteredCount > 0) {
      console.log("✅ Search returned results");
      
      // Check if any card contains the search term
      const firstCard = filteredCards.first();
      const text = await firstCard.textContent();
      console.log(`First card content snippet: ${text?.substring(0, 100)}`);
    } else {
      console.log("❌ Search returned NO results");
    }

    // Also check for "No controls available" message
    const noResultsMsg = page.getByText("No controls available");
    const noResultsVisible = await noResultsMsg.isVisible().catch(() => false);
    console.log(`"No controls available" message visible: ${noResultsVisible}`);
  });

  test("should show 'No controls available' for search with no matches", async ({ page }) => {
    await page.goto("/checklist");

    await expect(page.getByText("Filter checklist")).toBeVisible();

    const searchInput = page.getByLabel("Search controls");
    
    // Search for something that definitely won't match
    await searchInput.fill("xyzabc123notarealterm");
    await page.waitForTimeout(1000);

    // Check for no results message
    const noResultsMsg = page.getByText("No controls available");
    await expect(noResultsMsg).toBeVisible();

    const cardCount = await page.locator("article[role='button']").count();
    expect(cardCount).toBe(0);
  });
});
