function stripCodeFences(text) {
  if (!text) return '';

  return text
    .replace(/^```[a-zA-Z]*\n?/i, '')
    .replace(/```$/i, '')
    .trim();
}

/**
 * ----------------------------------------
 * FIX RESPONSE
 * ----------------------------------------
 */

function parseFixResponse(rawText) {
  const delimiter = "===EXPLANATION===";

  const idx = rawText.indexOf(delimiter);

  if (idx === -1) {
    return {
      fixedCode: stripCodeFences(rawText),
      explanation: ""
    };
  }

  const fixedCode = stripCodeFences(
    rawText.substring(0, idx).trim()
  );

  const explanation = rawText
    .substring(idx + delimiter.length)
    .trim();

  return {
    fixedCode,
    explanation
  };
}

/**
 * ----------------------------------------
 * AUDIT RESPONSE
 * ----------------------------------------
 */

function parseAuditResponse(rawText) {

  if (!rawText) return [];

  let cleaned = rawText
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  try {

    const parsed = JSON.parse(cleaned);

    if (!Array.isArray(parsed))
      return [];

    return parsed.map(normalizeIssue);

  } catch (err) {

    console.error(
      "[Audit Parser]",
      err.message
    );

    return [];
  }

}

/**
 * ----------------------------------------
 * NORMALIZE
 * Makes old AI responses compatible
 * ----------------------------------------
 */

function normalizeIssue(issue) {

  return {

    id:
      issue.id ||
      createId(),

    category:
      issue.category ||
      "General",

    severity:
      (
        issue.severity ||
        "medium"
      ).toLowerCase(),

    priority:
      issue.priority ||
      severityToPriority(issue.severity),

    title:
      issue.title ||
      "Unknown Issue",

    summary:
      issue.summary ||
      issue.description ||
      "",

    description:
      issue.description ||
      issue.summary ||
      "",

    why_it_matters:
      issue.why_it_matters ||
      "",

    business_impact:
      issue.business_impact ||
      "",

    recommendation:
      issue.recommendation ||
      "",

    expected_improvement:
      issue.expected_improvement ||
      "",

    estimated_conversion_uplift:
      issue.estimated_conversion_uplift ||
      "",

    estimated_revenue_impact:
      issue.estimated_revenue_impact ||
      "",

    difficulty:
      issue.difficulty ||
      "Medium",

    estimated_fix_time:
      issue.estimated_fix_time ||
      "15 mins",

    confidence:
      Number(issue.confidence) || 85,

    element_selector:
      issue.element_selector ||
      "",

    file_target:
      issue.file_target ||
      null,

    suggested_fix_summary:
      issue.suggested_fix_summary ||
      "",

    quick_win:
      issue.quick_win ||
      false,

    status:
      issue.status ||
      "open"

  };

}

/**
 * ----------------------------------------
 * Helpers
 * ----------------------------------------
 */

function severityToPriority(severity) {

  switch ((severity || "").toLowerCase()) {

    case "critical":
      return "Critical";

    case "high":
      return "High";

    case "medium":
      return "Medium";

    default:
      return "Low";
  }

}

function createId() {

  return (
    "issue_" +
    Math.random()
      .toString(36)
      .substring(2, 12)
  );

}

module.exports = {

  parseFixResponse,

  parseAuditResponse

};