import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
test("dashboard, configuration, exam and submission dialog meet automated WCAG checks", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByText("Questions practiced", { exact: true }),
  ).toBeVisible();
  const scan = async () => {
    const entering = page.locator("#main>div").first();
    if (await entering.count())
      await expect(entering).toHaveCSS("opacity", "1");
    await page.evaluate(() =>
      Promise.all(
        document
          .getAnimations()
          .filter((a) => a.effect?.getComputedTiming().iterations !== Infinity)
          .map((a) => a.finished.catch(() => {})),
      ),
    );
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(
      result.violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        nodes: v.nodes.map((n) => n.target),
      })),
    ).toEqual([]);
  };
  await scan();
  await page.goto("/practice?part=incomplete-sentences");
  await expect(
    page.getByRole("button", { name: "Start practice", exact: true }),
  ).toBeVisible();
  await scan();
  await page
    .getByRole("button", { name: "Start practice", exact: true })
    .click();
  await expect(page.getByRole("heading", { name: /Question 1/ })).toBeVisible();
  await scan();
  const trigger = page.getByRole("button", { name: "Open question navigator" });
  if (await trigger.isVisible()) {
    await trigger.click();
    await scan();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Review and submit" })
      .click();
  } else await page.getByRole("button", { name: "Review and submit" }).click();
  await expect(
    page.getByRole("dialog", { name: "Ready to finish?" }),
  ).toBeVisible();
  await scan();
  await expect(
    page.getByRole("button", { name: "Return to test" }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();
});
