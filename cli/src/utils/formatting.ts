import chalk from 'chalk';
import type { StatusValue } from '../types/index.js';

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

const DEFAULT_BOX_WIDTH = 62;

export function formatBoxLine(char: string = '─', width: number = DEFAULT_BOX_WIDTH): string {
  return char.repeat(width);
}

export function formatCentered(text: string, width: number = DEFAULT_BOX_WIDTH - 2): string {
  const padding = Math.max(0, width - text.length);
  const left = Math.floor(padding / 2);
  const right = padding - left;
  return ' '.repeat(left) + text + ' '.repeat(right);
}

export function formatPadded(text: string, width: number): string {
  if (text.length > width) {
    return text.slice(0, width - 1) + '…';
  }
  return text.padEnd(width);
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + '...';
}

type StatusCategory = 'success' | 'error' | 'warning' | 'unknown';

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
