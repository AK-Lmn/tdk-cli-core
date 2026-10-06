import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Text } from "ink";
import { getTabBarDensity, getTerminalRuleWidth } from "../utils/terminal-layout.js";
const TABS = [
    { id: "overview", label: "OVERVIEW", shortcut: "1" },
    { id: "resources", label: "RESOURCES", shortcut: "2" },
    { id: "events", label: "EVENTS", shortcut: "3" },
    { id: "files", label: "FILES", shortcut: "4" },
    { id: "config", label: "CONFIG", shortcut: "5" },
];
export const TabBar = ({ activeTab, compact = false, terminalWidth }) => {
    const responsive = terminalWidth !== undefined;
    const density = terminalWidth === undefined ? "wide" : getTabBarDensity(terminalWidth);
    const compactLayout = responsive && density === "compact";
    const wide = !responsive || density === "wide";
    const ruleWidth = responsive ? getTerminalRuleWidth(terminalWidth) : compact ? 60 : 80;
    return (_jsxs(Box, { flexDirection: "column", paddingX: 1, children: [_jsx(Box, { marginBottom: 1, children: _jsx(Text, { color: "gray", children: "\u2500".repeat(ruleWidth) }) }), _jsx(Box, { flexDirection: "row", justifyContent: "space-between", paddingX: 1, children: TABS.map((tab) => {
                    const isActive = activeTab === tab.id;
                    const label = compactLayout || (!responsive && compact && !isActive)
                        ? tab.label.slice(0, 4)
                        : tab.label;
                    return (_jsx(Box, { children: compactLayout ? (_jsxs(Text, { color: isActive ? "cyan" : "gray", bold: isActive, children: ["[", tab.shortcut, "] ", label] })) : isActive ? (_jsx(Box, { borderStyle: "single", borderColor: "cyan", paddingX: wide ? 1 : 0, backgroundColor: "black", children: _jsxs(Text, { children: [wide && _jsx(Text, { color: "cyan", children: "\u2593\u2592\u2591" }), _jsxs(Text, { color: "cyan", bold: true, children: [" ", "[", tab.shortcut, "] ", label, " "] }), wide && _jsx(Text, { color: "cyan", children: "\u2591\u2592\u2593" })] }) })) : (_jsx(Box, { paddingX: wide ? 1 : 0, children: _jsxs(Text, { color: "gray", dimColor: true, children: ["[", tab.shortcut, "] ", label] }) })) }, tab.id));
                }) }), _jsx(Box, { marginTop: 1, children: _jsx(Text, { color: "gray", children: "\u2500".repeat(ruleWidth) }) })] }));
};
//# sourceMappingURL=TabBar.js.map