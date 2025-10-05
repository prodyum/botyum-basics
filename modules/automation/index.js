// Description: Registers automation and utility tools such as webhooks, QR codes, timers, and scripts.

import { createWebhookSenderGroup } from "./webhook-sender.js";
import { createIcsEventGroup } from "./ics-event.js";
import { createSunMoonGroup } from "./sun-moon.js";
import { createShoppingListGroup } from "./shopping-list.js";
import { createFlashcardsGroup } from "./flashcards.js";
import { createPomodoroGroup } from "./pomodoro.js";
import { createQrCodeGroup } from "./qr-code.js";
import { createPasswordGeneratorGroup } from "./password-generator.js";
import { createUrlShortenerGroup } from "./url-shortener.js";
import { createFileFinderGroup } from "./file-finder.js";
import { createTipSplitGroup } from "./tip-split.js";
import { createReadabilityGroup } from "./readability.js";

const MODULE_ID = "automation";
const MODULE_LABEL = "Otomasyon ve Arac Kutusu";
const MODULE_DESCRIPTION = "Webhook, listeler ve pratik araclar.";
const MODULE_ORDER = 6;

function buildFeatureGroups(ctx) {
  return [
    createWebhookSenderGroup(ctx),
    createIcsEventGroup(ctx),
    createSunMoonGroup(ctx),
    createShoppingListGroup(ctx),
    createFlashcardsGroup(ctx),
    createPomodoroGroup(ctx),
    createQrCodeGroup(ctx),
    createPasswordGeneratorGroup(ctx),
    createUrlShortenerGroup(ctx),
    createFileFinderGroup(ctx),
    createTipSplitGroup(ctx),
    createReadabilityGroup(ctx),
  ].filter(Boolean);
}

export function registerAutomationKit(ctx) {
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
    return registerAutomationKit(ctx);
  },
};

export default plugin;
