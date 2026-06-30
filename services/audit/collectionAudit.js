const { auditSeo } = require('./seoAudit');
const { auditAccessibility } = require('./accessibilityAudit');
const { auditMobile } = require('./mobileAudit');
const { auditUi } = require('./uiAudit');
const { auditPerformance } = require('./performanceAudit');

function auditCollection(parsed) {
  const issues = [
    ...auditSeo(parsed, 'collection'),
    ...auditAccessibility(parsed),
    ...auditMobile(parsed),
    ...auditUi(parsed),
    ...auditPerformance(parsed)
  ];

  if (parsed.images.length === 0) {
    issues.push({
      category: 'ui', severity: 'high',
      title: 'No product images detected on collection page',
      description: 'Collection grid shows no images — could indicate broken theme rendering or a slow JS-rendered grid.',
      suggested_fix_summary: 'Verify the collection grid section renders product images server-side.'
    });
  }

  return issues;
}

module.exports = { auditCollection };
