const supabase = require('./supabase');

async function saveFix({
  shopId, auditId, issueId, fileTarget, originalCode, fixedCode,
  aiExplanation, aiModel, rollbackBackupId
}) {
  const { data, error } = await supabase
    .from('fixes')
    .insert({
      shop_id: shopId,
      audit_id: auditId,
      issue_id: issueId,
      file_target: fileTarget,
      original_code: originalCode,
      fixed_code: fixedCode,
      ai_explanation: aiExplanation,
      ai_model: aiModel,
      rollback_backup_id: rollbackBackupId
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function markFixApplied(fixId, appliedBy = 'auto') {
  const { data, error } = await supabase
    .from('fixes')
    .update({ applied: true, applied_at: new Date().toISOString(), applied_by: appliedBy })
    .eq('id', fixId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function getFix(fixId) {
  const { data, error } = await supabase.from('fixes').select('*').eq('id', fixId).single();
  if (error) throw error;
  return data;
}

async function listFixesForShop(shopId, limit = 50) {
  const { data, error } = await supabase
    .from('fixes')
    .select('*')
    .eq('shop_id', shopId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}

module.exports = { saveFix, markFixApplied, getFix, listFixesForShop };
