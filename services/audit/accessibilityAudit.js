const { analyzeImages } = require('../scraper/imageAnalyzer');

function auditAccessibility(parsed) {
  const issues = [];
  const imgStats = analyzeImages(parsed.images);

  if (imgStats.missingAltCount > 0) {
    issues.push({
      category: 'accessibility', severity: imgStats.missingAltCount > 5 ? 'high' : 'medium',
      title: `${imgStats.missingAltCount} image(s) missing alt text`,
      description: 'Images without alt attributes are inaccessible to screen reader users and hurt image SEO.',
      element_selector: 'img:not([alt])',
      suggested_fix_summary: 'Add descriptive alt text to every product/content image.'
    });
  }

  const emptyButtons = parsed.buttons.filter((b) => !b || b.trim() === '');
  if (emptyButtons.length > 0) {
    issues.push({
      category: 'accessibility', severity: 'medium',
      title: 'Buttons/links with no accessible text',
      description: `${emptyButtons.length} interactive element(s) have no visible or aria-label text, making them unusable for screen readers.`,
      suggested_fix_summary: 'Add aria-label or visible text to every interactive element.'
    });
  }

  if (!parsed.hasViewportMeta) {
    issues.push({
      category: 'accessibility', severity: 'high',
      title: 'Missing viewport meta tag',
      description: 'No responsive viewport meta tag found; mobile rendering and zoom behavior may be broken.',
      suggested_fix_summary: 'Add <meta name="viewport" content="width=device-width, initial-scale=1">.'
    });
  }

  return issues;
}

module.exports = { auditAccessibility };
