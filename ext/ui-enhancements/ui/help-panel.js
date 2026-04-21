/**
 * HELP PANEL JS - UI Enhancements Extension
 * Provides slide-in help panel for developer onboarding
 */

(function () {
  'use strict';

  // Help content data
  const HELP_CONTENT = {
    gettingStarted: {
      title: 'Getting Started',
      content: `
                <p>Welcome to TDK Landscape local development! This Tilt interface helps you manage all services.</p>
                <p><strong>Quick Start:</strong></p>
                <ol>
                    <li>Wait for all services to show green (ready)</li>
                    <li>Access services via their URLs in the resource list</li>
                    <li>Use the Cron Jobs tab to monitor background tasks</li>
                    <li>Check the help icons (?) on resources for more info</li>
                </ol>
            `,
    },
    resourceTypes: {
      title: 'Resource Types',
      items: [
        {
          icon: 'service',
          name: 'Services',
          desc: 'Application services (backend, frontend)',
        },
        {
          icon: 'infrastructure',
          name: 'Infrastructure',
          desc: 'Databases, caches, message brokers',
        },
        { icon: 'job', name: 'Jobs', desc: 'One-time or periodic tasks' },
        {
          icon: 'cron',
          name: 'Cron Jobs',
          desc: 'Background tasks running on schedule',
        },
        { icon: 'test', name: 'Tests', desc: 'Test suites and quality checks' },
        {
          icon: 'quality',
          name: 'Quality Tools',
          desc: 'Lint, format, type checking',
        },
        {
          icon: 'maintenance',
          name: 'Maintenance',
          desc: 'Cleanup and optimization tasks',
        },
      ],
    },
    commonTasks: {
      title: 'Common Tasks',
      items: [
        {
          title: 'Restart a service',
          steps: [
            'Click the refresh icon on the resource',
            'Or click the resource name and select "Restart"',
          ],
        },
        {
          title: 'View logs',
          steps: [
            'Click on a resource name to expand it',
            'Logs appear in the panel below',
          ],
        },
        {
          title: 'Check cron job status',
          steps: [
            'Click the "Cron Jobs" tab at the top',
            'View status of all background jobs',
          ],
        },
        {
          title: 'Run lint/format manually',
          steps: [
            'Click on "lint" or "format" resource',
            'Click the play button to trigger',
          ],
        },
      ],
    },
    shortcuts: {
      title: 'Keyboard Shortcuts',
      items: [
        { action: 'Focus search', key: '/' },
        { action: 'Toggle sidebar', key: 'Cmd/Ctrl + B' },
        { action: 'Refresh all', key: 'r' },
        { action: 'Open help', key: '?' },
      ],
    },
  };

  // Create help panel HTML
  function createHelpPanel() {
    const panel = document.createElement('div');
    panel.id = 'tilt-help-panel';
    panel.className = 'tilt-help-panel';
    panel.innerHTML = `
            <div class="tilt-help-header">
                <h2>Help & Getting Started</h2>
                <button class="tilt-help-close" aria-label="Close">&times;</button>
            </div>
            <div class="tilt-help-search">
                <input type="text" placeholder="Search help..." id="tilt-help-search-input">
            </div>
            <div class="tilt-help-content" id="tilt-help-content">
                ${renderHelpContent()}
            </div>
        `;
    return panel;
  }

  // Render help content sections
  function renderHelpContent() {
    return `
            <div class="tilt-help-section" data-section="getting-started">
                <h3>${HELP_CONTENT.gettingStarted.title}</h3>
                ${HELP_CONTENT.gettingStarted.content}
            </div>

            <div class="tilt-help-section" data-section="resource-types">
                <h3>${HELP_CONTENT.resourceTypes.title}</h3>
                ${HELP_CONTENT.resourceTypes.items
                  .map(
                    (item) => `
                    <div class="tilt-help-resource-type">
                        <span class="icon">${getIconSvg(item.icon)}</span>
                        <div class="info">
                            <div class="name">${item.name}</div>
                            <div class="desc">${item.desc}</div>
                        </div>
                    </div>
                `,
                  )
                  .join('')}
            </div>

            <div class="tilt-help-section" data-section="common-tasks">
                <h3>${HELP_CONTENT.commonTasks.title}</h3>
                ${HELP_CONTENT.commonTasks.items
                  .map(
                    (item) => `
                    <div class="tilt-help-task">
                        <div class="title">${item.title}</div>
                        <ol class="steps">
                            ${item.steps.map((step) => `<li>${step}</li>`).join('')}
                        </ol>
                    </div>
                `,
                  )
                  .join('')}
            </div>

            <div class="tilt-help-section" data-section="shortcuts">
                <h3>${HELP_CONTENT.shortcuts.title}</h3>
                ${HELP_CONTENT.shortcuts.items
                  .map(
                    (item) => `
                    <div class="tilt-help-shortcut">
                        <span class="action">${item.action}</span>
                        <span class="key">${item.key}</span>
                    </div>
                `,
                  )
                  .join('')}
            </div>
        `;
  }

  // Get icon SVG
  function getIconSvg(type) {
    const icons = {
      service:
        '<svg viewBox="0 0 24 24"><path d="M4 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5zm0 10a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-4z"/></svg>',
      infrastructure:
        '<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 3.79 2 6s4.48 4 10 4 10-1.79 10-4-4.48-4-10-4zm0 14c-5.52 0-10-1.79-10-4v4c0 2.21 4.48 4 10 4s10-1.79 10-4v-4c0 2.21-4.48 4-10 4z"/></svg>',
      job: '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>',
      cron: '<svg viewBox="0 0 24 24"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>',
      test: '<svg viewBox="0 0 24 24"><path d="M9 3L7 17h10L15 3H9zm3 14a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm1-6H11V7h2v4z"/></svg>',
      quality:
        '<svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>',
      maintenance:
        '<svg viewBox="0 0 24 24"><path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2.2-2.2-5.6-2.4-8.1-.5l4.6 4.6-3.2 3.2-4.6-4.6c-1.9 2.5-1.7 5.9.5 8.1 1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z"/></svg>',
    };
    return icons[type] || icons.service;
  }

  // Create help button
  function createHelpButton() {
    const button = document.createElement('button');
    button.id = 'tilt-help-button';
    button.className = 'tilt-help-button';
    button.innerHTML = `
            <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/></svg>
            Help
        `;
    return button;
  }

  // Create overlay
  function createOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'tilt-help-overlay';
    overlay.className = 'tilt-help-overlay';
    return overlay;
  }

  // Initialize help panel
  function initHelpPanel() {
    // Add help button to header
    const header = document.querySelector(
      'header, [class*="header"], [class*="Header"]',
    );
    if (header) {
      const helpButton = createHelpButton();
      header.appendChild(helpButton);

      // Add panel and overlay to body
      const panel = createHelpPanel();
      const overlay = createOverlay();
      document.body.appendChild(panel);
      document.body.appendChild(overlay);

      // Event listeners
      helpButton.addEventListener('click', openPanel);
      overlay.addEventListener('click', closePanel);
      panel
        .querySelector('.tilt-help-close')
        .addEventListener('click', closePanel);

      // Search functionality
      const searchInput = panel.querySelector('#tilt-help-search-input');
      searchInput.addEventListener('input', (e) =>
        handleSearch(e.target.value),
      );

      // Keyboard shortcut
      document.addEventListener('keydown', (e) => {
        if (e.key === '?' && !e.target.matches('input, textarea')) {
          e.preventDefault();
          openPanel();
        }
        if (e.key === 'Escape') {
          closePanel();
        }
      });
    }
  }

  // Open panel
  function openPanel() {
    const panel = document.getElementById('tilt-help-panel');
    const overlay = document.getElementById('tilt-help-overlay');
    if (panel && overlay) {
      panel.classList.add('open');
      overlay.classList.add('visible');
      document.getElementById('tilt-help-search-input')?.focus();
    }
  }

  // Close panel
  function closePanel() {
    const panel = document.getElementById('tilt-help-panel');
    const overlay = document.getElementById('tilt-help-overlay');
    if (panel && overlay) {
      panel.classList.remove('open');
      overlay.classList.remove('visible');
    }
  }

  // Handle search
  function handleSearch(query) {
    const sections = document.querySelectorAll('.tilt-help-section');
    const lowerQuery = query.toLowerCase();

    sections.forEach((section) => {
      const text = section.textContent.toLowerCase();
      if (text.includes(lowerQuery)) {
        section.classList.remove('hidden');
        // Highlight matches
        highlightMatches(section, lowerQuery);
      } else {
        section.classList.add('hidden');
      }
    });
  }

  // Highlight search matches
  function highlightMatches(element, query) {
    if (!query) {
      // Remove highlights
      element.querySelectorAll('.highlight').forEach((el) => {
        const parent = el.parentNode;
        parent.replaceChild(document.createTextNode(el.textContent), el);
        parent.normalize();
      });
      return;
    }
    // Simple highlight implementation
    // In production, use a more robust text highlighting approach
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHelpPanel);
  } else {
    // Small delay to ensure Tilt UI is loaded
    setTimeout(initHelpPanel, 1000);
  }

  console.log('✨ Tilt UI Help Panel loaded');
})();
