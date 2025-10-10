// Description: Registers monitoring helpers such as page change detection and traffic shortcuts.

import { createPageWatchGroup } from "./page-watch.js";
import { createTrafficLinksGroup } from "./traffic-links.js";
import { createTestSummaryGroup } from "./test-summary.js";

const MODULE_ID = "monitoring";
const MODULE_LABEL = "Izleme ve Bildirimler";
const MODULE_DESCRIPTION = "Web izleme ve sistem sagligi kontrolleri.";
const MODULE_ORDER = 10;

function buildFeatureGroups(ctx) {
  return [
    createPageWatchGroup(ctx),
    createTrafficLinksGroup(ctx),
    createTestSummaryGroup(ctx),
  ].filter(Boolean);
}

export function registerMonitoringSuite(ctx) {
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
    return registerMonitoringSuite(ctx);
  },
};

export default plugin;
