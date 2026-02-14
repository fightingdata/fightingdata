module.exports = function(eleventyConfig) {
  // Copy static assets to output
  eleventyConfig.addPassthroughCopy("assets");
  
  // Copy pre-generated HTML reports
  eleventyConfig.addPassthroughCopy({
    "../scripts/reports": "compare"
  });
  
  // Copy pre-generated event previews
  eleventyConfig.addPassthroughCopy({
    "../scripts/event_previews": "events"
  });
  
  // Add limit filter (like Liquid)
  eleventyConfig.addFilter("limit", function(array, limit) {
    if (!array || !Array.isArray(array)) return [];
    return array.slice(0, limit);
  });
  
  // Add date filter
  eleventyConfig.addFilter("date", function(date, format) {
    const d = new Date();
    return d.getFullYear();
  });
  
  // Add default filter
  eleventyConfig.addFilter("default", function(value, defaultValue) {
    return value || defaultValue;
  });
  
  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "../_includes",
      data: "../_data"
    },
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk"
  };
};
