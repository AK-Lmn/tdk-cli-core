/**
 * TabBar Component - Custom tab bar for TDK UI
 * 
 * Displays 5 tabs: Overview, Resources, Events, Files, Config
 * Supports keyboard navigation (Tab, Shift+Tab, 1-5 keys)
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
  { id: 'overview', label: 'Overview', shortcut: '1' },
  { id: 'resources', label: 'Resources', shortcut: '2' },
  { id: 'events', label: 'Events', shortcut: '3' },
  { id: 'files', label: 'Files', shortcut: '4' },
  { id: 'config', label: 'Config', shortcut: '5' },
];

interface TabBarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  compact?: boolean;
}

export const TabBar: React.FC<TabBarProps> = ({ activeTab, onTabChange, compact = false }) => {
  return (
    <Box 
      borderStyle="single" 
      borderColor="gray" 
      paddingX={1}
      height={compact ? 1 : 3}
      flexDirection={compact ? 'row' : 'column'}
    >
      {compact ? (
        // Compact horizontal layout for narrow terminals
        <Box flexDirection="row" gap={1}>
          {TABS.map((tab) => (
            <Text 
              key={tab.id}
              color={activeTab === tab.id ? 'cyan' : 'gray'}
              bold={activeTab === tab.id}
              dimColor={activeTab !== tab.id}
            >
              {activeTab === tab.id ? `[${tab.shortcut}]` : tab.shortcut}
            </Text>
          ))}
        </Box>
      ) : (
        // Full layout with labels
        <>
          <Box flexDirection="row" gap={2}>
            {TABS.map((tab) => (
              <Box key={tab.id}>
                <Text 
                  color={activeTab === tab.id ? 'cyan' : 'white'}
                  bold={activeTab === tab.id}
                  dimColor={activeTab !== tab.id}
                  backgroundColor={activeTab === tab.id ? 'blue' : undefined}
                >
                  {activeTab === tab.id ? '▸ ' : '  '}
                  [{tab.shortcut}] {tab.label}
                  {activeTab === tab.id ? ' ◂' : '  '}
                </Text>
              </Box>
            ))}
          </Box>
          <Box marginTop={1}>
            <Text color="gray" dimColor>
              Press [1-5] for direct access, [Tab] to cycle
            </Text>
          </Box>
        </>
      )}
    </Box>
  );
};

export { TABS };
export default TabBar;
