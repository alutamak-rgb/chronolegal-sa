/**
 * ChronoLegal AI — Upload Flow Logic
 * Handles drag-and-drop, file selection, form validation, and API-driven analysis.
 */
(function () {
  'use strict';

  // ── DOM refs ────────────────────────────────────────────────
  const dropZones = document.querySelectorAll('.drop-zone');
  const fileInputs = document.querySelectorAll('.drop-zone-input');
  const analyzeBtn = document.getElementById('btn-analyze');
  const spinnerOverlay = document.getElementById('spinner-overlay');
  const spinnerText = document.getElementById('spinner-text');
  const resultsSection = document.getElementById('results-section');
  const uploadSection = document.getElementById('upload-section');

  const uploadedFiles = {
    hospital: null,
    expertA:  null,
    expertB:  null,
  };

  // ── Initialize Drop Zones ───────────────────────────────────
  function initDropZone(zone, input, slotKey) {
    const placeholder = zone.querySelector('.drop-zone-placeholder');
    const fileNameEl  = zone.querySelector('.drop-zone-file-name');
    const removeBtn   = zone.querySelector('.drop-zone-remove');

    zone.addEventListener('click', (e) => {
      if (e.target === removeBtn) return;
      input.click();
    });

    input.addEventListener('change', () => {
      if (input.files.length > 0) {
        setFile(slotKey, input.files[0], zone, fileNameEl, placeholder);
      }
    });

    zone.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
      zone.classList.add('drag-over');
    });

    zone.addEventListener('dragleave', (e) => {
      e.preventDefault();
      e.stopPropagation();
      zone.classList.remove('drag-over');
    });

    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      zone.classList.remove('drag-over');

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        const file = files[0];
        if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
          setFile(slotKey, file, zone, fileNameEl, placeholder);
        } else {
          alert('Please upload a PDF file only.');
        }
      }
    });

    if (removeBtn) {
      removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        clearFile(slotKey, zone, fileNameEl, placeholder, input);
      });
    }
  }

  function setFile(slotKey, file, zone, fileNameEl, placeholder) {
    uploadedFiles[slotKey] = file;
    fileNameEl.textContent = file.name;
    zone.classList.add('has-file');
    if (placeholder) placeholder.style.display = 'none';
    checkAllReady();
  }

  function clearFile(slotKey, zone, fileNameEl, placeholder, input) {
    uploadedFiles[slotKey] = null;
    fileNameEl.textContent = '';
    zone.classList.remove('has-file');
    if (placeholder) placeholder.style.display = '';
    input.value = '';
    checkAllReady();
  }

  // ── Form Validation ─────────────────────────────────────────
  function checkAllReady() {
    const caseRef   = document.getElementById('case-reference');
    const attorney  = document.getElementById('attorney-name');
    const allFiles  = uploadedFiles.hospital && uploadedFiles.expertA && uploadedFiles.expertB;

    // Attorney name is the only required text field
    const formValid = attorney && attorney.value.trim() !== '';

    if (analyzeBtn) {
      analyzeBtn.disabled = !(allFiles && formValid);
    }
  }

  // ── HTTP helper with timeout ─────────────────────────────────
  async function postWithTimeout(url, body, timeoutMs = 150000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const resp = await fetch(url, {
        method: 'POST',
        body,
        signal: controller.signal,
      });
      clearTimeout(timer);
      return resp;
    } catch (err) {
      clearTimeout(timer);
      throw err;
    }
  }

  // ── Analyze Button → Real API Call ───────────────────────────
  if (analyzeBtn) {
    analyzeBtn.addEventListener('click', async (e) => {
      e.preventDefault();

      // Show loading overlay
      if (spinnerOverlay) spinnerOverlay.classList.add('active');
      if (spinnerText) spinnerText.textContent = 'Extracting text from documents...';

      const caseRef   = document.getElementById('case-reference')?.value?.trim() || '';
      const claimant  = document.getElementById('claimant-name')?.value?.trim() || '';
      const mvaDate   = document.getElementById('mva-date')?.value || '';
      const attorney  = document.getElementById('attorney-name')?.value?.trim() || '';

      // Build FormData
      const fd = new FormData();
      fd.append('hospital', uploadedFiles.hospital, uploadedFiles.hospital.name);
      fd.append('expert_a', uploadedFiles.expertA, uploadedFiles.expertA.name);
      fd.append('expert_b', uploadedFiles.expertB, uploadedFiles.expertB.name);
      fd.append('case_name', caseRef || 'case_analysis');

      try {
        // Phase 1: uploading
        if (spinnerText) spinnerText.textContent = 'Uploading documents to AI engine...';

        const resp = await postWithTimeout('/api/analyze', fd);

        // Phase 2: processing (server does this, but update text for UX)
        if (spinnerText) spinnerText.textContent = 'AI analyzing discrepancies...';

        if (!resp.ok) {
          const errData = await resp.json().catch(() => ({}));
          throw new Error(errData.error || `Server returned ${resp.status}`);
        }

        // Phase 3: rendering
        if (spinnerText) spinnerText.textContent = 'Generating discrepancy matrix...';

        const apiResult = await resp.json();
        const timeline = apiResult.timeline || [];

        if (!timeline.length) {
          throw new Error('No discrepancies were identified. The documents may be in agreement.');
        }

        // Map API response → matrix.js render format
        const matrixData = timeline.map(item => ({
          date: item.date || '',
          time: '—',
          event: item.eventOrInjury || '',
          hospitalNote: item.hospitalRecordNote || 'Not addressed',
          expertANote: item.expertANote || 'Not addressed',
          expertBNote: item.expertBNote || 'Not addressed',
          riskLevel: (item.riskLevel || 'low').toLowerCase(),
          alertType: item.riskLevel === 'High' ? 'critical'
                   : item.riskLevel === 'Medium' ? 'warning'
                   : 'info',
          alertText: item.strategicAlert || '',
        }));

        // Update case info in results header
        updateCaseInfo(caseRef, claimant, attorney, mvaDate);

        // Render matrix
        if (window.ChronoLegal && window.ChronoLegal.renderMatrix) {
          window.ChronoLegal.renderMatrix(matrixData);
        }

        // Show results section
        if (spinnerOverlay) spinnerOverlay.classList.remove('active');
        if (uploadSection) uploadSection.classList.add('hidden');
        if (resultsSection) resultsSection.classList.remove('hidden');
        window.location.hash = '#results';
        window.scrollTo({ top: 0, behavior: 'smooth' });

      } catch (err) {
        console.error('Analysis failed:', err);
        if (spinnerOverlay) spinnerOverlay.classList.remove('active');

        if (err.name === 'AbortError') {
          alert('Analysis timed out. Please try again with smaller PDFs or fewer pages.');
        } else if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
          alert('Could not reach the analysis server. Please check your connection and try again.');
        } else {
          alert('Analysis failed: ' + (err.message || 'Unknown error. Please try again.'));
        }
      }
    });
  }

  // ── Update case info in results header ──────────────────────
  function updateCaseInfo(caseRef, claimant, attorney, mvaDate) {
    const caseEl     = document.getElementById('result-case-ref');
    const claimantEl = document.getElementById('result-claimant');
    const attorneyEl = document.getElementById('result-attorney');
    const dateEl     = document.getElementById('result-mva-date');

    if (caseEl)     caseEl.textContent     = caseRef || '—';
    if (claimantEl) claimantEl.textContent = claimant || '—';
    if (attorneyEl) attorneyEl.textContent = attorney || '—';
    if (dateEl)     dateEl.textContent     = mvaDate || '—';
  }

  // ── Wire up form fields ─────────────────────────────────────
  const caseRefInput  = document.getElementById('case-reference');
  const attorneyInput = document.getElementById('attorney-name');
  const claimantInput = document.getElementById('claimant-name');

  if (caseRefInput) caseRefInput.addEventListener('input', checkAllReady);
  if (attorneyInput) attorneyInput.addEventListener('input', checkAllReady);
  if (claimantInput) claimantInput.addEventListener('input', checkAllReady);

  // ── Initialize all drop zones ───────────────────────────────
  dropZones.forEach((zone) => {
    const slotKey = zone.dataset.slot;
    const input   = zone.querySelector('.drop-zone-input');
    if (slotKey && input) {
      initDropZone(zone, input, slotKey);
    }
  });

  // ── Back to upload button ───────────────────────────────────
  const backBtn = document.getElementById('btn-back-upload');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      if (uploadSection) uploadSection.classList.remove('hidden');
      if (resultsSection) resultsSection.classList.add('hidden');
      window.location.hash = '';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // ── Initial state ───────────────────────────────────────────
  checkAllReady();

  // Check if returning to results via hash
  if (window.location.hash === '#results') {
    if (uploadSection) uploadSection.classList.add('hidden');
    if (resultsSection) resultsSection.classList.remove('hidden');
  }
})();
