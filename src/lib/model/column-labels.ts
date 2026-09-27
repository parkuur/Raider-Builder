/**
 * Editable table column headers, shared by every table section. A section's
 * `data.columnLabels` stores only what's been saved — possibly partial or
 * missing entirely (documents saved before a table had editable labels, or
 * before a column existed) — and self-heals against the section's defaults
 * here rather than in persistence.ts, matching how every section's `data`
 * shape is trusted once it passes the generic "is this an object?" check on
 * load, not deep-validated. This is permanent schema behavior, not a
 * temporary migration.
 */
export type ColumnLabels<K extends string> = Record<K, string>;

export interface WithColumnLabels<K extends string> {
  columnLabels?: Partial<ColumnLabels<K>>;
}

export function resolveColumnLabels<K extends string>(
  defaults: ColumnLabels<K>,
  data: WithColumnLabels<K>,
): ColumnLabels<K> {
  return { ...defaults, ...data.columnLabels };
}

export function setColumnLabel<K extends string, D extends WithColumnLabels<K>>(
  data: D,
  defaults: ColumnLabels<K>,
  key: K,
  label: string,
): D {
  return {
    ...data,
    columnLabels: { ...resolveColumnLabels(defaults, data), [key]: label },
  };
}
