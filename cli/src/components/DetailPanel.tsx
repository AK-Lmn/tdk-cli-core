/** DetailPanel Component */

import React from 'react';
import { Box, Text } from 'ink';
import type { DiscoveredStack, DiscoveredResource, StackMetadata, ResourceMetadata } from '../types/index.js';
import { formatDate, getStatusColor, getStatusIcon } from '../utils/formatting.js';

interface DetailPanelProps {
  stack: DiscoveredStack | null;
  service: DiscoveredResource | null;
  stackMetadata?: StackMetadata | null;
  visible: boolean;
}

export const DetailPanel: React.FC<DetailPanelProps> = ({ 
  stack, 
  service, 
  stackMetadata,
  visible 
}) => {
  if (!visible) {
    return <Box width={0} />;
  }

  // Show service details if service is selected
  if (service) {
    return (
      <Box 
        width={40} 
        flexDirection="column"
        borderStyle="single"
        borderColor="gray"
        paddingX={1}
        paddingY={1}
      >
  <Box marginBottom={1} justifyContent="center">
          <Text color="cyan" bold>
            ┌─ {service.name.toUpperCase()} ─┐
          </Text>
        </Box>
        
        <Box flexDirection="column" marginY={1}>
          <Box>
            <Text color="gray">Name: </Text>
            <Text color="white">{service.name}</Text>
          </Box>
          <Box>
            <Text color="gray">Stack: </Text>
            <Text color="white">{service.stack || 'unknown'}</Text>
          </Box>
          {service.stack && (
            <Box>
              <Text color="gray">Stack: </Text>
              <Text color="cyan">{service.stack}</Text>
            </Box>
          )}
          <Box>
            <Text color="gray">Type: </Text>
            <Text color="yellow">{(service.stack || '') === 'platform' ? 'PLATFORM' : 'PRODUCT'}</Text>
          </Box>
        </Box>
        
  <Box marginTop={2}>
          <Text color="gray" dimColor>
            Press <Text color="cyan">[Esc]</Text> to close
          </Text>
        </Box>
      </Box>
    );
  }

  if (stack && stackMetadata) {
  if (stack && stackMetadata) {
    const statusColor = getStatusColor(stackMetadata.overallStatus);
    const statusIcon = getStatusIcon(stackMetadata.overallStatus);

    return (
      <Box 
        width={40} 
        flexDirection="column"
        borderStyle="single"
        borderColor="gray"
        paddingX={1}
        paddingY={1}
      >
        {/* Title */}
        <Box marginBottom={1} justifyContent="center">
          <Text color="cyan" bold>
            ┌─ {stack.name.toUpperCase()} ─┐
          </Text>
        </Box>
        
  <Box
          borderStyle="single"
          borderColor={statusColor}
          paddingX={1}
          paddingY={1}
          marginY={1}
          justifyContent="center"
        >
          <Text color={statusColor} bold>
            {statusIcon} {stackMetadata.overallStatus.toUpperCase()}
          </Text>
        </Box>
        
  <Box flexDirection="column" marginY={1}>
          <Box>
            <Text color="gray">Created: </Text>
            <Text color="white">{formatDate(stackMetadata.createdAt)}</Text>
          </Box>
          <Box>
            <Text color="gray">Resources: </Text>
            <Text color="cyan">{stackMetadata.resourceCount}</Text>
          </Box>
        </Box>

        <Box marginTop={1} marginBottom={1}>
          <Text color="gray" underline>
            Resources
          </Text>
        </Box>
        
        <Box flexDirection="column">
          {stack.resources.map((svc: {name: string}, index: number) => (
            <Box key={svc.name}>
              <Text color="gray">
                {index === stack.resources.length - 1 ? '└─ ' : '├─ '}
              </Text>
              <Text color="white">{svc.name}</Text>
            </Box>
          ))}
        </Box>

        {/* Close hint */}
        <Box marginTop={2}>
          <Text color="gray" dimColor>
            Press <Text color="cyan">[Esc]</Text> to close
          </Text>
        </Box>
      </Box>
    );
  }

  // Empty state
  return (
    <Box 
      width={40} 
      borderStyle="single" 
      borderColor="gray"
      paddingX={2}
      paddingY={2}
      flexDirection="column"
    >
      <Box marginBottom={1} justifyContent="center">
        <Text color="gray" dimColor>
          Select a stack or service
        </Text>
      </Box>
      <Box justifyContent="center">
        <Text color="gray" dimColor>
          to view details
        </Text>
      </Box>
    </Box>
  );
};
