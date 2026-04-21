import * as vscode from 'vscode';
import { AgentService } from './agentService';

export class SDLCAgentProvider implements vscode.TreeDataProvider<AgentItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<AgentItem | undefined | null | void> = new vscode.EventEmitter<AgentItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<AgentItem | undefined | null | void> = this._onDidChangeTreeData.event;

    constructor(
        private context: vscode.ExtensionContext,
        private agentService: AgentService
    ) {}

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: AgentItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: AgentItem): Thenable<AgentItem[]> {
        if (!element) {
            // Root level items
            return Promise.resolve([
                new AgentItem(
                    'Chat with Agent',
                    'Start a conversation with the SDLC Agent',
                    vscode.TreeItemCollapsibleState.None,
                    'chat',
                    {
                        command: 'sdlc-agent.openChat',
                        title: 'Open Chat'
                    }
                ),
                new AgentItem(
                    'Quick Actions',
                    'Common SDLC tasks',
                    vscode.TreeItemCollapsibleState.Expanded,
                    'actions'
                ),
                new AgentItem(
                    'Recent Files',
                    'Recently analyzed files',
                    vscode.TreeItemCollapsibleState.Collapsed,
                    'recent'
                ),
                new AgentItem(
                    'Agent Status',
                    'Check agent health and configuration',
                    vscode.TreeItemCollapsibleState.None,
                    'status',
                    {
                        command: 'sdlc-agent.checkStatus',
                        title: 'Check Status'
                    }
                )
            ]);
        } else if (element.contextValue === 'actions') {
            // Quick actions
            return Promise.resolve([
                new AgentItem(
                    'Analyze Current File',
                    'Analyze the currently open file',
                    vscode.TreeItemCollapsibleState.None,
                    'action',
                    {
                        command: 'sdlc-agent.analyze',
                        title: 'Analyze'
                    }
                ),
                new AgentItem(
                    'Fix Code Issues',
                    'Fix bugs in the current file',
                    vscode.TreeItemCollapsibleState.None,
                    'action',
                    {
                        command: 'sdlc-agent.fix',
                        title: 'Fix'
                    }
                ),
                new AgentItem(
                    'Explain Code',
                    'Explain selected code',
                    vscode.TreeItemCollapsibleState.None,
                    'action',
                    {
                        command: 'sdlc-agent.explain',
                        title: 'Explain'
                    }
                )
            ]);
        } else if (element.contextValue === 'recent') {
            // Recent files (placeholder - could be implemented with state management)
            return Promise.resolve([
                new AgentItem(
                    'No recent files',
                    'Files you analyze will appear here',
                    vscode.TreeItemCollapsibleState.None,
                    'placeholder'
                )
            ]);
        }

        return Promise.resolve([]);
    }
}

export class AgentItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly tooltip: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly contextValue: string,
        public readonly command?: vscode.Command
    ) {
        super(label, collapsibleState);

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
