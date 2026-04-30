/** Shared formatting utilities for TDK CLI */

function pluralize(count: number, singular: string, plural?: string): string {
  return count === 1 ? singular : (plural || `${singular}s`);
}

export function formatCount(count: number, singular: string, plural?: string): string {
  return `${count} ${pluralize(count, singular, plural)}`;
}

// Shared date formatting options
const DATE_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
};

/**
 * Format a timestamp as a full locale string (date + time)
 * @param timestamp - ISO timestamp string
 * @returns Formatted date string (e.g., "Jan 15, 02:30 PM")
 */
export function formatDate(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', DATE_FORMAT_OPTIONS);
}

/**
 * Format a timestamp as a short locale date string
 * Alias for formatDate - both now use the same underlying format
 * @param timestamp - ISO timestamp string
 * @returns Formatted date string
 */
export function formatShortDate(timestamp: string): string {
  return formatDate(timestamp);
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + '...';
}

// Box Drawing Utilities (migrated from networks.ts)

const DEFAULT_BOX_WIDTH = 62;

/**
 * Create a horizontal line for box drawing
 * @param char - Character to repeat (default: '─')
 * @param width - Line width (default: 62)
 * @returns Repeated character string
 */
export function formatBoxLine(char: string = '─', width: number = DEFAULT_BOX_WIDTH): string {
  return char.repeat(width);
}

/**
 * Center text within a given width
 * @param text - Text to center
 * @param width - Total width (default: 60)
 * @returns Centered text with padding
 */
export function formatCentered(text: string, width: number = DEFAULT_BOX_WIDTH - 2): string {
  const padding = Math.max(0, width - text.length);
  const left = Math.floor(padding / 2);
  const right = padding - left;
  return ' '.repeat(left) + text + ' '.repeat(right);
}

/**
 * Pad or truncate text to fit within width
 * @param text - Text to pad
 * @param width - Target width
 * @returns Padded or truncated string
 */
export function formatPadded(text: string, width: number): string {
  if (text.length > width) {
    return text.slice(0, width - 1) + '…';
  }
  return text.padEnd(width);
}

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
