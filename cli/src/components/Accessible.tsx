/**
 * Accessible Components - Neon Edition
 *
 * Components with screen reader support and accessibility features
 */

import React from 'react';
import { Box, Text } from 'ink';

// Tooltip/hint that shows on hover/focus
interface AccessibleTooltipProps {
  content: string;
  shortcut?: string;
  visible: boolean;
}

export const AccessibleTooltip: React.FC<AccessibleTooltipProps> = ({
  content,
  shortcut,
  visible
}) => {
  if (!visible) return null;

  return (
    <Box
      flexDirection="column"
      borderStyle="single"
      borderColor="yellow"
      paddingX={1}
      paddingY={1}
      backgroundColor="black"
      marginTop={1}
    >
      <Text color="yellow">ℹ {content}</Text>
      {shortcut && (
        <Box marginTop={1}>
          <Text color="gray">Press </Text>
          <Text color="cyan" bold>[{shortcut}]</Text>
          <Text color="gray"> to use</Text>
        </Box>
      )}
    </Box>
  );
};
