/**
 * TabBar Component - Neon Edition (Restrained)
 * 
 * Only the active tab gets neon treatment
 */

import React from 'react';
import { Box, Text } from 'ink';

export type TabId = 'overview' | 'resources' | 'events' | 'files' | 'config';

interface Tab {
  id: TabId;
  label: string;
  shortcut: string;
}

const TABS: Tab[] = [
  { id: 'overview', label: 'OVERVIEW', shortcut: '1' },
  { id: 'resources', label: 'RESOURCES', shortcut: '2' },
  { id: 'events', label: 'EVENTS', shortcut: '3' },
  { id: 'files', label: 'FILES', shortcut: '4' },
  { id: 'config', label: 'CONFIG', shortcut: '5' },
];

interface TabBarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  compact?: boolean;
}

export const TabBar: React.FC<TabBarProps> = ({ activeTab, onTabChange, compact = false }) => {
  return (
    <Box flexDirection="column" paddingX={1}>
      {/* Simple separator line */}
      <Box marginBottom={1}>
        <Text color="gray">{'─'.repeat(compact ? 60 : 80)}</Text>
      </Box>
      
      {/* Tabs */}
      <Box flexDirection="row" justifyContent="space-between" paddingX={1}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          
          return (
            <Box key={tab.id}>
              {isActive ? (
                // Active tab: neon cyan with border
                <Box 
                  borderStyle="single" 
                  borderColor="cyan"
                  paddingX={1}
                  backgroundColor="black"
                >
                  <Text>
                    <Text color="cyan">▓▒░</Text>
                    <Text color="cyan" bold> [{tab.shortcut}] {tab.label} </Text>
                    <Text color="cyan">░▒▓</Text>
                  </Text>
                </Box>
              ) : (
                // Inactive tab: plain gray
                <Box paddingX={1}>
                  <Text color="gray" dimColor>
                    [{tab.shortcut}] {compact ? tab.label.slice(0, 4) : tab.label}
                  </Text>
                </Box>
              )}
            </Box>
          );
        })}
      </Box>
      
      {/* Simple separator line */}
      <Box marginTop={1}>
        <Text color="gray">{'─'.repeat(compact ? 60 : 80)}</Text>
      </Box>
    </Box>
  );
};

export { TABS };
