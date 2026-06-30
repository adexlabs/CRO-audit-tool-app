const { getAsset } = require('./assets');
const { createBackup } = require('../database/backups');

/**
 * Snapshots a theme file into Supabase BEFORE we let AI overwrite it,
 * so every fix is reversible.
 */
async function backupAssetBeforeFix({ shopDomain, accessToken, themeId, fileKey, shopId }) {
  const asset = await getAsset(shopDomain, accessToken, themeId, fileKey);
  const backup = await createBackup({
    shopId,
    themeId: String(themeId),
    fileTarget: fileKey,
    fileContent: asset.value
  });
  return { backup, originalContent: asset.value };
}

module.exports = { backupAssetBeforeFix };
