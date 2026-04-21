#!/usr/bin/env python3
"""
Tilt IDE Code Executor
Execute commands from web UI at http://localhost:9768
"""

import os
import sys
import subprocess
import urllib.parse
import json
from http.server import HTTPServer, BaseHTTPRequestHandler
from pathlib import Path

# Add shared modules
sys.path.insert(0, str(Path(__file__).parent.parent / 'shared'))
from file_utils import PROJECT_ROOT

PORT = 9768


class CodeExecutorHandler(BaseHTTPRequestHandler):
    """HTTP request handler for code executor"""
    
    def log_message(self, format, *args):
        pass
    
    def send_json_response(self, data, status=200):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())
    
    def send_html_response(self, html, status=200):
        self.send_response(status)
        self.send_header('Content-Type', 'text/html; charset=utf-8')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(html.encode())
    
    def escape_html(self, text: str) -> str:
        return (text
                .replace('&', '&amp;')
                .replace('<', '&lt;')
                .replace('>', '&gt;')
                .replace('"', '&quot;'))
    
    def validate_command(self, cmd: str) -> tuple:
        """
        Validate command for safety.
        Returns (is_valid, error_message)
        """
        # Block dangerous commands
        dangerous = ['rm -rf /', 'rm -rf /*', ':(){ :|:& };:', '> /dev/sda', 
                     'mv / /dev/null', 'dd if=/dev/zero', 'mkfs.', 'chmod -R 777 /',
                     'sudo', 'su -', 'passwd', 'deluser', 'userdel']
        
        for d in dangerous:
            if d in cmd.lower():
                return False, f"Command blocked for safety: {d}"
        
        # Only allow bun commands and safe system commands
        allowed_prefixes = ['bun ', 'ls ', 'pwd', 'echo ', 'cat ', 'head ', 'tail ', 
                           'grep ', 'find ', 'cd ', 'mkdir ', 'touch ', 'clear', 'exit',
                           'npm ', 'yarn ', 'npx ', 'pnpm ', 'git ', 'curl ', 'wget ']
        
        cmd_stripped = cmd.strip()
        is_allowed = any(cmd_stripped.startswith(prefix) for prefix in allowed_prefixes)
        
        if not is_allowed:
            return False, "Only bun, npm, git, and safe system commands are allowed"
        
        return True, None
    
    def execute_command(self, cmd: str, cwd: str = None) -> dict:
        """Execute command and return result"""
        # Validate
        is_valid, error = self.validate_command(cmd)
        if not is_valid:
            return {'success': False, 'stdout': '', 'stderr': error, 'exit_code': 1}
        
        # Determine working directory
        work_dir = cwd or str(PROJECT_ROOT)
        
        try:
            # Execute with timeout
            result = subprocess.run(
                cmd,
                shell=True,
                cwd=work_dir,
                capture_output=True,
                text=True,
                timeout=60,  # 60 second timeout
                env={**os.environ, 'TERM': 'xterm-color'}
            )
            
            return {
                'success': result.returncode == 0,
                'stdout': result.stdout,
                'stderr': result.stderr,
                'exit_code': result.returncode
            }
        except subprocess.TimeoutExpired:
            return {'success': False, 'stdout': '', 'stderr': 'Command timed out (60s limit)', 'exit_code': -1}
        except Exception as e:
            return {'success': False, 'stdout': '', 'stderr': str(e), 'exit_code': -1}
    
    def render_page(self, title: str, content: str) -> str:
        """Render full HTML page"""
        template_path = Path(__file__).parent.parent / 'shared' / 'templates' / 'base.html'
        try:
            with open(template_path, 'r') as f:
                template = f.read()
        except:
            template = '''<!DOCTYPE html>
<html><head><title>{title}</title><link rel="stylesheet" href="/static/styles.css"></head>
<body><header class="header"><h1>{icon} {title}</h1></header>
<div class="container">{sidebar}<main class="content">{content}</main></div></body></html>'''
        
        return template.format(
            title=title,
            icon='💻',
            favicon='💻',
            active_browser='',
            active_viewer='',
            active_inspector='',
            active_terminal='active',
            sidebar='',
            content=content
        )
    
    def do_GET(self):
        """Handle GET requests"""
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        query = urllib.parse.parse_qs(parsed.query)
        
        # Health check
        if path == '/health':
            self.send_json_response({'status': 'ok', 'service': 'code-executor'})
            return
        
        # Static files
        if path.startswith('/static/'):
            static_path = Path(__file__).parent.parent / 'shared' / path[1:]
            if static_path.exists():
                with open(static_path, 'r') as f:
                    content = f.read()
                self.send_response(200)
                self.send_header('Content-Type', 'text/css')
                self.end_headers()
                self.wfile.write(content.encode())
            else:
                self.send_error(404)
            return
        
        # Main terminal page
        if path in ('/', '/terminal'):
            # Get working directory from query
            cwd = query.get('cwd', [str(PROJECT_ROOT)])[0]
            cwd_display = self.escape_html(cwd.replace(str(PROJECT_ROOT), '~'))
            
            content = f'''
                <div class="terminal" style="height: calc(100vh - 200px);">
                    <div class="terminal-header">
                        <div>
                            <span class="panel-title">💻 Terminal</span>
                            <span class="text-muted" style="margin-left: 1rem; font-size: 0.85rem;">Working directory: {cwd_display}</span>
                        </div>
                        <div>
                            <span class="text-muted" style="font-size: 0.8rem;">Supports: bun, npm, git, basic shell</span>
                        </div>
                    </div>
                    <div class="terminal-content" id="terminal-output" style="white-space: pre-wrap; font-family: var(--font-mono);">
                        <div class="text-muted">TDK Landscape Tilt IDE Terminal</div>
                        <div class="text-muted">Type a command and press Enter to execute</div>
                        <div class="text-muted">─────────────────────────────────────────</div>
                    </div>
                    <div class="terminal-input-line">
                        <span class="terminal-prompt">$</span>
                        <input type="text" id="terminal-input" class="terminal-input" 
                               placeholder="Enter command (e.g., bun test, ls -la)..." 
                               autocomplete="off" spellcheck="false">
                    </div>
                </div>
                
                <script>
                    const terminalOutput = document.getElementById('terminal-output');
                    const terminalInput = document.getElementById('terminal-input');
                    const cwd = {json.dumps(cwd)};
                    let commandHistory = [];
                    let historyIndex = -1;
                    
                    terminalInput.addEventListener('keydown', async function(e) {{
                        if (e.key === 'Enter') {{
                            const cmd = this.value.trim();
                            if (!cmd) return;
                            
                            // Add to history
                            commandHistory.push(cmd);
                            historyIndex = commandHistory.length;
                            
                            // Display command
                            terminalOutput.innerHTML += `<div><span style="color: var(--accent-primary);">$</span> ${{self.escape_html(cmd)}}</div>`;
                            terminalInput.value = '';
                            
                            // Execute
                            try {{
                                const response = await fetch('/execute', {{
                                    method: 'POST',
                                    headers: {{'Content-Type': 'application/json'}},
                                    body: JSON.stringify({{command: cmd, cwd: cwd}})
                                }});
                                const result = await response.json();
                                
                                // Display output
                                if (result.stdout) {{
                                    terminalOutput.innerHTML += `<div style="color: var(--text-primary);">${{self.escape_html(result.stdout)}}</div>`;
                                }}
                                if (result.stderr) {{
                                    terminalOutput.innerHTML += `<div style="color: var(--error);">${{self.escape_html(result.stderr)}}</div>`;
                                }}
                                
                                // Status
                                const statusColor = result.success ? 'var(--success)' : 'var(--error)';
                                terminalOutput.innerHTML += `<div style="color: ${{statusColor}}; font-size: 0.8rem;">Exit code: ${{result.exit_code}}</div>`;
                                
                            }} catch (err) {{
                                terminalOutput.innerHTML += `<div style="color: var(--error);">Error: ${{err.message}}</div>`;
                            }}
                            
                            // Scroll to bottom
                            terminalOutput.scrollTop = terminalOutput.scrollHeight;
                        }}
                        
                        // History navigation
                        if (e.key === 'ArrowUp') {{
                            e.preventDefault();
                            if (historyIndex > 0) {{
                                historyIndex--;
                                terminalInput.value = commandHistory[historyIndex];
                            }}
                        }}
                        if (e.key === 'ArrowDown') {{
                            e.preventDefault();
                            if (historyIndex < commandHistory.length - 1) {{
                                historyIndex++;
                                terminalInput.value = commandHistory[historyIndex];
                            }} else {{
                                historyIndex = commandHistory.length;
                                terminalInput.value = '';
                            }}
                        }}
                    }});
                    
                    terminalInput.focus();
                </script>
            '''
            
            self.send_html_response(self.render_page('Terminal', content))
            return
        
        # 404
        self.send_html_response(self.render_page(
            'Not Found',
            '<div class="empty-state"><div class="empty-state-icon">❓</div>Page not found</div>'
        ), 404)
    
    def do_POST(self):
        """Handle POST requests"""
        parsed = urllib.parse.urlparse(self.path)
        
        if parsed.path == '/execute':
            # Read request body
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length).decode()
            
            try:
                data = json.loads(body)
                cmd = data.get('command', '').strip()
                cwd = data.get('cwd', str(PROJECT_ROOT))
                
                if not cmd:
                    self.send_json_response({'success': False, 'error': 'No command provided'}, 400)
                    return
                
                result = self.execute_command(cmd, cwd)
                self.send_json_response(result)
                
            except json.JSONDecodeError:
                self.send_json_response({'success': False, 'error': 'Invalid JSON'}, 400)
            except Exception as e:
                self.send_json_response({'success': False, 'error': str(e)}, 500)
            return
        
        self.send_json_response({'error': 'Not found'}, 404)


def run_server():
    """Run the code executor server"""
    server = HTTPServer(('127.0.0.1', PORT), CodeExecutorHandler)
    print(f"💻 Tilt IDE Code Executor running at http://localhost:{PORT}")
    print(f"   🚀 Execute bun commands from the browser")
    print(f"   ⚠️  Safety: Only bun, npm, git, and safe system commands allowed")
    
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n👋 Shutting down...")
        server.shutdown()


if __name__ == '__main__':
    run_server()
