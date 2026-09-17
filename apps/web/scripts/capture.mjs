// Capturas de revisión Impeccable. Uso: node scripts/capture.mjs [baseUrl]
import { mkdirSync } from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const base = process.argv[2] ?? "http://localhost:5175";
const out = path.resolve(".impeccable/review");
mkdirSync(out, { recursive: true });

const TABS = ["inicio", "asesor", "metas", "historial"];

async function capture(name, viewport, tabs) {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 1, locale: "es-MX" });
  const page = await ctx.newPage();
  await page.goto(base, { waitUntil: "networkidle" });
  await page.waitForTimeout(4500);
  await page.screenshot({ path: path.join(out, `${name}.png`) });
  for (const tab of tabs) {
    const i = TABS.indexOf(tab);
    await page.locator('nav[aria-label="Secciones"] button').nth(i).click();
    await page.waitForTimeout(2600);
    await page.screenshot({ path: path.join(out, `${name}-${tab}.png`) });
  }
  await browser.close();
}

await capture("desktop", { width: 1440, height: 900 }, ["metas"]);
await capture("mobile", { width: 390, height: 844 }, ["asesor", "metas", "historial"]);
console.log(`ok → ${out}`);
