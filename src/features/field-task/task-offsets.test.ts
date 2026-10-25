import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { shiftActivityWindow } from "@/features/field-task/task-offsets.js";

describe("shiftActivityWindow", () => {
  it("shifts the whole plantation window by an independent offset", () => {
    assert.deepEqual(shiftActivityWindow("2026-11-03", "2026-11-05", 4), {
      startDate: "2026-11-07",
      endDate: "2026-11-09",
      dueDate: "2026-11-09",
    });
    assert.deepEqual(shiftActivityWindow("2026-11-03", "2026-11-05", 8), {
      startDate: "2026-11-11",
      endDate: "2026-11-13",
      dueDate: "2026-11-13",
    });
  });

  it("uses a one-day window when the plantation has no end date", () => {
    assert.deepEqual(shiftActivityWindow("2026-11-03", null, 4), {
      startDate: "2026-11-07",
      endDate: "2026-11-07",
      dueDate: "2026-11-07",
    });
  });
});
