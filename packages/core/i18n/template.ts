/**
 * Replace {placeholders} in a string with values from `vars`.
 * Pure & client-safe — no server imports.
 */
export function format(
  template: string,
  vars: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (_, key) =>
    String(vars[key] ?? `{${key}}`),
  );
}
