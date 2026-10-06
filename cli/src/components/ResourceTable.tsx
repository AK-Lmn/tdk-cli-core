import { Box, Text } from "ink";
import type React from "react";
import type { ResourceTableProps } from "../types/index.js";
import { formatShortDate, getStatusColor, getStatusIcon, truncate } from "../utils/formatting.js";

export const ResourceTable: React.FC<ResourceTableProps> = ({ resources, maxWidth = 100 }) => {
  if (resources.length === 0) {
    return (
      <Box paddingY={1}>
        <Text color="gray">No resources found</Text>
      </Box>
    );
  }

  const narrowMode = maxWidth < 80;
  const tableContentWidth = Math.max(1, Math.floor(maxWidth) - 4);
  const extraWidth = tableContentWidth - (narrowMode ? 19 : 26);
  const nameWidth = 4 + Math.floor(extraWidth * (narrowMode ? 0.37 : 0.29));
  const stackWidth = 5 + Math.floor(extraWidth * (narrowMode ? 0.22 : 0.2));
  const typeWidth = 4 + Math.floor(extraWidth * (narrowMode ? 0.2 : 0.13));
  const statusWidth = narrowMode
    ? tableContentWidth - nameWidth - stackWidth - typeWidth
    : 6 + Math.floor(extraWidth * 0.17);
  const createdWidth = narrowMode
    ? 0
    : tableContentWidth - nameWidth - stackWidth - typeWidth - statusWidth;

  return (
    <Box flexDirection="column">
      <Box flexDirection="row" borderStyle="single" borderColor="gray" paddingX={1}>
        <Box width={nameWidth}>
          <Text bold>Name</Text>
        </Box>
        <Box width={stackWidth}>
          <Text bold>Stack</Text>
        </Box>
        <Box width={typeWidth}>
          <Text bold>Type</Text>
        </Box>
        <Box width={statusWidth}>
          <Text bold>Status</Text>
        </Box>
        {!narrowMode && (
          <Box width={createdWidth}>
            <Text bold>Created</Text>
          </Box>
        )}
      </Box>

      {resources.map((resource) => {
        const statusColor = getStatusColor(resource.status);
        const statusLabel = `${getStatusIcon(resource.status)} ${resource.status}`;
        const stackName = resource.stack && resource.stack !== "unknown" ? resource.stack : "-";

        return (
          <Box key={resource.name} flexDirection="row" paddingX={1}>
            <Box width={nameWidth}>
              <Text>{truncate(resource.name, Math.max(3, nameWidth - 1))}</Text>
            </Box>
            <Box width={stackWidth}>
              <Text color="gray">{truncate(stackName, Math.max(3, stackWidth - 1))}</Text>
            </Box>
            <Box width={typeWidth}>
              <Text color="cyan">{truncate(resource.type, Math.max(3, typeWidth - 1))}</Text>
            </Box>
            <Box width={statusWidth}>
              <Text color={statusColor}>{truncate(statusLabel, Math.max(3, statusWidth - 1))}</Text>
            </Box>
            {!narrowMode && (
              <Box width={createdWidth}>
                <Text color="gray">
                  {truncate(formatShortDate(resource.createdAt), Math.max(3, createdWidth - 1))}
                </Text>
              </Box>
            )}
          </Box>
        );
      })}
    </Box>
  );
};
