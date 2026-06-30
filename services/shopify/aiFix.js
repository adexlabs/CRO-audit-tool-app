/**
 * This is the heart of the "Fix with AI" button.
 *
 * Flow:
 *  1. Load the live theme file that contains the issue
 *  2. Back it up to Supabase (rollback safety net)
 *  3. Ask Claude to generate a corrected version (services/ai/fixGenerator.js)
 *  4. Validate the AI output (services/ai/codeValidator.js)
 *  5. Push the corrected file back to the live theme (goes live instantly,
 *     Shopify serves theme assets directly — no redeploy needed)
 *  6. Save the fix + mark the issue resolved in Supabase
 */
const { getActiveTheme } = require('./themes');
const { getAsset, updateAsset } = require('./assets');
const { backupAssetBeforeFix } = require('./backup');
const { generateFix } = require('../ai/fixGenerator');
const { validateCode } = require('../ai/codeValidator');
const { saveFix, markFixApplied } = require('../database/fixes');
const { updateIssueStatus } = require('../database/audits');
const { logEvent } = require('../database/history');

async function applyAiFix({ shopDomain, accessToken, shopId, auditId, issue }) {
  const theme = await getActiveTheme(shopDomain, accessToken);
  const fileKey = issue.file_target;
  if (!fileKey) {
    throw new Error('This issue has no associated theme file and cannot be auto-fixed.');
  }

  // 1. Backup current live code
  const { backup, originalContent } = await backupAssetBeforeFix({
    shopDomain, accessToken, themeId: theme.id, fileKey, shopId
  });

  // 2. Ask Claude for a fix
  const aiResult = await generateFix({
    issue,
    fileKey,
    currentCode: originalContent
  });

  // 3. Validate before pushing anything live
  const validation = validateCode(aiResult.fixedCode, fileKey);
  if (!validation.valid) {
    throw new Error('AI fix failed validation: ' + validation.reason);
  }

  // 4. Push live
  await updateAsset(shopDomain, accessToken, theme.id, fileKey, aiResult.fixedCode);

  // 5. Persist fix + update issue status
  const savedFix = await saveFix({
    shopId,
    auditId,
    issueId: issue.id,
    fileTarget: fileKey,
    originalCode: originalContent,
    fixedCode: aiResult.fixedCode,
    aiExplanation: aiResult.explanation,
    aiModel: aiResult.model,
    rollbackBackupId: backup.id
  });
  await markFixApplied(savedFix.id, 'auto');
  await updateIssueStatus(issue.id, 'fixed');
  await logEvent({
    shopId,
    eventType: 'fix_applied',
    referenceId: savedFix.id,
    metadata: { fileTarget: fileKey, issueTitle: issue.title }
  });

  return { fix: savedFix, backupId: backup.id, theme };
}

module.exports = { applyAiFix };
