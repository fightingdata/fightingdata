module.exports = function(eleventyConfig) {
  // ─── Fighter profile shortlinks: [[Fighter Name]] in article markdown ───────
  // Build an EXACT (case-insensitive) name -> slug map from the fighter database.
  // Names shared by 2+ fighters are treated as ambiguous and removed, so a
  // [[Name]] token can only ever resolve to a single, correct profile — never a
  // guessed/fuzzy match (a wrong link is worse than no link).
  const fightersData = require("./_data/fighters.json");
  const slugsByName = new Map();           // name(lower) -> Set(slug)
  for (const f of fightersData) {
    if (!f.name || !f.slug) continue;
    const key = f.name.trim().toLowerCase();
    if (!slugsByName.has(key)) slugsByName.set(key, new Set());
    slugsByName.get(key).add(f.slug);
  }
  const fighterSlug = new Map();           // name(lower) -> slug (unique only)
  const ambiguousNames = new Set();
  for (const [key, slugs] of slugsByName) {
    if (slugs.size === 1) fighterSlug.set(key, [...slugs][0]);
    else ambiguousNames.add(key);
  }

  // Replaces [[Fighter Name]] with a link to /fighters/{slug}/. On no/ambiguous
  // match it leaves clean plain text (no brackets) and logs a build warning.
  eleventyConfig.addFilter("fighterLinks", function(html) {
    if (!html) return html;
    return html.replace(/\[\[([^\]\[]+)\]\]/g, function(_whole, rawName) {
      const name = rawName.trim();
      const key = name.toLowerCase();
      const slug = fighterSlug.get(key);
      if (slug) return `<a href="/fighters/${slug}/">${name}</a>`;
      if (ambiguousNames.has(key)) {
        console.warn(`[fighterLinks] "${name}" matches multiple fighters — left unlinked. Disambiguate manually.`);
      } else {
        console.warn(`[fighterLinks] no profile match for "${name}" — left as plain text. Check spelling.`);
      }
      return name;
    });
  });

  // Copy static assets to output
  eleventyConfig.addPassthroughCopy("assets");
  
  eleventyConfig.addPassthroughCopy("events");
  eleventyConfig.addPassthroughCopy("compare");
  eleventyConfig.addPassthroughCopy("fighters");
  eleventyConfig.addPassthroughCopy("methodology"); // generated from METRIC_DEFS (Phase 3)
  eleventyConfig.addPassthroughCopy("sitemap.xml");
  eleventyConfig.addPassthroughCopy("robots.txt");
  eleventyConfig.addPassthroughCopy("_redirects");   // Netlify legacy 404 -> current slug redirects (P4)

  // Add limit filter (like Liquid)
  eleventyConfig.addFilter("limit", function(array, limit) {
    if (!array || !Array.isArray(array)) return [];
    return array.slice(0, limit);
  });
  
  // Year filter (footer / generic). Honors a passed-in date, defaults to now.
  eleventyConfig.addFilter("date", function(date) {
    const d = date ? new Date(date) : new Date();
    return isNaN(d) ? new Date().getFullYear() : d.getUTCFullYear();
  });

  // Long-form article date, e.g. "April 12, 2026".
  // Uses UTC getters so a "YYYY-MM-DD" frontmatter date never shifts a day
  // due to the local timezone when Eleventy parses it to midnight UTC.
  eleventyConfig.addFilter("articleDate", function(value) {
    const d = (value instanceof Date) ? value : new Date(value);
    if (isNaN(d)) return "";
    const months = ["January","February","March","April","May","June","July",
                    "August","September","October","November","December"];
    return `${months[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
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
