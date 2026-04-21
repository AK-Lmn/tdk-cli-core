/**
 * ResourceTable Component - Table for displaying Resources tab content
 * 
 * AWS CloudFormation-style resource table with columns:
 * - Logical ID, Physical ID, Type, Status, Created Time
 */

import React from 'react';
import { Box, Text } from 'ink';
import type { ServiceMetadata } from './DetailPanel.js';

interface ResourceTableProps {
  services: ServiceMetadata[];
  maxWidth?: number;
}

export const ResourceTable: React.FC<ResourceTableProps> = ({ services, maxWidth = 100 }) => {
  if (services.length === 0) {
    return (
      <Box paddingY={1}>
        <Text color="gray">No services found</Text>
      </Box>
    );
  }

  const narrowMode = maxWidth < 80;

  return (
    <Box flexDirection="column">
      {/* Table Header */}
      <Box flexDirection="row" borderStyle="single" borderColor="gray" paddingX={1}>
        <Box width={narrowMode ? 20 : 25}>
          <Text bold>Logical ID</Text>
        </Box>
        {!narrowMode && (
          <Box width={20}>
            <Text bold>Physical ID</Text>
          </Box>
        )}
        <Box width={12}>
          <Text bold>Type</Text>
        </Box>
        <Box width={15}>
          <Text bold>Status</Text>
        </Box>
        {!narrowMode && (
          <Box width={20}>
            <Text bold>Created</Text>
          </Box>
        )}
      </Box>

      {/* Table Rows */}
      {services.map((service, index) => {
        const statusColor = getStatusColor(service.status);
        const statusIcon = getStatusIcon(service.status);
        const isEven = index % 2 === 0;
        
        return (
          <Box 
            key={service.name} 
            flexDirection="row" 
            paddingX={1}
          >
            <Box width={narrowMode ? 20 : 25}>
              <Text>{truncate(service.name, narrowMode ? 18 : 23)}</Text>
            </Box>
            {!narrowMode && (
              <Box width={20}>
                <Text color="gray">{truncate(service.domain + '/' + service.name, 18)}</Text>
              </Box>
            )}
            <Box width={12}>
              <Text color="cyan">{service.type}</Text>
            </Box>
            <Box width={15}>
              <Text color={statusColor}>{statusIcon} {service.status}</Text>
            </Box>
            {!narrowMode && (
              <Box width={20}>
                <Text color="gray">{formatShortDate(service.createdAt)}</Text>
              </Box>
            )}
          </Box>
        );
      })}
    </Box>
  );
};

function getStatusColor(status: string): string {
  switch (status) {
    case 'ready': return 'green';
    case 'pending': return 'yellow';
    case 'error': return 'red';
    default: return 'gray';
  }
}

function getStatusIcon(status: string): string {
  switch (status) {
    case 'ready': return '✓';
    case 'pending': return '○';
    case 'error': return '✗';
    default: return '?';
  }
}

function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + '...';
}

function formatShortDate(timestamp: string): string {
  try {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '-';
  }
}

export default ResourceTable;
