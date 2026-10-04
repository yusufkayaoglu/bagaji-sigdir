import { test, expect } from "@playwright/test";

async function load(page) {
  await page.goto("/");
  await expect(page.locator(".game")).not.toHaveClass(/loading/);
  return page.locator(".game").boundingBox();
}
async function drag(page, bounds, to) {
  const bag = await page.locator(".suitcase").boundingBox();
  await page.mouse.move(bag.x + bag.width / 2, bag.y + bag.height / 2);
  await page.mouse.down();
  await page.mouse.move(
    bounds.x + bounds.width * to[0],
    bounds.y + bounds.height * to[1],
    { steps: 12 },
  );
  await page.mouse.up();
}

test("valid drop settles once, updates progress, and replay restores the scene", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const bounds = await load(page);
  await page.screenshot({ path: "test-results/scene-before.png" });
  await drag(page, bounds, [0.4, 0.42]);
  await expect(page.locator("#count")).toHaveText("1 / 5");
  await expect(page.locator(".suitcase")).toBeDisabled();
  await expect(page.getByRole("status")).toHaveText("Tam yerine oturdu!");
  await page.screenshot({ path: "test-results/scene-after.png" });
  await page.getByRole("button", { name: "Yeniden dene" }).click();
  await expect(page.locator("#count")).toHaveText("0 / 5");
  await expect(page.locator(".suitcase")).toBeEnabled();
  expect(
    parseFloat(
      await page
        .locator(".suitcase")
        .evaluate((el) => getComputedStyle(el).left),
    ),
  ).toBeCloseTo(bounds.width * 0.122, 1);
  expect(errors).toEqual([]);
});

test("invalid drop returns home without advancing progress", async ({
  page,
}) => {
  const bounds = await load(page);
  await drag(page, bounds, [0.8, 0.7]);
  await expect(page.getByRole("status")).toHaveText(
    "Eşyayı açık bagajın içine bırak",
  );
  await expect(page.locator("#count")).toHaveText("0 / 5");
  const style = await page.locator(".suitcase").getAttribute("style");
  expect(style).toContain("left: 12.2%");
  await drag(page, bounds, [0.4, 0.42]);
  await expect(page.locator("#count")).toHaveText("1 / 5");
});

test("keyboard and reduced motion allow placement", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await load(page);
  await page.locator(".suitcase").focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#count")).toHaveText("1 / 5");
});

test("touch drag works at a small mobile viewport", async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 360, height: 740 },
    hasTouch: true,
    isMobile: true,
  });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:5174");
  await expect(page.locator(".game")).not.toHaveClass(/loading/);
  const bounds = await page.locator(".game").boundingBox();
  const bag = await page.locator(".suitcase").boundingBox();
  const session = await context.newCDPSession(page);
  const start = { x: bag.x + bag.width / 2, y: bag.y + bag.height / 2 };
  const end = {
    x: bounds.x + bounds.width * 0.4,
    y: bounds.y + bounds.height * 0.42,
  };
  await session.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ ...start, id: 1 }],
  });
  await session.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [{ ...end, id: 1 }],
  });
  await session.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await expect(page.locator("#count")).toHaveText("1 / 5");
  await context.close();
});

test("cancelled touch returns without getting stuck", async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:5174");
  await expect(page.locator(".game")).not.toHaveClass(/loading/);
  const bag = await page.locator(".suitcase").boundingBox();
  const session = await context.newCDPSession(page);
  await session.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [
      { x: bag.x + bag.width / 2, y: bag.y + bag.height / 2, id: 1 },
    ],
  });
  await session.send("Input.dispatchTouchEvent", {
    type: "touchCancel",
    touchPoints: [],
  });
  await expect(page.getByRole("status")).toHaveText(
    "Eşyayı açık bagajın içine bırak",
  );
  await expect(page.locator("#count")).toHaveText("0 / 5");
  await page.locator(".suitcase").focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#count")).toHaveText("1 / 5");
  await context.close();
});

