/** Accessible Components */

import React from 'react';
import { BaseTooltip } from './BaseTooltip.js';
import type { TooltipProps } from '../types/index.js';

/**
 * AccessibleTooltip - Tooltip variant with info icon prefix
 * Uses BaseTooltip for consistent styling
 */
export const AccessibleTooltip: React.FC<TooltipProps> = ({
  content,
  shortcut,
  visible
}) => {
  return (
    <BaseTooltip
      content={content}
      shortcut={shortcut}
      visible={visible}
      prefix="ℹ "
      marginTop={1}
    />
  );
};
