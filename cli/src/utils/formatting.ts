/** Shared formatting utilities for TDK CLI */

function pluralize(count: number, singular: string, plural?: string): string {
  return count === 1 ? singular : (plural || `${singular}s`);
}

export function formatCount(count: number, singular: string, plural?: string): string {
  return `${count} ${pluralize(count, singular, plural)}`;
}

export function formatDate(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatShortDate(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + '...';
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
