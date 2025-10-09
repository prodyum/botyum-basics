// Description: Registers discovery tools for summaries, system info, maps, dictionaries, and social search.

import { createTodaySummaryGroup } from "./today-summary.js";
import { createSystemInfoGroup } from "./system-info.js";
import { createPackageTrackingGroup } from "./package-tracking.js";
import { createTimezoneConverterGroup } from "./timezone-converter.js";
import { createDictionaryEnTrGroup } from "./dictionary-en-tr.js";
import { createTranslationTrEnGroup } from "./translation-tr-en.js";
import { createMediaSearchGroup } from "./media-search.js";
import { createQuoraSearchGroup } from "./quora-search.js";
import { createRedditSearchGroup } from "./reddit-search.js";
import { createSocialSearchGroup } from "./social-search.js";
import { createQuoteFeedGroup } from "./quote-feed.js";
import { createDataInsightsGroup } from "./data-insights.js";

const MODULE_ID = "insight";
const MODULE_LABEL = "Bilgi ve Arama Merkezi";
const MODULE_DESCRIPTION = "Haritalar, sozlukler ve veri ozeti.";
const MODULE_ORDER = 5;

function buildFeatureGroups(ctx) {
  return [
    createTodaySummaryGroup(ctx),
    createSystemInfoGroup(ctx),
    createPackageTrackingGroup(ctx),
    createTimezoneConverterGroup(ctx),
    createDictionaryEnTrGroup(ctx),
    createTranslationTrEnGroup(ctx),
    createMediaSearchGroup(ctx),
    createQuoraSearchGroup(ctx),
    createRedditSearchGroup(ctx),
    createSocialSearchGroup(ctx),
    createQuoteFeedGroup(ctx),
    createDataInsightsGroup(ctx),
  ].filter(Boolean);
}

export function registerInsightSearch(ctx) {
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
    return registerInsightSearch(ctx);
  },
};

export default plugin;
