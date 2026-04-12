/**
 * Standardized grade label mapping.
 * Abbreviations are always in English regardless of report language.
 * 
 * A (90-100%) → Outstanding (O)
 * B (80-89%) → Exceed Expectations (EE)
 * C (70-79%) → Meet Expectations (ME)
 * D (60-69%) → Below Expectations (BE)
 * F (<60%)   → Doesn't Meet (DM)
 */

export const gradeAbbreviations: Record<string, string> = {
  A: "O",
  B: "EE",
  C: "ME",
  D: "BE",
  F: "DM",
};

export const gradeFullLabels: Record<string, string> = {
  A: "Outstanding",
  B: "Exceed Expectations",
  C: "Meet Expectations",
  D: "Below Expectations",
  F: "Doesn't Meet",
};

/**
 * Returns the grade abbreviation string for display.
 * Always returns English abbreviation regardless of language.
 * Format: "A (O)", "F (DM)", etc.
 */
export function getGradeWithAbbreviation(grade: string): string {
  const abbr = gradeAbbreviations[grade];
  return abbr ? `${grade} (${abbr})` : grade;
}

/**
 * Returns grade label for PDF/print reports.
 * Always uses English abbreviation: e.g., "(DM)" not "(لا يحقق المتطلبات)"
 */
export function getGradeLabel(grade: string): string {
  return gradeAbbreviations[grade] || grade;
}

/**
 * Returns full English label with abbreviation.
 * e.g., "Outstanding (O)", "Doesn't Meet (DM)"
 */
export function getGradeFullLabel(grade: string): string {
  const full = gradeFullLabels[grade];
  const abbr = gradeAbbreviations[grade];
  return full && abbr ? `${full} (${abbr})` : grade;
}
