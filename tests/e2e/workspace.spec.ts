import { test, expect } from "@playwright/test";
test("workspace routes and preferences work without narrow-screen overflow", async ({
  page,
}, info) => {
  const pages = [
    ["/", "Learning overview"],
    ["/practice", "Practice studio"],
    ["/mock-tests", "Mock tests"],
    ["/progress", "My progress"],
    ["/review", "Review library"],
    ["/account", "Account & preferences"],
  ] as const;
  for (const [route, title] of pages) {
    await page.goto(route);
    await expect(
      page.getByRole("heading", { name: title, exact: true }),
    ).toBeVisible();
    await expect(page.locator(".loading-state")).toHaveCount(0);
    await expect(page.locator(".error-state")).toHaveCount(0);
    await expect(page.locator("#main>div")).toHaveCSS("opacity", "1");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: info.outputPath((route.slice(1) || "dashboard") + ".png"),
      fullPage: true,
    });
  }
  await page.getByLabel("Target accuracy (%)", { exact: true }).fill("80");
  await page.getByLabel("Weekly question target", { exact: true }).fill("40");
  await page.getByRole("button", { name: "Save preferences" }).click();
  await expect(page.getByRole("status")).toContainText("Preferences saved");
  await page.reload();
  await expect(
    page.getByLabel("Target accuracy (%)", { exact: true }),
  ).toHaveValue("80");
  await expect(
    page.getByLabel("Weekly question target", { exact: true }),
  ).toHaveValue("40");
  await page.goto("/account?signin=failed");
  await expect(page.locator(".inline-alert")).toContainText(
    "Google sign-in could not be completed",
  );
});
