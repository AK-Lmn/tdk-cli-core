import chalk from 'chalk';
import type { StatusValue, StatusCategory } from '../types/index.js';

function pluralize(count: number, singular: string, plural?: string): string {
  return count === 1 ? singular : (plural || `${singular}s`);
}

export function formatCount(count: number, singular: string, plural?: string): string {
  return `${count} ${pluralize(count, singular, plural)}`;
}

const DATE_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
};

export function formatDate(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', DATE_FORMAT_OPTIONS);
}

export function formatShortDate(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}



function getStatusCategory(status: StatusValue): StatusCategory {
  if (!status) return 'unknown';
  const lowerStatus = status.toLowerCase();

  // Success states
  if (lowerStatus === 'ready' || lowerStatus === 'healthy' || lowerStatus === 'active' || lowerStatus === 'running') {
    return 'success';
  }

  // Error states
  if (lowerStatus === 'error' || lowerStatus === 'failed' || lowerStatus === 'critical' || lowerStatus === 'stopped') {
    return 'error';
  }

  // Warning/pending states
  if (lowerStatus === 'pending' || lowerStatus === 'starting' || lowerStatus === 'building' || lowerStatus === 'degraded') {
    return 'warning';
  }

  return 'unknown';
}

export function getStatusColor(status: StatusValue): string {
  const category = getStatusCategory(status);
  const colorMap: Record<StatusCategory, string> = {
    success: 'green',
    error: 'red',
    warning: 'yellow',
    unknown: 'gray',
  };
  return colorMap[category];
}

export function getStatusIcon(status: StatusValue): string {
  const category = getStatusCategory(status);
  const iconMap: Record<StatusCategory, string> = {
    success: '✓',
    error: '✗',
    warning: '○',
    unknown: '?',
  };
  return iconMap[category];
}

export function colorizeByStatus(text: string, status: StatusValue): string {
  const category = getStatusCategory(status);
  // Use category for type-safe chalk color mapping
  const colorMap = {
    success: chalk.green,
    error: chalk.red,
    warning: chalk.yellow,
    unknown: chalk.gray,
  } as const;
  return colorMap[category](text);
}

const EMPTY_STATE_CONFIG: Record<string, { singular: string; command: string; context?: string }> = {
  resources: {
    singular: 'resource',
    command: 'tdk resource <name>',
    context: '\nTo create a resource:',
  },
  stacks: {
    singular: 'stack',
    command: 'tdk stack <stack-name>',
    context: '\nTo create a stack, use:',
  },
  services: {
    singular: 'service',
    command: 'tdk resource <name>',
    context: '\nTo create a service:',
  },
  'stack-services': {
    singular: 'service',
    command: 'tdk resource <name> --stack <stack-name>',
    context: '\nTo add services to this stack:',
  },
};

export function showEmptyState(
  itemType: 'resources' | 'stacks' | 'services' | 'stack-services',
  filterContext?: string
): void {
  const config = EMPTY_STATE_CONFIG[itemType];

  if (filterContext) {
    console.log(chalk.yellow(`No ${config.singular}s found${filterContext}.`));
  } else {
    console.log(chalk.yellow(`No ${config.singular}s found.`));
  }

  console.log(chalk.gray(config.context));
  console.log(chalk.gray(`  ${config.command}`));

  if (itemType === 'stacks') {
    console.log(chalk.gray('\nOr create a new resource with a stack:'));
    console.log(chalk.gray('  tdk resource <name> --stack <stack-name>'));
  }
}

export function showCancelled(message?: string): void {
  console.log(chalk.yellow(message || 'Cancelled.'));
}

export function showCommandHeader(title: string): void {
  console.log(chalk.blue(`TDK ${title}\n`));
}

export function showAllSatisfyCondition(items: string, condition: string): void {
  console.log(chalk.green(`All ${items} are ${condition}!`));
}

const DEFAULT_BOX_WIDTH = 62;

