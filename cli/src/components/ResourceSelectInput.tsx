import React from 'react';
import { Text } from 'ink';
import SelectInput from 'ink-select-input';
import type { SelectItem } from '../types/index.js';

interface ResourceSelectInputProps {
  /** Items to display in the list */
  items: SelectItem[];
  /** Handler when an item is selected */
  onSelect: (item: SelectItem) => void;
  /** Currently highlighted index */
  highlightedIndex: number;
}

/**
 * Standardized SelectInput component with TDK styling
 * Provides consistent cyan/white color scheme and indicator style
 * across all tabs in the TUI
 */
export const ResourceSelectInput: React.FC<ResourceSelectInputProps> = ({
  items,
  onSelect,
  highlightedIndex,
}) => {
  return (
    <SelectInput
      items={items}
      onSelect={onSelect}
      initialIndex={highlightedIndex}
      indicatorComponent={({ isSelected }) => (
        <Text color={isSelected ? 'cyan' : undefined}>
          {isSelected ? '▓▒░ ' : '    '}
        </Text>
      )}
      itemComponent={({ isSelected, label }) => (
        <Text
          color={isSelected ? 'cyan' : 'white'}
          bold={isSelected}
          backgroundColor={isSelected ? 'black' : undefined}
        >
          {label}
        </Text>
      )}
    />
  );
};
