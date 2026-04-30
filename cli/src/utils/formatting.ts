/**
 * Shared formatting utilities for TDK CLI
 *
 * Consolidates formatting logic that was previously duplicated
 * across components and command files.
 */

/**
 * Pluralizes a word based on count
 *
 * @param count - The number to check
 * @param singular - The singular form of the word
 * @param plural - The plural form (defaults to singular + 's')
 * @returns The appropriate form of the word
 *
 * @example
 * pluralize(1, 'resource') // 'resource'
 * pluralize(5, 'resource') // 'resources'
 * pluralize(0, 'service', 'services') // 'services'
 */
function pluralize(count: number, singular: string, plural?: string): string {
  return count === 1 ? singular : (plural || `${singular}s`);
}

/**
 * Formats a count with a pluralized word
 *
 * @param count - The number
 * @param singular - The singular form of the word
 * @param plural - Optional plural form
 * @returns Formatted string like "5 resources" or "1 service"
 *
 * @example
 * formatCount(5, 'resource') // '5 resources'
 * formatCount(1, 'service') // '1 service'
 */
export function formatCount(count: number, singular: string, plural?: string): string {
  return `${count} ${pluralize(count, singular, plural)}`;
}


