const { auditSeo } = require('./seoAudit');
const { auditAccessibility } = require('./accessibilityAudit');
const { auditMobile } = require('./mobileAudit');
const { auditTrust } = require('./trustAudit');
const { auditUi } = require('./uiAudit');
const { auditPerformance } = require('./performanceAudit');

function auditProduct(parsed) {
  const issues = [
    ...auditSeo(parsed, 'product'),
    ...auditAccessibility(parsed),
    ...auditMobile(parsed),
    ...auditTrust(parsed),
    ...auditUi(parsed),
    ...auditPerformance(parsed)
  ];

  const bodyText = parsed.$ ? parsed.$('body').text().toLowerCase() : '';
  if (!/add to cart|buy now/.test(bodyText)) {
    issues.push({
      category: 'cart', severity: 'critical',
      title: 'No "Add to Cart" / "Buy Now" text detected',
      description: 'The core purchase action could not be detected in the page text — this may indicate the buy button is missing, hidden, or rendered only via JS.',
      suggested_fix_summary: 'Verify the Add to Cart button is visible and not hidden behind broken JS/CSS.'
    });
  }

  return issues;
}

module.exports = { auditProduct };
