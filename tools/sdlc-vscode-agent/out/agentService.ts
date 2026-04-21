import * as vscode from 'vscode';
import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

export class AgentService {
    private context: vscode.ExtensionContext;
    private agentPath: string = '';
    private apiKey: string = '';

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.loadConfiguration();
    }

    private loadConfiguration() {
        const config = vscode.workspace.getConfiguration('sdlc-agent');
        this.apiKey = config.get<string>('apiKey', '');
        this.agentPath = config.get<string>('agentPath', '../sdlc-langchain-agent');

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

    private getAgentCommand(): string {
        const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '';
        const fullAgentPath = path.resolve(workspaceRoot, this.agentPath);
        
        // Check if agent exists
        if (!fs.existsSync(fullAgentPath)) {
            throw new Error(`SDLC Agent not found at: ${fullAgentPath}`);
        }

        return fullAgentPath;
    }

    private async executeAgent(prompt: string, filePath?: string): Promise<string> {
        return new Promise((resolve, reject) => {
            try {
                const agentPath = this.getAgentCommand();
                const config = vscode.workspace.getConfiguration('sdlc-agent');
                const debugMode = config.get<boolean>('debugMode', false);
                
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

                const child: ChildProcess = spawn('bash', args, {
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
                        // Parse the output to extract the agent response
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

    private parseAgentOutput(output: string): string {
        // Extract the agent response from the CLI output
        // Look for the "Agent Response" section
        const responseMatch = output.match(/Agent Response[\s\S]*?─+\s*│\s*([\s\S]*?)\s*│[\s\S]*?╰/);
        if (responseMatch && responseMatch[1]) {
            return responseMatch[1].trim();
        }

        // Fallback: return the last meaningful line
        const lines = output.split('\n').filter(line => line.trim());
        return lines[lines.length - 1] || 'No response from agent';
    }

    async analyzeCode(code: string, fileName?: string): Promise<string> {
        const fileContext = fileName ? ' in file ' + path.basename(fileName) : '';
        const prompt = 'Analyze this code' + fileContext + ' and provide insights about potential issues, improvements, and best practices:\n\n' + code;
        
        return await this.executeAgent(prompt, fileName);
    }

    async fixCode(code: string, fileName?: string): Promise<string> {
        const fileContext = fileName ? ' in file ' + path.basename(fileName) : '';
        const prompt = `Fix all bugs and issues in this code${fileContext}. Return only the corrected code:

${code}`;

        return await this.executeAgent(prompt, fileName);
    }

    async explainCode(code: string): Promise<string> {
        const prompt = 'Explain what this code does, how it works, and any important concepts:\n\n' + code;
        
        return await this.executeAgent(prompt);
    }

    async chatWithAgent(message: string): Promise<string> {
        return await this.executeAgent(message);
    }

    async processFileRequest(filePath: string, request: string): Promise<string> {
        const prompt = request + ' for file: ' + filePath;
        return await this.executeAgent(prompt, filePath);
    }

    // Health check method
    async checkAgentHealth(): Promise<boolean> {
        try {
            const response = await this.executeAgent('health check');
            return response.includes('healthy') || response.includes('ready');
        } catch (error) {
            console.error('Agent health check failed:', error);
            return false;
        }
    }

    // Configuration update handler
    onConfigurationChanged() {
        this.loadConfiguration();
    }
}
