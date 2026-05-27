/**
 * Utilities for the Text node's dynamic variable-handle feature.
 *
 * When a user types {{ myVar }} in the text body, we extract "myVar"
 * as a new target handle. Only valid JS identifiers are accepted so
 * the backend can use them as named placeholders.
 */

const VARIABLE_RE = /\{\{\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\}\}/g;

/**
 * Parse all unique variable names from a template string.
 * Preserves the first-seen order (insertion order of a Set).
 *
 * @param {string} text
 * @returns {string[]} deduplicated array of identifier names
 */
export function parseVariables(text) {
  const seen = new Set();
  let match;
  const result = [];

  // Reset lastIndex for safety when reusing the regex.
  VARIABLE_RE.lastIndex = 0;

  while ((match = VARIABLE_RE.exec(text)) !== null) {
    const name = match[1];
    if (!seen.has(name)) {
      seen.add(name);
      result.push(name);
    }
  }

  return result;
}

/**
 * Compute the evenly-spaced top-percentage for the i-th handle
 * when there are `total` handles on a side.
 *
 * e.g. total=1 → [50%], total=2 → [33%, 67%], total=3 → [25%, 50%, 75%]
 */
export function handleTop(index, total) {
  return `${((index + 1) / (total + 1)) * 100}%`;
}
