import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("landing and active test have no serious accessibility violations", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  const landing = await new AxeBuilder({ page }).analyze();
  expect(landing.violations.filter((violation) => ["critical", "serious"].includes(violation.impact ?? ""))).toEqual([]);

  await page.getByLabel("Candidate name").fill("Accessibility Check");
  await page.getByRole("button", { name: "Start practice test" }).click();
  await expect(page).toHaveURL(/\/test$/, { timeout: 15_000 });
  const activeTest = await new AxeBuilder({ page }).analyze();
  expect(activeTest.violations.filter((violation) => ["critical", "serious"].includes(violation.impact ?? ""))).toEqual([]);
});
