const { auditTrust } = require('./trustAudit');
const { auditUi } = require('./uiAudit');
const { auditMobile } = require('./mobileAudit');

function auditCart(parsed) {
  const issues = [...auditTrust(parsed), ...auditUi(parsed), ...auditMobile(parsed)];
  const bodyText = parsed.$ ? parsed.$('body').text().toLowerCase() : '';

  if (!/checkout/.test(bodyText)) {
    issues.push({
      category: 'cart', severity: 'critical',
      title: 'No visible checkout CTA on cart page',
      description: 'The word "checkout" could not be found, suggesting the checkout button may be missing or unclear.',
      suggested_fix_summary: 'Ensure a prominent, clearly labeled "Checkout" button is present.'
    });
  }

  if (!/free shipping|shipping calculated|estimate shipping/.test(bodyText)) {
    issues.push({
      category: 'cart', severity: 'medium',
      title: 'No shipping cost transparency on cart',
      description: 'Surprise shipping costs at checkout are a leading cause of cart abandonment.',
      suggested_fix_summary: 'Show shipping estimate or free-shipping threshold directly in the cart.'
    });
  }

  return issues;
}

module.exports = { auditCart };
