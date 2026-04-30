/** Shared formatting utilities for TDK CLI */

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

/**
 * Formats a timestamp to a human-readable date string
 *
 * @param timestamp - ISO 8601 timestamp string
 * @returns Formatted date string
 */
export function formatDate(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Formats a timestamp to a short date string (date only)
 *
 * @param timestamp - ISO 8601 timestamp string
 * @returns Formatted short date string
 */
export function formatShortDate(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Truncates a string to a maximum length with ellipsis
 *
 * @param str - The string to truncate
 * @param maxLength - Maximum allowed length
 * @returns Truncated string
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + '...';
}

/**
 * Gets status color for terminal output
 *
 * @param status - The status string
 * @returns Color name for chalk
 */
export function getStatusColor(status: string): string {
  switch (status) {
    case 'ready':
    case 'running':
    case 'healthy':
      return 'green';
    case 'pending':
    case 'degraded':
      return 'yellow';
    case 'error':
    case 'stopped':
      return 'red';
    default:
      return 'gray';
  }
}

/**
 * Gets status icon for terminal output
 *
 * @param status - The status string
 * @returns Icon character
 */
export function getStatusIcon(status: string): string {
  switch (status) {
    case 'ready':
    case 'running':
    case 'healthy':
      return '✓';
    case 'pending':
      return '○';
    case 'error':
    case 'stopped':
      return '✗';
    default:
      return '?';
  }
}
