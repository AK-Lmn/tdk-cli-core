import chalk from 'chalk';

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

/**
 * Configuration for empty state messages by item type
 */
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

/**
 * Display an empty state message with helpful next steps
 *
 * @param itemType - Type of item that was not found
 * @param filterContext - Optional context about what was being filtered (e.g., stack name)
 */
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

  // Additional context for stack-related empty states
  if (itemType === 'stacks') {
    console.log(chalk.gray('\nOr create a new resource with a stack:'));
    console.log(chalk.gray('  tdk resource <name> --stack <stack-name>'));
  }
}
