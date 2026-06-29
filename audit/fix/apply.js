const adminClient = require("../../services/shopifyAdminClient");
const { getFix, getShop, updateFixStatus } = require("../../services/supabaseService");

module.exports = async (req, res) => {
  try {
    const { fixId } = req.body;

    const fix = await getFix(fixId);
    if (fix.status !== "pending") {
      return res.status(400).json({ success: false, error: "Fix already processed" });
    }

    const shop = await getShop(fix.shop_domain);
    const client = adminClient(shop.shop_domain, shop.access_token);

    if (fix.target_type === "theme_asset") {
      // Re-read current live source right before writing, to avoid clobbering
      // a change someone made manually since the diff was generated.
      const { data: liveAsset } = await client.get(
        `/themes/${fix.theme_id}/assets.json?asset[key]=${encodeURIComponent(fix.target_key)}`
      );

      if (liveAsset.asset.value !== fix.original_content) {
        await updateFixStatus(fixId, "failed");
        return res.status(409).json({
          success: false,
          error: "File changed since fix was generated — please regenerate the fix."
        });
      }

      await client.put(`/themes/${fix.theme_id}/assets.json`, {
        asset: {
          key: fix.target_key,
          value: fix.proposed_content
        }
      });
    }

    // target_type === 'page' would PUT to /pages/{id}.json with body_html, similarly

    await updateFixStatus(fixId, "applied");
    res.status(200).json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
};