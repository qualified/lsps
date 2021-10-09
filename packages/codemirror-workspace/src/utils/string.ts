export const escapeHtml = (s: string): string => s.replace(PATTERN, escaped);
const PATTERN = /[&<>'"]/g;
const escaped = (c: string) =>
  c === "&"
    ? "&amp;"
    : c === "<"
    ? "&lt;"
    : c === ">"
    ? "&gt;"
    : c === "'"
    ? "&#39;"
    : "&quot;";
