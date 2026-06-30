const supabase = require('./supabase');

async function logEvent({ shopId, eventType, referenceId, metadata = {} }) {
  const { data, error } = await supabase
    .from('history')
    .insert({ shop_id: shopId, event_type: eventType, reference_id: referenceId, metadata })
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function listHistory(shopId, limit = 100) {
  const { data, error } = await supabase
    .from('history')
    .select('*')
    .eq('shop_id', shopId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}

module.exports = { logEvent, listHistory };
