// modules/fun/youtube-search.js
// Search YouTube directly and list video links.

import { URLSearchParams } from "url";

function extractInitialData(html) {
  const marker = "var ytInitialData = ";
  const index = html.indexOf(marker);
  if (index === -1) {
    throw new Error("ytInitialData marker not found");
  }
  const jsonStart = html.indexOf("{", index + marker.length);
  if (jsonStart === -1) {
    throw new Error("ytInitialData JSON start not found");
  }
  let depth = 0;
  let inString = false;
  let escapeNext = false;
  for (let i = jsonStart; i < html.length; i += 1) {
    const char = html[i];
    if (inString) {
      if (escapeNext) {
        escapeNext = false;
      } else if (char === "\\") {
        escapeNext = true;
      } else if (char === "\"") {
        inString = false;
      }
      continue;
    }
    if (char === "\"") {
      inString = true;
      continue;
    }
    if (char === "{") {
      depth += 1;
    } else if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        const jsonText = html.slice(jsonStart, i + 1);
        return JSON.parse(jsonText);
      }
    }
  }
  throw new Error("Failed to parse ytInitialData JSON");
}

function collectVideoResults(initialData, limit = 10) {
  const sections = initialData?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents ?? [];
  const videos = [];
  for (const section of sections) {
    const items = section?.itemSectionRenderer?.contents ?? [];
    for (const item of items) {
      const video = item?.videoRenderer;
      if (!video?.videoId) continue;
      const title = (video.title?.runs ?? []).map((run) => run.text).join(" ").trim();
      if (!title) continue;
      const channel = (video.longBylineText?.runs ?? []).map((run) => run.text).join(" ").trim();
      const description = (video.detailedMetadataSnippets?.[0]?.snippetText?.runs ?? []).map((run) => run.text).join(" ").trim();
      const url = `https://www.youtube.com/watch?v=${video.videoId}`;
      videos.push({ title, channel, description, url });
      if (videos.length >= limit) return videos;
    }
  }
  return videos;
}

export function createYoutubeSearchGroup(ctx) {
  const { inquirer, ok, warn, err, dim, printDivider, curl } = ctx;

  async function searchYoutube() {
    const { term } = await inquirer.prompt([{ type: "input", name: "term", message: "YouTube aramasi" }]);
    if (!term) return;
    try {
      const params = new URLSearchParams({ search_query: term });
      const url = `https://www.youtube.com/results?${params.toString()}`;
      const html = await curl(url, { Accept: "text/html", "Accept-Language": "tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7" }, 20);
      const initialData = extractInitialData(html);
      const results = collectVideoResults(initialData, 10);
      if (!results.length) {
        console.log(warn("Sonuc bulunamadi."));
        return;
      }
      results.forEach((result, index) => {
        const header = `${ok(String(index + 1).padStart(2, "0"))}) ${result.title}`;
        const channel = result.channel ? `   ${dim(result.channel)}` : null;
        console.log(header);
        if (channel) console.log(channel);
        console.log(dim(`   ${decodeURIComponent(result.url)}`));
        if (result.description) {
          console.log(dim(`   ${result.description}`));
        }
      });
      printDivider();
    } catch (error) {
      console.log(err(`YouTube aramasi hatasi: ${error.message}`));
    }
  }

  return {
    id: "youtube-search",
    label: "YouTube aramasi",
    description: "YouTube aramasi yapar ve video baglantilarini listeler.",
    items: [{ id: "youtube-search-run", label: "Video ara", run: searchYoutube }],
  };
}
