const cheerio = require('cheerio');

/**
 * Parses raw HTML into the structured shape every audit module consumes.
 */
function parseHtml(html) {
  const $ = cheerio.load(html);

  return {
    $,
    title: $('title').text().trim(),
    metaDescription: $('meta[name="description"]').attr('content') || '',
    h1Count: $('h1').length,
    h1Texts: $('h1').map((_, el) => $(el).text().trim()).get(),
    images: $('img').map((_, el) => ({
      src: $(el).attr('src'),
      alt: $(el).attr('alt') || null,
      width: $(el).attr('width'),
      height: $(el).attr('height')
    })).get(),
    links: $('a').map((_, el) => ({
      href: $(el).attr('href'),
      text: $(el).text().trim()
    })).get(),
    buttons: $('button, a.btn, .button, [role="button"]').map((_, el) => $(el).text().trim()).get(),
    forms: $('form').length,
    scripts: $('script[src]').map((_, el) => $(el).attr('src')).get(),
    hasViewportMeta: $('meta[name="viewport"]').length > 0,
    bodyTextLength: $('body').text().replace(/\s+/g, ' ').trim().length,
    rawHtmlSnippet: html.slice(0, 8000) // truncated for AI prompt size
  };
}

module.exports = { parseHtml };
