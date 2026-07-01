(function () {
  const state = {
    shopDomain: "",
    currentAudit: null
  };

  // ---- DOM refs ----
  const el = {
    shopLabel: document.getElementById('shop-domain-label'),
    urlInput: document.getElementById('url-input'),
    pageTypeSelect: document.getElementById('page-type-select'),
    runBtn: document.getElementById('run-audit-btn'),
    scoreDial: document.getElementById('score-dial'),
    scoreNumber: document.getElementById('score-number'),
    categoryGrid: document.getElementById('category-grid'),
    issuesList: document.getElementById('issues-list'),
    issueCountLabel: document.getElementById('issue-count-label'),
    historyList: document.getElementById('history-list'),
    settingsDomain: document.getElementById('settings-shop-domain'),
    settingsToken: document.getElementById('settings-access-token'),
    saveConnectionBtn: document.getElementById('save-connection-btn'),
    toast: document.getElementById('toast')
  };

  async function loadSession() {

    const params = new URLSearchParams(window.location.search);

    let shop = params.get("shop");

    // Save shop after OAuth redirect
    if (shop) {
      localStorage.setItem("cro_shop_domain", shop);
    } else {
      // Later app launches
      shop = localStorage.getItem("cro_shop_domain");
    }

    if (!shop) {
      showToast("Shop not found. Please reinstall the app.", true);
      return;
    }

    state.shopDomain = shop;

    const res = await fetch(
      `/api/session?shop=${encodeURIComponent(shop)}`
    );

    if (!res.ok) {
      const err = await res.json();
      showToast(err.error, true);
      return;
    }

    const session = await res.json();

    el.shopLabel.textContent = session.shop;
    el.urlInput.value = `https://${session.shop}`;

    loadDashboard();
  }

  function init() {

    loadSession();

    document.querySelectorAll(".rail-btn").forEach(btn => {
      btn.addEventListener("click", () => switchView(btn.dataset.view));
    });

    el.runBtn.addEventListener("click", runAudit);

  }

  function switchView(view) {
    document.querySelectorAll('.rail-btn').forEach((b) => b.classList.toggle('active', b.dataset.view === view));
    document.querySelectorAll('.view').forEach((v) => v.classList.remove('active'));
    document.getElementById(`view-${view}`).classList.add('active');
    if (view === 'history') loadHistory();
  }

  function showToast(message, isError) {
    el.toast.textContent = message;
    el.toast.classList.toggle('error', !!isError);
    el.toast.classList.add('show');
    setTimeout(() => el.toast.classList.remove('show'), 3500);
  }

  // ---- Audit ----
  async function runAudit() {
    if (!state.shopDomain) return showToast('Connect a shop first in Settings', true);
    const url = el.urlInput.value.trim();
    if (!url) return showToast('Enter a page URL to audit', true);

    el.runBtn.disabled = true;
    el.runBtn.textContent = 'Auditing…';
    el.issuesList.innerHTML = `<div class="empty-state">Scanning page and analyzing conversion factors…</div>`;

    try {
      const res = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          pageType: el.pageTypeSelect.value
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Audit failed');

      state.currentAudit = data.audit;
      renderScore(data.audit);
      renderIssues(data.audit.id, data.issues);
      showToast(`Audit complete — score ${data.audit.overall_score}/100`);
    } catch (err) {
      showToast(err.message, true);
      el.issuesList.innerHTML = `<div class="empty-state">Audit failed: ${escapeHtml(err.message)}</div>`;
    } finally {
      el.runBtn.disabled = false;
      el.runBtn.textContent = 'Run audit';
    }
  }

  function renderScore(audit) {
    const score = audit.overall_score ?? 0;
    el.scoreNumber.textContent = score;
    el.scoreDial.style.setProperty('--pct', score);

    const cats = audit.category_scores || {};
    el.categoryGrid.innerHTML = Object.keys(cats)
      .map((name) => `
        <div class="category-cell">
          <span class="cat-name">${name}</span>
          <span class="cat-score">${cats[name]}</span>
        </div>`)
      .join('');
  }

  function renderIssues(auditId, issues) {
    el.issueCountLabel.textContent = `${issues.length} issue${issues.length === 1 ? '' : 's'} found`;
    if (!issues.length) {
      el.issuesList.innerHTML = `<div class="empty-state">No issues found — this page looks solid.</div>`;
      return;
    }

    el.issuesList.innerHTML = issues.map((issue) => issueRowHtml(auditId, issue)).join('');

    issues.forEach((issue) => {
      const btn = document.getElementById(`fix-btn-${issue.id}`);
      if (btn) btn.addEventListener('click', () => fixWithAi(auditId, issue.id, btn));
    });
  }

  function issueRowHtml(auditId, issue) {
    const fixable = !!issue.file_target;
    return `
      <div class="issue-row" id="issue-row-${issue.id}">
        <span class="severity-tag severity-${issue.severity}">${issue.severity}</span>
        <div class="issue-body">
          <p class="issue-title">${escapeHtml(issue.title)}</p>
          <p class="issue-desc">${escapeHtml(issue.description || '')}</p>
          <span class="issue-meta">${issue.category}${issue.file_target ? ' · ' + issue.file_target : ''}</span>
        </div>
        <div class="issue-actions">
          <span class="status-pill ${issue.status === 'fixed' ? 'fixed' : ''}" id="status-pill-${issue.id}">${issue.status}</span>
          ${issue.status === 'fixed'
        ? ''
        : `<button class="btn-ghost" id="fix-btn-${issue.id}" ${fixable ? '' : 'disabled title="No theme file mapped to this issue"'}>Fix with AI</button>`
      }
        </div>
      </div>`;
  }

  async function fixWithAi(auditId, issueId, btn) {
    btn.disabled = true;
    btn.textContent = 'Fixing…';
    try {
      const res = await fetch('/api/fix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ issueId, auditId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Fix failed');

      document.getElementById(`status-pill-${issueId}`).textContent = 'fixed';
      document.getElementById(`status-pill-${issueId}`).classList.add('fixed');
      btn.remove();
      showToast('Fix applied — live on your storefront now.');
    } catch (err) {
      btn.disabled = false;
      btn.textContent = 'Fix with AI';
      showToast(err.message, true);
    }
  }

  // ---- Dashboard / history ----
  async function loadDashboard() {
    try {
      const res = await fetch(`/api/dashboard?shop=${encodeURIComponent(state.shopDomain)}`)
      if (!res.ok) return;
      const data = await res.json();
      if (data.latestAudit) {
        state.currentAudit = data.latestAudit;
        renderScore(data.latestAudit);
        if (data.latestAudit.audit_issues) renderIssues(data.latestAudit.id, data.latestAudit.audit_issues);
      }
    } catch (e) { /* silent on first load */ }
  }

  async function loadHistory() {
    if (!state.shopDomain) { el.historyList.innerHTML = `<div class="empty-state">Connect a shop first.</div>`; return; }
    try {
      const res = await fetch(`/api/history?shop=${encodeURIComponent(state.shopDomain)}`)
      const data = await res.json();
      const items = data.history || [];
      el.historyList.innerHTML = items.length
        ? items.map((h) => `
          <div class="history-row">
            <span class="h-type">${h.event_type}</span>
            <span class="h-time">${new Date(h.created_at).toLocaleString()}</span>
          </div>`).join('')
        : `<div class="empty-state">No activity yet.</div>`;
    } catch (err) {
      el.historyList.innerHTML = `<div class="empty-state">Could not load history.</div>`;
    }
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  init();
})();
