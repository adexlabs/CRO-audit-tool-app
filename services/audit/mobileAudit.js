function auditMobile(parsed) {
  const issues = [];

  if (!parsed.hasViewportMeta) {
    issues.push({
      category: 'mobile', severity: 'critical',
      title: 'Page not optimized for mobile viewport',
      description: 'Without a viewport meta tag, mobile browsers render the desktop layout zoomed out, hurting usability and Google mobile-first ranking.',
      suggested_fix_summary: 'Add the responsive viewport meta tag to theme.liquid.'
    });
  }

  const tinyButtons = parsed.buttons.filter((b) => b && b.length > 0 && b.length < 3);
  if (tinyButtons.length > 3) {
    issues.push({
      category: 'mobile', severity: 'low',
      title: 'Several very short button labels detected',
      description: 'Short labels combined with small tap targets can be hard to tap accurately on mobile.',
      suggested_fix_summary: 'Ensure all tappable buttons are at least 44x44px with clear labels.'
    });
  }

  return issues;
}

module.exports = { auditMobile };
