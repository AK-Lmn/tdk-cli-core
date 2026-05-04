import React from 'react';
import { BaseTooltip } from './BaseTooltip.js';
import type { BaseTooltipProps } from '../types/index.js';

/**
 * Info tooltip variant with predefined accessibility styling.
 * Uses ℹ prefix and adds margin for better visibility.
 */
export const AccessibleTooltip: React.FC<Pick<BaseTooltipProps, 'content' | 'shortcut' | 'visible'>> = ({
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
