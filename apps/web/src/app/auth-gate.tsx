import { useEffect } from "react";
import { LoginScreen } from "../auth/login-screen";
import { useAuth } from "../auth/store";
import { useCanvas } from "../canvas/store";
import { AppRoot } from "./app-root";
import { AppShell } from "./app-shell";

/**
 * Única puerta de la app: sin sesión se ve `LoginScreen`, con sesión el resto
 * de la app tal cual. `useCanvas.userId` (el "perfil demo" de antes) se
 * sincroniza aquí para que el resto de pantallas no tenga que saber que ahora
 * existe `useAuth`.
 *
 * `AppRoot` no monta hasta que `userId` ya coincide con el usuario logueado:
 * si se montara con el `userId` vacío del store, el `/home` que dispara
 * `CanvasScreen` al montarse saldría con un userId inválido (su efecto corre
 * antes que este, porque React dispara los efectos de hijos primero).
 */
export function AuthGate() {
  const token = useAuth((s) => s.token);
  const user = useAuth((s) => s.user);
  const canvasUserId = useCanvas((s) => s.userId);
  const setUserId = useCanvas((s) => s.setUserId);

  useEffect(() => {
    if (user && user.id !== canvasUserId) setUserId(user.id);
  }, [user, canvasUserId, setUserId]);

  const ready = Boolean(token && user && canvasUserId === user.id);

  return <AppShell>{ready ? <AppRoot /> : <LoginScreen />}</AppShell>;
}
