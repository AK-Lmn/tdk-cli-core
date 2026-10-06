import { Box, Text } from "ink";
import type React from "react";

interface TUIHeaderProps {
  projectRoot: string;
  resourceCount: number;
  terminalWidth: number;
  version: string;
}

export const TUIHeader: React.FC<TUIHeaderProps> = ({
  projectRoot,
  resourceCount,
  terminalWidth,
  version,
}) => {
  const title = terminalWidth < 80 ? `TDK v${version}` : `TDK NEON EDITION v${version}`;
  const resourceLabel = `${String(resourceCount)} resource${resourceCount === 1 ? "" : "s"} discovered`;
  const compactHeading = `${title} | ${resourceLabel}`;
  const paddingX = terminalWidth >= 28 ? 1 : 0;

  if (terminalWidth < 80) {
    const contentWidth = Math.max(1, terminalWidth - paddingX * 2);
    const splitHeading = compactHeading.length > contentWidth;

    return (
      <Box flexDirection="column" paddingX={paddingX} width={terminalWidth}>
        {splitHeading ? (
          <>
            <Text color="cyan" bold>
              {title}
            </Text>
            <Text color="green">{resourceLabel}</Text>
          </>
        ) : (
          <Text>
            <Text color="cyan" bold>
              {title}
            </Text>
            <Text color="gray"> | </Text>
            <Text color="green">{resourceLabel}</Text>
          </Text>
        )}
        <Text color="white" wrap="truncate-end">
          {projectRoot}
        </Text>
      </Box>
    );
  }

  const rootWidth = Math.max(
    1,
    terminalWidth -
      paddingX * 2 -
      title.length -
      " | ".length -
      " | ".length -
      resourceLabel.length,
  );

  return (
    <Box flexDirection="row" paddingX={paddingX} width={terminalWidth}>
      <Text color="cyan" bold>
        {title}
      </Text>
      <Text color="gray"> | </Text>
      <Box flexShrink={1} width={rootWidth}>
        <Text color="white" wrap="truncate-end">
          {projectRoot}
        </Text>
      </Box>
      <Text color="gray"> | </Text>
      <Text color="green">{resourceLabel}</Text>
    </Box>
  );
};
