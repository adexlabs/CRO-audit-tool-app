function validateCode(code, fileKey) {
  if (!code || typeof code !== 'string' || code.trim().length === 0) {
    return { valid: false, reason: 'Empty code returned by AI' };
  }

  if (code.length < 20) {
    return { valid: false, reason: 'Suspiciously short output' };
  }

  if (fileKey.endsWith('.liquid')) {
    const openTags = (code.match(/{%-?\s*(if|for|case|capture|form|comment|schema)\b/g) || []).length;
    const closeTags = (code.match(/{%-?\s*end(if|for|case|capture|form|comment|schema)\b/g) || []).length;
    if (openTags !== closeTags) {
      return { valid: false, reason: `Unbalanced Liquid tags (open: ${openTags}, close: ${closeTags})` };
    }
  }

  if (fileKey.endsWith('.json')) {
    try {
      JSON.parse(code);
    } catch (e) {
      return { valid: false, reason: 'Invalid JSON: ' + e.message };
    }
  }

  if (fileKey.endsWith('.css') || fileKey.endsWith('.css.liquid')) {
    const openBraces = (code.match(/{/g) || []).length;
    const closeBraces = (code.match(/}/g) || []).length;
    if (openBraces !== closeBraces) {
      return { valid: false, reason: 'Unbalanced CSS braces' };
    }
  }

  return { valid: true };
}

module.exports = { validateCode };
