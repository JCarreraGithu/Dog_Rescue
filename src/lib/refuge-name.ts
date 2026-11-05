import { SITE } from "../config/site";

// Solo el nombre visible; conserva enlaces e identificadores incluidos en el texto.
export function normalizeRefugeName(text: string): string {
  return text.replace(/https?:\/\/[^\s<>"']+|\bDOG[ \t]+rescue[ \t]+Guatemala\b/gi,
    match => /^https?:\/\//i.test(match) ? match : SITE.name);
}
