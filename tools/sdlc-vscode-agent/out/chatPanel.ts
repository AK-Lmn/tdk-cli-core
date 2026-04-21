import * as vscode from 'vscode';
import { AgentService } from './agentService';

export class ChatPanel {
    private panel: vscode.WebviewPanel;
    private agentService: AgentService;
    private disposables: vscode.Disposable[] = [];

    constructor(panel: vscode.WebviewPanel, agentService: AgentService) {
        this.panel = panel;
        this.agentService = agentService;

        this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
        this.panel.webview.html = this.getWebviewContent();

        // Handle messages from the webview
        this.panel.webview.onDidReceiveMessage(
            async (message) => {
                switch (message.type) {
                    case 'chat':
                        await this.handleChatMessage(message.text);
                        break;
                    case 'clear':
                        this.clearChat();
                        break;
                    case 'analyze-current-file':
                        await this.analyzeCurrentFile();
                        break;
                }
            },
            null,
            this.disposables
        );
    }

    private async handleChatMessage(message: string) {
        try {
            // Show user message
            this.addMessage('user', message);
            
            // Show typing indicator
            this.showTyping(true);

            // Get response from agent
            const response = await this.agentService.chatWithAgent(message);
            
            // Hide typing indicator and show response
            this.showTyping(false);
            this.addMessage('agent', response);

        } catch (error) {
            this.showTyping(false);
            this.addMessage('error', `Error: ${error}`);
        }
    }

