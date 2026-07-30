const axios = require("axios");
const cheerio = require("cheerio");

const MAX_PAGES = 10;
const TIMEOUT_MS = 8000;

function cleanText($) {
  $("script, style, nav, footer, noscript").remove();
  return $("body").text().replace(/\s+/g, " ").trim();
}

function getInternalLinks($, baseUrl) {
  const base = new URL(baseUrl);
  const links = new Set();

  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    try {
      const resolved = new URL(href, baseUrl);
      if (resolved.hostname === base.hostname && !resolved.href.includes("#")) {
        links.add(resolved.href.split("?")[0]);
      }
    } catch (e) {
      // ignore invalid URLs
    }
  });

  return Array.from(links);
}

async function scrapeWebsite(startUrl) {
  const visited = new Set();
  const toVisit = [startUrl];
  const pageTexts = [];

  while (toVisit.length > 0 && visited.size < MAX_PAGES) {
    const url = toVisit.shift();
    if (visited.has(url)) continue;
    visited.add(url);

    try {
      const response = await axios.get(url, {
        timeout: TIMEOUT_MS,
        headers: { "User-Agent": "ChatCoreBot/1.0" },
      });
      const $ = cheerio.load(response.data);

      const text = cleanText($);
      if (text) {
        pageTexts.push(`--- Page: ${url} ---\n${text}`);
      }

      if (visited.size === 1) {
        // Only discover more links from the first (homepage) page
        const links = getInternalLinks($, url);
        for (const link of links) {
          if (!visited.has(link) && toVisit.length + visited.size < MAX_PAGES) {
            toVisit.push(link);
          }
        }
      }
    } catch (err) {
      // Skip pages that fail to load, don't crash the whole import
      continue;
    }
  }

  if (pageTexts.length === 0) {
    throw new Error("Could not extract any content from this website.");
  }

  return pageTexts.join("\n\n");
}

module.exports = { scrapeWebsite };
