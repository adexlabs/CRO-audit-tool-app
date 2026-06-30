function auditUi(parsed) {
  const issues = [];

  if (parsed.buttons.length === 0) {
    issues.push({
      category: 'ui', severity: 'high',
      title: 'No clear call-to-action buttons detected',
      description: 'No <button> or button-styled elements were found on the page, which likely means no clear CTA exists.',
      suggested_fix_summary: 'Add a prominent, high-contrast CTA button above the fold.'
    });
  }

  if (parsed.bodyTextLength < 200) {
    issues.push({
      category: 'ui', severity: 'low',
      title: 'Very little page content',
      description: 'Page has minimal text content, which can hurt both SEO and shopper confidence.',
      suggested_fix_summary: 'Add more descriptive, persuasive content explaining value proposition.'
    });
  }

  return issues;
}

module.exports = { auditUi };
