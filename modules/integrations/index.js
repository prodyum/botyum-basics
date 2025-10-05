// Description: Registers messaging and collaboration integrations such as Slack, Telegram, and issue trackers.

import { createSlackGroup } from "./slack.js";
import { createTelegramGroup } from "./telegram.js";
import { createIssuesGroup } from "./issues.js";
import { createQuickTextGroup } from "./quick-text.js";
import { createUserProfileGroup } from "./user-profile.js";

const MODULE_ID = "integrations";
const MODULE_LABEL = "Entegrasyonlar";
const MODULE_DESCRIPTION = "Mesajlasma ve isbirligi baglantilari.";
const MODULE_ORDER = 9;

function buildFeatureGroups(ctx) {
  return [
    createSlackGroup(ctx),
    createTelegramGroup(ctx),
    createIssuesGroup(ctx),
    createQuickTextGroup(ctx),
    createUserProfileGroup(ctx),
  ].filter(Boolean);
}

export function registerIntegrationsSuite(ctx) {
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
    return registerIntegrationsSuite(ctx);
  },
};

export default plugin;
