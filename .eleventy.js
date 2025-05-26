const path = require("path");
const pluginRss = require("@11ty/eleventy-plugin-rss"); // needed for absoluteUrl SEO feature
const eleventyNavigationPlugin = require("@11ty/eleventy-navigation");
const Image = require("@11ty/eleventy-img");
const { DateTime } = require("luxon");
const excerpts = require("excerpts");
require("dotenv").config();

const baseUrl = process.env.BASE_URL || "https://nlvms.de";
const globalSiteData = {
  title: "NLV Modellflug Saarmund e.V.",
  description: "Modellflugverein in Saarmund",
  locale: "de_DE",
  lang: "de-DE",
  baseUrl: baseUrl,
};

module.exports = async function (eleventyConfig) {
  /* --- GLOBAL DATA --- */

  eleventyConfig.addGlobalData("site", globalSiteData);

  /* --- PASSTHROUGHS --- */

  eleventyConfig.addPassthroughCopy("src/assets/css");
  eleventyConfig.addPassthroughCopy("src/assets/js");
  eleventyConfig.addPassthroughCopy("src/public/assets/pdf");

  /* --- PLUGINS --- */

  eleventyConfig.addPlugin(pluginRss); // just includes absolute url helper function
  eleventyConfig.addPlugin(eleventyNavigationPlugin);

  const eleventyVitePlugin = (await import("@11ty/eleventy-plugin-vite")).default;
  eleventyConfig.addPlugin(eleventyVitePlugin);

  /* --- SHORTCODES --- */

  // Image shortcode config
  const defaultImageOptions = {
    urlPath: "/images/",
    outputDir: "./_site/images/",
    filenameFormat: function (_id, src, width, format, _options) {
      const extension = path.extname(src);
      const name = path.basename(src, extension);
      return `${name}-${width}w.${format}`;
    },
  };

  // Image shortcode config
  let defaultSizesConfig = "(min-width: 1200px) 1400px, 100vw"; // above 1200px use a 1400px image at least, below just use 100vw sized image
  eleventyConfig.addShortcode(
    "image",
    async function (src, alt, options, sizes = defaultSizesConfig) {
      console.log(`Generating image(s) from:  ${src}`);
      let metadata = await Image(src, {
        widths: [800, 1500],
        formats: ["webp", "jpeg"],
        ...defaultImageOptions,
      });

      let imageAttributes = {
        alt,
        sizes,
        loading: "lazy",
        decoding: "async",
        ...options,
      };

      return Image.generateHTML(metadata, imageAttributes);
    },
  );

  eleventyConfig.addShortcode("miniature", async function (src) {
    console.log(`Generating miniature(s) from:  ${src}`);
    let metadata = await Image(src, {
      widths: [400],
      formats: ["webp"],
      ...defaultImageOptions,
    });

    let data = metadata.webp[0];
    return data.url;
  });

  // Output year for copyright notices
  eleventyConfig.addShortcode("year", () => `${new Date().getFullYear()}`);

  // Excerpt
  eleventyConfig.addShortcode("excerpt", function (article) {
    const content = article.templateContent;
    return excerpts(content, { words: 25 });
  });

  /* --- COLECTIONS --- */

  eleventyConfig.addCollection("posts", function (collection) {
    return collection.getFilteredByGlob("./src/posts/*.md").reverse();
  });

  /* --- FILTERS --- */

  eleventyConfig.addFilter("readableDate", (dateObj, format, zone) => {
    // Formatting tokens for Luxon: https://moment.github.io/luxon/#/formatting?id=table-of-tokens
    return DateTime.fromJSDate(dateObj, { zone: zone || "utc" }).toFormat(
      format || "dd LLLL yyyy",
    );
  });

  eleventyConfig.addFilter("htmlDateString", (dateObj) => {
    // dateObj input: https://html.spec.whatwg.org/multipage/common-microsyntaxes.html#valid-date-string
    return DateTime.fromJSDate(dateObj, { zone: "utc" }).toFormat("yyyy-LL-dd");
  });

  // Custom Random Helper Filter (useful for ID attributes)
  eleventyConfig.addFilter("generateRandomIdString", function (prefix) {
    return prefix + "-" + Math.floor(Math.random() * 1000000);
  });

  /* --- BASE CONFIG --- */

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "includes", // this path is releative to input-path (src/)
      layouts: "layouts", // this path is releative to input-path (src/)
      data: "data", // this path is releative to input-path (src/)
    },
    templateFormats: ["njk", "md"],
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
  };
};
