/**
 * DetailPanel Component - Right sidebar showing stack/service details
 * 
 * Displays metadata similar to AWS CloudFormation stack details:
 * - Name, Created Time, Status, Service Count
 * - Resource summary table
 */

import React from 'react';
import { Box, Text } from 'ink';
import type { DiscoveredStack, DiscoveredService } from '../types/index.js';

interface DetailPanelProps {
  stack: DiscoveredStack | null;
  service: DiscoveredService | null;
  stackMetadata?: StackMetadata | null;
  visible: boolean;
}

export interface StackMetadata {
  name: string;
  serviceCount: number;
  createdAt: string;
  lastModified: string;
  overallStatus: 'healthy' | 'degraded' | 'error' | 'unknown';
  services: ServiceMetadata[];
}

export interface ServiceMetadata {
  name: string;
  domain: string;
  type: 'frontend' | 'backend' | 'lib';
  port?: number;
  createdAt: string;
  status: 'ready' | 'pending' | 'error' | 'unknown';
}

export const DetailPanel: React.FC<DetailPanelProps> = ({ 
  stack, 
  service, 
  stackMetadata,
  visible 
}) => {
  if (!visible) {
    return (
      <Box width={0} />
    );
  }

  // Show service details if service is selected
  if (service) {
    return (
      <Box 
        width={40} 
        borderStyle="single" 
        borderColor="cyan"
        paddingX={1}
        flexDirection="column"
      >
        <Text bold color="cyan" underline>Service Details</Text>
        <Box marginY={1} flexDirection="column">
          <Text><Text bold>Name:</Text> {service.name}</Text>
          <Text><Text bold>Domain:</Text> {service.domain || 'unknown'}</Text>
          {service.stack && (
            <Text><Text bold>Stack:</Text> {service.stack}</Text>
          )}
          <Text><Text bold>Type:</Text> {(service.domain || '') === 'platform' ? 'platform' : 'product'}</Text>
        </Box>
      </Box>
    );
  }

  // Show stack details if stack is selected
  if (stack && stackMetadata) {
    const statusColor = 
      stackMetadata.overallStatus === 'healthy' ? 'green' :
      stackMetadata.overallStatus === 'degraded' ? 'yellow' : 'red';
    
    const statusIcon = 
      stackMetadata.overallStatus === 'healthy' ? '✓' :
      stackMetadata.overallStatus === 'degraded' ? '⚠' : '✗';

    return (
      <Box 
        width={45} 
        borderStyle="single" 
        borderColor="cyan"
        paddingX={1}
        flexDirection="column"
      >
        <Text bold color="cyan" underline>Stack Details</Text>
        
        <Box marginY={1} flexDirection="column">
          <Text><Text bold>Name:</Text> {stack.name}</Text>
          <Text><Text bold>Created:</Text> {formatDate(stackMetadata.createdAt)}</Text>
          <Text><Text bold>Services:</Text> {stackMetadata.serviceCount}</Text>
          <Text>
            <Text bold>Status:</Text>{' '}
            <Text color={statusColor}>{statusIcon} {stackMetadata.overallStatus}</Text>
          </Text>
        </Box>

        <Box marginTop={1}>
          <Text bold underline>Services</Text>
        </Box>
        
        <Box flexDirection="column" marginTop={1}>
          {stack.services.map((svc: DiscoveredService) => (
            <Box key={svc.name}>
              <Text color="gray">├─ {svc.name}</Text>
            </Box>
          ))}
        </Box>

        <Box marginTop={2}>
          <Text dimColor color="gray">
            Press [Esc] to close
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
      paddingX={1}
      flexDirection="column"
    >
      <Text color="gray" dimColor>
        Select a stack or service
to view details
      </Text>
    </Box>
  );
};

function formatDate(timestamp: string): string {
  try {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return timestamp;
  }
}

export default DetailPanel;
