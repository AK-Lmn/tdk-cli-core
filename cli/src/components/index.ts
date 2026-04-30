/**
 * Component exports for TDK CLI UI
 *
 * Organized by category: Main components, Type definitions, Utilities
 */

// Main UI components
export { TabBar } from './TabBar.js';
export { DetailPanel } from './DetailPanel.js';
export { ResourceTable } from './ResourceTable.js';
export { FileTree } from './FileTree.js';

// Accessibility components
export { AccessibleTooltip } from './Accessible.js';

// Utility constants
export { TOOLTIPS } from './Tooltip.js';

// Component type definitions (from component files)
export type { TabId } from './TabBar.js';
export type { FileNode } from './FileTree.js';

// Shared UI types (from types/index.ts)
export type { TooltipProps } from '../types/index.js';
