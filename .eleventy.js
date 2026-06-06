import path from "node:path";
import fs from "node:fs";
import pluginRss from "@11ty/eleventy-plugin-rss";
import eleventyNavigationPlugin from "@11ty/eleventy-navigation";
import eleventyVitePlugin from "@11ty/eleventy-plugin-vite";
import Image from "@11ty/eleventy-img";
import { DateTime } from "luxon";
import excerpts from "excerpts";

const baseUrl = process.env.BASE_URL || "https://nlvms.de";
const globalSiteData = {
  title: "NLV Modellflug Saarmund e.V.",
  description: "Modellflugverein in Saarmund",
  locale: "de_DE",
  lang: "de-DE",
  baseUrl: baseUrl,
};

export default function (eleventyConfig) {
  /* --- GLOBAL DATA --- */

  eleventyConfig.addGlobalData("site", globalSiteData);

  /* --- PASSTHROUGHS --- */

  eleventyConfig.addPassthroughCopy("src/assets/css");
  eleventyConfig.addPassthroughCopy("src/assets/js");
  eleventyConfig.addPassthroughCopy("src/public/assets/pdf");

  /* --- PLUGINS --- */

  eleventyConfig.addPlugin(pluginRss); // just includes absolute url helper function
  eleventyConfig.addPlugin(eleventyNavigationPlugin);
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

  // Gallery shortcode: turns every image in a directory into an
  // auto-advancing, one-image-at-a-time slideshow.
  //   {% gallery "src/assets/images/posts/20260526" %}        // 4s default
  //   {% gallery "src/assets/images/posts/20260526", 6 %}     // 6s interval
  const galleryImageExtensions = new Set([
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
    ".gif",
    ".avif",
  ]);

  eleventyConfig.addShortcode("gallery", async function (dir, interval = 4) {
    const absDir = path.resolve(dir);
    let entries;
    try {
      entries = fs.readdirSync(absDir);
    } catch (err) {
      throw new Error(
        `gallery: cannot read directory "${dir}": ${err.message}`,
      );
    }

    const images = entries
      .filter((file) =>
        galleryImageExtensions.has(path.extname(file).toLowerCase()),
      )
      // numeric-aware sort so e.g. 20260524_1651 sorts chronologically
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

    if (images.length === 0) {
      throw new Error(`gallery: no images found in "${dir}"`);
    }

    const slides = [];
    const dots = [];
    for (let i = 0; i < images.length; i++) {
      const src = path.join(dir, images[i]);
      console.log(`Generating gallery image(s) from:  ${src}`);
      const metadata = await Image(src, {
        widths: [800, 1500],
        formats: ["webp", "jpeg"],
        ...defaultImageOptions,
      });

      const alt = path
        .basename(images[i], path.extname(images[i]))
        .replace(/[-_]+/g, " ");
      const imgHtml = Image.generateHTML(metadata, {
        alt,
        sizes: defaultSizesConfig,
        loading: i === 0 ? "eager" : "lazy",
        decoding: "async",
      });

      const active = i === 0;
      slides.push(
        `<figure class="gallery-slide${active ? " is-active" : ""}" aria-hidden="${active ? "false" : "true"}">${imgHtml}</figure>`,
      );
      dots.push(
        `<button type="button" class="gallery-dot${active ? " is-active" : ""}" aria-label="Bild ${i + 1}"${active ? ' aria-current="true"' : ""}></button>`,
      );
    }

    const ms = Math.round(Number(interval) * 1000) || 4000;
    return `<div class="gallery" data-interval="${ms}">
  <div class="gallery-track">
    ${slides.join("\n    ")}
  </div>
  <button type="button" class="gallery-btn gallery-prev" aria-label="Vorheriges Bild">&lsaquo;</button>
  <button type="button" class="gallery-btn gallery-next" aria-label="N&auml;chstes Bild">&rsaquo;</button>
  <div class="gallery-dots">
    ${dots.join("\n    ")}
  </div>
</div>`;
  });

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

  // Custom Filter for posts
  eleventyConfig.addFilter("filterByTag", function (collection, tag) {
    if (!tag) return collection;
    return collection.filter(function (item) {
      return item.data.tags?.includes(tag);
    });
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
}
