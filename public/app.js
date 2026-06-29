const AppBridge = window["app-bridge"];
const createApp = AppBridge.default;
const { Redirect } = AppBridge.actions;

const urlParams = new URLSearchParams(window.location.search);
const host = urlParams.get("host");

const app = createApp({
    apiKey: document.querySelector('meta[name="shopify-api-key"]').content,
    host
});

let currentAuditId = null;
let pendingFix = null;

async function authFetch(url, options = {}) {
    // App Bridge automatically attaches the session token via fetch wrapper
    // in newer versions; for broad compatibility we fetch normally here since
    // the server validates the embedded session cookie/JWT via shopify lib.
    return fetch(url, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {})
        }
    });
}

async function loadAudit() {
    const result = document.getElementById("result");
    try {
        const res = await authFetch("/api/audit");
        const data = await res.json();

        if (!res.ok || !data.success) {
            if (res.status === 404) {
                result.innerHTML = `
                    <div class="empty-state">
                        <h3>No audit yet</h3>
                        <p>We're generating your first CRO audit. This can take a minute.</p>
                        <button id="runAuditBtn" class="btn-primary">Run Audit Now</button>
                    </div>
                `;
                document.getElementById("runAuditBtn").addEventListener("click", runAudit);
                return;
            }
            throw new Error(data.error || "Failed to load audit");
        }

        renderReport(data.audit);
    } catch (error) {
        result.innerHTML = `<div class="error">${error.message}</div>`;
    }
}

async function runAudit() {
    const result = document.getElementById("result");
    result.innerHTML = `
        <div class="loading">
            <h3>Generating CRO Audit...</h3>
            <div class="loader"></div>
            <p class="loading-text">Analyzing UX, trust signals, CTAs, forms, content, and conversion opportunities.</p>
        </div>
    `;

    try {
        const res = await authFetch("/api/audit/run", { method: "POST" });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error || "Audit failed");
        renderReport(data.audit);
    } catch (error) {
        result.innerHTML = `<div class="error">${error.message}</div>`;
    }
}

function renderReport(audit) {
    currentAuditId = audit.id;
    const data = audit.full_report || audit;

    const recs = (data.recommendations || []).map((rec) => ({
        id: rec.id,
        score: rec.priority_score || 0,
        impact: rec.impact_level || "Low",
        title: rec.issue_found || "Untitled Recommendation",
        category: rec.category || "General",
        why: rec.why_it_hurts_conversions || "",
        solution: rec.recommended_solution || "",
        expected: rec.expected_cro_impact || "",
        difficulty: rec.implementation_difficulty || "",
        fixableByAi: rec.fixable_by_ai !== false,
        status: rec.status || "open"
    }));

    recs.sort((a, b) => b.score - a.score);

    const highImpactRecs = recs.filter((r) => r.impact.toLowerCase() === "high");
    const criticalRecs = highImpactRecs.slice(0, 4);
    const criticalTitles = criticalRecs.map((r) => r.title);
    const remainingHighRecs = highImpactRecs.slice(4);
    const criticalCount = criticalRecs.length;
    const highCount = remainingHighRecs.length;
    const mediumCount = recs.filter((r) => r.impact.toLowerCase() === "medium").length;
    const lowCount = recs.filter((r) => r.impact.toLowerCase() === "low").length;

    let html = `
    <div class="audit-header">
        <h1>CRO Audit — ${data.website_url || ""}</h1>
        <p>Analysed ${data.audit_date || ""} · ${recs.length} recommendations</p>
        <button id="rerunBtn" class="btn-secondary small">Re-run Audit</button>
    </div>

    <div class="stats-grid">
        <div class="stat-card">
            <span>Overall CRO Score</span>
            <h2>${data.overall_conversion_score || 0} / 100</h2>
        </div>
        <div class="stat-card critical">
            <span>Critical Issues</span>
            <h2>${criticalCount}</h2>
        </div>
        <div class="stat-card major">
            <span>Major Opportunities</span>
            <h2>${data.major_opportunities || mediumCount}</h2>
        </div>
        <div class="stat-card quick">
            <span>Quick Wins</span>
            <h2>${data.quick_wins || lowCount}</h2>
        </div>
    </div>

    <div class="summary-card">${data.summary || ""}</div>

    <div class="filters">
        <button class="filter-btn active" data-filter="all">All (${recs.length})</button>
        <button class="filter-btn critical-filter" data-filter="critical">Critical (${criticalCount})</button>
        <button class="filter-btn" data-filter="high">High Impact (${highCount})</button>
        <button class="filter-btn" data-filter="medium">Medium Impact (${mediumCount})</button>
        <button class="filter-btn" data-filter="low">Low Impact (${lowCount})</button>
    </div>
    `;

    recs.forEach((rec) => {
        const isCritical = criticalTitles.includes(rec.title);
        const cardFilter = isCritical ? "critical" : rec.impact.toLowerCase();
        const badgeClass = isCritical ? "critical" : rec.impact.toLowerCase();
        const badgeText = isCritical ? "Critical" : rec.impact;

        const fixButton = rec.fixableByAi
            ? rec.status === "applied"
                ? `<button class="btn-fixed" disabled>Fixed ✓</button>`
                : `<button class="btn-fix-ai" data-rec-id="${rec.id}">Fix with AI</button>`
            : `<span class="manual-note">Requires manual decision</span>`;

        html += `
        <div class="recommendation-card" data-impact="${cardFilter}">
            <div class="score-box">${rec.score}</div>
            <div class="recommendation-content">
                <h3>${rec.title}</h3>
                <div class="category">${rec.category}</div>
                <details>
                    <summary>View Analysis</summary>
                    <div class="details-content">
                        <h4>Why It Hurts</h4><p>${rec.why}</p>
                        <h4>Recommended Solution</h4><p>${rec.solution}</p>
                        <h4>Expected Impact</h4><p>${rec.expected}</p>
                        <h4>Difficulty</h4><p>${rec.difficulty}</p>
                    </div>
                </details>
                <div class="fix-actions">${fixButton}</div>
            </div>
            <div class="impact-pill ${badgeClass}">${badgeText}</div>
        </div>
        `;
    });

    document.getElementById("result").innerHTML = html;

    document.getElementById("rerunBtn").addEventListener("click", runAudit);
    initFilters();
    initFixButtons();
}

