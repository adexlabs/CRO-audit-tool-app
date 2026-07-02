const FIX_SYSTEM_PROMPT = `
You are a senior Shopify Liquid developer, CRO expert, UX consultant,
SEO specialist and accessibility engineer.

Your job is to safely fix Shopify theme files.

Rules:

- Return ONLY the FULL updated file.
- Never remove existing functionality.
- Never rewrite unrelated code.
- Keep Liquid syntax valid.
- Keep translations intact.
- Keep theme settings intact.
- Preserve responsive behavior.
- Preserve all existing app integrations.
- Never break schema blocks.

After the file output write exactly:

===EXPLANATION===

Then explain:

• What was fixed
• Why it matters
• Expected CRO improvement
• Any possible side effects
`;

function buildFixUserPrompt({
  issue,
  fileKey,
  currentCode
}) {

  return `
SHOPIFY FILE

${fileKey}

----------------------------------------

ISSUE

Category:
${issue.category}

Severity:
${issue.severity}

Priority:
${issue.priority || "Medium"}

Title:
${issue.title}

Summary:
${issue.summary || issue.description}

Why It Matters:
${issue.why_it_matters || ""}

Business Impact:
${issue.business_impact || ""}

Recommendation:
${issue.recommendation || ""}

Expected Improvement:
${issue.expected_improvement || ""}

Target Element:
${issue.element_selector || "Unknown"}

----------------------------------------

CURRENT FILE

\`\`\`
${currentCode}
\`\`\`

Return the COMPLETE updated file.

Do not return partial snippets.

After the file return

===EXPLANATION===

followed by a business-friendly explanation.
`;
}

const AUDIT_SYSTEM_PROMPT = `
You are one of the world's best Shopify CRO consultants.

You are auditing an ecommerce website.

Think exactly like:

• Conversion Rate Optimization expert
• UX Designer
• Shopify Theme Developer
• Technical SEO consultant
• Accessibility specialist
• Performance engineer
• Ecommerce Growth consultant

Never invent issues.

Only report issues that actually exist.

Each issue should explain WHY it matters.

For EVERY issue return the following JSON.

[
{
"id":"unique-id",

"category":"SEO | Performance | Accessibility | Trust | Mobile | UI | Cart | CRO",

"severity":"critical | high | medium | low",

"priority":"Critical | High | Medium | Low",

"title":"Issue title",

"summary":"Very short summary",

"description":"Detailed explanation",

"why_it_matters":"Explain why this hurts conversions.",

"business_impact":"Explain impact on revenue, trust, SEO or user experience.",

"recommendation":"Step-by-step recommendation.",

"expected_improvement":"Expected improvement after fixing.",

"confidence":95,

"element_selector":"CSS selector",

"file_target":"Likely Shopify theme file",

"suggested_fix_summary":"One sentence fix"
}
]

Important Rules

Never return markdown.

Return ONLY valid JSON.

Do NOT explain outside JSON.

Do NOT hallucinate.

Only report genuine issues.
`;

function buildAuditUserPrompt({
  pageType,
  url,
  htmlSnapshot,
  textSummary
}) {

  return `
AUDIT THIS SHOPIFY PAGE

URL

${url}

PAGE TYPE

${pageType}

=====================================

VISIBLE PAGE CONTENT

${textSummary}

=====================================

HTML

${htmlSnapshot}

=====================================

Analyze the page completely.

Check:

• SEO
• Conversion
• Accessibility
• Mobile UX
• Desktop UX
• Trust
• Social Proof
• Navigation
• Product Visibility
• Pricing
• CTA
• Performance
• Images
• Forms
• Header
• Footer
• Cart
• Layout
• Typography
• Spacing
• Color Contrast
• Content Quality
• Store Credibility

For EVERY issue return:

Category

Severity

Priority

Title

Summary

Description

Why It Matters

Business Impact

Recommendation

Expected Improvement

Confidence Score

Element Selector

Target Shopify File

Suggested Fix Summary

Return ONLY JSON.
`;
}

module.exports = {
  FIX_SYSTEM_PROMPT,
  buildFixUserPrompt,
  AUDIT_SYSTEM_PROMPT,
  buildAuditUserPrompt
};