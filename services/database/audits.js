const supabase = require('./supabase');

async function createAudit({ shopId, targetType, targetUrl }) {
  const { data, error } = await supabase
    .from('audits')
    .insert({ shop_id: shopId, target_type: targetType, target_url: targetUrl, status: 'running' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function completeAudit(auditId, { overallScore, categoryScores, rawFindings }) {
  const { data, error } = await supabase
    .from('audits')
    .update({
      status: 'completed',
      overall_score: overallScore,
      category_scores: categoryScores,
      raw_findings: rawFindings,
      completed_at: new Date().toISOString()
    })
    .eq('id', auditId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function failAudit(auditId, errorMessage) {
  await supabase
    .from('audits')
    .update({ status: 'failed', raw_findings: [{ error: errorMessage }] })
    .eq('id', auditId);
}

async function insertIssues(auditId, issues) {
  if (!issues.length) return [];
  const rows = issues.map((i) => ({ ...i, audit_id: auditId }));
  const { data, error } = await supabase.from('audit_issues').insert(rows).select();
  if (error) throw error;
  return data;
}

async function getAudit(auditId) {
  const { data, error } = await supabase
    .from('audits')
    .select('*, audit_issues(*)')
    .eq('id', auditId)
    .single();
  if (error) throw error;
  return data;
}

async function listAuditsForShop(shopId, limit = 20) {
  const { data, error } = await supabase
    .from('audits')
    .select('*')
    .eq('shop_id', shopId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}

async function updateIssueStatus(issueId, status) {
  const { data, error } = await supabase
    .from('audit_issues')
    .update({ status })
    .eq('id', issueId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

module.exports = {
  createAudit,
  completeAudit,
  failAudit,
  insertIssues,
  getAudit,
  listAuditsForShop,
  updateIssueStatus
};
