/** ResourceSelectInput Component - Standardized SelectInput for TDK CLI */

import React from 'react';
import { Text } from 'ink';
import SelectInput from 'ink-select-input';

interface SelectItem {
  label: string;
  value: string;
}

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
