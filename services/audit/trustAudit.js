function auditTrust(parsed) {
  const issues = [];
  const bodyText = parsed.$ ? parsed.$('body').text().toLowerCase() : '';

  const hasReturnPolicy = /return policy|returns? & exchanges|money.back/.test(bodyText);
  const hasSecureBadgeText = /secure checkout|ssl secured|ssl encrypted/.test(bodyText);
  const hasContactInfo = /contact us|customer support|support@|help@/.test(bodyText);
  const hasReviews = /reviews?|★|rating/.test(bodyText);

  if (!hasReturnPolicy) {
    issues.push({
      category: 'trust', severity: 'medium',
      title: 'No visible return/refund policy mention',
      description: 'Shoppers look for return policy information before purchasing. None was detected on this page.',
      suggested_fix_summary: 'Add a visible return policy link/badge near the buy button.'
    });
  }

  if (!hasSecureBadgeText) {
    issues.push({
      category: 'trust', severity: 'low',
      title: 'No secure checkout trust signal visible',
      description: 'Trust badges (SSL, secure checkout) near checkout/CTA buttons increase conversion confidence.',
      suggested_fix_summary: 'Add a secure checkout badge near the Add to Cart / Checkout button.'
    });
  }

  if (!hasContactInfo) {
    issues.push({
      category: 'trust', severity: 'low',
      title: 'No visible contact/support information',
      description: 'Customers want reassurance support is reachable. No contact info detected in page text.',
      suggested_fix_summary: 'Add a visible contact link in the header or footer.'
    });
  }

  if (!hasReviews) {
    issues.push({
      category: 'trust', severity: 'medium',
      title: 'No customer reviews or ratings detected',
      description: 'Social proof (reviews, ratings) strongly influences purchase decisions and was not found on this page.',
      suggested_fix_summary: 'Add a reviews/ratings section or app block.'
    });
  }

  return issues;
}

module.exports = { auditTrust };
