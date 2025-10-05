// modules/voice/index.js
// Registers speech-focused helpers (STT/TTS pipelines).

import { createSpeechToolsGroup } from "./speech-tools.js";

const MODULE_ID = "voice";
const MODULE_LABEL = "Ses ve Entegrasyonlar";
const MODULE_DESCRIPTION = "Konusma, dokuman ve entegrasyon destekleri.";
const MODULE_ORDER = 13;

function buildFeatureGroups(ctx) {
  return [createSpeechToolsGroup(ctx)].filter(Boolean);
}

export function registerVoiceIntegrations(ctx) {
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
    return registerVoiceIntegrations(ctx);
  },
};

export default plugin;
