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
exports.AgentService = void 0;
const vscode = __importStar(require("vscode"));
const child_process_1 = require("child_process");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
class AgentService {
    constructor(context) {
        this.agentPath = '';
        this.apiKey = '';
        this.context = context;
        this.loadConfiguration();
    }
    loadConfiguration() {
        const config = vscode.workspace.getConfiguration('sdlc-agent');
        this.apiKey = config.get('apiKey', '');
        this.agentPath = config.get('agentPath', '../sdlc-langchain-agent');
        if (!this.apiKey) {
            vscode.window.showWarningMessage('SDLC Agent: No API key configured. Please set your Google API key in settings.', 'Open Settings').then(selection => {
                if (selection === 'Open Settings') {
                    vscode.commands.executeCommand('workbench.action.openSettings', 'sdlc-agent.apiKey');
                }
            });
        }
    }
    getAgentCommand() {
        const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '';
        const fullAgentPath = path.resolve(workspaceRoot, this.agentPath);
        // Check if agent exists
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
                const child = (0, child_process_1.spawn)('bash', args, {
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
                    }
                    else {
                        reject(new Error('Agent failed with code ' + code + ': ' + stderr));
                    }
                });
                child.on('error', (error) => {
                    reject(new Error('Failed to start agent: ' + error.message));
                });
            }
            catch (error) {
                reject(error);
            }
        });
    }
    parseAgentOutput(output) {
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
    async analyzeCode(code, fileName) {
        const fileContext = fileName ? ' in file ' + path.basename(fileName) : '';
        const prompt = 'Analyze this code' + fileContext + ' and provide insights about potential issues, improvements, and best practices:\n\n' + code;
        return await this.executeAgent(prompt, fileName);
    }
    async fixCode(code, fileName) {
        const fileContext = fileName ? ' in file ' + path.basename(fileName) : '';
        const prompt = `Fix all bugs and issues in this code${fileContext}. Return only the corrected code:

${code}`;
        return await this.executeAgent(prompt, fileName);
    }
    async explainCode(code) {
        const prompt = 'Explain what this code does, how it works, and any important concepts:\n\n' + code;
        return await this.executeAgent(prompt);
    }
    async chatWithAgent(message) {
        return await this.executeAgent(message);
    }
    async processFileRequest(filePath, request) {
        const prompt = request + ' for file: ' + filePath;
        return await this.executeAgent(prompt, filePath);
    }
    // Health check method
    async checkAgentHealth() {
        try {
            const response = await this.executeAgent('health check');
            return response.includes('healthy') || response.includes('ready');
        }
        catch (error) {
            console.error('Agent health check failed:', error);
            return false;
        }
    }
    // Configuration update handler
    onConfigurationChanged() {
        this.loadConfiguration();
    }
}
exports.AgentService = AgentService;
//# sourceMappingURL=agentService.js.map