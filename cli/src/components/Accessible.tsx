/**
 * Accessible Components - Neon Edition
 * 
 * Components with screen reader support and accessibility features
 */

import React from 'react';
import { Box, Text } from 'ink';

interface AccessibleItemProps {
  label: string;
  isSelected: boolean;
  isFocused?: boolean;
  index: number;
  total: number;
  type?: 'stack' | 'service' | 'file' | 'tab';
  status?: 'ready' | 'pending' | 'error' | 'unknown';
  shortcut?: string;
  description?: string;
}

// Accessible list item with screen reader hints
export const AccessibleItem: React.FC<AccessibleItemProps> = ({
  label,
  isSelected,
  isFocused = false,
  index,
  total,
  type = 'item',
  status,
  shortcut,
  description,
}) => {
  // Build accessibility hint for screen readers
  const getAriaLabel = () => {
    const parts: string[] = [];
    
    if (isSelected) parts.push('[SELECTED]');
    if (isFocused) parts.push('[FOCUSED]');
    
    parts.push(label);
    parts.push(`${type}, ${index + 1} of ${total}`);
    
    if (status) {
      const statusText = status === 'ready' ? 'healthy' : 
                        status === 'pending' ? 'pending' : 
                        status === 'error' ? 'error' : 'unknown';
      parts.push(`Status: ${statusText}`);
    }
    
    if (description) parts.push(description);
    if (shortcut) parts.push(`Press ${shortcut} to select`);
    
    return parts.join('. ');
  };

  const ariaLabel = getAriaLabel();

  return (
    <Box>
      {/* Visual indicator */}
      <Text color={isSelected ? 'cyan' : isFocused ? 'yellow' : undefined}>
        {isSelected ? '▓▒░ ' : isFocused ? '▸ ' : '    '}
      </Text>
      
      {/* Main content with accessibility text */}
      <Text 
        color={isSelected ? 'cyan' : isFocused ? 'yellow' : 'white'} 
        bold={isSelected || isFocused}
        underline={isFocused}
      >
        {label}
      </Text>
      
      {/* Hidden accessibility text (visible to screen readers) */}
      <Text color="black" backgroundColor="black"> {ariaLabel}</Text>
    </Box>
  );
};

// Focus indicator component
interface FocusIndicatorProps {
  isFocused: boolean;
  children: React.ReactNode;
}

export const FocusIndicator: React.FC<FocusIndicatorProps> = ({ isFocused, children }) => {
  return (
    <Box 
      borderStyle={isFocused ? 'single' : undefined}
      borderColor={isFocused ? 'cyan' : undefined}
      paddingX={isFocused ? 1 : 0}
    >
      {children}
      {isFocused && (
        <Text color="gray" dimColor>
          {' '}▸ Focused
        </Text>
      )}
    </Box>
  );
};

// Status announcement for screen readers
interface StatusAnnouncementProps {
  message: string;
  priority?: 'polite' | 'assertive';
}

export const StatusAnnouncement: React.FC<StatusAnnouncementProps> = ({ 
  message, 
  priority = 'polite' 
}) => {
  return (
    <Box height={1}>
      <Text color={priority === 'assertive' ? 'red' : 'gray'}>
        {priority === 'assertive' ? '▶ ' : ''}{message}
      </Text>
    </Box>
  );
};

// Accessible tab with tooltip info
interface AccessibleTabProps {
  id: string;
  label: string;
  shortcut: string;
  isActive: boolean;
  description: string;
  index: number;
  total: number;
}

export const AccessibleTab: React.FC<AccessibleTabProps> = ({
  label,
  shortcut,
  isActive,
  description,
  index,
  total,
}) => {
  return (
    <Box>
      {isActive ? (
        <Box 
          borderStyle="single" 
          borderColor="cyan"
          paddingX={1}
        >
          <Text>
            <Text color="cyan">▓▒░</Text>
            <Text color="cyan" bold> [{shortcut}] {label} </Text>
            <Text color="cyan">░▒▓</Text>
          </Text>
          {/* Hidden description for accessibility */}
          <Text color="black"> {description}. Tab {index + 1} of {total}</Text>
        </Box>
      ) : (
        <Box paddingX={1}>
          <Text color="gray" dimColor>
            [{shortcut}] {label}
          </Text>
          {/* Hidden description */}
          <Text color="black"> {description}</Text>
        </Box>
      )}
    </Box>
  );
};

// High contrast mode wrapper
interface HighContrastProps {
  enabled: boolean;
  children: React.ReactNode;
}

export const HighContrastWrapper: React.FC<HighContrastProps> = ({ 
  enabled, 
  children 
}) => {
  if (!enabled) return <>{children}</>;
  
  // In high contrast mode, wrap children with high contrast styling
  return (
    <Box 
      flexDirection="column"
      borderStyle="double"
      borderColor="white"
      padding={1}
    >
      <Text color="white" bold backgroundColor="black">HIGH CONTRAST MODE</Text>
      {children}
    </Box>
  );
};

// Skip link for keyboard navigation
interface SkipLinkProps {
  target: string;
  label: string;
}

export const SkipLink: React.FC<SkipLinkProps> = ({ target, label }) => {
  return (
    <Box height={1}>
      <Text color="cyan" underline>
        [Tab] to focus: {label}
      </Text>
    </Box>
  );
};

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

// Live region for dynamic updates
interface LiveRegionProps {
  children: React.ReactNode;
  priority?: 'polite' | 'assertive';
}

export const LiveRegion: React.FC<LiveRegionProps> = ({ 
  children,
  priority = 'polite'
}) => {
  return (
    <Box 
      height={1}
      borderStyle={priority === 'assertive' ? 'single' : undefined}
      borderColor={priority === 'assertive' ? 'red' : undefined}
    >
      {children}
    </Box>
  );
};
