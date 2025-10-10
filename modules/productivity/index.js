// Description: Registers productivity helpers for calendar, feeds, content, and workflow utilities.

import { createCalendarImportGroup } from "./calendar-import.js";
import { createCalendarGroup } from "./calendar.js";
import { createNaturalRemindersGroup } from "./natural-reminders.js";
import { createEmailDigestGroup } from "./email-digest.js";
import { createRssNewsGroup } from "./rss-news.js";
import { createPriceWatchGroup } from "./price-watch.js";
import { createContentSummarizerGroup } from "./content-summarizer.js";
import { createPdfNarratorGroup } from "./pdf-narrator.js";
import { createExpensesGroup } from "./expenses.js";
import { createClipboardGroup } from "./clipboard.js";
import { createTemplatesGroup } from "./templates.js";
import { createMediaLauncherGroup } from "./media-launcher.js";
// Placeholder konfor kısayolları kaldırıldı
import { createGoogleCalendarGroup } from "./google-calendar.js";

const MODULE_ID = "productivity";
const MODULE_LABEL = "Planlama ve Verimlilik";
const MODULE_DESCRIPTION = "Takvim, hatirlatma ve icerik isleme.";
const MODULE_ORDER = 4;

function buildFeatureGroups(ctx) {
  return [
    createCalendarImportGroup(ctx),
    createCalendarGroup(ctx),
    createGoogleCalendarGroup(ctx),
    createNaturalRemindersGroup(ctx),
    createEmailDigestGroup(ctx),
    createRssNewsGroup(ctx),
    createPriceWatchGroup(ctx),
    createContentSummarizerGroup(ctx),
    createPdfNarratorGroup(ctx),
    createExpensesGroup(ctx),
    createClipboardGroup(ctx),
    createTemplatesGroup(ctx),
    createMediaLauncherGroup(ctx),
  ].filter(Boolean);
}

export function registerProductivitySuite(ctx) {
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
    return registerProductivitySuite(ctx);
  },
};

export default plugin;
