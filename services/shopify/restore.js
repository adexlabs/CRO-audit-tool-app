const { updateAsset } = require('./assets');
const { getBackup } = require('../database/backups');
const { logEvent } = require('../database/history');

async function restoreFromBackup({ shopDomain, accessToken, themeId, backupId, shopId }) {
  const backup = await getBackup(backupId);
  if (!backup) throw new Error('Backup not found');

  const restored = await updateAsset(shopDomain, accessToken, themeId, backup.file_target, backup.file_content);

  await logEvent({
    shopId,
    eventType: 'fix_rolled_back',
    referenceId: backupId,
    metadata: { fileTarget: backup.file_target }
  });

  return restored;
}

module.exports = { restoreFromBackup };
