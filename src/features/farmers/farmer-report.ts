import type { FarmerSeedReportRow } from "@/features/farmers/farmer.schema.js";
import {
  acresFromBags,
  formatDecimal,
  getRemainingAcres,
  parseDecimal,
  roundBags,
  sumAcresFromBagLines,
} from "@/features/seed-dispatch/quantity.js";

export type FarmerReportRequisitionInput = {
  requisitionId: string;
  status: FarmerSeedReportRow["status"];
  requisitionDate: Date | null;
  contractDate: Date;
  farmer: FarmerSeedReportRow["farmer"];
  variety: FarmerSeedReportRow["variety"];
  expectedSize: FarmerSeedReportRow["expectedSize"];
  requestedBags: number | null;
  requestedAcres: string | null;
};

export type FarmerReportSizeInput = {
  sizeId: string;
  sizeName: string;
  seedBagsPerAcre: number | null;
  bags: number;
};

type CollapsedSize = {
  sizeId: string;
  sizeName: string;
  seedBagsPerAcre: number | null;
  bags: number;
};

function positiveIntegerRate(value: number | null): number | null {
  if (value == null || !Number.isInteger(value) || value <= 0) return null;
  return value;
}

function collapseDispatchedSizes(sizes: FarmerReportSizeInput[]): CollapsedSize[] {
  const grouped = new Map<string, CollapsedSize>();

  for (const size of sizes) {
    const existing = grouped.get(size.sizeId);
    if (!existing) {
      grouped.set(size.sizeId, {
        sizeId: size.sizeId,
        sizeName: size.sizeName,
        seedBagsPerAcre: size.seedBagsPerAcre,
        bags: size.bags,
      });
      continue;
    }

    existing.bags += size.bags;
    if (existing.seedBagsPerAcre !== size.seedBagsPerAcre) {
      existing.seedBagsPerAcre = null;
    }
  }

  return [...grouped.values()].sort((left, right) => {
    const byName = left.sizeName.localeCompare(right.sizeName);
    if (byName !== 0) return byName;
    return left.sizeId.localeCompare(right.sizeId);
  });
}

export function buildFarmerSeedReportRow(
  requisition: FarmerReportRequisitionInput,
  sizes: FarmerReportSizeInput[],
): FarmerSeedReportRow {
  const quantityUnit = requisition.requestedBags != null ? "BAGS" : "ACRES";
  const forecastRate = positiveIntegerRate(requisition.expectedSize?.seedBagsPerAcre ?? null);
  const collapsed = collapseDispatchedSizes(sizes);
  const dispatchedSizes = collapsed.map((size) => {
    const rate = positiveIntegerRate(size.seedBagsPerAcre);
    return {
      sizeId: size.sizeId,
      sizeName: size.sizeName,
      seedBagsPerAcre: size.seedBagsPerAcre,
      bags: size.bags,
      acres: rate == null ? null : formatDecimal(acresFromBags(size.bags, rate)),
    };
  });
  const dispatchedBags = dispatchedSizes.reduce((sum, size) => sum + size.bags, 0);
  const acresKnown = dispatchedSizes.every((size) => size.acres != null);
  const dispatchedAcres =
    dispatchedSizes.length === 0
      ? "0"
      : acresKnown
        ? formatDecimal(
            sumAcresFromBagLines(
              collapsed.map((size) => ({
                quantity: size.bags,
                bagsPerAcre: positiveIntegerRate(size.seedBagsPerAcre) ?? 0,
              })),
            ),
          )
        : null;

  const requestedBags =
    quantityUnit === "BAGS"
      ? requisition.requestedBags
      : forecastRate == null || requisition.requestedAcres == null
        ? null
        : roundBags(parseDecimal(requisition.requestedAcres) * forecastRate);
  const requestedAcres =
    quantityUnit === "ACRES"
      ? requisition.requestedAcres
      : forecastRate == null || requisition.requestedBags == null
        ? null
        : formatDecimal(acresFromBags(requisition.requestedBags, forecastRate));

  let remainingBags: number | null = null;
  let remainingAcres: string | null = null;

  if (quantityUnit === "BAGS") {
    remainingBags = Math.max(0, (requisition.requestedBags ?? 0) - dispatchedBags);
    if (dispatchedAcres != null && forecastRate != null) {
      remainingAcres = formatDecimal(acresFromBags(remainingBags, forecastRate));
    }
  } else if (dispatchedAcres != null) {
    const remaining = getRemainingAcres({
      acres: requisition.requestedAcres,
      seedBagsInitialQuantity: null,
      fulfilledQuantity: "0",
      fulfilledAcres: dispatchedAcres,
    });
    remainingAcres = formatDecimal(remaining);
    if (forecastRate != null) {
      remainingBags = roundBags(remaining * forecastRate);
    }
  }

  return {
    requisitionId: requisition.requisitionId,
    status: requisition.status,
    requisitionDate: requisition.requisitionDate,
    contractDate: requisition.contractDate,
    farmer: requisition.farmer,
    variety: requisition.variety,
    quantityUnit,
    expectedSize: requisition.expectedSize,
    requestedBags,
    requestedAcres,
    dispatchedBags,
    dispatchedAcres,
    remainingBags,
    remainingAcres,
    dispatchedSizes,
  };
}
