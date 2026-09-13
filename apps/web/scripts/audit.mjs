// Auditoría visual/funcional con Playwright. Uso: node scripts/audit.mjs [baseUrl]
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import path from "node:path";

const base = process.argv[2] ?? "http://localhost:5175";
const out = path.resolve("../../.impeccable/review/audit");
mkdirSync(out, { recursive: true });

const report = { console: [], pageErrors: [], failedRequests: [], stepFailures: [], checks: {} };

async function step(name, label, fn) {
  try {
    await fn();
  } catch (e) {
    report.stepFailures.push(`[${name}] ${label}: ${String(e.message).split("\n").slice(0, 6).join(" | ").slice(0, 500)}`);
  }
}

async function audit(name, viewport) {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 2, locale: "es-MX" });
  const page = await ctx.newPage();
  page.on("console", (m) => {
    if (m.type() === "error" || m.type() === "warning")
      report.console.push(`[${name}] ${m.type()}: ${m.text().slice(0, 400)}`);
  });
  page.on("pageerror", (e) => report.pageErrors.push(`[${name}] ${e.message.slice(0, 400)}`));
  page.on("requestfailed", (r) =>
    report.failedRequests.push(`[${name}] ${r.method()} ${r.url()} ${r.failure()?.errorText}`),
  );

  const shot = (label, opts = {}) =>
    page.screenshot({ path: path.join(out, `${name}-${label}.png`), ...opts });

  const check = async (label) => {
    const r = await page.evaluate(() => {
      const over = [];
      const small = [];
      const clipped = [];
      const contrast = [];
      const lum = (c) => {
        const m = c.match(/\d+(\.\d+)?/g)?.map(Number) ?? [0, 0, 0, 1];
        const [r, g, b] = m.map((v) => {
          v /= 255;
          return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
        });
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
      };
      const bg = (el) => {
        let e = el;
        while (e) {
          const c = getComputedStyle(e).backgroundColor;
          if (c && !/rgba\(0, 0, 0, 0\)|transparent/.test(c) && !/rgba\([^)]*, 0(\.\d+)?\)$/.test(c)) return c;
          e = e.parentElement;
        }
        return "rgb(255,255,255)";
      };
      document.querySelectorAll("body *").forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) return;
        const cs = getComputedStyle(el);
        if (r.right > innerWidth + 1 || r.left < -1)
          over.push(`${el.tagName}.${String(el.className).slice(0, 40)} l=${r.left | 0} r=${r.right | 0}`);
        if (el.matches("button, a, [role=button], input, [tabindex]") && (r.width < 40 || r.height < 40))
          small.push(`${el.tagName} "${(el.getAttribute("aria-label") || el.textContent || "").trim().slice(0, 30)}" ${r.width | 0}x${r.height | 0}`);
        if (el.scrollWidth > el.clientWidth + 2 && cs.overflowX === "hidden" && cs.textOverflow !== "ellipsis" && el.children.length === 0 && el.textContent.trim())
          clipped.push(`${el.tagName} "${el.textContent.trim().slice(0, 40)}" sw=${el.scrollWidth} cw=${el.clientWidth}`);
        if (el.children.length === 0 && el.textContent.trim().length > 1 && cs.visibility !== "hidden" && Number(cs.opacity) > 0.9) {
          const fg = cs.color;
          const b = bg(el);
          const L1 = lum(fg);
          const L2 = lum(b);
          const ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
          const size = parseFloat(cs.fontSize);
          const bold = parseInt(cs.fontWeight, 10) >= 700;
          const large = size >= 24 || (size >= 18.66 && bold);
          if (ratio < (large ? 3 : 4.5) && !/rgba\([^)]*, 0\.\d+\)/.test(b))
            contrast.push(`${ratio.toFixed(2)} "${el.textContent.trim().slice(0, 30)}" ${fg} on ${b} ${size}px`);
        }
      });
      return {
        vw: innerWidth,
        vh: innerHeight,
        docW: document.documentElement.scrollWidth,
        layout: document.querySelector("[data-layout]")?.getAttribute("data-layout") ?? null,
        over: over.slice(0, 15),
        small: small.slice(0, 15),
        clipped: clipped.slice(0, 15),
        contrast: [...new Set(contrast)].slice(0, 20),
      };
    });
    report.checks[`${name}:${label}`] = r;
  };

  await page.goto(base, { waitUntil: "networkidle" });
  await page.waitForTimeout(3500);
  await shot("home");
  await check("home");
  await shot("home-full", { fullPage: true });

  // Expandir tarjeta de saldo
  await step(name, "balance", async () => {
    const ink = page.getByRole("button", { name: /Tu dinero hoy/ }).first();
    if (!(await ink.count())) return;
    await ink.click({ timeout: 5000 });
    await page.waitForTimeout(900);
    await shot("home-balance-open");
    await check("balance-open");
    await ink.click({ timeout: 5000 });
    await page.waitForTimeout(600);
  });

  // Expandir salud
  await step(name, "health", async () => {
    const health = page.getByRole("button", { name: /Salud financiera/ }).first();
    if (!(await health.count())) return;
    await health.click({ timeout: 5000 });
    await page.waitForTimeout(900);
    await shot("home-health-open");
    await health.click({ timeout: 5000 });
    await page.waitForTimeout(600);
  });

  // MCP panel
  await step(name, "mcp", async () => {
    const mcp = page.getByRole("button", { name: /Actividad MCP/ }).first();
    if (!(await mcp.count())) return;
    await mcp.click({ timeout: 5000 });
    await page.waitForTimeout(900);
    await shot("mcp-open");
    await check("mcp-open");
    await page.keyboard.press("Escape");
    await page.waitForTimeout(1200);
    const dialog = page.getByRole("dialog");
    if (await dialog.count()) {
      report.stepFailures.push(`[${name}] mcp: Escape no cierra la hoja MCP`);
      const close = dialog.getByRole("button", { name: /cerrar/i }).first();
      if (await close.count()) await close.click({ timeout: 5000, force: true });
      else await page.mouse.click(10, 10);
      await page.waitForTimeout(1200);
    }
  });

  // Tabs
  for (const tab of ["Asesor", "Metas", "Historial"]) {
    await step(name, `tab-${tab}`, async () => {
      const b = page.getByRole("button", { name: tab, exact: true }).first();
      if (!(await b.count())) return;
      await b.click({ timeout: 5000 });
      await page.waitForTimeout(1200);
      await shot(`tab-${tab.toLowerCase()}`);
      await check(`tab-${tab.toLowerCase()}`);
    });
  }

  // Metas: abrir formulario
  await step(name, "metas-form", async () => {
    await page.getByRole("button", { name: "Metas", exact: true }).first().click({ timeout: 5000 });
    await page.waitForTimeout(600);
    const nuevaMeta = page.getByRole("button", { name: /nueva meta|crear meta|agregar/i }).first();
    if (!(await nuevaMeta.count())) return;
    await nuevaMeta.click({ timeout: 5000 });
    await page.waitForTimeout(800);
    await shot("metas-form");
    await check("metas-form");
  });

  // Volver a inicio y escribir en la barra
  await step(name, "ask", async () => {
    await page.getByRole("button", { name: "Inicio", exact: true }).first().click({ timeout: 5000 });
    await page.waitForTimeout(800);
    const input = page.getByRole("textbox").first();
    await input.fill("¿Me alcanza para un Mazda 3?");
    await page.waitForTimeout(300);
    await shot("typing");
    await input.press("Enter");
    await page.waitForTimeout(1500);
    await shot("thinking");
    await check("thinking");
    await page.waitForTimeout(14000);
    await shot("answer");
    await shot("answer-full", { fullPage: true });
    await check("answer");
  });

  // Cambiar de perfil
  await step(name, "profile", async () => {
    const profile = page.getByRole("button", { name: /Cambiar de perfil/ }).first();
    if (!(await profile.count())) return;
    await profile.click({ timeout: 5000 });
    await page.waitForTimeout(700);
    await shot("profile-menu");
    await page.keyboard.press("Escape");
  });

  // Foco por teclado
  await step(name, "focus", async () => {
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await page.waitForTimeout(200);
    await shot("focus");
  });

  await browser.close();
}

await audit("mobile", { width: 390, height: 844 });
await audit("desktop", { width: 1440, height: 900 });
await audit("tablet", { width: 820, height: 1180 });

console.log(JSON.stringify(report, null, 2));
