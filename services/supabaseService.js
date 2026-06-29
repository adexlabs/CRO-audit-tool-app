const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

function getISTParts(date) {
    const istString = date.toLocaleString("en-US", {
        timeZone: "Asia/Kolkata",
        hour12: false,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
    });
    const [datePart, timePart] = istString.split(", ");
    const [month, day, year] = datePart.split("/");
    const [hour, minute, second] = timePart.split(":");
    return { day, month, year, hour: hour === "24" ? "00" : hour, minute, second };
}

function buildShareSlug(shop) {
    const now = new Date();
    const { day, month, year, hour, minute, second } = getISTParts(now);
    const cleanShop = shop.replace(".myshopify.com", "");
    return `${cleanShop}-${day}-${month}-${year}-${hour}h${minute}m${second}s`;
}

async function saveAudit(shop, report, websiteData) {
    const shareSlug = buildShareSlug(shop);

    const { data, error } = await supabase
        .from("audits")
        .insert([
            {
                shop_domain: shop,
                share_url: shareSlug,
                created_at: new Date().toISOString(),
                website_url: report.website_url,
                overall_conversion_score: report.overall_conversion_score,
                critical_issues: report.critical_issues,
                major_opportunities: report.major_opportunities,
                quick_wins: report.quick_wins,
                summary: report.summary,
                recommendations: report.recommendations,
                full_report: report,
                scraped_data: websiteData
            }
        ])
        .select()
        .single();

    if (error) throw error;
    return data;
}

async function getLatestAuditForShop(shop) {
    const { data, error } = await supabase
        .from("audits")
        .select("*")
        .eq("shop_domain", shop)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

    if (error) throw error;
    return data;
}

async function getAuditById(id) {
    const { data } = await supabase
        .from("audits")
        .select("*")
        .eq("share_url", id)
        .maybeSingle();
    return data;
}

async function updateRecommendationStatus(auditId, recId, status) {
    const audit = await supabase.from("audits").select("recommendations").eq("id", auditId).single();
    if (audit.error) throw audit.error;

    const updated = (audit.data.recommendations || []).map((r) =>
        r.id === recId ? { ...r, status } : r
    );

    const { error } = await supabase
        .from("audits")
        .update({ recommendations: updated })
        .eq("id", auditId);

    if (error) throw error;
    return updated;
}

async function saveFixRecord(fixRecord) {
    const { data, error } = await supabase.from("fixes").insert([fixRecord]).select().single();
    if (error) throw error;
    return data;
}

async function deleteShopData(shop) {
    await supabase.from("audits").delete().eq("shop_domain", shop);
    await supabase.from("fixes").delete().eq("shop_domain", shop);
}

module.exports = {
    saveAudit,
    getLatestAuditForShop,
    getAuditById,
    updateRecommendationStatus,
    saveFixRecord,
    deleteShopData
};
