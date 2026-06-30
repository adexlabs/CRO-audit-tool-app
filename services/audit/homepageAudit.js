const { auditSeo } = require('./seoAudit');
const { auditAccessibility } = require('./accessibilityAudit');
const { auditMobile } = require('./mobileAudit');
const { auditTrust } = require('./trustAudit');
const { auditUi } = require('./uiAudit');
const { auditPerformance } = require('./performanceAudit');

function auditHomepage(parsed) {
  return [
    ...auditSeo(parsed, 'homepage'),
    ...auditAccessibility(parsed),
    ...auditMobile(parsed),
    ...auditTrust(parsed),
    ...auditUi(parsed),
    ...auditPerformance(parsed)
  ];
}

module.exports = { auditHomepage };
