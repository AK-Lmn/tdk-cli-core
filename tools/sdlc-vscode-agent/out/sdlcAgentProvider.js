"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentItem = exports.SDLCAgentProvider = void 0;
const vscode = __importStar(require("vscode"));
class SDLCAgentProvider {
    constructor(context, agentService) {
        this.context = context;
        this.agentService = agentService;
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    }
    refresh() {
        this._onDidChangeTreeData.fire();
    }
    getTreeItem(element) {
        return element;
    }
    getChildren(element) {
        if (!element) {
            // Root level items
            return Promise.resolve([
                new AgentItem('Chat with Agent', 'Start a conversation with the SDLC Agent', vscode.TreeItemCollapsibleState.None, 'chat', {
                    command: 'sdlc-agent.openChat',
                    title: 'Open Chat'
                }),
                new AgentItem('Quick Actions', 'Common SDLC tasks', vscode.TreeItemCollapsibleState.Expanded, 'actions'),
                new AgentItem('Recent Files', 'Recently analyzed files', vscode.TreeItemCollapsibleState.Collapsed, 'recent'),
                new AgentItem('Agent Status', 'Check agent health and configuration', vscode.TreeItemCollapsibleState.None, 'status', {
                    command: 'sdlc-agent.checkStatus',
                    title: 'Check Status'
                })
            ]);
        }
        else if (element.contextValue === 'actions') {
            // Quick actions
            return Promise.resolve([
                new AgentItem('Analyze Current File', 'Analyze the currently open file', vscode.TreeItemCollapsibleState.None, 'action', {
                    command: 'sdlc-agent.analyze',
                    title: 'Analyze'
                }),
                new AgentItem('Fix Code Issues', 'Fix bugs in the current file', vscode.TreeItemCollapsibleState.None, 'action', {
                    command: 'sdlc-agent.fix',
                    title: 'Fix'
                }),
                new AgentItem('Explain Code', 'Explain selected code', vscode.TreeItemCollapsibleState.None, 'action', {
                    command: 'sdlc-agent.explain',
                    title: 'Explain'
                })
            ]);
        }
        else if (element.contextValue === 'recent') {
            // Recent files (placeholder - could be implemented with state management)
            return Promise.resolve([
                new AgentItem('No recent files', 'Files you analyze will appear here', vscode.TreeItemCollapsibleState.None, 'placeholder')
            ]);
        }
        return Promise.resolve([]);
    }
}
exports.SDLCAgentProvider = SDLCAgentProvider;
class AgentItem extends vscode.TreeItem {
    constructor(label, tooltip, collapsibleState, contextValue, command) {
        super(label, collapsibleState);
        this.label = label;
        this.tooltip = tooltip;
        this.collapsibleState = collapsibleState;
        this.contextValue = contextValue;
        this.command = command;
        this.tooltip = tooltip;
        this.contextValue = contextValue;
        // Set icons based on context
        switch (contextValue) {
            case 'chat':
                this.iconPath = new vscode.ThemeIcon('comment-discussion');
                break;
            case 'actions':
                this.iconPath = new vscode.ThemeIcon('tools');
                break;
            case 'action':
                this.iconPath = new vscode.ThemeIcon('play');
                break;
            case 'recent':
                this.iconPath = new vscode.ThemeIcon('history');
                break;
            case 'status':
                this.iconPath = new vscode.ThemeIcon('pulse');
                break;
            case 'placeholder':
                this.iconPath = new vscode.ThemeIcon('info');
                break;
            default:
                this.iconPath = new vscode.ThemeIcon('file');
        }
    }
}
exports.AgentItem = AgentItem;
//# sourceMappingURL=sdlcAgentProvider.js.map