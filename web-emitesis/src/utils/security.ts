/**
 * Utility for frontend sanitization against common SQL injection patterns.
 * Note: Real SQL injection protection MUST happen in the backend using parameterized queries.
 * This frontend layer adds an extra barrier by cleaning inputs before they are sent.
 */

export const sanitizeInput = (input: string): string => {
  if (!input) return "";

  // Remove common SQL injection characters and keywords
  return input
    .replace(/'/g, "''") // Escape single quotes (SQL style)
    .replace(/--/g, "")   // Remove SQL comments
    .replace(/\/\*/g, "") // Remove SQL block comments start
    .replace(/\*\//g, "") // Remove SQL block comments end
    .replace(/;/g, "")    // Remove statement terminators
    .replace(/\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|EXEC|EXECUTE)\b/gi, "") // Remove SQL keywords
    .trim();
};

/**
 * Validates if an input contains suspicious SQL patterns
 */
export const isSuspicious = (input: string): boolean => {
  const sqlPatterns = [
    /--/,
    /\/\*/,
    /\*\//,
    /;\s*$/,
    /\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|EXEC|EXECUTE)\b/i
  ];

  return sqlPatterns.some(pattern => pattern.test(input));
};
