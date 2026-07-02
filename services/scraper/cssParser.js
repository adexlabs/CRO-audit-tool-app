function analyzeCssLinks($) {
  const links = $('link[rel="stylesheet"]').map((_, el) => $(el).attr('href')).get();
  return {
    stylesheetCount: links.length,
    stylesheets: links,
    tooManyStylesheets: links.length > 6
  };
}

module.exports = { analyzeCssLinks };