function initFilters() {
    const buttons = document.querySelectorAll(".filter-btn");
    const cards = document.querySelectorAll(".recommendation-card");

    buttons.forEach((button) => {
        button.addEventListener("click", () => {
            buttons.forEach((btn) => btn.classList.remove("active"));
            button.classList.add("active");
            const filter = button.dataset.filter;

            cards.forEach((card) => {
                const impact = card.dataset.impact;
                card.style.display = filter === "all" || impact === filter ? "flex" : "none";
            });
        });
    });
}

function initFixButtons() {
    document.querySelectorAll(".btn-fix-ai").forEach((btn) => {
        btn.addEventListener("click", () => proposeFix(btn.dataset.recId, btn));
    });
}

async function proposeFix(recommendationId, btnEl) {
    btnEl.disabled = true;
    btnEl.textContent = "Thinking...";

    try {
        const res = await authFetch("/api/fix/propose", {
            method: "POST",
            body: JSON.stringify({ auditId: currentAuditId, recommendationId })
        });
        const data = await res.json();

        if (!res.ok || !data.success) {
            throw new Error(data.error || "Could not generate a fix");
        }

        if (!data.fix.find) {
            alert("AI couldn't find a safe place to apply this fix automatically:\n\n" + data.fix.explanation);
            btnEl.disabled = false;
            btnEl.textContent = "Fix with AI";
            return;
        }

        pendingFix = data.fix;
        openFixModal(data.fix);
    } catch (error) {
        alert("Error: " + error.message);
    } finally {
        btnEl.disabled = false;
        btnEl.textContent = "Fix with AI";
    }
}

function openFixModal(fix) {
    document.getElementById("fixExplanation").textContent = fix.explanation;
    document.getElementById("fixBefore").textContent = fix.find;
    document.getElementById("fixAfter").textContent = fix.replace;
    document.getElementById("fixRisk").textContent = fix.risk_note
        ? `⚠ ${fix.risk_note}`
        : `Confidence: ${fix.confidence}`;
    document.getElementById("fixModal").classList.remove("hidden");
}

function closeFixModal() {
    document.getElementById("fixModal").classList.add("hidden");
    pendingFix = null;
}

document.getElementById("fixCancelBtn").addEventListener("click", closeFixModal);

document.getElementById("fixApplyBtn").addEventListener("click", async () => {
    if (!pendingFix) return;
    const applyBtn = document.getElementById("fixApplyBtn");
    applyBtn.disabled = true;
    applyBtn.textContent = "Applying...";

    try {
        const res = await authFetch("/api/fix/apply", {
            method: "POST",
            body: JSON.stringify({
                fixId: pendingFix.id,
                themeId: pendingFix.themeId,
                assetKey: pendingFix.assetKey,
                find: pendingFix.find,
                replace: pendingFix.replace
            })
        });
        const data = await res.json();

        if (!res.ok || !data.success) {
            throw new Error(data.error || "Failed to apply fix");
        }

        closeFixModal();
        await loadAudit();
    } catch (error) {
        alert("Error applying fix: " + error.message);
    } finally {
        applyBtn.disabled = false;
        applyBtn.textContent = "Approve & Apply";
    }
});

loadAudit();
