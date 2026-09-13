import { getSessionByToken } from "@camaleon/db/queries";
import type { Context, Next } from "hono";
import type { AppEnv } from "./index";

/**
 * Sesión simple por token opaco: sin JWT, sin firma. El token vive en la
 * tabla `sessions` y aquí solo se resuelve a un userId o se corta con 401.
 */
export async function requireAuth(c: Context<AppEnv>, next: Next) {
  const header = c.req.header("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  const session = token ? await getSessionByToken(token) : null;

  if (!session) return c.json({ error: "No autorizado" }, 401);

  c.set("userId", session.userId);
  await next();
}
