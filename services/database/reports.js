const supabase = require('./supabase');

async function saveReport({ shopId, auditId, reportUrl, format = 'pdf' }) {
  const { data, error } = await supabase
    .from('reports')
    .insert({ shop_id: shopId, audit_id: auditId, report_url: reportUrl, format })
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function listReportsForShop(shopId) {
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .eq('shop_id', shopId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

module.exports = { saveReport, listReportsForShop };
