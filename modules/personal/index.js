// Description: Registers personal assistant tools such as notes, todos, translation, weather, TTS, and settings.

import { createNotesGroup } from "./notes.js";
import { createTodosGroup } from "./todos.js";
import { createTranslationGroup } from "./translation.js";
import { createSynonymsGroup } from "./synonyms.js";
import { createWeatherGroup } from "./weather.js";
import { createTextToSpeechGroup } from "./text-to-speech.js";
import { createPersonalSettingsGroup } from "./settings.js";

const MODULE_ID = "personal";
const MODULE_LABEL = "Kisisel Araclar";
const MODULE_DESCRIPTION = "Notlar, ceviri ve diger kisisel araclar.";
const MODULE_ORDER = 3;

function buildFeatureGroups(ctx) {
  return [
    createNotesGroup(ctx),
    createTodosGroup(ctx),
    createTranslationGroup(ctx),
    createSynonymsGroup(ctx),
    createWeatherGroup(ctx),
    createTextToSpeechGroup(ctx),
    createPersonalSettingsGroup(ctx),
  ].filter(Boolean);
}

export function registerPersonalToolkit(ctx) {
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
    return registerPersonalToolkit(ctx);
  },
};

export default plugin;
