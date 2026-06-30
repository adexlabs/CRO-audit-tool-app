const supabase = require('./supabase');

async function createBackup({ shopId, themeId, fileTarget, fileContent }) {
  const { data, error } = await supabase
    .from('backups')
    .insert({ shop_id: shopId, theme_id: themeId, file_target: fileTarget, file_content: fileContent })
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function getBackup(backupId) {
  const { data, error } = await supabase.from('backups').select('*').eq('id', backupId).single();
  if (error) throw error;
  return data;
}

module.exports = { createBackup, getBackup };
