/** Flags missing alt text and oversized/unoptimized images from parsed HTML data */
function analyzeImages(images) {
  const missingAlt = images.filter((img) => !img.alt || img.alt.trim() === '');
  const missingDimensions = images.filter((img) => !img.width || !img.height);

  return {
    totalImages: images.length,
    missingAltCount: missingAlt.length,
    missingAltImages: missingAlt.map((i) => i.src),
    missingDimensionsCount: missingDimensions.length
  };
}

module.exports = { analyzeImages };
