export const escapeRegExp = (s: string): string =>
  s.replace(/[.*+\-?^${}()|[\]\\]/g, "\\$&");
