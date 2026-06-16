module.exports = function(eleventyConfig) {
  // Copy static assets to output
  eleventyConfig.addPassthroughCopy("assets");
  
  eleventyConfig.addPassthroughCopy("events");
  eleventyConfig.addPassthroughCopy("compare");
  eleventyConfig.addPassthroughCopy("fighters");    
  eleventyConfig.addPassthroughCopy("sitemap.xml");
  eleventyConfig.addPassthroughCopy("robots.txt");
  eleventyConfig.addPassthroughCopy("_redirects");   // Netlify legacy 404 -> current slug redirects (P4)

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

  // Add commaNumber filter for formatting numbers with commas
  eleventyConfig.addFilter("commaNumber", function(value) {
    if (value === null || value === undefined) return '0';
    return Number(value).toLocaleString('en-US');
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
