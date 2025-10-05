// Description: Registers camera capture, OCR, and screenshot helpers.

import { createCameraPhotoGroup } from "./camera-photo.js";
import { createCameraVideoGroup } from "./camera-video.js";
import { createScreenshotGroup } from "./screenshot.js";
import { createOcrGroup } from "./ocr.js";

const MODULE_ID = "vision";
const MODULE_LABEL = "Goruntu ve OCR";
const MODULE_DESCRIPTION = "Kamera, ekran goruntusu ve OCR araclari.";
const MODULE_ORDER = 7;

function buildFeatureGroups(ctx) {
  return [
    createCameraPhotoGroup(ctx),
    createCameraVideoGroup(ctx),
    createScreenshotGroup(ctx),
    createOcrGroup(ctx),
  ].filter(Boolean);
}

export function registerVisionSuite(ctx) {
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
    return registerVisionSuite(ctx);
  },
};

export default plugin;
