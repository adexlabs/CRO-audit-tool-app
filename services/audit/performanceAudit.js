const { analyzeCssLinks } = require('../scraper/cssParser');

function auditPerformance(parsed) {
  const issues = [];
  const cssStats = analyzeCssLinks(parsed.$);

  if (cssStats.tooManyStylesheets) {
    issues.push({
      category: 'performance', severity: 'medium',
      title: `${cssStats.stylesheetCount} separate stylesheets loaded`,
      description: 'Loading many separate CSS files increases render-blocking requests and slows first paint.',
      suggested_fix_summary: 'Bundle/minify stylesheets or defer non-critical CSS.'
    });
  }

  if (parsed.scripts.length > 10) {
    issues.push({
      category: 'performance', severity: 'medium',
      title: `${parsed.scripts.length} external scripts loaded`,
      description: 'A high number of script tags (often from apps) can significantly slow page load and hurt conversion.',
      suggested_fix_summary: 'Audit installed apps and defer/async non-critical scripts.'
    });
  }

  const unoptimizedImages = parsed.images.filter((i) => !i.width || !i.height);
  if (unoptimizedImages.length > 3) {
    issues.push({
      category: 'performance', severity: 'medium',
      title: 'Images missing explicit width/height',
      description: 'Images without explicit dimensions cause layout shift (poor CLS) as they load.',
      suggested_fix_summary: 'Add width/height attributes or aspect-ratio CSS to all images.'
    });
  }

  return issues;
}

module.exports = { auditPerformance };
