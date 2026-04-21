const vscode = require('vscode');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

class AgentService {
    constructor(context) {
        this.context = context;
        this.loadConfiguration();
    }

    loadConfiguration() {
        const config = vscode.workspace.getConfiguration('sdlc-agent');
        this.apiKey = config.get('apiKey', '');
        this.agentPath = config.get('agentPath', '../shared-product-engineering/sdlc-langchain-agent');

        if (!this.apiKey) {
            vscode.window.showWarningMessage(
                'SDLC Agent: No API key configured. Please set your Google API key in settings.',
                'Open Settings'
            ).then(selection => {
                if (selection === 'Open Settings') {
                    vscode.commands.executeCommand('workbench.action.openSettings', 'sdlc-agent.apiKey');
                }
            });
        }
    }

    getAgentCommand() {
        const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '';
        const fullAgentPath = path.resolve(workspaceRoot, this.agentPath);

        if (!fs.existsSync(fullAgentPath)) {
            throw new Error(`SDLC Agent not found at: ${fullAgentPath}`);
        }

        return fullAgentPath;
    }

    async executeAgent(prompt, filePath) {
        return new Promise((resolve, reject) => {
            try {
                const agentPath = this.getAgentCommand();
                const config = vscode.workspace.getConfiguration('sdlc-agent');
                const debugMode = config.get('debugMode', false);

                const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '';

                // Create a temporary script to avoid shell escaping issues
                const tempScript = `#!/bin/bash
cd "${agentPath}"
source venv/bin/activate
exec python -m src.sdlc_langchain_agent.cli run "$@"${debugMode ? ' --debug' : ''}
`;

                const args = [
                    '-c',
                    tempScript,
                    '--',
                    prompt,
                    '--project-root',
                    workspaceRoot,
                    '--working-dir',
                    workspaceRoot
                ];

                // Set environment variables
                const env = {
                    ...process.env,
                    GOOGLE_API_KEY: this.apiKey,
                    PYTHONPATH: agentPath
                };

                console.log('Executing agent command...');

                const child = spawn('bash', args, {
                    env: env,
                    stdio: ['pipe', 'pipe', 'pipe']
                });

                let stdout = '';
                let stderr = '';

                child.stdout?.on('data', (data) => {
                    stdout += data.toString();
                });

                child.stderr?.on('data', (data) => {
                    stderr += data.toString();
                });

                child.on('close', (code) => {
                    if (code === 0) {
                        const response = this.parseAgentOutput(stdout);
                        resolve(response);
                    } else {
                        reject(new Error('Agent failed with code ' + code + ': ' + stderr));
                    }
                });

                child.on('error', (error) => {
                    reject(new Error('Failed to start agent: ' + error.message));
                });

            } catch (error) {
                reject(error);
            }
        });
    }

    parseAgentOutput(output) {
        const responseMatch = output.match(/Agent Response[\s\S]*?─+\s*│\s*([\s\S]*?)\s*│[\s\S]*?╰/);
        if (responseMatch && responseMatch[1]) {
            return responseMatch[1].trim();
        }

        const lines = output.split('\n').filter(line => line.trim());
        return lines[lines.length - 1] || 'No response from agent';
    }

    async analyzeCode(code, fileName) {
        const fileContext = fileName ? ' in file ' + path.basename(fileName) : '';
        const prompt = 'Analyze this code' + fileContext + ' and provide insights about potential issues, improvements, and best practices:\n\n' + code;

        return await this.executeAgent(prompt, fileName);
    }

    async fixCode(code, fileName) {
        const filePathInfo = fileName ? ` in file ${fileName}` : '';
        const prompt = `Fix all bugs and issues in this code${filePathInfo}. Return only the corrected code. Do not create new files; update the same file path provided.\n\n${code}`;

        return await this.executeAgent(prompt, fileName);
    }

    async explainCode(code) {
        const prompt = 'Explain what this code does, how it works, and any important concepts:\n\n' + code;

        return await this.executeAgent(prompt);
    }

    async chatWithAgent(message) {
        return await this.executeAgent(message);
    }
}

let agentService;

function activate(context) {
    console.log('SDLC Agent extension is now active!');

    agentService = new AgentService(context);

    const analyzeCommand = vscode.commands.registerCommand('sdlc-agent.analyze', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor found');
            return;
        }

        const selection = editor.selection;
        const text = editor.document.getText(selection.isEmpty ? undefined : selection);

        if (!text.trim()) {
            vscode.window.showErrorMessage('No code selected or file is empty');
            return;
        }

        try {
            vscode.window.showInformationMessage('Analyzing code...');
            const result = await agentService.analyzeCode(text, editor.document.fileName);

            const doc = await vscode.workspace.openTextDocument({
                content: result,
                language: 'markdown'
            });
            await vscode.window.showTextDocument(doc);
        } catch (error) {
            vscode.window.showErrorMessage(`Analysis failed: ${error.message}`);
        }
    });

    const fixCommand = vscode.commands.registerCommand('sdlc-agent.fix', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor found');
            return;
        }

        const selection = editor.selection;
        const text = editor.document.getText(selection.isEmpty ? undefined : selection);

        if (!text.trim()) {
            vscode.window.showErrorMessage('No code selected or file is empty');
            return;
        }

        try {
            vscode.window.showInformationMessage('Fixing code...');
            const result = await agentService.fixCode(text, editor.document.fileName);

            await editor.edit(editBuilder => {
                if (selection.isEmpty) {
                    const fullRange = new vscode.Range(
                        editor.document.positionAt(0),
                        editor.document.positionAt(editor.document.getText().length)
                    );
                    editBuilder.replace(fullRange, result);
                } else {
                    editBuilder.replace(selection, result);
                }
            });

            vscode.window.showInformationMessage('Code fixed successfully!');
        } catch (error) {
            vscode.window.showErrorMessage(`Fix failed: ${error.message}`);
        }
    });

    const explainCommand = vscode.commands.registerCommand('sdlc-agent.explain', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor found');
            return;
        }

        const selection = editor.selection;
        const text = editor.document.getText(selection.isEmpty ? undefined : selection);

        if (!text.trim()) {
            vscode.window.showErrorMessage('No code selected or file is empty');
            return;
        }

        try {
            vscode.window.showInformationMessage('Explaining code...');
            const result = await agentService.explainCode(text);

            const doc = await vscode.workspace.openTextDocument({
                content: result,
                language: 'markdown'
            });
            await vscode.window.showTextDocument(doc);
        } catch (error) {
            vscode.window.showErrorMessage(`Explanation failed: ${error.message}`);
        }
    });

    const chatCommand = vscode.commands.registerCommand('sdlc-agent.chat', async () => {
        const input = await vscode.window.showInputBox({
            prompt: 'Enter your message for the SDLC Agent',
            placeHolder: 'Ask anything about your code...'
        });

        if (!input) {
            return;
        }

        try {
            vscode.window.showInformationMessage('Chatting with agent...');
            const result = await agentService.chatWithAgent(input);

            const doc = await vscode.workspace.openTextDocument({
                content: result,
                language: 'markdown'
            });
            await vscode.window.showTextDocument(doc);
        } catch (error) {
            vscode.window.showErrorMessage(`Chat failed: ${error.message}`);
        }
    });

    context.subscriptions.push(analyzeCommand, fixCommand, explainCommand, chatCommand);

    vscode.commands.executeCommand('setContext', 'sdlc-agent:enabled', true);
}

function deactivate() {
    console.log('SDLC Agent extension is now deactivated');
}

module.exports = {
    activate,
    deactivate
};
