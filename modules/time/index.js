// Description: Registers time utilities covering conversions, adjustments, and alarm scheduling.

import { createCurrentTimeGroup } from "./current-time.js";
import { createDayOfWeekGroup } from "./day-of-week.js";
import { createTimeDifferenceGroup } from "./time-difference.js";
import { createTimeAdjustGroup } from "./time-adjust.js";
import { createCountdownGroup } from "./countdown.js";
import { createAlarmGroup } from "./alarm.js";
import { createAlarmInventoryGroup } from "./alarm-inventory.js";

const MODULE_ID = "time";
const MODULE_LABEL = "Zaman Yonetimi";
const MODULE_DESCRIPTION = "Saat, tarih ve alarm planlayicilari.";
const MODULE_ORDER = 2;

function buildFeatureGroups(ctx) {
  return [
    createCurrentTimeGroup(ctx),
    createDayOfWeekGroup(ctx),
    createTimeDifferenceGroup(ctx),
    createTimeAdjustGroup(ctx),
    createCountdownGroup(ctx),
    createAlarmGroup(ctx),
    createAlarmInventoryGroup(ctx),
  ].filter(Boolean);
}

export function registerTimeToolkit(ctx) {
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
    return registerTimeToolkit(ctx);
  },
};

export default plugin;
