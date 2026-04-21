/**
 * ICONS JS - UI Enhancements Extension
 * Provides visual icons for resource type identification
 */

(function () {
  'use strict';

  // SVG icons for different resource types
  const ICONS = {
    // Service - box/server icon
    service: `<svg viewBox="0 0 24 24">
            <path d="M4 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5zm0 10a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-4zm4-6h2v2H8V9zm0 10h2v2H8v-2z"/>
        </svg>`,

    // Job - play/check icon
    job: `<svg viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z"/>
        </svg>`,

    // Test - beaker icon
    test: `<svg viewBox="0 0 24 24">
            <path d="M9 3L7 17h10L15 3H9zm3 14a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm1-6H11V7h2v4z"/>
        </svg>`,

    // Infrastructure - database icon
    infrastructure: `<svg viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 3.79 2 6s4.48 4 10 4 10-1.79 10-4-4.48-4-10-4zm0 14c-5.52 0-10-1.79-10-4v4c0 2.21 4.48 4 10 4s10-1.79 10-4v-4c0 2.21-4.48 4-10 4z"/>
        </svg>`,

    // Cron - clock icon
    cron: `<svg viewBox="0 0 24 24">
            <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
        </svg>`,

    // Frontend - web/browser icon
    frontend: `<svg viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
        </svg>`,

    // Backend - server icon
    backend: `<svg viewBox="0 0 24 24">
            <path d="M4 3h16c1.1 0 2 .9 2 2v4c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V5c0-1.1.9-2 2-2zm0 10h16c1.1 0 2 .9 2 2v4c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2v-4c0-1.1.9-2 2-2zm6 3h4v2h-4v-2z"/>
        </svg>`,

    // Library - package icon
    library: `<svg viewBox="0 0 24 24">
            <path d="M12 2l-8 4v12l8 4 8-4V6l-8-4zm0 2.5l6 3-6 3-6-3 6-3zm-8 4.5l6 3v7l-6-3v-7zm14 7l-6 3v-7l6-3v7z"/>
        </svg>`,

    // Maintenance - tools/wrench icon
    maintenance: `<svg viewBox="0 0 24 24">
            <path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2.2-2.2-5.6-2.4-8.1-.5l4.6 4.6-3.2 3.2-4.6-4.6c-1.9 2.5-1.7 5.9.5 8.1 1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z"/>
        </svg>`,

    // Quality - checkmark icon
    quality: `<svg viewBox="0 0 24 24">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
        </svg>`,

    // Default - generic circle
    default: `<svg viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="8"/>
        </svg>`,
  };

  // Determine resource type from name and labels
  function getResourceType(resourceName, labels = []) {
    const name = resourceName.toLowerCase();

    // Check labels first
    if (labels.includes('cron') || name.includes('cron')) return 'cron';
    if (
      labels.includes('dev.quality') ||
      name.includes('lint') ||
      name.includes('format')
    )
      return 'quality';
    if (labels.includes('dev.maintenance') || name.includes('prune'))
      return 'maintenance';
    if (labels.includes('app.')) return 'service';
    if (labels.includes('test')) return 'test';
    if (name.includes('frontend')) return 'frontend';
    if (name.includes('backend')) return 'backend';
    if (
      name.includes('db') ||
      name.includes('postgres') ||
      name.includes('redis')
    )
      return 'infrastructure';
    if (name.includes('lib')) return 'library';

    // Fallback to name patterns
    if (name.includes('auto-') || name.includes('job')) return 'job';

    return 'default';
  }

  // Get status from resource element
  function getResourceStatus(element) {
    // Check for status classes or indicators
    const statusEl = element.querySelector(
      '[class*="status"], [data-testid*="status"]',
    );
    if (statusEl) {
      const className = statusEl.className || '';
      if (className.includes('success') || className.includes('ready'))
        return 'success';
      if (className.includes('error') || className.includes('failed'))
        return 'error';
      if (className.includes('pending') || className.includes('warning'))
        return 'pending';
      if (className.includes('running')) return 'running';
    }
    return 'idle';
  }

  // Create icon element
  function createIcon(type, status) {
    const iconWrapper = document.createElement('span');
    iconWrapper.className = `tilt-icon tilt-icon-type-${type} status-${status}`;
    iconWrapper.innerHTML = ICONS[type] || ICONS.default;
    return iconWrapper;
  }

  // Add icon to resource element
  function addIconToResource(element) {
    // Skip if already has icon
    if (element.querySelector('.tilt-icon')) return;

    // Get resource name
    const nameEl = element.querySelector(
      '[class*="name"], .MuiTypography-root, h1, h2, h3, h4',
    );
    const name = nameEl?.textContent?.trim() || '';

    // Get labels from data attributes or classes
    const labels = [];
    const labelAttr = element.getAttribute('data-labels');
    if (labelAttr) {
      labels.push(...labelAttr.split(','));
    }

    // Determine type and status
    const type = getResourceType(name, labels);
    const status = getResourceStatus(element);

    // Create and insert icon
    const icon = createIcon(type, status);

    // Insert at the beginning of the name element or element itself
    if (nameEl && nameEl !== element) {
      nameEl.insertBefore(icon, nameEl.firstChild);
      nameEl.classList.add('tilt-resource-with-icon');
    } else {
      element.insertBefore(icon, element.firstChild);
      element.classList.add('tilt-resource-with-icon');
    }
  }

  // Initialize icons on existing elements
  function initIcons() {
    // Find all resource elements
    const resourceElements = document.querySelectorAll(
      '[data-testid^="resource-"], .MuiListItemButton-root, [class*="resource"], [class*="ResourceItem"]',
    );

    resourceElements.forEach(addIconToResource);
  }

  // Watch for new elements to add icons
  function watchForNewResources() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // Check if the node itself is a resource
            if (
              node.matches &&
              node.matches(
                '[data-testid^="resource-"], .MuiListItemButton-root, [class*="resource"]',
              )
            ) {
              addIconToResource(node);
            }

            // Check for resources within the node
            const resources = node.querySelectorAll?.(
              '[data-testid^="resource-"], .MuiListItemButton-root, [class*="resource"]',
            );
            resources?.forEach(addIconToResource);
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  // Update icon colors when status changes
  function watchForStatusChanges() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === 'attributes' &&
          mutation.attributeName === 'class'
        ) {
          const element = mutation.target;
          const icon = element.querySelector('.tilt-icon');
          if (icon) {
            // Update status class
            const status = getResourceStatus(
              element.closest(
                '[data-testid^="resource-"], .MuiListItemButton-root',
              ),
            );
            icon.className = icon.className.replace(
              /status-\w+/,
              `status-${status}`,
            );
          }
        }
      });
    });

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class'],
      subtree: true,
    });
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initIcons();
      watchForNewResources();
      watchForStatusChanges();
    });
  } else {
    initIcons();
    watchForNewResources();
    watchForStatusChanges();
  }

  console.log('✨ Tilt UI Icons loaded');
})();
