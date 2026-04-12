/**
 * Detects whether a string contains Arabic characters.
 * Returns true if any Arabic-range Unicode codepoints are present.
 */
export const hasArabic = (text?: string | null): boolean => {
  if (!text) return false;
  // Arabic + Arabic supplement + extended + presentation forms
  return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text);
};

/**
 * Returns 'rtl' if text contains Arabic, otherwise 'ltr'.
 */
export const autoDir = (text?: string | null): "rtl" | "ltr" =>
  hasArabic(text) ? "rtl" : "ltr";

/**
 * Returns 'right' if text contains Arabic, otherwise 'left'.
 */
export const autoAlign = (text?: string | null): "right" | "left" =>
  hasArabic(text) ? "right" : "left";
