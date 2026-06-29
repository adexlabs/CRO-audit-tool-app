const axios = require("axios");

/**
 * Given a recommendation + the relevant source (theme asset content, or a
 * storefront page body), ask Claude to produce a concrete patch:
 *  - the exact original snippet to find
 *  - the exact replacement snippet
 *  - a short human explanation
 *
 * This keeps the "fix" scoped and reviewable instead of having the AI
 * rewrite the whole file.
 */
async function generateFix({ recommendation, sourceType, sourceContent, sourceLabel }) {
    const prompt = `
You are a senior CRO + front-end engineer.

You will be given:
1. A CRO recommendation that needs to be implemented.
2. The current source content it needs to be applied to (${sourceType}: "${sourceLabel}").

Produce a MINIMAL, SAFE patch that implements the recommendation.

Return ONLY valid JSON in this exact shape:
{
  "explanation": "1-3 sentences, plain language, for a merchant (non-technical)",
  "find": "EXACT substring from the source content to be replaced (keep this as short as possible while still unique)",
  "replace": "the replacement substring implementing the fix",
  "confidence": "high | medium | low",
  "risk_note": "short note on what to double check after applying, or empty string"
}

Rules:
- "find" MUST be an exact, verbatim substring of the provided source content (whitespace included), so it can be located with a string match. If you cannot find a safe, unique snippet to anchor the fix to, return "find": "" and explain why in "explanation".
- Do not rewrite unrelated content.
- Keep "find" as small as possible (just the relevant line(s)/element), not the whole document.
- Never invent content that isn't grounded in the recommendation (e.g. don't invent fake testimonials or fake prices).

Recommendation:
${JSON.stringify(recommendation)}

Source content:
${sourceContent.slice(0, 40000)}
`;

    const response = await axios.post(
        "https://api.anthropic.com/v1/messages",
        {
            model: "claude-sonnet-4-6",
            max_tokens: 4000,
            system: "Return ONLY valid JSON. No markdown. No explanation outside the JSON.",
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
    const clean = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const fix = JSON.parse(clean);

    // Validate the "find" snippet actually exists in source, otherwise
    // applying it later would silently no-op or corrupt content.
    if (fix.find && !sourceContent.includes(fix.find)) {
        fix.confidence = "low";
        fix.risk_note =
            (fix.risk_note ? fix.risk_note + " " : "") +
            "Warning: anchor snippet was not found verbatim in the source; manual review required.";
        fix.unanchored = true;
    } else {
        fix.unanchored = false;
    }

    return fix;
}

module.exports = generateFix;
