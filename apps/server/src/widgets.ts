import { type Widget, type WidgetType, widgetDescriptions, widgetSchemas } from "@camaleon/shared";
import { type ToolSet, tool } from "ai";
import { z } from "zod";

/**
 * El catálogo como tools.
 *
 * Cada widget es una tool independiente con esquema PLANO. Nada de árboles
 * recursivos ni uniones discriminadas: los modelos las manejan mal. Aquí,
 * llamar la tool ES pintar el widget, y el orden de las llamadas es el orden
 * en que aparecen en pantalla.
 */

export type PaintFn = (widget: Widget) => void;
export type SavePlanFn = (input: {
  title: string;
}) => Promise<{ ok: boolean; planId: number; widgets: number }>;

const TYPES = Object.keys(widgetSchemas) as WidgetType[];

export function widgetTools(paint: PaintFn, savePlan?: SavePlanFn): ToolSet {
  const tools: ToolSet = {};

  for (const type of TYPES) {
    tools[`paint_${type}`] = tool({
      description: widgetDescriptions[type],
      inputSchema: widgetSchemas[type],
      execute: async (props: Record<string, unknown>) => {
        const id = typeof props.id === "string" && props.id ? props.id : autoId(type);
        paint({ id, type, props } as Widget);
        return { painted: type, id };
      },
    });
  }

  if (savePlan) {
    tools.save_plan = tool({
      description:
        "Guarda en 'Mis planes' todo lo pintado en esta respuesta bajo un título corto. Úsala SOLO cuando el usuario pida guardar el plan o cuando armaste un plan completo con pasos y montos.",
      inputSchema: z.object({ title: z.string().min(3).max(80) }),
      execute: savePlan,
    });
  }

  return tools;
}

let counter = 0;
function autoId(type: string) {
  counter += 1;
  return `${type}-${counter}`;
}
