// Description: Registers core helpers like calculations, web browsing, search, and quick links.

import { createCalculationsGroup } from "./calculations.js";
import { createOpenLinkGroup } from "./web/open-link.js";
import { createFetchContentGroup } from "./web/fetch-content.js";
import { createGoogleSearchGroup } from "./web/google-search.js";
import { createWikiQaGroup } from "./web/wiki-qa.js";
import { createQuickLinksGroup } from "./web/quick-links.js";
import { createPhoneLinksGroup } from "./phone-links.js";

const MODULE_ID = "core";
const MODULE_LABEL = "Gundelik Yardimcilar";
const MODULE_DESCRIPTION = "Zaman, ceviri ve bilgi araclari.";
const MODULE_ORDER = 1;

function buildFeatureGroups(ctx) {
  return [
    createCalculationsGroup(ctx),
    createOpenLinkGroup(ctx),
    createFetchContentGroup(ctx),
    createGoogleSearchGroup(ctx),
    createWikiQaGroup(ctx),
    createQuickLinksGroup(ctx),
    createPhoneLinksGroup(ctx),
  ].filter(Boolean);
}

export function registerCoreAssistant(ctx) {
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
    return registerCoreAssistant(ctx);
  },
};

export default plugin;
