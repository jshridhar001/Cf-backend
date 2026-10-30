import type { FacilityStockSummaryVariety } from "@/features/master/facility-stock/facility-stock.schema.js";

export type FacilityStockSummaryRow = {
  varietyId: string;
  varietyName: string;
  varietyCreatedAt: Date;
  varietyUpdatedAt: Date;
  sizeId: string;
  sizeName: string;
  sizeVarietyId: string | null;
  seedBagsPerAcre: number | null;
  sizeCreatedAt: Date;
  sizeUpdatedAt: Date;
  generationId: string;
  generationName: string;
  generationCreatedAt: Date;
  generationUpdatedAt: Date;
  initialQuantity: number;
  currentQuantity: number;
};

type Named = { id: string; name: string };

type GenerationBucket = Named & {
  createdAt: Date;
  updatedAt: Date;
  initialQuantity: number;
  currentQuantity: number;
};

type SizeBucket = Named & {
  varietyId: string | null;
  seedBagsPerAcre: number | null;
  createdAt: Date;
  updatedAt: Date;
  generations: Map<string, GenerationBucket>;
};

type VarietyBucket = Named & {
  createdAt: Date;
  updatedAt: Date;
  sizes: Map<string, SizeBucket>;
};

function byNameThenId(left: Named, right: Named) {
  const byName = left.name.localeCompare(right.name);
  if (byName !== 0) return byName;
  return left.id.localeCompare(right.id);
}

function sumQuantities(items: { initialQuantity: number; currentQuantity: number }[]) {
  return items.reduce(
    (totals, item) => ({
      initialQuantity: totals.initialQuantity + item.initialQuantity,
      currentQuantity: totals.currentQuantity + item.currentQuantity,
    }),
    { initialQuantity: 0, currentQuantity: 0 },
  );
}

export function buildFacilityStockSummary(
  rows: FacilityStockSummaryRow[],
): FacilityStockSummaryVariety[] {
  const varieties = new Map<string, VarietyBucket>();

  for (const row of rows) {
    let variety = varieties.get(row.varietyId);
    if (!variety) {
      variety = {
        id: row.varietyId,
        name: row.varietyName,
        createdAt: row.varietyCreatedAt,
        updatedAt: row.varietyUpdatedAt,
        sizes: new Map(),
      };
      varieties.set(row.varietyId, variety);
    }

    let size = variety.sizes.get(row.sizeId);
    if (!size) {
      size = {
        id: row.sizeId,
        name: row.sizeName,
        varietyId: row.sizeVarietyId,
        seedBagsPerAcre: row.seedBagsPerAcre,
        createdAt: row.sizeCreatedAt,
        updatedAt: row.sizeUpdatedAt,
        generations: new Map(),
      };
      variety.sizes.set(row.sizeId, size);
    }

    const generation = size.generations.get(row.generationId);
    if (!generation) {
      size.generations.set(row.generationId, {
        id: row.generationId,
        name: row.generationName,
        createdAt: row.generationCreatedAt,
        updatedAt: row.generationUpdatedAt,
        initialQuantity: row.initialQuantity,
        currentQuantity: row.currentQuantity,
      });
      continue;
    }

    generation.initialQuantity += row.initialQuantity;
    generation.currentQuantity += row.currentQuantity;
  }

  return [...varieties.values()]
    .map((variety) => {
      const sizes = [...variety.sizes.values()]
        .map((size) => {
          const generations = [...size.generations.values()]
            .map((generation) => ({
              generation: {
                id: generation.id,
                name: generation.name,
                createdAt: generation.createdAt,
                updatedAt: generation.updatedAt,
              },
              initialQuantity: generation.initialQuantity,
              currentQuantity: generation.currentQuantity,
            }))
            .sort((left, right) => byNameThenId(left.generation, right.generation));
          const totals = sumQuantities(generations);

          return {
            size: {
              id: size.id,
              name: size.name,
              varietyId: size.varietyId,
              seedBagsPerAcre: size.seedBagsPerAcre,
              createdAt: size.createdAt,
              updatedAt: size.updatedAt,
            },
            initialQuantity: totals.initialQuantity,
            currentQuantity: totals.currentQuantity,
            generations,
          };
        })
        .sort((left, right) => byNameThenId(left.size, right.size));
      const totals = sumQuantities(sizes);

      return {
        variety: {
          id: variety.id,
          name: variety.name,
          createdAt: variety.createdAt,
          updatedAt: variety.updatedAt,
        },
        initialQuantity: totals.initialQuantity,
        currentQuantity: totals.currentQuantity,
        sizes,
      };
    })
    .sort((left, right) => byNameThenId(left.variety, right.variety));
}
