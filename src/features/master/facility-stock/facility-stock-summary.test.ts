import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildFacilityStockSummary,
  type FacilityStockSummaryRow,
} from "@/features/master/facility-stock/facility-stock-summary.js";

const varietyCreatedAt = new Date("2025-01-01T00:00:00.000Z");
const varietyUpdatedAt = new Date("2025-01-02T00:00:00.000Z");
const alphaCreatedAt = new Date("2025-04-01T00:00:00.000Z");
const alphaUpdatedAt = new Date("2025-04-02T00:00:00.000Z");
const sizeCreatedAt = new Date("2025-03-01T00:00:00.000Z");
const sizeUpdatedAt = new Date("2025-03-02T00:00:00.000Z");
const largeCreatedAt = new Date("2025-05-01T00:00:00.000Z");
const largeUpdatedAt = new Date("2025-05-02T00:00:00.000Z");
const g1CreatedAt = new Date("2026-01-01T00:00:00.000Z");
const g1UpdatedAt = new Date("2026-01-02T00:00:00.000Z");
const g2CreatedAt = new Date("2026-02-01T00:00:00.000Z");
const g2UpdatedAt = new Date("2026-02-02T00:00:00.000Z");

function row(
  input: Partial<FacilityStockSummaryRow> &
    Pick<FacilityStockSummaryRow, "initialQuantity" | "currentQuantity">,
): FacilityStockSummaryRow {
  return {
    varietyId: "variety-b",
    varietyName: "Beta",
    varietyCreatedAt,
    varietyUpdatedAt,
    sizeId: "size-s",
    sizeName: "Small",
    sizeVarietyId: "variety-b",
    seedBagsPerAcre: 8,
    sizeCreatedAt,
    sizeUpdatedAt,
    generationId: "generation-2",
    generationName: "G2",
    generationCreatedAt: g2CreatedAt,
    generationUpdatedAt: g2UpdatedAt,
    ...input,
  };
}