test("all five items finish in any order; inflated flamingo is rejected and reset restores it", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const bounds = await load(page);
  await page.screenshot({ path: "test-results/five-before.png" });
  const flame = page.locator('[data-item="flamingo"]');
  await flame.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#count")).toHaveText("0 / 5");
  await expect(page.getByRole("status")).toContainText("çok büyük");
  for (const [index, id] of ["purple", "ball", "yellow", "red"].entries()) {
    const item = page.locator(`[data-item="${id}"]`),
      b = await item.boundingBox();
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
    await page.mouse.down();
    await page.mouse.move(
      bounds.x + bounds.width * 0.5,
      bounds.y + bounds.height * 0.42,
      { steps: 10 },
    );
    await page.mouse.up();
    await expect(page.locator("#count")).toHaveText(`${index + 1} / 5`);
    await expect(item).toBeDisabled();
  }
  await page
    .getByRole("button", { name: "Flamingonun havasını indir" })
    .click();
  await expect(flame).toHaveClass(/deflated/);
  const b = await flame.boundingBox();
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
  await page.mouse.down();
  await page.mouse.move(
    bounds.x + bounds.width * 0.55,
    bounds.y + bounds.height * 0.47,
    { steps: 10 },
  );
  await page.mouse.up();
  await expect(page.locator("#count")).toHaveText("5 / 5");
  await expect(page.locator("h1")).toHaveText("HEPSİ SIĞDI!");
  await expect(page.locator(".dots .filled")).toHaveCount(5);
  await page.screenshot({ path: "test-results/five-complete.png" });
  const rectangles = await page.locator(".item").evaluateAll((els) =>
    els.map((el) => {
      const r = el.getBoundingClientRect();
      return { x: r.x, y: r.y, w: r.width, h: r.height };
    }),
  );
  for (let i = 0; i < rectangles.length; i++)
    for (let j = i + 1; j < rectangles.length; j++) {
      const a = rectangles[i],
        b = rectangles[j];
      const overlapX = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
      const overlapY = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
      expect(overlapX > 1 && overlapY > 1).toBe(false);
    }
  await page.getByRole("button", { name: "Yeniden dene" }).click();
  await expect(page.locator("#count")).toHaveText("0 / 5");
  await expect(page.locator(".item:disabled")).toHaveCount(0);
  await expect(flame).not.toHaveClass(/deflated/);
  await expect(
    page.getByRole("button", { name: "Flamingonun havasını indir" }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test("flamingo can be deflated and packed first with reduced motion", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await load(page);
  await page
    .getByRole("button", { name: "Flamingonun havasını indir" })
    .click();
  await expect(page.locator('[data-item="flamingo"]')).toHaveClass(/deflated/);
  for (const [n, id] of [
    "flamingo",
    "red",
    "yellow",
    "purple",
    "ball",
  ].entries()) {
    await page.locator(`[data-item="${id}"]`).focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("#count")).toHaveText(`${n + 1} / 5`);
  }
});

test("reset during placement cancels pending state updates", async ({
  page,
}) => {
  await load(page);
  await page.locator('[data-item="red"]').focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#count")).toHaveText("1 / 5");
  await page.locator('[data-item="yellow"]').focus();
  await page.keyboard.press("Enter");
  await page.getByRole("button", { name: "Yeniden dene" }).click();
  // Wait beyond the interrupted animation to catch stale completion callbacks.
  await page.waitForTimeout(650);
  await expect(page.locator("#count")).toHaveText("0 / 5");
  await expect(page.locator(".in-trunk")).toHaveCount(0);
  await page.locator('[data-item="yellow"]').focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#count")).toHaveText("1 / 5");
});

test("reset during deflation restores the inflated item and unlocks input", async ({
  page,
}) => {
  await load(page);
  await page.locator('[data-item="red"]').focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#count")).toHaveText("1 / 5");
  await page.locator(".valve").click();
  await page.getByRole("button", { name: "Yeniden dene" }).click();
  await page.waitForTimeout(1050);
  await expect(page.locator("#count")).toHaveText("0 / 5");
  await expect(page.locator('[data-item="flamingo"]')).not.toHaveClass(
    /deflat/,
  );
  await expect(page.locator(".valve")).toBeEnabled();
  await page.locator(".valve").click();
  await expect(page.locator('[data-item="flamingo"]')).toHaveClass(/deflated/);
});

test("viewport resize cancels an active drag without trapping pointer input", async ({
  page,
}) => {
  await load(page);
  const bag = await page.locator('[data-item="purple"]').boundingBox();
  await page.mouse.move(bag.x + bag.width / 2, bag.y + bag.height / 2);
  await page.mouse.down();
  await page.mouse.move(bag.x, bag.y - 100);
  await page.setViewportSize({ width: 430, height: 900 });
  await page.mouse.up();
  await expect(page.locator(".held")).toHaveCount(0);
  await expect(page.getByRole("status")).toHaveText(
    "Eşyayı açık bagajın içine bırak",
  );
  await page.locator('[data-item="purple"]').focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#count")).toHaveText("1 / 5");
});
