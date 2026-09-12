/**
 * Catálogo de mentira para el selector de "Fuente de datos" en Ajustes.
 * No hay ninguna conexión real a Snowflake: son strings estáticos que dejan
 * el campo (`dataSourceId`) listo para cuando esa conexión exista de verdad.
 */

export type MockTable = { id: string; label: string };
export type MockSchema = { id: string; label: string; tables: MockTable[] };
export type MockWarehouse = { id: string; label: string; schemas: MockSchema[] };

export const MOCK_DATA_SOURCES: MockWarehouse[] = [
  {
    id: "raw",
    label: "RAW",
    schemas: [
      {
        id: "transacciones",
        label: "transacciones",
        tables: [
          { id: "movimientos_2026", label: "movimientos_2026" },
          { id: "movimientos_2025", label: "movimientos_2025" },
        ],
      },
      {
        id: "clientes",
        label: "clientes",
        tables: [
          { id: "perfiles", label: "perfiles" },
          { id: "kyc", label: "kyc" },
        ],
      },
    ],
  },
  {
    id: "analytics",
    label: "ANALYTICS",
    schemas: [
      {
        id: "finanzas",
        label: "finanzas",
        tables: [
          { id: "gasto_por_categoria", label: "gasto_por_categoria" },
          { id: "metas_progreso", label: "metas_progreso" },
        ],
      },
      {
        id: "productos",
        label: "productos",
        tables: [{ id: "cross_sell_scores", label: "cross_sell_scores" }],
      },
    ],
  },
];

export function parseDataSourceId(
  id: string | null,
): { warehouseId: string; schemaId: string; tableId: string } | null {
  if (!id) return null;
  const [warehouseId, schemaId, tableId] = id.split(".");
  return warehouseId && schemaId && tableId ? { warehouseId, schemaId, tableId } : null;
}
