function auditSeo(parsed, pageType) {
  const issues = [];

  if (!parsed.title || parsed.title.length < 10) {
    issues.push({
      category: 'seo', severity: 'high',
      title: 'Missing or too-short page title',
      description: 'The <title> tag is missing or under 10 characters, hurting search visibility and click-through rate.',
      suggested_fix_summary: 'Add a descriptive, keyword-rich title between 50-60 characters.'
    });
  } else if (parsed.title.length > 70) {
    issues.push({
      category: 'seo', severity: 'low',
      title: 'Page title too long',
      description: `Title is ${parsed.title.length} characters and will be truncated in Google search results.`,
      suggested_fix_summary: 'Shorten the title to under 60 characters.'
    });
  }

  if (!parsed.metaDescription) {
    issues.push({
      category: 'seo', severity: 'medium',
      title: 'Missing meta description',
      description: 'No meta description tag found. Search engines will auto-generate a snippet, reducing click-through control.',
      suggested_fix_summary: 'Add a compelling 150-160 character meta description.'
    });
  }

  if (parsed.h1Count === 0) {
    issues.push({
      category: 'seo', severity: 'high',
      title: 'Missing H1 heading',
      description: 'No <h1> tag found on the page. H1 tags help search engines understand page topic.',
      suggested_fix_summary: 'Add a single, descriptive H1 heading.'
    });
  } else if (parsed.h1Count > 1) {
    issues.push({
      category: 'seo', severity: 'low',
      title: 'Multiple H1 tags found',
      description: `Found ${parsed.h1Count} H1 tags. Best practice is exactly one H1 per page.`,
      suggested_fix_summary: 'Keep one H1, convert the rest to H2/H3.'
    });
  }

  return issues;
}

module.exports = { auditSeo };
