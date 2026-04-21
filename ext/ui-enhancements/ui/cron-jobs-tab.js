/**
 * CRON JOBS TAB JS - UI Enhancements Extension
 * Provides a dedicated tab for monitoring cron jobs
 */

(function () {
  'use strict';

  // Configuration
  const CONFIG = {
    apiUrl: 'http://localhost:10352/api/cron-jobs-status',
    pollInterval: 5000, // 5 seconds
    controlDir: '/tmp/cron-jobs-control',
  };

  // State
  let jobsData = { jobs: [] };
  let isPanelOpen = false;
  let pollTimer = null;
  let expandedJobs = new Set();

  // SVG icons
  const ICONS = {
    clock:
      '<svg viewBox="0 0 24 24"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>',
    close:
      '<svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>',
    expand:
      '<svg viewBox="0 0 24 24"><path d="M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z"/></svg>',
    collapse:
      '<svg viewBox="0 0 24 24"><path d="M12 8l-6 6 1.41 1.41L12 10.83l4.59 4.58L18 14z"/></svg>',
    play: '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>',
    pause:
      '<svg viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>',
    refresh:
      '<svg viewBox="0 0 24 24"><path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>',
  };

  // Create tab button
  function createTabButton() {
    const button = document.createElement('button');
    button.id = 'tilt-cron-tab-button';
    button.className = 'tilt-cron-tab-button';
    button.innerHTML = `
            ${ICONS.clock}
            <span>Cron Jobs</span>
            <span class="badge" id="cron-badge" style="display:none">0</span>
        `;
    return button;
  }

  // Create cron panel
  function createCronPanel() {
    const panel = document.createElement('div');
    panel.id = 'tilt-cron-panel';
    panel.className = 'tilt-cron-panel';
    panel.innerHTML = `
            <div class="tilt-cron-header">
                <h2>
                    ${ICONS.clock}
                    <span>Cron Jobs Monitor</span>
                </h2>
                <button class="tilt-cron-close" id="tilt-cron-close" aria-label="Close">
                    ${ICONS.close}
                </button>
            </div>
            <div class="tilt-cron-content" id="tilt-cron-content">
                <div class="tilt-cron-loading">Loading cron jobs status...</div>
            </div>
        `;
    return panel;
  }

  // Format relative time
  function formatRelativeTime(isoString) {
    if (!isoString) return 'Never';
    const date = new Date(isoString);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  }

  // Format countdown
  function formatCountdown(isoString) {
    if (!isoString) return 'Soon';
    const date = new Date(isoString);
    const now = new Date();
    const diff = Math.floor((date - now) / 1000);

    if (diff <= 0) return 'Now';
    if (diff < 60) return `${diff}s`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    return `${Math.floor(diff / 3600)}h`;
  }

  // Render jobs table
  function renderJobsTable() {
    const content = document.getElementById('tilt-cron-content');
    if (!content) return;

    if (!jobsData.jobs || jobsData.jobs.length === 0) {
      content.innerHTML =
        '<div class="tilt-cron-loading">No cron jobs found</div>';
      return;
    }

    const tableHtml = `
            <table class="tilt-cron-table">
                <thead>
                    <tr>
                        <th>Job</th>
                        <th>Status</th>
                        <th>Last Run</th>
                        <th>Next Run</th>
                        <th>Controls</th>
                    </tr>
                </thead>
                <tbody>
                    ${jobsData.jobs.map((job) => renderJobRow(job)).join('')}
                </tbody>
            </table>
        `;

    content.innerHTML = tableHtml;

    // Add event listeners to buttons
    jobsData.jobs.forEach((job) => {
      const runBtn = document.getElementById(`cron-run-${job.name}`);
      const pauseBtn = document.getElementById(`cron-pause-${job.name}`);
      const expandBtn = document.getElementById(`cron-expand-${job.name}`);

      if (runBtn) runBtn.addEventListener('click', () => triggerJob(job.name));
      if (pauseBtn)
        pauseBtn.addEventListener('click', () =>
          togglePause(job.name, job.status),
        );
      if (expandBtn)
        expandBtn.addEventListener('click', () => toggleExpand(job.name));
    });
  }

  // Render single job row
  function renderJobRow(job) {
    const isExpanded = expandedJobs.has(job.name);
    const isPaused = job.status === 'paused';

    return `
            <tr class="tilt-cron-job">
                <td>
                    <div class="tilt-cron-job-name">
                        <span class="icon">${ICONS.clock}</span>
                        <span class="name">${job.name}</span>
                    </div>
                </td>
                <td>
                    <span class="tilt-cron-status ${job.status}">${job.status}</span>
                </td>
                <td>
                    <span class="tilt-cron-time ${job.lastRun ? '' : 'never'}">
                        ${formatRelativeTime(job.lastRun)}
                    </span>
                </td>
                <td>
                    <span class="tilt-cron-time">
                        ${isPaused ? 'Paused' : formatCountdown(job.nextRun)}
                    </span>
                </td>
                <td>
                    <div class="tilt-cron-controls">
                        <button class="tilt-cron-btn primary" id="cron-run-${job.name}" title="Run Now">
                            ${ICONS.refresh}
                        </button>
                        <button class="tilt-cron-btn" id="cron-pause-${job.name}" title="${isPaused ? 'Resume' : 'Pause'}">
                            ${isPaused ? ICONS.play : ICONS.pause}
                        </button>
                        <button class="tilt-cron-expand" id="cron-expand-${job.name}">
                            ${isExpanded ? 'Hide History' : 'Show History'}
                            ${isExpanded ? ICONS.collapse : ICONS.expand}
                        </button>
                    </div>
                </td>
            </tr>
            <tr>
                <td colspan="5" style="padding: 0;">
                    <div class="tilt-cron-history ${isExpanded ? 'open' : ''}" id="cron-history-${job.name}">
                        <h4>Execution History (Last 10)</h4>
                        ${renderHistory(job.history || [])}
                    </div>
                </td>
            </tr>
        `;
  }

  // Render job history
  function renderHistory(history) {
    if (!history || history.length === 0) {
      return '<p style="color:#808090; font-size:13px;">No execution history yet</p>';
    }

    return history
      .map(
        (entry) => `
            <div class="tilt-cron-history-item">
                <span class="time">${formatRelativeTime(entry.time)}</span>
                <span class="status ${entry.status}">
                    ${entry.status === 'success' ? '✓' : entry.status === 'failure' ? '✗' : '○'}
                    ${entry.status}
                </span>
                <span class="duration">${entry.duration || 'N/A'}</span>
            </div>
        `,
      )
      .join('');
  }

  // Toggle expand/collapse
  function toggleExpand(jobName) {
    if (expandedJobs.has(jobName)) {
      expandedJobs.delete(jobName);
    } else {
      expandedJobs.add(jobName);
    }
    renderJobsTable();
  }

  // Trigger job manually (via control file - would need backend support)
  function triggerJob(jobName) {
    console.log(`Triggering job: ${jobName}`);
    // This would need a backend endpoint to actually trigger the job
    // For now, just log it
    alert(
      `Manual trigger for ${jobName} would be implemented here.\n\nIn production, this would write to ${CONFIG.controlDir}/${jobName}.trigger`,
    );
  }

  // Toggle pause/resume
  function togglePause(jobName, currentStatus) {
    console.log(`Toggling pause for: ${jobName}, current: ${currentStatus}`);
    // This would need a backend endpoint to actually pause/resume
    // For now, just log it
    const action = currentStatus === 'paused' ? 'resume' : 'pause';
    alert(
      `${action} for ${jobName} would be implemented here.\n\nIn production, this would write/remove ${CONFIG.controlDir}/${jobName}.pause`,
    );
  }

  // Fetch jobs data
  async function fetchJobs() {
    try {
      const response = await fetch(CONFIG.apiUrl);
      if (!response.ok) throw new Error('Failed to fetch');
      jobsData = await response.json();
      updateBadge();
      if (isPanelOpen) {
        renderJobsTable();
      }
    } catch (error) {
      console.error('Failed to fetch cron jobs:', error);
      if (isPanelOpen) {
        const content = document.getElementById('tilt-cron-content');
        if (content) {
          content.innerHTML = `
                        <div class="tilt-cron-error">
                            Failed to load cron jobs status.<br>
                            Make sure the cron-jobs-status-server is running.
                        </div>
                    `;
        }
      }
    }
  }

  // Update badge count
  function updateBadge() {
    const badge = document.getElementById('cron-badge');
    if (!badge) return;

    const failedJobs = jobsData.jobs.filter(
      (j) => j.status === 'failure',
    ).length;
    if (failedJobs > 0) {
      badge.textContent = failedJobs;
      badge.style.display = 'inline-block';
      badge.className = 'badge';
    } else {
      badge.style.display = 'none';
    }
  }

  // Open panel
  function openPanel() {
    isPanelOpen = true;
    const panel = document.getElementById('tilt-cron-panel');
    const button = document.getElementById('tilt-cron-tab-button');
    if (panel) panel.classList.add('open');
    if (button) button.classList.add('active');
    renderJobsTable();
    fetchJobs(); // Refresh immediately
  }

  // Close panel
  function closePanel() {
    isPanelOpen = false;
    const panel = document.getElementById('tilt-cron-panel');
    const button = document.getElementById('tilt-cron-tab-button');
    if (panel) panel.classList.remove('open');
    if (button) button.classList.remove('active');
  }

  // Start polling
  function startPolling() {
    fetchJobs();
    pollTimer = setInterval(fetchJobs, CONFIG.pollInterval);
  }

  // Stop polling (available for future use)
  function stopPolling() {
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
  }

  // Export for potential external control
  window.TiltCronTab = {
    open: openPanel,
    close: closePanel,
    refresh: fetchJobs,
    stopPolling: stopPolling,
    startPolling: startPolling,
  };

  // Initialize
  function initCronTab() {
    // Add button to header
    const header = document.querySelector(
      'header, [class*="header"], [class*="Header"]',
    );
    if (header) {
      const button = createTabButton();
      header.appendChild(button);

      // Add panel to body
      const panel = createCronPanel();
      document.body.appendChild(panel);

      // Event listeners
      button.addEventListener('click', () => {
        if (isPanelOpen) closePanel();
        else openPanel();
      });

      document
        .getElementById('tilt-cron-close')
        .addEventListener('click', closePanel);

      // Keyboard shortcut
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && isPanelOpen) {
          closePanel();
        }
      });

      // Start polling
      startPolling();

      console.log('✨ Tilt Cron Jobs Tab loaded');
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(initCronTab, 1500); // Delay to ensure Tilt UI is loaded
    });
  } else {
    setTimeout(initCronTab, 1500);
  }
})();
