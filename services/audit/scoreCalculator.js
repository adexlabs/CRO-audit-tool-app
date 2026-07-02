const SEVERITY_WEIGHTS = { critical: 25, high: 15, medium: 8, low: 3 };
const CATEGORIES = ['seo', 'performance', 'accessibility', 'trust', 'mobile', 'ui', 'cart'];

function calculateScores(issues) {
  const categoryDeductions = {};
  CATEGORIES.forEach((c) => (categoryDeductions[c] = 0));

  let totalDeduction = 0;
  for (const issue of issues) {
    const weight = SEVERITY_WEIGHTS[issue.severity] || 5;
    totalDeduction += weight;
    if (categoryDeductions[issue.category] !== undefined) {
      categoryDeductions[issue.category] += weight;
    }
  }

  const categoryScores = {};
  CATEGORIES.forEach((c) => {
    categoryScores[c] = Math.max(0, Math.round(100 - categoryDeductions[c]));
  });

  const overallScore = Math.max(0, Math.round(100 - totalDeduction / Math.max(1, CATEGORIES.length / 2)));

  return { overallScore: Math.min(100, overallScore), categoryScores };
}

module.exports = { calculateScores };
