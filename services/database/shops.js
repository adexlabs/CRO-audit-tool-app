const supabase = require('./supabase');

async function getOrCreateShop(shopDomain, accessToken) {
  const { data: existing, error: findErr } = await supabase
    .from('shops')
    .select('*')
    .eq('shop_domain', shopDomain)
    .maybeSingle();

  if (findErr) throw findErr;
  if (existing) {
    if (accessToken && existing.access_token !== accessToken) {
      const { data: updated } = await supabase
        .from('shops')
        .update({ access_token: accessToken })
        .eq('id', existing.id)
        .select()
        .single();
      return updated;
    }
    return existing;
  }

  const { data: created, error: createErr } = await supabase
    .from('shops')
    .insert({ shop_domain: shopDomain, access_token: accessToken })
    .select()
    .single();
  if (createErr) throw createErr;
  return created;
}

async function getShopByDomain(shopDomain) {
  const { data, error } = await supabase
    .from('shops')
    .select('*')
    .eq('shop_domain', shopDomain)
    .maybeSingle();
  if (error) throw error;
  return data;
}

module.exports = { getOrCreateShop, getShopByDomain };
