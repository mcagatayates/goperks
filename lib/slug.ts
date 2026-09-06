const TR_MAP: Record<string, string> = {
  "ç": "c",
  "ğ": "g",
  "ı": "i",
  "ö": "o",
  "ş": "s",
  "ü": "u",
  "Ç": "c",
  "Ğ": "g",
  "İ": "i",
  "Ö": "o",
  "Ş": "s",
  "Ü": "u",
};

// Turkish characters are mapped to ASCII explicitly above rather than via
// Unicode normalization, since normalize("NFD") decomposes "ı" (dotless i)
// and "ğ" inconsistently across engines.
export function slugify(input: string): string {
  return input
    .split("")
    .map((ch) => TR_MAP[ch] ?? ch)
    .join("")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}
