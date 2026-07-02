const { fetchPageHtml } = require('../scraper/websiteScraper');
const { parseHtml } = require('../scraper/htmlParser');
const { auditHomepage } = require('./homepageAudit');
const { auditProduct } = require('./productAudit');
const { auditCollection } = require('./collectionAudit');
const { auditCart } = require('./cartAudit');
const { calculateScores } = require('./scoreCalculator');
const { prioritizeIssues } = require('./recommendationEngine');

const AUDITORS = {
  homepage: auditHomepage,
  product: auditProduct,
  collection: auditCollection,
  cart: auditCart
};

async function runAudit({ url, pageType = 'homepage', fileTargetMap = {} }) {
  const html = await fetchPageHtml(url);
  const parsed = parseHtml(html);

  const auditorFn = AUDITORS[pageType] || auditHomepage;
  let issues = auditorFn(parsed);

  const defaultFileTargets = {
    seo: 'layout/theme.liquid',
    performance: 'layout/theme.liquid',
    accessibility: pageType === 'product' ? 'sections/main-product.liquid' : 'layout/theme.liquid',
    mobile: 'layout/theme.liquid',
    trust: pageType === 'product' ? 'sections/main-product.liquid' : 'sections/footer.liquid',
    ui: pageType === 'product' ? 'sections/main-product.liquid' : 'sections/main-' + pageType + '.liquid',
    cart: 'sections/main-cart.liquid'
  };

  issues = issues.map((issue) => ({
    ...issue,
    file_target: fileTargetMap[issue.category] || defaultFileTargets[issue.category] || null,
    current_snippet: null
  }));

  issues = prioritizeIssues(issues);
  const { overallScore, categoryScores } = calculateScores(issues);

  return {
    overallScore,
    categoryScores,
    issues,
    pageType,
    url,
    rawFindings: { issueCount: issues.length, parsedSummary: { title: parsed.title, h1Count: parsed.h1Count } }
  };
}

module.exports = { runAudit };
