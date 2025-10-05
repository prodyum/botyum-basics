// Description: Aggregates entertainment-focused helper groups.

import { createDiceGamesGroup } from "./dice.js";
import { createCoinFlipGroup } from "./coin-flip.js";
import { createRandomNumberGroup } from "./random-number.js";
import { createRockPaperScissorsGroup } from "./rock-paper-scissors.js";
import { createStopwatchGroup } from "./stopwatch.js";
import { createPodcastSearchGroup } from "./podcast-search.js";
import { createYoutubeSearchGroup } from "./youtube-search.js";
import { createSportsSearchGroup } from "./sports-search.js";
import { createMusicSearchGroup } from "./music-search.js";

const MODULE_ID = "fun";
const MODULE_LABEL = "Eglence Oyunlari";
const MODULE_DESCRIPTION = "Oyunlar ve medya aramalari.";
const MODULE_ORDER = 11;

function buildFeatureGroups(ctx) {
  return [
    createDiceGamesGroup(ctx),
    createCoinFlipGroup(ctx),
    createRandomNumberGroup(ctx),
    createRockPaperScissorsGroup(ctx),
    createStopwatchGroup(ctx),
    createPodcastSearchGroup(ctx),
    createYoutubeSearchGroup(ctx),
    createSportsSearchGroup(ctx),
    createMusicSearchGroup(ctx),
  ].filter(Boolean);
}

export function registerFunArcade(ctx) {
  const featureGroups = buildFeatureGroups(ctx);
  return {
    featureGroups,
    description: MODULE_DESCRIPTION,
  };
}

export const plugin = {
  id: MODULE_ID,
  label: MODULE_LABEL,
  description: MODULE_DESCRIPTION,
  order: MODULE_ORDER,
  async register(ctx) {
    return registerFunArcade(ctx);
  },
};

export default plugin;