/**
 * Create a horizontal line for ASCII boxes.
 *
 * @param char - Character to repeat (default: '─')
 * @param width - Width of the line (default: 62)
 * @returns Repeated character string
 */
export function formatBoxLine(char: string = '─', width: number = DEFAULT_BOX_WIDTH): string {
  return char.repeat(width);
}

/**
 * Center text within a specified width.
 *
 * @param text - Text to center
 * @param width - Total width (default: 60)
 * @returns Centered text string
 */
export function formatCentered(text: string, width: number = DEFAULT_BOX_WIDTH - 2): string {
  const padding = Math.max(0, width - text.length);
  const left = Math.floor(padding / 2);
  const right = padding - left;
  return ' '.repeat(left) + text + ' '.repeat(right);
}

/**
 * Pad text to a specific width, truncating with ellipsis if too long.
 *
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

/**
 * Truncate text with ellipsis if it exceeds max length.
 *
 * @param str - String to truncate
 * @param maxLength - Maximum length
 * @returns Truncated string with "..." if needed
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + '...';
}

/**
 * Format a complete ASCII box with title and content lines.
 *
 * @param title - Box title (shown at top)
 * @param lines - Content lines to display inside box
 * @param width - Box width (default: 62)
 * @returns Array of formatted strings (one per line)
 */
export function formatAsciiBox(
  title: string,
  lines: string[],
  width: number = DEFAULT_BOX_WIDTH
): string[] {
  const innerWidth = width - 2;
  const result: string[] = [];

  // Top border with title
  const centeredTitle = formatCentered(title, innerWidth);
  result.push(chalk.cyan('╭' + formatBoxLine('─', innerWidth) + '╮'));
  result.push(chalk.cyan('│') + chalk.bold.white(centeredTitle) + chalk.cyan('│'));
  result.push(chalk.cyan('├' + formatBoxLine('─', innerWidth) + '┤'));

  // Content lines
  for (const line of lines) {
    const padded = formatPadded(line, innerWidth);
    result.push(chalk.cyan('│') + padded + chalk.cyan('│'));
  }

  // Bottom border
  result.push(chalk.cyan('╰' + formatBoxLine('─', innerWidth) + '╯'));

  return result;
}

/**
 * Print an ASCII box directly to console.
 *
 * @param title - Box title
 * @param lines - Content lines
 * @param width - Box width
 */
export function printAsciiBox(title: string, lines: string[], width?: number): void {
  const formatted = formatAsciiBox(title, lines, width);
  formatted.forEach(line => console.log(line));
}

/**
 * Format a simple separator line with optional label.
 *
 * @param label - Optional label to center in the separator
 * @param width - Separator width
 * @param char - Character to use
 * @returns Formatted separator string
 */
export function formatSeparator(
  label?: string,
  width: number = DEFAULT_BOX_WIDTH,
  char: string = '─'
): string {
  if (!label) {
    return char.repeat(width);
  }

  const labelWithSpaces = ` ${label} `;
  const padding = width - labelWithSpaces.length;
  if (padding <= 0) {
    return labelWithSpaces;
  }

  const left = Math.floor(padding / 2);
  const right = padding - left;
  return char.repeat(left) + labelWithSpaces + char.repeat(right);
}

/**
 * Display a success message with checkmark icon.
 * Replaces: console.log(chalk.green(`✓ ${message}`))
 */
export function showSuccess(message: string): void {
  console.log(chalk.green(`✓ ${message}`));
}

/**
 * Display a step/action message with blue color.
 * Replaces: console.log(chalk.blue(`📝 ${message}`))
 */
export function showStep(message: string): void {
  console.log(chalk.blue(message));
}

/**
 * Display detailed information with indentation.
 * Replaces: console.log(chalk.gray(`  - ${message}`))
 */
export function showDetail(message: string, indent = 2): void {
  console.log(chalk.gray(`${' '.repeat(indent)}${message}`));
}
