import * as vscode from 'vscode';
import { SDLCAgentProvider } from './sdlcAgentProvider';
import { ChatPanel } from './chatPanel';
import { AgentService } from './agentService';

let agentService: AgentService;
let chatPanel: ChatPanel | undefined;

export function activate(context: vscode.ExtensionContext) {
    console.log('SDLC Agent extension is now active!');

    // Initialize services
    agentService = new AgentService(context);
    
    // Set context for views
    vscode.commands.executeCommand('setContext', 'sdlc-agent:enabled', true);

    // Register commands
    const commands = [
        vscode.commands.registerCommand('sdlc-agent.analyze', analyzeCode),
        vscode.commands.registerCommand('sdlc-agent.fix', fixCode),
        vscode.commands.registerCommand('sdlc-agent.chat', openChat),
        vscode.commands.registerCommand('sdlc-agent.explain', explainCode),
        vscode.commands.registerCommand('sdlc-agent.openChat', openChat)
    ];

    // Register tree data provider
    const provider = new SDLCAgentProvider(context, agentService);
    vscode.window.registerTreeDataProvider('sdlc-agent-chat', provider);

    // Register event listeners
    const listeners = [
        vscode.workspace.onDidSaveTextDocument(onDocumentSave),
        vscode.window.onDidChangeActiveTextEditor(onActiveEditorChange)
    ];

    context.subscriptions.push(...commands, ...listeners);

    // Show welcome message
    vscode.window.showInformationMessage(
        'SDLC Agent is ready! Use Ctrl+Shift+A to start chatting.',
        'Open Chat'
    ).then(selection => {
        if (selection === 'Open Chat') {
            openChat();
        }
    });
}

async function analyzeCode() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage('No active editor found');
        return;
    }

    const selection = editor.selection;
    const text = selection.isEmpty ? editor.document.getText() : editor.document.getText(selection);
    const fileName = editor.document.fileName;

    if (!text.trim()) {
        vscode.window.showErrorMessage('No code selected or file is empty');
        return;
    }

    try {
        vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Analyzing code...",
            cancellable: false
        }, async () => {
            const result = await agentService.analyzeCode(text, fileName);
            
            // Show results in a new document
            const doc = await vscode.workspace.openTextDocument({
                content: `# Code Analysis Results\n\n${result}`,
                language: 'markdown'
            });
            await vscode.window.showTextDocument(doc);
        });
    } catch (error) {
        vscode.window.showErrorMessage(`Analysis failed: ${error}`);
    }
}

async function fixCode() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage('No active editor found');
        return;
    }

    const selection = editor.selection;
    const text = selection.isEmpty ? editor.document.getText() : editor.document.getText(selection);
    const fileName = editor.document.fileName;

    if (!text.trim()) {
        vscode.window.showErrorMessage('No code selected or file is empty');
        return;
    }

    try {
        const result = await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Fixing code issues...",
            cancellable: false
        }, async () => {
            return await agentService.fixCode(text, fileName);
        });

        // Ask user if they want to apply the fixes
        const choice = await vscode.window.showInformationMessage(
            'Code fixes are ready. Apply changes?',
            'Apply', 'Preview', 'Cancel'
        );

        if (choice === 'Apply') {
            const range = selection.isEmpty ? 
                new vscode.Range(0, 0, editor.document.lineCount, 0) : 
                selection;
            
            await editor.edit(editBuilder => {
                editBuilder.replace(range, result);
            });
            
            vscode.window.showInformationMessage('Code fixes applied successfully!');
        } else if (choice === 'Preview') {
            const doc = await vscode.workspace.openTextDocument({
                content: result,
                language: editor.document.languageId
            });
            await vscode.window.showTextDocument(doc, vscode.ViewColumn.Beside);
        }
    } catch (error) {
        vscode.window.showErrorMessage(`Fix failed: ${error}`);
    }
}

async function explainCode() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage('No active editor found');
        return;
    }

    const selection = editor.selection;
    const text = selection.isEmpty ? editor.document.getText() : editor.document.getText(selection);

    if (!text.trim()) {
        vscode.window.showErrorMessage('No code selected');
        return;
    }

    try {
        vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Explaining code...",
            cancellable: false
        }, async () => {
            const explanation = await agentService.explainCode(text);
            
            // Show explanation in a new document
            const doc = await vscode.workspace.openTextDocument({
                content: `# Code Explanation\n\n${explanation}`,
                language: 'markdown'
            });
            await vscode.window.showTextDocument(doc, vscode.ViewColumn.Beside);
        });
    } catch (error) {
        vscode.window.showErrorMessage(`Explanation failed: ${error}`);
    }
}

function openChat() {
    if (chatPanel) {
        chatPanel.reveal();
    } else {
        chatPanel = new ChatPanel(vscode.window.createWebviewPanel(
            'sdlc-agent-chat',
            'SDLC Agent Chat',
            vscode.ViewColumn.Beside,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        ), agentService);

        chatPanel.onDispose(() => {
            chatPanel = undefined;
        });
    }
}

async function onDocumentSave(document: vscode.TextDocument) {
    const config = vscode.workspace.getConfiguration('sdlc-agent');
    const autoAnalyze = config.get<boolean>('autoAnalyze', false);

    if (autoAnalyze && (document.languageId === 'javascript' || 
                       document.languageId === 'typescript' || 
                       document.languageId === 'python')) {
        // Auto-analyze saved files (optional feature)
        vscode.window.showInformationMessage(
            `File saved: ${document.fileName}. Run analysis?`,
            'Analyze'
        ).then(selection => {
            if (selection === 'Analyze') {
                analyzeCode();
            }
        });
    }
}

function onActiveEditorChange(editor: vscode.TextEditor | undefined) {
    // Update context or perform actions when editor changes
    if (editor) {
        console.log(`Active editor changed to: ${editor.document.fileName}`);
    }
}

export function deactivate() {
    if (chatPanel) {
        chatPanel.dispose();
    }
    console.log('SDLC Agent extension deactivated');
}
