/** Splits the fix-generation response into {fixedCode, explanation} */
function parseFixResponse(rawText) {
  const delimiter = '===EXPLANATION===';
  const idx = rawText.indexOf(delimiter);
  if (idx === -1) {
    // Model didn't follow format — treat the whole thing as code, no explanation
    return { fixedCode: stripCodeFences(rawText.trim()), explanation: '' };
  }
  const codePart = rawText.slice(0, idx).trim();
  const explanationPart = rawText.slice(idx + delimiter.length).trim();
  return { fixedCode: stripCodeFences(codePart), explanation: explanationPart };
}

function stripCodeFences(text) {
  return text.replace(/^```[a-zA-Z]*\n?/, '').replace(/```$/, '').trim();
}

/** Parses the audit JSON-array response, tolerant of stray markdown fences */
function parseAuditResponse(rawText) {
  const cleaned = rawText.replace(/```json|```/g, '').trim();
  try {
    const parsed = JSON.parse(cleaned);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('[responseParser] Failed to parse audit JSON:', e.message);
    return [];
  }
}

module.exports = { parseFixResponse, parseAuditResponse };
