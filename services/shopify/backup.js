const { getAsset } = require('./assets');
const { createBackup } = require('../database/backups');

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
