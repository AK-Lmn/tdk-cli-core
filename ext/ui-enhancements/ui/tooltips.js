/**
 * TOOLTIPS JS - UI Enhancements Extension
 * Provides contextual tooltips for Tilt UI elements
 */

(function () {
  'use strict';

  // Resource metadata mapping - descriptions for tooltips
  const RESOURCE_DESCRIPTIONS = {
    // Quality/Development tools
    lint: {
      title: 'Lint',
      description: 'Runs Biome linter to check code quality and style',
      meta: 'Manual trigger - use cron-lint for automatic runs',
    },
    format: {
      title: 'Format',
      description: 'Runs Biome formatter to auto-fix code formatting',
      meta: 'Manual trigger - use cron-format for automatic runs',
    },
    'cron-lint': {
      title: 'Cron Lint',
      description: 'Automatically runs linter every 60 seconds',
      meta: 'Background job - runs continuously',
    },
    'cron-format': {
      title: 'Cron Format',
      description: 'Automatically runs formatter every 60 seconds',
      meta: 'Background job - runs continuously',
    },
    'build-shared': {
      title: 'Build Shared',
      description: 'Builds shared platform libraries',
      meta: 'Run when changing shared library code',
    },

    // Maintenance jobs
    'auto-prune-dangling': {
      title: 'Auto Prune Dangling',
      description:
        'Automatically removes dangling Docker images every 5 minutes',
      meta: 'Threshold: 5 images',
    },
    'auto-prune-migrator-images': {
      title: 'Auto Prune Migrators',
      description: 'Cleans up completed migrator Docker images',
      meta: 'Runs every 45 seconds',
    },
    'prune-images': {
      title: 'Prune Images',
      description: 'Manual cleanup of Docker images',
      meta: 'One-time cleanup operation',
    },
    'memory-optimizer': {
      title: 'Memory Optimizer',
      description: 'Frees memory by pruning Docker resources',
      meta: 'For Mac M1 - use when memory is low',
    },

    // UI and services
    'ui-enhancements-server': {
      title: 'UI Enhancements',
      description: 'Serves CSS/JS for enhanced Tilt UI',
      meta: 'Provides tooltips, icons, and cron jobs tab',
    },
    'cron-jobs-status-server': {
      title: 'Cron Status Server',
      description: 'HTTP endpoint for cron job status',
      meta: 'API for cron jobs monitoring tab',
    },

    // Status indicators
    ready: {
      title: 'Ready',
      description: 'Resource is healthy and ready to serve requests',
      meta: 'All dependencies satisfied',
    },
    pending: {
      title: 'Pending',
      description: 'Resource is waiting for dependencies',
      meta: 'Will start once dependencies are ready',
    },
    error: {
      title: 'Error',
      description: 'Resource has failed or encountered an error',
      meta: 'Check logs for details',
    },
    running: {
      title: 'Running',
      description: 'Resource is currently executing',
      meta: 'Process is active',
    },

    // Controls
    refresh: {
      title: 'Refresh',
      description: 'Restart or rebuild the resource',
      meta: 'Triggers a new build/run',
    },
    logs: {
      title: 'Logs',
      description: 'View resource output logs',
      meta: 'Opens log stream in new panel',
    },
    stop: {
      title: 'Stop',
      description: 'Stop the running resource',
      meta: 'Gracefully terminates the process',
    },
  };

  // Get description for a resource
  function getResourceDescription(name, type = 'resource') {
    const key = name.toLowerCase().replace(/\s+/g, '-');
    return (
      RESOURCE_DESCRIPTIONS[key] || {
        title: name,
        description:
          type === 'service'
            ? 'Application service'
            : type === 'job'
              ? 'Background job'
              : type === 'test'
                ? 'Test suite'
                : type === 'infrastructure'
                  ? 'Infrastructure component'
                  : 'Tilt resource',
        meta: '',
      }
    );
  }

  // Create tooltip element
  function createTooltip() {
    const tooltip = document.createElement('div');
    tooltip.className = 'tilt-tooltip';
    tooltip.style.display = 'none';
    document.body.appendChild(tooltip);
    return tooltip;
  }

  // Position tooltip relative to target element
  function positionTooltip(tooltip, target) {
    const rect = target.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();

    // Default position: bottom center
    let top = rect.bottom + 8;
    let left = rect.left + rect.width / 2 - tooltipRect.width / 2;
    let position = 'bottom';

    // Adjust if off-screen
    if (left < 8) {
      left = 8;
    } else if (left + tooltipRect.width > window.innerWidth - 8) {
      left = window.innerWidth - tooltipRect.width - 8;
    }

    // Flip to top if too close to bottom
    if (top + tooltipRect.height > window.innerHeight - 8) {
      top = rect.top - tooltipRect.height - 8;
      position = 'top';
    }

    tooltip.style.top = `${top + window.scrollY}px`;
    tooltip.style.left = `${left + window.scrollX}px`;
    tooltip.setAttribute('data-position', position);
  }

  // Show tooltip
  function showTooltip(tooltip, target, content) {
    tooltip.innerHTML = content;
    tooltip.style.display = 'block';
    positionTooltip(tooltip, target);

    // Force reflow
    tooltip.offsetHeight;

    tooltip.classList.add('visible');
  }

  // Hide tooltip
  function hideTooltip(tooltip) {
    tooltip.classList.remove('visible');
    setTimeout(() => {
      if (!tooltip.classList.contains('visible')) {
        tooltip.style.display = 'none';
      }
    }, 150);
  }

  // Build tooltip HTML content
  function buildTooltipContent(desc) {
    let html = '';
    if (desc.title) {
      html += `<span class="tooltip-title">${escapeHtml(desc.title)}</span>`;
    }
    if (desc.description) {
      html += `<span class="tooltip-description">${escapeHtml(desc.description)}</span>`;
    }
    if (desc.meta) {
      html += `<span class="tooltip-meta">${escapeHtml(desc.meta)}</span>`;
    }
    return html;
  }

  // Escape HTML to prevent XSS
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Initialize tooltips on the page
  function initTooltips() {
    const tooltip = createTooltip();
    let activeTarget = null;

    // Handle mouseover on resource names
    document.addEventListener('mouseover', (e) => {
      // Check for resource name elements
      const resourceEl = e.target.closest(
        '[data-testid^="resource-"], .MuiListItemButton-root, [class*="resource"]',
      );
      if (resourceEl) {
        const nameEl =
          resourceEl.querySelector('[class*="name"], .MuiTypography-root') ||
          resourceEl;
        const name = nameEl.textContent?.trim();
        if (name && name !== activeTarget) {
          activeTarget = resourceEl;
          const desc = getResourceDescription(name, 'resource');
          showTooltip(tooltip, resourceEl, buildTooltipContent(desc));
        }
      }

      // Check for status indicators
      const statusEl = e.target.closest(
        '[class*="status"], [data-testid*="status"]',
      );
      if (statusEl) {
        const statusText =
          statusEl.getAttribute('title') || statusEl.textContent?.trim();
        if (statusText) {
          activeTarget = statusEl;
          const desc = getResourceDescription(
            statusText.toLowerCase(),
            'status',
          );
          showTooltip(tooltip, statusEl, buildTooltipContent(desc));
        }
      }
    });

    // Handle mouseout
    document.addEventListener('mouseout', (e) => {
      if (activeTarget && !activeTarget.contains(e.relatedTarget)) {
        hideTooltip(tooltip);
        activeTarget = null;
      }
    });

    // Hide on click outside
    document.addEventListener('click', (e) => {
      if (activeTarget && !activeTarget.contains(e.target)) {
        hideTooltip(tooltip);
        activeTarget = null;
      }
    });
  }

  // Watch for DOM changes to add tooltips to new elements
  function watchForNewElements() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // New elements will be handled by the event delegation above
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initTooltips();
      watchForNewElements();
    });
  } else {
    initTooltips();
    watchForNewElements();
  }

  console.log('✨ Tilt UI Tooltips loaded');
})();
