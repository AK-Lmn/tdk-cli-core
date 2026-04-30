/** Accessible Components */

import React from 'react';
import { Box, Text } from 'ink';
import type { TooltipProps } from '../types/index.js';

export const AccessibleTooltip: React.FC<TooltipProps> = ({
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