describe("buildFacilityStockSummary", () => {
  it("returns an empty list when there is no stock", () => {
    assert.deepEqual(buildFacilityStockSummary([]), []);
  });

  it("sums the same variety, size, and generation across facilities", () => {
    const summary = buildFacilityStockSummary([
      row({
        varietyId: "variety-a",
        varietyName: "Alpha",
        varietyCreatedAt: alphaCreatedAt,
        varietyUpdatedAt: alphaUpdatedAt,
        sizeId: "size-l",
        sizeName: "Large",
        sizeVarietyId: "variety-a",
        seedBagsPerAcre: 10,
        sizeCreatedAt: largeCreatedAt,
        sizeUpdatedAt: largeUpdatedAt,
        generationId: "generation-1",
        generationName: "G1",
        generationCreatedAt: g1CreatedAt,
        generationUpdatedAt: g1UpdatedAt,
        initialQuantity: 100,
        currentQuantity: 80,
      }),
      row({
        varietyId: "variety-a",
        varietyName: "Alpha",
        varietyCreatedAt: alphaCreatedAt,
        varietyUpdatedAt: alphaUpdatedAt,
        sizeId: "size-l",
        sizeName: "Large",
        sizeVarietyId: "variety-a",
        seedBagsPerAcre: 10,
        sizeCreatedAt: largeCreatedAt,
        sizeUpdatedAt: largeUpdatedAt,
        generationId: "generation-1",
        generationName: "G1",
        generationCreatedAt: g1CreatedAt,
        generationUpdatedAt: g1UpdatedAt,
        initialQuantity: 50,
        currentQuantity: 20,
      }),
    ]);

    assert.deepEqual(summary, [
      {
        variety: {
          id: "variety-a",
          name: "Alpha",
          createdAt: alphaCreatedAt,
          updatedAt: alphaUpdatedAt,
        },
        initialQuantity: 150,
        currentQuantity: 100,
        sizes: [
          {
            size: {
              id: "size-l",
              name: "Large",
              varietyId: "variety-a",
              seedBagsPerAcre: 10,
              createdAt: largeCreatedAt,
              updatedAt: largeUpdatedAt,
            },
            initialQuantity: 150,
            currentQuantity: 100,
            generations: [
              {
                generation: {
                  id: "generation-1",
                  name: "G1",
                  createdAt: g1CreatedAt,
                  updatedAt: g1UpdatedAt,
                },
                initialQuantity: 150,
                currentQuantity: 100,
              },
            ],
          },
        ],
      },
    ]);
  });

  it("keeps different generations separate and rolls totals up", () => {
    const summary = buildFacilityStockSummary([
      row({
        varietyId: "variety-a",
        varietyName: "Alpha",
        sizeId: "size-l",
        sizeName: "Large",
        generationId: "generation-2",
        generationName: "G2",
        generationCreatedAt: g2CreatedAt,
        generationUpdatedAt: g2UpdatedAt,
        initialQuantity: 10,
        currentQuantity: 5,
      }),
      row({
        varietyId: "variety-a",
        varietyName: "Alpha",
        sizeId: "size-l",
        sizeName: "Large",
        generationId: "generation-1",
        generationName: "G1",
        generationCreatedAt: g1CreatedAt,
        generationUpdatedAt: g1UpdatedAt,
        initialQuantity: 40,
        currentQuantity: 30,
      }),
    ]);

    assert.equal(summary.length, 1);
    assert.equal(summary[0]?.initialQuantity, 50);
    assert.equal(summary[0]?.currentQuantity, 35);
    assert.deepEqual(
      summary[0]?.sizes[0]?.generations.map((generation) => generation.generation.name),
      ["G1", "G2"],
    );
    assert.equal(summary[0]?.sizes[0]?.initialQuantity, 50);
    assert.equal(summary[0]?.sizes[0]?.currentQuantity, 35);
  });

  it("sorts varieties, sizes, and generations by name, then id", () => {
    const summary = buildFacilityStockSummary([
      row({ initialQuantity: 1, currentQuantity: 1 }),
      row({
        varietyId: "variety-a",
        varietyName: "Alpha",
        sizeId: "size-l",
        sizeName: "Large",
        generationId: "generation-1",
        generationName: "G1",
        generationCreatedAt: g1CreatedAt,
        generationUpdatedAt: g1UpdatedAt,
        initialQuantity: 2,
        currentQuantity: 2,
      }),
      row({
        varietyId: "variety-a",
        varietyName: "Alpha",
        sizeId: "size-m",
        sizeName: "Medium",
        generationId: "generation-1",
        generationName: "G1",
        generationCreatedAt: g1CreatedAt,
        generationUpdatedAt: g1UpdatedAt,
        initialQuantity: 3,
        currentQuantity: 3,
      }),
      row({
        varietyId: "variety-c",
        varietyName: "Alpha",
        sizeId: "size-l",
        sizeName: "Large",
        generationId: "generation-1",
        generationName: "G1",
        generationCreatedAt: g1CreatedAt,
        generationUpdatedAt: g1UpdatedAt,
        initialQuantity: 4,
        currentQuantity: 4,
      }),
    ]);

    assert.deepEqual(
      summary.map((variety) => variety.variety),
      [
        {
          id: "variety-a",
          name: "Alpha",
          createdAt: varietyCreatedAt,
          updatedAt: varietyUpdatedAt,
        },
        {
          id: "variety-c",
          name: "Alpha",
          createdAt: varietyCreatedAt,
          updatedAt: varietyUpdatedAt,
        },
        { id: "variety-b", name: "Beta", createdAt: varietyCreatedAt, updatedAt: varietyUpdatedAt },
      ],
    );
    assert.deepEqual(
      summary[0]?.sizes.map((size) => size.size.name),
      ["Large", "Medium"],
    );
    assert.deepEqual(
      summary[2]?.sizes[0]?.generations.map((generation) => generation.generation.name),
      ["G2"],
    );
  });
});
