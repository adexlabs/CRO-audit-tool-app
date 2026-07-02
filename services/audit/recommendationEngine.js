const SEVERITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };

function prioritizeIssues(issues) {
  const sorted = [...issues].sort(
    (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]
  );
  return sorted.map((issue, idx) => ({
    ...issue,
    priority_rank: idx + 1,
    quick_win: idx < 3 && (issue.severity === 'critical' || issue.severity === 'high')
  }));
}

module.exports = { prioritizeIssues };
