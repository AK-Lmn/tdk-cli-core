import { Box, Text } from "ink";
import type React from "react";
import type { Tab, TabBarProps } from "../types/index.js";
import { getTabBarDensity, getTerminalRuleWidth } from "../utils/terminal-layout.js";

export const TABS: Tab[] = [
  { id: "overview", label: "OVERVIEW", shortcut: "1" },
  { id: "resources", label: "RESOURCES", shortcut: "2" },
  { id: "files", label: "FILES", shortcut: "3" },
  { id: "config", label: "CONFIG", shortcut: "4" },
];

export const TabBar: React.FC<TabBarProps> = ({ activeTab, compact = false, terminalWidth }) => {
  const responsive = terminalWidth !== undefined;
  const density = terminalWidth === undefined ? "wide" : getTabBarDensity(terminalWidth);
  const compactLayout = responsive && density === "compact";
  const wide = !responsive || density === "wide";
  const ruleWidth = responsive ? getTerminalRuleWidth(terminalWidth) : compact ? 60 : 80;

  return (
    <Box flexDirection="column" paddingX={1}>
      <Box marginBottom={1}>
        <Text color="gray">{"\u2500".repeat(ruleWidth)}</Text>
      </Box>
      <Box flexDirection="row" justifyContent="space-between" paddingX={1}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const label =
            compactLayout || (!responsive && compact && !isActive)
              ? tab.label.slice(0, 4)
              : tab.label;

          return (
            <Box key={tab.id}>
              {compactLayout ? (
                <Text color={isActive ? "cyan" : "gray"} bold={isActive}>
                  [{tab.shortcut}] {label}
                </Text>
              ) : isActive ? (
                <Box
                  borderStyle="single"
                  borderColor="cyan"
                  paddingX={wide ? 1 : 0}
                  backgroundColor="black"
                >
                  <Text>
                    {wide && <Text color="cyan">{"\u2593\u2592\u2591"}</Text>}
                    <Text color="cyan" bold>
                      {" "}
                      [{tab.shortcut}] {label}{" "}
                    </Text>
                    {wide && <Text color="cyan">{"\u2591\u2592\u2593"}</Text>}
                  </Text>
                </Box>
              ) : (
                <Box paddingX={wide ? 1 : 0}>
                  <Text color="gray" dimColor>
                    [{tab.shortcut}] {label}
                  </Text>
                </Box>
              )}
            </Box>
          );
        })}
      </Box>
      <Box marginTop={1}>
        <Text color="gray">{"\u2500".repeat(ruleWidth)}</Text>
      </Box>
    </Box>
  );
};
