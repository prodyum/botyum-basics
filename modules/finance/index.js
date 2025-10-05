// Description: Aggregates finance helper groups.

import { createPercentageCalculatorGroup } from "./percentage.js";
import { createForexConverterGroup } from "./forex-converter.js";

const MODULE_ID = "finance";
const MODULE_LABEL = "Finans Araclari";
const MODULE_DESCRIPTION = "Kur donusumleri ve yuzde hesaplari.";
const MODULE_ORDER = 12;

function buildFeatureGroups(ctx) {
  return [
    createPercentageCalculatorGroup(ctx),
    createForexConverterGroup(ctx),
  ].filter(Boolean);
}

export function registerFinanceSuite(ctx) {
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
    return registerFinanceSuite(ctx);
  },
};

export default plugin;
