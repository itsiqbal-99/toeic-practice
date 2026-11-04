import { expect, test, type Page } from "@playwright/test";
import type { Attempt, StartInput } from "@toeic/shared";
async function start(page: Page, input: StartInput): Promise<Attempt> {
  await page.goto("/");
  await expect(
    page.getByText("Questions practiced", { exact: true }),
  ).toBeVisible();
  const response = await page.request.post("/api/v1/attempts", {
    headers: { Origin: "http://127.0.0.1:3000", "X-Toeic-Client": "1" },
    data: input,
  });
  expect(response.ok()).toBe(true);
  const a = (await response.json()) as Attempt;
  await page.goto("/test?attempt=" + a.id);
  await expect(page.getByRole("heading", { name: /Question 1/ })).toBeVisible();
  return a;
}
async function navigator(page: Page) {
  await expect(page.locator(".exam-header")).toBeVisible();
  const trigger = page.getByRole("button", { name: "Open question navigator" });
  if (await trigger.isVisible()) {
    await trigger.click();
    return page.getByRole("dialog", { name: "Question navigator" });
  }
  return page.locator(".exam-sidebar");
}
async function finish(page: Page) {
  const sheet = await navigator(page);
  await sheet.getByRole("button", { name: "Review and submit" }).click();
  const dialog = page.getByRole("dialog", { name: "Ready to finish?" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Submit session" }).click();
  await expect(
    page.getByRole("heading", { name: "Session results", exact: true }),
  ).toBeVisible();
}
test("first-time dashboard has honest metrics and functional setup", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Learning overview" }),
  ).toBeVisible();
  await expect(
    page.locator(".stat-card").first().locator(".stat-value"),
  ).toHaveText("001");
  await expect(
    page.getByRole("heading", { name: "Start with a short diagnostic." }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Your progress starts here" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Take a quick test" }).click();
  await page
    .getByRole("button", { name: "Start quick test", exact: true })
    .click();
  await expect(page.getByRole("heading", { name: /Question 1/ })).toBeVisible();
  await expect(page.locator(".exam-progress")).toHaveAttribute(
    "aria-valuenow",
    "0",
  );
  expect(errors).toEqual([]);
});
test("answers, review markers and question position survive refresh and resume", async ({
  page,
}) => {
  await start(page, {
    mode: "focused",
    part: "incomplete-sentences",
    count: 5,
    immediate: false,
  });
  await page.getByRole("radio").first().check();
  await expect(page.getByRole("status", { name: "Save status" })).toContainText(
    "Saved",
  );
  await page
    .getByRole("button", { name: "Mark for review", exact: true })
    .click();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.getByRole("heading", { name: /Question 2/ })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: /Question 2/ })).toBeVisible();
  await expect(page.locator(".exam-progress")).toHaveAttribute(
    "aria-valuenow",
    "1",
  );
  await page.goto("/");
  await page.getByRole("link", { name: "Resume session" }).click();
  const sheet = await navigator(page);
  await sheet
    .getByRole("button", { name: "Question 1, answered, marked", exact: true })
    .click();
  await expect(page.getByRole("radio").first()).toBeChecked();
});
test("incomplete submission creates real history and filtered answer review", async ({
  page,
}) => {
  await start(page, { mode: "quick", count: 12 });
  await finish(page);
  await expect(page.locator(".result-counts")).toContainText("12");
  await page.getByRole("link", { name: "Review answers", exact: true }).click();
  await page.getByRole("button", { name: "Unanswered", exact: true }).click();
  await expect(page.getByText("12 matching questions")).toBeVisible();
  await expect(page.locator(".explanation")).not.toBeEmpty();
  await page.goto("/");
  await expect(page.getByRole("heading",{name:"Check in with a quick test."})).toBeVisible();
  await expect(
    page.locator(".stat-card").first().locator(".stat-value"),
  ).toHaveText("101");
  await expect(
    page.getByRole("link", { name: /12-question quick test/ }),
  ).toBeVisible();
});
test("mobile question navigation separates position from answered progress", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await start(page, { mode: "mock" });
  const sheet = await navigator(page);
  await sheet
    .getByRole("button", { name: "Question 80, unanswered", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: /Question 80/ }),
  ).toBeVisible();
  await expect(page.locator(".exam-progress")).toHaveAttribute(
    "aria-valuenow",
    "0",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
test("unsynced answers survive refresh and can be retried", async ({
  page,
}) => {
  const a = await start(page, {
    mode: "focused",
    part: "incomplete-sentences",
    count: 5,
  });
  await page.route("**/api/v1/attempts/*/answers/*", (route) =>
    route.abort("failed"),
  );
  await page.getByRole("radio").first().check();
  await expect(page.getByRole("button", { name: "Retry save" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("radio").first()).toBeChecked();
  await expect(page.getByRole("button", { name: "Retry save" })).toBeVisible();
  await page.unroute("**/api/v1/attempts/*/answers/*");
  await page.getByRole("button", { name: "Retry save" }).click();
  await expect(page.getByRole("status", { name: "Save status" })).toContainText(
    "Saved",
  );
  expect(
    await page.evaluate(
      (id) => localStorage.getItem("toeic:pending:" + id),
      a.id,
    ),
  ).toBeNull();
});
test("reading documents render clearly and listening errors remain recoverable", async ({
  page,
}) => {
  await start(page, { mode: "focused", part: "multiple-passage", count: 3 });
  await expect(page.locator(".passage-card")).toHaveCount(2);
  await expect(page.locator(".passage-copy").first()).not.toBeEmpty();
  await page.route("**/audio/*.mp3", (route) => route.abort());
  await start(page, { mode: "focused", part: "photographs", count: 1 });
  await expect(page.locator(".question-image img")).toBeVisible();
  await expect(page.locator(".audio-error")).toContainText(
    "audio could not play",
  );
  await expect(page.getByRole("radio").first()).toBeEnabled();
  await page.getByRole("radio").first().check();
  await expect(page.getByRole("radio").first()).toBeChecked();
});
test("keyboard answers and reduced motion remain usable", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await start(page, {
    mode: "focused",
    part: "incomplete-sentences",
    count: 1,
  });
  const first = page.getByRole("radio").first();
  await first.focus();
  await page.keyboard.press("Space");
  await expect(first).toBeChecked();
  await expect(page.getByRole("status", { name: "Save status" })).toContainText(
    "Saved",
  );
  await finish(page);
  expect(
    await page
      .locator(".bar-track>span")
      .first()
      .evaluate((el) => parseFloat(getComputedStyle(el).transitionDuration)),
  ).toBeLessThan(0.01);
});
test("stale edits require explicit conflict resolution", async ({ page }) => {
  const a = await start(page, {
    mode: "focused",
    part: "incomplete-sentences",
    count: 5,
  });
  await page.request.patch(`/api/v1/attempts/${a.id}/progress`, {
    headers: { Origin: "http://127.0.0.1:3000", "X-Toeic-Client": "1" },
    data: { revision: 0, currentIndex: 2 },
  });
  await page.getByRole("radio").first().check();
  await expect(page.locator(".inline-alert")).toContainText(
    "changed in another tab",
  );
  await page.getByRole("button", { name: "Use server’s saved state" }).click();
  await expect(page.getByRole("heading", { name: /Question 3/ })).toBeVisible();
  await expect(page.locator(".exam-progress")).toHaveAttribute(
    "aria-valuenow",
    "0",
  );
});
