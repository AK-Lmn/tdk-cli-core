#!/usr/bin/env python3
"""
Tilt IDE Code Viewer
Serves syntax-highlighted code viewing at http://localhost:9766
"""

import os
import sys
import urllib.parse
from http.server import HTTPServer, BaseHTTPRequestHandler
from pathlib import Path

# Add shared modules
sys.path.insert(0, str(Path(__file__).parent.parent / 'shared'))
from file_utils import FileUtils, PROJECT_ROOT

PORT = 9766


class CodeViewerHandler(BaseHTTPRequestHandler):
    """HTTP request handler for code viewer"""
    
    def log_message(self, format, *args):
        pass
    
    def send_html_response(self, html, status=200):
        self.send_response(status)
        self.send_header('Content-Type', 'text/html; charset=utf-8')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(html.encode())
    
    def escape_html(self, text: str) -> str:
        """Escape HTML special characters"""
        return (text
                .replace('&', '&amp;')
                .replace('<', '&lt;')
                .replace('>', '&gt;')
                .replace('"', '&quot;'))
    
    def simple_highlight(self, code: str, language: str) -> str:
        """Simple syntax highlighting using regex"""
        import re
        
        # Escape HTML first
        code = self.escape_html(code)
        
        # Keywords (common across languages)
        keywords = [
            'import', 'from', 'export', 'default', 'const', 'let', 'var', 'function',
            'class', 'interface', 'type', 'return', 'if', 'else', 'for', 'while',
            'switch', 'case', 'break', 'continue', 'try', 'catch', 'finally', 'async',
            'await', 'new', 'this', 'super', 'extends', 'implements', 'static',
            'public', 'private', 'protected', 'package', 'def', 'load', 'struct',
            'struct', 'load', 'if', 'else', 'for', 'in', 'return', 'def', 'True', 'False',
        ]
        
        # Highlight keywords
        for kw in keywords:
            pattern = rf'\b({kw})\b'
            code = re.sub(pattern, r'<span class="syntax-keyword">\1</span>', code)
        
        # Strings
        code = re.sub(r'(".*?")', r'<span class="syntax-string">\1</span>', code)
        code = re.sub(r"('.*?')", r'<span class="syntax-string">\1</span>', code)
        code = re.sub(r'(`[\s\S]*?`)', r'<span class="syntax-string">\1</span>', code)
        
        # Comments
        code = re.sub(r'(//.*$)', r'<span class="syntax-comment">\1</span>', code, flags=re.MULTILINE)
        code = re.sub(r'(#.*$)', r'<span class="syntax-comment">\1</span>', code, flags=re.MULTILINE)
        
        # Numbers
        code = re.sub(r'\b(\d+)\b', r'<span class="syntax-number">\1</span>', code)
        
        return code
    
    def render_code_with_line_numbers(self, code: str, language: str) -> str:
        """Render code with line numbers"""
        lines = code.split('\n')
        highlighted = self.simple_highlight(code, language)
        highlighted_lines = highlighted.split('\n')
        
        html = ['<table style="width:100%; border-collapse: collapse;">']
        html.append('<tr>')
        
        # Line numbers column
        html.append('<td class="line-numbers" style="vertical-align: top; padding-right: 1rem; width: 50px;">')
        for i in range(1, len(lines) + 1):
            html.append(f'<div>{i}</div>')
        html.append('</td>')
        
        # Code column
        html.append('<td style="vertical-align: top;">')
        html.append('<pre style="margin: 0;"><code>')
        for line in highlighted_lines:
            html.append(f'<div>{line or "&nbsp;"}</div>')
        html.append('</code></pre>')
        html.append('</td>')
        
        html.append('</tr>')
        html.append('</table>')
        
        return ''.join(html)
    
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
            icon='👁️',
            favicon='👁️',
            active_browser='',
            active_viewer='active',
            active_inspector='',
            active_terminal='',
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
            import json
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'status': 'ok', 'service': 'code-viewer'}).encode())
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
        
        # View file
        if path == '/view' or path == '/':
            file_path = query.get('file', [''])[0]
            
            if not file_path:
                # Show welcome/empty state
                content = '''
                    <div class="empty-state">
                        <div class="empty-state-icon">👁️</div>
                        <h2>Code Viewer</h2>
                        <p>Open a file from the <a href="http://localhost:9765">File Browser</a> to view its contents.</p>
                        <p class="text-muted">Supports TypeScript, JavaScript, Starlark, JSON, YAML, and more.</p>
                    </div>
                '''
                self.send_html_response(self.render_page('Code Viewer', content))
                return
            
            # Read file
            content, error = FileUtils.read_file_safe(file_path)
            
            if error:
                error_content = f'''
                    <div class="code-container">
                        <div class="code-header">
                            <div class="code-header-left">
                                <span class="file-path">{self.escape_html(file_path)}</span>
                            </div>
                        </div>
                        <div class="code-content">
                            <div class="empty-state">
                                <div class="empty-state-icon">⚠️</div>
                                <p>{self.escape_html(error)}</p>
                                <p class="text-muted"><a href="http://localhost:9765">← Back to File Browser</a></p>
                            </div>
                        </div>
                    </div>
                '''
                self.send_html_response(self.render_page('Error', error_content))
                return
            
            # Get file info
            resolved = FileUtils.validate_path(file_path)
            file_info = FileUtils.get_file_info(resolved) if resolved else {'name': file_path, 'size_str': 'Unknown'}
            
            # Determine language
            ext = Path(file_path).suffix.lower()
            language = FileUtils.get_language_from_ext(ext)
            
            # Render code
            code_html = self.render_code_with_line_numbers(content, language)
            
            page_content = f'''
                <div class="code-container">
                    <div class="code-header">
                        <div class="code-header-left">
                            <span class="file-path">{self.escape_html(file_path)}</span>
                            <span class="read-only-badge">👁️ READ-ONLY</span>
                        </div>
                        <div>
                            <span class="text-muted">{file_info['size_str']} • {file_info['modified']}</span>
                        </div>
                    </div>
                    <div class="code-content">
                        {code_html}
                    </div>
                </div>
                <div style="margin-top: 1rem; text-align: center;">
                    <a href="http://localhost:9765/browse?path={urllib.parse.quote(str(Path(file_path).parent))}" class="text-muted">← Back to directory</a>
                </div>
            '''
            
            self.send_html_response(self.render_page(f"{file_info['name']}", page_content))
            return
        
        # 404
        self.send_html_response(self.render_page(
            'Not Found',
            '<div class="empty-state"><div class="empty-state-icon">❓</div>Page not found</div>'
        ), 404)


def run_server():
    """Run the code viewer server"""
    server = HTTPServer(('127.0.0.1', PORT), CodeViewerHandler)
    print(f"👁️  Tilt IDE Code Viewer running at http://localhost:{PORT}")
    print(f"   📄 Open files from the file browser to view with syntax highlighting")
    
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n👋 Shutting down...")
        server.shutdown()


if __name__ == '__main__':
    run_server()
