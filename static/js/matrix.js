/**
 * ChronoLegal AI — Discrepancy Matrix Rendering
 * Renders the comparison table from live API data.
 *
 * Expected data shape (produced by upload.js mapping):
 *   [{ date, time, event, hospitalNote, expertANote, expertBNote, riskLevel, alertType, alertText }]
 *
 * riskLevel: 'low' | 'medium' | 'high'
 * alertType: 'info' | 'warning' | 'critical'
 */
(function () {
  'use strict';

  // ── Render Matrix ───────────────────────────────────────────
  function renderMatrix(data) {
    const tbody = document.getElementById('matrix-tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (!data || data.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="text-center py-16 text-[#94A3B8]">
            <div class="text-3xl mb-3">📋</div>
            <p class="text-base font-medium text-[#475569]">No discrepancies found</p>
            <p class="text-sm mt-1">Upload three medico-legal PDFs and click "Analyze Documents" to begin.</p>
          </td>
        </tr>`;
      renderStats([]);
      return;
    }

    data.forEach((row) => {
      const tr = document.createElement('tr');

      const riskBadgeHTML = `
        <span class="risk-badge risk-badge-${row.riskLevel}">
          <span class="risk-badge-dot risk-badge-dot-${row.riskLevel}"></span>
          ${row.riskLevel.toUpperCase()}
        </span>`;

      const alertClass = row.alertType === 'critical' ? 'alert-callout-critical'
                       : row.alertType === 'warning'  ? 'alert-callout-warning'
                       : 'alert-callout-info';

      tr.innerHTML = `
        <td class="col-date">
          <div class="font-medium">${escapeHtml(row.date)}</div>
          <div class="text-xs text-muted">${escapeHtml(row.time)}</div>
        </td>
        <td class="col-event font-medium">${escapeHtml(row.event)}</td>
        <td class="col-note">
          <div class="flex items-start gap-1.5">
            <span class="text-[10px] font-bold text-[#1F4E79] bg-[#F0F6FB] px-1.5 py-0.5 rounded mt-0.5 shrink-0">HR</span>
            <span class="text-sm leading-relaxed">${escapeHtml(row.hospitalNote)}</span>
          </div>
        </td>
        <td class="col-note">
          <div class="flex items-start gap-1.5">
            <span class="text-[10px] font-bold text-[#C9A84C] bg-[#FDF8ED] px-1.5 py-0.5 rounded mt-0.5 shrink-0">A</span>
            <span class="text-sm leading-relaxed">${escapeHtml(row.expertANote)}</span>
          </div>
        </td>
        <td class="col-note">
          <div class="flex items-start gap-1.5">
            <span class="text-[10px] font-bold text-[#7C3AED] bg-[#F5F3FF] px-1.5 py-0.5 rounded mt-0.5 shrink-0">B</span>
            <span class="text-sm leading-relaxed">${escapeHtml(row.expertBNote)}</span>
          </div>
        </td>
        <td class="text-center">${riskBadgeHTML}</td>
        <td>
          <div class="alert-callout ${alertClass}">${escapeHtml(row.alertText)}</div>
        </td>
      `;

      tbody.appendChild(tr);
    });

    renderStats(data);
  }

  // ── HTML escape to prevent XSS ──────────────────────────────
  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ── Render Summary Stats ────────────────────────────────────
  function renderStats(data) {
    const totalEl  = document.getElementById('stat-total');
    const highEl   = document.getElementById('stat-high');
    const mediumEl = document.getElementById('stat-medium');
    const lowEl    = document.getElementById('stat-low');

    const total  = data.length;
    const high   = data.filter(r => r.riskLevel === 'high').length;
    const medium = data.filter(r => r.riskLevel === 'medium').length;
    const low    = data.filter(r => r.riskLevel === 'low').length;

    if (totalEl)  totalEl.textContent  = total;
    if (highEl)   highEl.textContent   = high;
    if (mediumEl) mediumEl.textContent = medium;
    if (lowEl)    lowEl.textContent    = low;
  }

  // ── Filter / Sort Handlers ──────────────────────────────────
  function filterByRisk(level) {
    const allRows = document.querySelectorAll('#matrix-tbody tr');
    allRows.forEach((row) => {
      const badge = row.querySelector('.risk-badge');
      if (!badge) return;
      if (level === 'all') {
        row.style.display = '';
      } else {
        row.style.display = badge.classList.contains(`risk-badge-${level}`) ? '' : 'none';
      }
    });
  }

  // ── Initialize ──────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    // Render empty state — data will be populated by upload.js
    renderMatrix(null);

    // Wire filter buttons
    const filterAll    = document.getElementById('filter-all');
    const filterHigh   = document.getElementById('filter-high');
    const filterMedium = document.getElementById('filter-medium');
    const filterLow    = document.getElementById('filter-low');

    const filters = [
      { el: filterAll,    level: 'all' },
      { el: filterHigh,   level: 'high' },
      { el: filterMedium, level: 'medium' },
      { el: filterLow,    level: 'low' },
    ];

    const allFilterBtns = [filterAll, filterHigh, filterMedium, filterLow].filter(Boolean);

    filters.forEach(({ el, level }) => {
      if (!el) return;
      el.addEventListener('click', () => {
        allFilterBtns.forEach(b => {
          b.classList.remove('bg-[#1F4E79]', 'text-white');
          b.classList.add('bg-white', 'text-[#64748B]', 'border', 'border-[#E2E8F0]');
        });
        el.classList.remove('bg-white', 'text-[#64748B]', 'border', 'border-[#E2E8F0]');
        el.classList.add('bg-[#1F4E79]', 'text-white');

        filterByRisk(level);
      });
    });
  });

  // ── Expose public API ───────────────────────────────────────
  window.ChronoLegal = {
    renderMatrix,
  };
})();
