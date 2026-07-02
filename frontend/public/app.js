(function () {
  const state = {
    shopDomain: "",
    currentAudit: null
  };

  // ---- DOM refs ----
  const el = {
    shopLabel: document.getElementById('shop-domain-label'),
    urlInput: document.getElementById('url-input'),
    // pageTypeSelect: document.getElementById('page-type-select'),
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

  // Every protected API route requires the shop to be identified via a
  // ?shop= query param (see middleware/shopifyAuth.js). This helper makes
  // sure we never forget it on an authenticated call.
  function shopUrl(path) {
    const separator = path.includes('?') ? '&' : '?';
    return `${path}${separator}shop=${encodeURIComponent(state.shopDomain)}`;
  }

  async function loadSession() {

    const params = new URLSearchParams(window.location.search);

    const shop = params.get("shop");

    if (!shop) {
      showToast("Missing shop parameter", true);
      return;
    }

    const res = await fetch(
      `/api/session?shop=${encodeURIComponent(shop)}`
    );

    if (!res.ok) {

      const err = await res.json();

      showToast(err.error || "Unable to load Shopify session", true);

      return;

    }

    const session = await res.json();

    state.shopDomain = session.shop;

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
      const res = await fetch(shopUrl('/api/audit'), {
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

    const severity = (issue.severity || "medium").toLowerCase();

    const priority = issue.priority || severity;

    const confidence = issue.confidence || 90;

    const difficulty = issue.difficulty || "Medium";

    const fixTime = issue.estimated_fix_time || "15 mins";

    const uplift =
      issue.estimated_conversion_uplift || "Unknown";

    const revenue =
      issue.estimated_revenue_impact || "Unknown";

    const fixable = !!issue.file_target;

    return `

<div class="issue-card severity-${severity}" id="issue-row-${issue.id}">

    <div class="issue-header">

        <div>

            <span class="severity-tag severity-${severity}">
                ${severity.toUpperCase()}
            </span>

            <span class="priority-tag">
                ${priority}
            </span>

        </div>

        <div>

            <span class="confidence-pill">

                ${confidence}% Confidence

            </span>

        </div>

    </div>

    <h3 class="issue-title">

        ${escapeHtml(issue.title)}

    </h3>

    <p class="issue-summary">

        ${escapeHtml(
      issue.summary ||
      issue.description ||
      ""
    )}

    </p>

    <div class="issue-details" id="issue-details-${issue.id}" style="display:none;">

    <div class="issue-section">

        <h4>Why this matters</h4>

        <p>

        ${escapeHtml(

      issue.why_it_matters ||

      "This issue may negatively impact conversions."

    )}

        </p>

    </div>

    <div class="issue-section">

        <h4>Business Impact</h4>

        <p>

        ${escapeHtml(

      issue.business_impact ||

      "Potential impact on sales and user trust."

    )}

        </p>

    </div>

    <div class="issue-section">

        <h4>Recommendation</h4>

        <p>

        ${escapeHtml(

      issue.recommendation ||

      "Follow CRO best practices."

    )}

        </p>

    </div>

    <div class="issue-section">

        <h4>Expected Improvement</h4>

        <p>

        ${escapeHtml(

      issue.expected_improvement ||

      "Improved usability and conversions."

    )}

        </p>

    </div>
    </div>

    <div class="issue-footer">

    <span class="issue-meta">
        ${escapeHtml(issue.category)}
        ${issue.file_target
        ? " • " + escapeHtml(issue.file_target)
        : ""
      }
    </span>

    <div class="issue-actions">

        <button
            class="btn-secondary issue-toggle-btn"
            onclick="toggleIssueDetails('${issue.id}')">

            More Details

        </button>

        <span
            class="status-pill ${issue.status === "fixed"
        ? "fixed"
        : ""
      }"
            id="status-pill-${issue.id}">

            ${issue.status}

        </span>

        ${issue.status === "fixed"
        ? ""
        : `
            <button
                class="btn-primary"
                id="fix-btn-${issue.id}"
                ${fixable
          ? ""
          : "disabled"
        }>
                Fix with AI
            </button>
            `
      }

    </div>

  </div>

</div>

`;

  }

  async function fixWithAi(auditId, issueId, btn) {
    btn.disabled = true;
    btn.textContent = 'Fixing…';
    try {
      const res = await fetch(shopUrl('/api/fix'), {
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
      const res = await fetch(shopUrl('/api/dashboard'));
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
      const res = await fetch(shopUrl('/api/history'));
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
