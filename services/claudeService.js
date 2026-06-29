const axios = require("axios");

async function generateAudit(content, url) {
    const prompt = `
You are a senior CRO consultant.

Generate a professional CRO audit dashboard report.

Return ONLY valid JSON.

{
  "website_url": "",
  "audit_date": "",
  "overall_conversion_score": 0,
  "critical_issues": 0,
  "major_opportunities": 0,
  "quick_wins": 0,
  "summary": "",
  "recommendations": [
    {
      "id": "",
      "priority_score": 95,
      "impact_level": "High",
      "category": "",
      "issue_found": "",
      "why_it_hurts_conversions": "",
      "recommended_solution": "",
      "expected_cro_impact": "",
      "implementation_difficulty": "Easy",
      "fixable_by_ai": true
    }
  ]
}

Rules:
- Overall score out of 100
- Include 10-15 recommendations
- Sort by impact
- Calculate Critical Issues, Major Opportunities, Quick Wins
- Executive summary must be concise
- Give every recommendation a short unique "id" (e.g. "rec-01")
- Set "fixable_by_ai": true only when the fix is something that could realistically
  be applied by editing on-page text/content or simple theme markup (e.g. CTA copy,
  trust badges, headline clarity, form labels). Set false for things requiring
  business decisions (pricing, shipping policy, etc).
- Do not rename fields. Return JSON only.

Website:
${JSON.stringify(content)}
`;

    try {
        const response = await axios.post(
            "https://api.anthropic.com/v1/messages",
            {
                model: "claude-sonnet-4-6",
                max_tokens: 12000,
                system: "Return ONLY valid JSON. No markdown. No explanation.",
                messages: [{ role: "user", content: prompt }]
            },
            {
                headers: {
                    "x-api-key": process.env.CLAUDE_API_KEY,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json"
                }
            }
        );

        const text = response.data.content[0].text;
        const cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();
        const audit = JSON.parse(cleanText);

        audit.website_url = url;
        audit.audit_date = new Date().toISOString().split("T")[0];

        return audit;
    } catch (error) {
        console.error("CLAUDE ERROR:", error.response?.data || error.message);
        throw error;
    }
}

module.exports = generateAudit;
