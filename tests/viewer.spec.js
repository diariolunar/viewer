import { test, expect } from "@playwright/test";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
async function sample(count = 5) {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (let i = 1; i <= count; i++) {
    const p = doc.addPage([420, 595]);
    p.drawRectangle({
      x: 0,
      y: 0,
      width: 420,
      height: 595,
      color: rgb(0.96, 0.95, 0.9),
    });
    p.drawText(`LUNAR - Page ${i}`, { x: 45, y: 480, size: 28, font });
    p.drawText("A book begins with a story.", {
      x: 45,
      y: 440,
      size: 16,
      font,
    });
  }
  return Buffer.from(await doc.save());
}
test("PDF rendering, navigation, single-page, zoom and replacement", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page
    .locator("#file")
    .setInputFiles({
      name: "meu-livro.pdf",
      mimeType: "application/pdf",
      buffer: await sample(),
    });
  await expect(page.locator("#filename")).toHaveText("meu-livro.pdf");
  await expect(page.locator(".pdf-page img")).toHaveCount(5);
  await expect(page.locator("#status")).toBeEmpty();
  await page.locator("#next").click();
  await expect(page.locator("#page-number")).toHaveValue("3");
  await page.locator("#page-number").fill("5");
  await page.locator("#page-number").press("Enter");
  await expect(page.locator("#page-number")).toHaveValue("5");
  await page.locator("#single-mode").click();
  await expect(page.locator(".pdf-page img")).toHaveCount(5);
  await expect(page.locator("#single-mode")).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.locator("#prev").click();
  await expect(page.locator("#page-number")).toHaveValue("4");
  await page.locator("#zoom-in").click();
  await expect(page.locator("#zoom-value")).toHaveText("110%");
  await page
    .locator("#file")
    .setInputFiles({
      name: "outro.pdf",
      mimeType: "application/pdf",
      buffer: await sample(1),
    });
  await expect(page.locator("#page-total")).toHaveText("de 1");
  await expect(page.locator(".pdf-page img")).toHaveCount(1);
  await expect(page.locator("#next")).toBeDisabled();
  expect(errors).toEqual([]);
  await page.screenshot({ path: "test-results/desktop.png", fullPage: true });
});
test("invalid PDFs show an actionable error", async ({ page }) => {
  await page.goto("/");
  await page
    .locator("#file")
    .setInputFiles({
      name: "quebrado.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("not a pdf"),
    });
  await expect(page.locator("#status")).toContainText("Não foi possível abrir");
  await expect(page.locator("#upload-section")).toBeVisible();
});
test("mobile reader stays within viewport and supports navigation", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page
    .locator("#file")
    .setInputFiles({
      name: "mobile.pdf",
      mimeType: "application/pdf",
      buffer: await sample(3),
    });
  await expect(page.locator(".pdf-page img")).toHaveCount(3);
  await page.locator("#next").click();
  await expect(page.locator("#page-number")).toHaveValue("2");
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
  await page.screenshot({ path: "test-results/mobile.png", fullPage: true });
});
