/** Base Tooltip Component - Shared foundation for all tooltip variants */

import React from 'react';
import { Box, Text } from 'ink';

interface BaseTooltipProps {
  /** Tooltip content text */
  content: string;
  /** Optional keyboard shortcut to display */
  shortcut?: string;
  /** Whether the tooltip is currently visible */
  visible: boolean;
  /** Maximum width for tooltip content wrapping */
  maxWidth?: number;
  /** Whether to wrap text to multiple lines */
  wrapText?: boolean;
  /** Additional prefix element (e.g., "ℹ " info icon) */
  prefix?: string;
  /** Vertical margin offset */
  marginTop?: number;
}

/**
 * Base tooltip component with shared styling
 * Provides consistent yellow border, black background, and padding
 */
export const BaseTooltip: React.FC<BaseTooltipProps> = ({
  content,
  shortcut,
  visible,
  maxWidth = 40,
  wrapText = false,
  prefix = '',
  marginTop = 0,
}) => {
  if (!visible) return null;

  // Wrap text to maxWidth if requested
  const lines: string[] = wrapText ? wrapContent(content, maxWidth) : [content];

  return (
    <Box
      flexDirection="column"
      borderStyle="single"
      borderColor="yellow"
      paddingX={1}
      paddingY={1}
      backgroundColor="black"
      marginTop={marginTop}
    >
      {lines.map((line, i) => (
        <Text key={i} color="yellow">
          {prefix}{line}
        </Text>
      ))}
      {shortcut && (
        <Box marginTop={1}>
          <Text color="gray">Press </Text>
          <Text color="cyan" bold>{shortcut.startsWith('[') ? shortcut : `[${shortcut}]`}</Text>
          <Text color="gray"> to use</Text>
        </Box>
      )}
    </Box>
  );
};

/**
 * Wrap content text to fit within maxWidth
 */
function wrapContent(content: string, maxWidth: number): string[] {
  const words = content.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if ((currentLine + word).length > maxWidth - 2) {
      lines.push(currentLine.trim());
      currentLine = word + ' ';
    } else {
      currentLine += word + ' ';
    }
  }
  if (currentLine) {
    lines.push(currentLine.trim());
  }
  return lines;
}
