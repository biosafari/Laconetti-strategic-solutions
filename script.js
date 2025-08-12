/*
 * Main JavaScript for the Laconetti business plan site.
 *
 * Handles theme toggling (light/dark) and initialises the
 * market analysis chart if present on the page. The script
 * stores the user's theme preference in localStorage so it
 * persists across sessions.
 */

// Immediately invoked function to avoid polluting the global scope
(function() {
  /**
   * Apply the saved theme or default to light on load. If a theme
   * preference exists in localStorage, use it; otherwise, detect
   * the user's system preference and set accordingly. Update the
   * theme toggle button label to reflect the current mode.
   */
  function applySavedTheme() {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const body = document.body;
    const toggleButton = document.getElementById('themeToggle');
    let theme;
    if (savedTheme) {
      theme = savedTheme;
    } else {
      theme = prefersDark ? 'dark' : 'light';
    }
    if (theme === 'dark') {
      body.classList.add('dark-mode');
      if (toggleButton) toggleButton.textContent = '☀️';
    } else {
      body.classList.remove('dark-mode');
      if (toggleButton) toggleButton.textContent = '🌙';
    }
  }

  /**
   * Toggle between light and dark themes when the button is clicked.
   * Updates the class on the body and stores the choice in
   * localStorage. Also flips the icon displayed on the button.
   */
  function toggleTheme() {
    const body = document.body;
    const isDark = body.classList.toggle('dark-mode');
    const toggleButton = document.getElementById('themeToggle');
    if (isDark) {
      localStorage.setItem('theme', 'dark');
      if (toggleButton) toggleButton.textContent = '☀️';
    } else {
      localStorage.setItem('theme', 'light');
      if (toggleButton) toggleButton.textContent = '🌙';
    }
  }

  /**
   * Initialise the market analysis chart using Chart.js. This
   * function checks for the existence of the canvas element with
   * id 'marketChart' before attempting to construct the chart. If
   * the element is found, sample data representing market
   * segmentation is displayed. Colours are derived from CSS
   * variables to stay consistent with the site theme.
   */
  function initMarketChart() {
    const ctx = document.getElementById('marketChart');
    if (!ctx || typeof Chart === 'undefined') return;
    // Retrieve CSS variables for colours
    const styles = getComputedStyle(document.body);
    const accent = styles.getPropertyValue('--accent').trim();
    const accentSecondary = styles.getPropertyValue('--accent-secondary').trim();
    const textPrimary = styles.getPropertyValue('--text-primary').trim();
    // Sample data: market share across four segments
    const data = {
      labels: ['Segment A', 'Segment B', 'Segment C', 'Segment D'],
      datasets: [
        {
          label: 'Market Share (%)',
          data: [35, 25, 20, 20],
          backgroundColor: [accent, accentSecondary, '#f7c948', '#6c5ce7'],
          borderColor: [accent, accentSecondary, '#e0b347', '#574b90'],
          borderWidth: 1
        }
      ]
    };
    const options = {
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            color: textPrimary
          },
          title: {
            display: true,
            text: 'Percentage',
            color: textPrimary
          }
        },
        x: {
          ticks: {
            color: textPrimary
          },
          title: {
            display: true,
            text: 'Market Segments',
            color: textPrimary
          }
        }
      },
      plugins: {
        legend: {
          labels: {
            color: textPrimary
          }
        },
        title: {
          display: true,
          text: 'Market Share by Segment',
          color: textPrimary,
          font: {
            size: 16
          }
        }
      }
    };
    new Chart(ctx, {
      type: 'bar',
      data: data,
      options: options
    });
  }

  // Setup event listeners when the DOM is ready
  document.addEventListener('DOMContentLoaded', () => {
    applySavedTheme();
    const toggleButton = document.getElementById('themeToggle');
    if (toggleButton) {
      toggleButton.addEventListener('click', toggleTheme);
    }
    initMarketChart();
  });
})();