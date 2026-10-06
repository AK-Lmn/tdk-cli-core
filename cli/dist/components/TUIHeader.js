import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Text } from "ink";
export const TUIHeader = ({ projectRoot, resourceCount, terminalWidth, version, }) => {
    const title = terminalWidth < 80 ? `TDK v${version}` : `TDK NEON EDITION v${version}`;
    const resourceLabel = `${String(resourceCount)} resource${resourceCount === 1 ? "" : "s"} discovered`;
    const compactHeading = `${title} | ${resourceLabel}`;
    const paddingX = terminalWidth >= 28 ? 1 : 0;
    if (terminalWidth < 80) {
        const contentWidth = Math.max(1, terminalWidth - paddingX * 2);
        const splitHeading = compactHeading.length > contentWidth;
        return (_jsxs(Box, { flexDirection: "column", paddingX: paddingX, width: terminalWidth, children: [splitHeading ? (_jsxs(_Fragment, { children: [_jsx(Text, { color: "cyan", bold: true, children: title }), _jsx(Text, { color: "green", children: resourceLabel })] })) : (_jsxs(Text, { children: [_jsx(Text, { color: "cyan", bold: true, children: title }), _jsx(Text, { color: "gray", children: " | " }), _jsx(Text, { color: "green", children: resourceLabel })] })), _jsx(Text, { color: "white", wrap: "truncate-end", children: projectRoot })] }));
    }
    const rootWidth = Math.max(1, terminalWidth -
        paddingX * 2 -
        title.length -
        " | ".length -
        " | ".length -
        resourceLabel.length);
    return (_jsxs(Box, { flexDirection: "row", paddingX: paddingX, width: terminalWidth, children: [_jsx(Text, { color: "cyan", bold: true, children: title }), _jsx(Text, { color: "gray", children: " | " }), _jsx(Box, { flexShrink: 1, width: rootWidth, children: _jsx(Text, { color: "white", wrap: "truncate-end", children: projectRoot }) }), _jsx(Text, { color: "gray", children: " | " }), _jsx(Text, { color: "green", children: resourceLabel })] }));
};
//# sourceMappingURL=TUIHeader.js.map