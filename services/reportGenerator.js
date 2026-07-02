function generateHtmlReport(audit) {
  const issuesHtml = (audit.audit_issues || [])
    .map(
      (i) => `
      <tr>
        <td>${i.category}</td>
        <td><span class="badge ${i.severity}">${i.severity}</span></td>
        <td>${i.title}</td>
        <td>${i.status}</td>
      </tr>`
    )
    .join('');

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>CRO Audit Report</title>
<style>
  body { font-family: -apple-system, Arial, sans-serif; padding: 40px; color: #1a1a1a; }
  h1 { margin-bottom: 0; }
  .score { font-size: 48px; font-weight: 700; color: #16a34a; }
  table { width: 100%; border-collapse: collapse; margin-top: 24px; }
  th, td { text-align: left; padding: 10px; border-bottom: 1px solid #eee; font-size: 14px; }
  .badge { padding: 2px 8px; border-radius: 4px; font-size: 12px; color: #fff; }
  .critical { background: #dc2626; } .high { background: #ea580c; }
  .medium { background: #ca8a04; } .low { background: #65a30d; }
</style>
</head>
<body>
  <h1>CRO Audit Report</h1>
  <p>Generated ${new Date(audit.created_at).toLocaleString()}</p>
  <div class="score">${audit.overall_score ?? '-'}/100</div>
  <table>
    <thead><tr><th>Category</th><th>Severity</th><th>Issue</th><th>Status</th></tr></thead>
    <tbody>${issuesHtml}</tbody>
  </table>
</body>
</html>`;
}

module.exports = { generateHtmlReport };