    private async analyzeCurrentFile() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            this.addMessage('error', 'No active file to analyze');
            return;
        }

        const fileName = editor.document.fileName;
        const content = editor.document.getText();

        try {
            this.showTyping(true);
            const analysis = await this.agentService.analyzeCode(content, fileName);
            this.showTyping(false);
            this.addMessage('agent', `**Analysis of ${fileName}:**\n\n${analysis}`);
        } catch (error) {
            this.showTyping(false);
            this.addMessage('error', `Analysis failed: ${error}`);
        }
    }

    private addMessage(type: 'user' | 'agent' | 'error', content: string) {
        this.panel.webview.postMessage({
            type: 'addMessage',
            messageType: type,
            content: content
        });
    }

    private showTyping(show: boolean) {
        this.panel.webview.postMessage({
            type: 'showTyping',
            show: show
        });
    }

    private clearChat() {
        this.panel.webview.postMessage({
            type: 'clearChat'
        });
    }

    public reveal() {
        this.panel.reveal();
    }

    public dispose() {
        this.panel.dispose();
        while (this.disposables.length) {
            const disposable = this.disposables.pop();
            if (disposable) {
                disposable.dispose();
            }
        }
    }

    public onDispose(callback: () => void) {
        this.panel.onDidDispose(callback);
    }

    private getWebviewContent(): string {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SDLC Agent Chat</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
            margin: 0;
            padding: 20px;
            height: 100vh;
            display: flex;
            flex-direction: column;
        }
        
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 1px solid var(--vscode-panel-border);
        }
        
        .title {
            font-size: 18px;
            font-weight: bold;
            color: var(--vscode-textLink-foreground);
        }
        
        .actions {
            display: flex;
            gap: 10px;
        }
        
        button {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 6px 12px;
            border-radius: 3px;
            cursor: pointer;
            font-size: 12px;
        }
        
        button:hover {
            background-color: var(--vscode-button-hoverBackground);
        }
        
        .chat-container {
            flex: 1;
            overflow-y: auto;
            margin-bottom: 20px;
            padding: 10px;
            border: 1px solid var(--vscode-panel-border);
            border-radius: 5px;
            background-color: var(--vscode-editor-background);
        }
        
        .message {
            margin-bottom: 15px;
            padding: 10px;
            border-radius: 8px;
            max-width: 80%;
        }
        
        .message.user {
            background-color: var(--vscode-textBlockQuote-background);
            margin-left: auto;
            text-align: right;
        }
        
        .message.agent {
            background-color: var(--vscode-textCodeBlock-background);
            margin-right: auto;
        }
        
        .message.error {
            background-color: var(--vscode-inputValidation-errorBackground);
            color: var(--vscode-inputValidation-errorForeground);
            margin-right: auto;
        }
        
        .message-header {
            font-weight: bold;
            margin-bottom: 5px;
            font-size: 12px;
            opacity: 0.8;
        }
        
        .typing {
            display: none;
            font-style: italic;
            opacity: 0.7;
            margin: 10px 0;
        }
        
        .input-container {
            display: flex;
            gap: 10px;
        }
        
        #messageInput {
            flex: 1;
            padding: 10px;
            border: 1px solid var(--vscode-input-border);
            border-radius: 3px;
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            font-family: inherit;
            font-size: inherit;
        }
        
        #messageInput:focus {
            outline: none;
            border-color: var(--vscode-focusBorder);
        }
        
        .send-button {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 10px 20px;
            border-radius: 3px;
            cursor: pointer;
        }
        
        .send-button:hover {
            background-color: var(--vscode-button-hoverBackground);
        }
        
        .send-button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        
        pre {
            background-color: var(--vscode-textCodeBlock-background);
            padding: 10px;
            border-radius: 3px;
            overflow-x: auto;
            white-space: pre-wrap;
        }
        
        code {
            background-color: var(--vscode-textCodeBlock-background);
            padding: 2px 4px;
            border-radius: 3px;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="title">🤖 SDLC Agent</div>
        <div class="actions">
            <button onclick="analyzeCurrentFile()">Analyze Current File</button>
            <button onclick="clearChat()">Clear Chat</button>
        </div>
    </div>
    
    <div class="chat-container" id="chatContainer">
        <div class="message agent">
            <div class="message-header">SDLC Agent</div>
            <div>Hello! I'm your AI coding assistant. I can help you analyze code, fix bugs, explain concepts, and more. What would you like to work on today?</div>
        </div>
    </div>
    
    <div class="typing" id="typing">Agent is thinking...</div>
    
    <div class="input-container">
        <input type="text" id="messageInput" placeholder="Ask me anything about your code..." />
        <button class="send-button" onclick="sendMessage()">Send</button>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        
        function sendMessage() {
            const input = document.getElementById('messageInput');
            const message = input.value.trim();
            
            if (message) {
                vscode.postMessage({
                    type: 'chat',
                    text: message
                });
                input.value = '';
            }
        }
        
        function clearChat() {
            vscode.postMessage({
                type: 'clear'
            });
        }
        
        function analyzeCurrentFile() {
            vscode.postMessage({
                type: 'analyze-current-file'
            });
        }
        
        // Handle Enter key in input
        document.getElementById('messageInput').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
        
        // Handle messages from extension
        window.addEventListener('message', event => {
            const message = event.data;
            
            switch (message.type) {
                case 'addMessage':
                    addMessage(message.messageType, message.content);
                    break;
                case 'showTyping':
                    showTyping(message.show);
                    break;
                case 'clearChat':
                    clearChatMessages();
                    break;
            }
        });
        
        function addMessage(type, content) {
            const container = document.getElementById('chatContainer');
            const messageDiv = document.createElement('div');
            messageDiv.className = \`message \${type}\`;
            
            const headerDiv = document.createElement('div');
            headerDiv.className = 'message-header';
            headerDiv.textContent = type === 'user' ? 'You' : type === 'agent' ? 'SDLC Agent' : 'Error';
            
            const contentDiv = document.createElement('div');
            contentDiv.innerHTML = formatMessage(content);
            
            messageDiv.appendChild(headerDiv);
            messageDiv.appendChild(contentDiv);
            container.appendChild(messageDiv);
            
            // Scroll to bottom
            container.scrollTop = container.scrollHeight;
        }
        
        function formatMessage(content) {
            // Basic markdown-like formatting
            return content
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/\`(.*?)\`/g, '<code>$1</code>')
                .replace(/\n/g, '<br>');
        }
        
        function showTyping(show) {
            const typing = document.getElementById('typing');
            typing.style.display = show ? 'block' : 'none';
        }
        
        function clearChatMessages() {
            const container = document.getElementById('chatContainer');
            container.innerHTML = \`
                <div class="message agent">
                    <div class="message-header">SDLC Agent</div>
                    <div>Chat cleared. How can I help you?</div>
                </div>
            \`;
        }
    </script>
</body>
</html>`;
    }
}
