import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test("validates the candidate name and resumes saved progress", async ({ page }) => {
  await page.getByRole("button", { name: "Start practice test" }).click();
  await expect(page.getByText("Enter your name to begin the practice test.")).toBeVisible();

  await page.getByLabel("Candidate name").fill("Morgan Ellis");
  await page.getByRole("button", { name: "Start practice test" }).click();
  await expect(page).toHaveURL(/\/test$/, { timeout: 15_000 });
  await expect(page.getByText("Question 1", { exact: false }).first()).toBeVisible();

  await page.getByRole("radio").first().check();
  await page.getByRole("button", { name: "Mark for review" }).click();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.reload();
  await expect(page.getByText("Question 2", { exact: false }).first()).toBeVisible();
  await page.goto("/");
  await expect(page.getByRole("button", { name: /Resume test/ })).toBeVisible();
  await expect(page.getByText("Morgan Ellis")).toBeVisible();
});

test("submits an incomplete attempt and opens answer review", async ({ page }) => {
  await page.getByLabel("Candidate name").fill("Avery Quinn");
  await page.getByRole("button", { name: "Start practice test" }).click();
  await expect(page).toHaveURL(/\/test$/);
  await expect(page.getByText("Question 1", { exact: false }).first()).toBeVisible();
  const mobileQuestions = page.getByRole("button", { name: "Questions" });
  if (await mobileQuestions.isVisible()) {
    await mobileQuestions.click();
    await page.getByRole("dialog", { name: "Question navigator" }).getByRole("button", { name: "Review and submit" }).click();
  } else {
    await page.getByRole("button", { name: "Review and submit" }).first().click();
  }
  await expect(page.getByText("100", { exact: true }).last()).toBeVisible();
  await page.getByRole("button", { name: "Submit test" }).click();
  await expect(page).toHaveURL(/\/results$/);
  await expect(page.getByText("10", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: /Review answers/ }).click();
  await expect(page).toHaveURL(/\/results\/review$/);
  await page.getByRole("button", { name: /Unanswered/ }).click();
  await expect(page.locator(".review-card")).toHaveCount(100);
});

test("uses the modal question navigator at a narrow viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByLabel("Candidate name").fill("Casey Rowe");
  await page.getByRole("button", { name: "Start practice test" }).click();
  await page.getByRole("button", { name: "Questions" }).click();
  const dialog = page.getByRole("dialog", { name: "Question navigator" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: /Question 50,/ }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByText("Question 50", { exact: false }).first()).toBeVisible();
});

test("recovers from a corrupt saved session", async ({ page }) => {
  await page.evaluate(() =>
    localStorage.setItem("practice-desk:active-attempt:v1", "{not-valid-json"),
  );
  await page.reload();
  await expect(page.getByText("Saved practice data could not be read.")).toBeVisible();
  await page.getByRole("button", { name: "Clear saved data" }).click();
  await expect(page.getByLabel("Candidate name")).toBeVisible();
});
