const { generateFix } = require("../../services/claudeService");
const { getAudit, saveFix } = require("../../services/supabaseService");
const diffLines = require("diff").diffLines; // npm i diff

module.exports = async (req, res) => {
  try {
    const { auditId, recommendationIndex, assetKey, currentSource } = req.body;

    const audit = await getAudit(auditId);
    const recommendation = audit.recommendations[recommendationIndex];

    const { explanation, full_updated_source } = await generateFix(
      recommendation,
      assetKey,
      currentSource
    );

    const diff = diffLines(currentSource, full_updated_source);

    const fixRecord = await saveFix({
      audit_id: auditId,
      shop_domain: audit.shop_domain,
      recommendation_index: recommendationIndex,
      target_type: "theme_asset",
      target_key: assetKey,
      original_content: currentSource,
      proposed_content: full_updated_source,
      diff: JSON.stringify(diff),
      status: "pending"
    });

    res.status(200).json({ success: true, fixId: fixRecord.id, explanation, diff });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
};