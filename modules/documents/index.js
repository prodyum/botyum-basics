// Description: Registers document browsing, search, and office generation helpers.

import { createDocumentsBrowserGroup } from "./documents-browser.js";
import { createDocumentsSearchGroup } from "./documents-search.js";
import { createOfficeGeneratorGroup } from "./office-generator.js";

const MODULE_ID = "documents";
const MODULE_LABEL = "Dokuman Yardimcilari";
const MODULE_DESCRIPTION = "Dosya tarama, arama ve ofis otomasyonu.";
const MODULE_ORDER = 8;

function buildFeatureGroups(ctx) {
  return [
    createDocumentsBrowserGroup(ctx),
    createDocumentsSearchGroup(ctx),
    createOfficeGeneratorGroup(ctx),
  ].filter(Boolean);
}

export function registerDocumentsSuite(ctx) {
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
    return registerDocumentsSuite(ctx);
  },
};

export default plugin;
