#!/usr/bin/env python3
"""
Tilt IDE File Browser
Serves a web-based file browser at http://localhost:9765
"""

import os
import sys
import urllib.parse
from http.server import HTTPServer, BaseHTTPRequestHandler
from pathlib import Path

# Add shared modules
sys.path.insert(0, str(Path(__file__).parent.parent / 'shared'))
from file_utils import FileUtils, PROJECT_ROOT

PORT = 9765


class FileBrowserHandler(BaseHTTPRequestHandler):
    """HTTP request handler for file browser"""
    
    def log_message(self, format, *args):
        """Suppress default logging"""
        pass
    
    def send_json_response(self, data, status=200):
        """Send JSON response"""
        import json
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())
    
    def send_html_response(self, html, status=200):
        """Send HTML response"""
        self.send_response(status)
        self.send_header('Content-Type', 'text/html; charset=utf-8')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(html.encode())
    
    def render_breadcrumb(self, path: str) -> str:
        """Render breadcrumb navigation"""
        if not path or path == '.':
            return '<div class="breadcrumb"><strong>📁 Root</strong></div>'
        
        parts = path.split('/')
        breadcrumbs = ['<a href="/browse?path=.">📁 Root</a>']
        
        current_path = ''
        for part in parts:
            if not part or part == '.':
                continue
            current_path = f"{current_path}/{part}" if current_path else part
            breadcrumbs.append(f'<span class="breadcrumb-separator">/</span>')
            breadcrumbs.append(f'<a href="/browse?path={urllib.parse.quote(current_path)}">{part}</a>')
        
        return f'<div class="breadcrumb">{ "".join(breadcrumbs) }</div>'
    
    def render_file_list(self, items: list, current_path: str, page: int = 1, per_page: int = 500) -> str:
        """Render file/directory list with pagination for large directories"""
        if not items:
            return '<div class="empty-state"><div class="empty-state-icon">📂</div>Empty directory</div>'
        
        total_items = len(items)
        total_pages = (total_items + per_page - 1) // per_page
        
        # Paginate files only (show all directories)
        dirs = [item for item in items if item['is_dir']]
        files = [item for item in items if not item['is_dir']]
        
        # For directories under 100 items, don't paginate
        if total_items <= 100:
            paginated_files = files
            show_pagination = False
        else:
            # Calculate pagination for files
            start_idx = (page - 1) * per_page
            end_idx = start_idx + per_page
            paginated_files = files[start_idx:end_idx]
            show_pagination = len(files) > per_page
            
            # Adjust page if out of bounds
            if start_idx >= len(files) and files:
                page = 1
                paginated_files = files[:per_page]
        
        html = ['<ul class="file-list">']
        
        # Parent directory link (if not at root)
        if current_path and current_path != '.':
            parent = str(Path(current_path).parent)
            if parent == '.':
                parent = '.'
            html.append(f'''
                <li class="file-item dir-item" onclick="location.href='/browse?path={urllib.parse.quote(parent)}'">
                    <span class="file-icon">📁</span>
                    <span class="file-name">..</span>
                    <span class="file-meta">Parent directory</span>
                </li>
            ''')
        
        # Show item count for large directories
        if total_items > 100:
            html.append(f'<div class="file-count">{len(dirs)} directories, {len(files)} files (total: {total_items})</div>')
        
        for item in dirs:
            encoded_path = urllib.parse.quote(item['path'])
            html.append(f'''
                <li class="file-item dir-item" onclick="location.href='/browse?path={encoded_path}'">
                    <span class="file-icon">{item['icon']}</span>
                    <span class="file-name">{item['name']}/</span>
                    <span class="file-meta">{item['modified']}</span>
                </li>
            ''')
        
        for item in paginated_files:
            # Link to code viewer for files
            viewer_url = f"http://localhost:9766/view?file={urllib.parse.quote(item['path'])}"
            html.append(f'''
                <li class="file-item" onclick="window.open('{viewer_url}', '_blank')">
                    <span class="file-icon">{item['icon']}</span>
                    <span class="file-name">{item['name']}</span>
                    <span class="file-meta">{item['size_str']} • {item['modified']}</span>
                </li>
            ''')
        
        # Pagination controls
        if show_pagination:
            html.append('<div class="pagination">')
            
            # Previous button
            if page > 1:
                prev_url = f'/browse?path={urllib.parse.quote(current_path)}&page={page-1}'
                html.append(f'<a href="{prev_url}" class="pagination-btn">← Previous</a>')
            else:
                html.append('<span class="pagination-btn disabled">← Previous</span>')
            
            # Page info
            total_file_pages = (len(files) + per_page - 1) // per_page
            html.append(f'<span class="pagination-info">Page {page} of {total_file_pages} (showing {len(paginated_files)} of {len(files)} files)</span>')
            
            # Next button
            if page < total_file_pages:
                next_url = f'/browse?path={urllib.parse.quote(current_path)}&page={page+1}'
                html.append(f'<a href="{next_url}" class="pagination-btn">Next →</a>')
            else:
                html.append('<span class="pagination-btn disabled">Next →</span>')
            
            html.append('</div>')
        
        html.append('</ul>')
        return ''.join(html)
    
    def render_page(self, title: str, content: str, sidebar: str = '') -> str:
        """Render full HTML page"""
        # Determine active nav item
        active_browser = 'active' if 'Files' in title else ''
        
        # Read base template
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
            icon='📁',
            favicon='📁',
            active_browser=active_browser,
            active_viewer='',
            active_inspector='',
            active_terminal='',
            sidebar=f'<aside class="sidebar">{sidebar}</aside>' if sidebar else '',
            content=content
        )
    
    def do_GET(self):
        """Handle GET requests"""
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        query = urllib.parse.parse_qs(parsed.query)
        
        # Health check
        if path == '/health':
            self.send_json_response({'status': 'ok', 'service': 'file-browser'})
            return
        
        # Browse directory
        if path == '/browse' or path == '/':
            browse_path = query.get('path', ['.'])[0]
            
            # Get pagination parameters
            try:
                page = int(query.get('page', ['1'])[0])
                if page < 1:
                    page = 1
            except (ValueError, IndexError):
                page = 1
            
            # Validate path
            resolved = FileUtils.validate_path(browse_path)
            if not resolved:
                self.send_html_response(self.render_page(
                    'Access Denied',
                    '<div class="empty-state"><div class="empty-state-icon">🚫</div>Invalid path or access denied</div>'
                ), 403)
                return
            
            # Get directory contents
            items, error = FileUtils.list_directory(browse_path)
            
            if error:
                self.send_html_response(self.render_page(
                    'Error',
                    f'<div class="empty-state"><div class="empty-state-icon">⚠️</div>{error}</div>'
                ), 500)
                return
            
            # Render page
            breadcrumb = self.render_breadcrumb(browse_path)
            file_list = self.render_file_list(items, browse_path, page=page)
            
            # Search box
            search_box = '''
                <form action="/search" method="get" style="margin-bottom: 1rem;">
                    <input type="text" name="q" id="searchBox" class="search-box" placeholder="🔍 Search files... (Ctrl+K)" required>
                </form>
                <script>
                    // Keyboard shortcut: Ctrl+K to focus search
                    document.addEventListener('keydown', function(e) {
                        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                            e.preventDefault();
                            document.getElementById('searchBox').focus();
                        }
                    });
                </script>
            '''
            
            content = f'{search_box}{breadcrumb}{file_list}'
            
            self.send_html_response(self.render_page(
                'File Browser',
                content
            ))
            return
        
        # Search endpoint
        if path == '/search':
            query_str = query.get('q', [''])[0]
            
            if not query_str:
                self.send_html_response(self.render_page(
                    'Search',
                    '<div class="empty-state"><div class="empty-state-icon">🔍</div>Enter a search query</div>'
                ))
                return
            
            results = FileUtils.search_files(query_str)
            
            if not results:
                content = f'''
                    <div class="breadcrumb"><a href="/browse?path=.">📁 Root</a> <span class="breadcrumb-separator">›</span> Search: "{query_str}"</div>
                    <div class="empty-state"><div class="empty-state-icon">😕</div>No files matching "{query_str}"</div>
                '''
            else:
                html = [f'''
                    <div class="breadcrumb"><a href="/browse?path=.">📁 Root</a> <span class="breadcrumb-separator">›</span> Search: "{query_str}" ({len(results)} results)</div>
                    <ul class="file-list">
                ''']
                
                for item in results:
                    viewer_url = f"http://localhost:9766/view?file={urllib.parse.quote(item['path'])}"
                    html.append(f'''
                        <li class="file-item" onclick="window.open('{viewer_url}', '_blank')">
                            <span class="file-icon">{item['icon']}</span>
                            <span class="file-name">{item['name']}</span>
                            <span class="file-meta">{item['path']} • {item['size_str']}</span>
                        </li>
                    ''')
                
                html.append('</ul>')
                content = ''.join(html)
            
            self.send_html_response(self.render_page('Search Results', content))
            return
        
        # Static files (CSS)
        if path.startswith('/static/'):
            static_path = Path(__file__).parent.parent / 'shared' / path[1:]  # Remove leading /
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
        
        # 404
        self.send_html_response(self.render_page(
            'Not Found',
            '<div class="empty-state"><div class="empty-state-icon">❓</div>Page not found</div>'
        ), 404)
    
    def do_POST(self):
        """Handle POST requests"""
        self.send_json_response({'error': 'Method not allowed'}, 405)


def run_server():
    """Run the file browser server"""
    server = HTTPServer(('127.0.0.1', PORT), FileBrowserHandler)
    print(f"🗂️  Tilt IDE File Browser running at http://localhost:{PORT}")
    print(f"   📁 Project root: {PROJECT_ROOT}")
    
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n👋 Shutting down...")
        server.shutdown()


if __name__ == '__main__':
    run_server()
