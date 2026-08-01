/** Quantity helpers for bag- vs acres-based requisitions. */

export type BagLineWithStandard = {
  quantity: number;
  bagsPerAcre: number;
};

export type QuantityRequisition = {
  acres: string | null;
  seedBagsInitialQuantity: string | null;
  fulfilledQuantity: string;
  fulfilledAcres: string;
};

const ACRES_TOLERANCE = 0.05;

/**
 * Half-up whole bags can slightly overshoot remaining acres.
 * Allow that overshoot (remaining floors at 0) — do not treat as an error.
 */
const BAG_ROUNDING_ACRES_OVERSHOOT = 0.5;

export function isAcresBasedRequisition(requisition: {
  acres: string | null;
  seedBagsInitialQuantity?: string | null;
}): boolean {
  return Boolean(requisition.acres && Number.parseFloat(requisition.acres) > 0);
}

export function parseDecimal(value: string | number | null | undefined): number {
  if (value == null || value === "") return 0;
  const parsed = typeof value === "number" ? value : Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function formatDecimal(value: number): string {
  return String(round2(value));
}

/** Whole bags only; half-up (.5+ rounds up). */
export function roundBags(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.round(value);
}

export function getRemainingBags(requisition: QuantityRequisition): number {
  const initial = parseDecimal(requisition.seedBagsInitialQuantity);
  const fulfilled = parseDecimal(requisition.fulfilledQuantity);
  return Math.max(0, roundBags(initial - fulfilled));
}

export function getRemainingAcres(requisition: QuantityRequisition): number {
  const initial = parseDecimal(requisition.acres);
  const fulfilled = parseDecimal(requisition.fulfilledAcres);
  return Math.max(0, round2(initial - fulfilled));
}

export function acresFromBags(quantity: number, bagsPerAcre: number): number {
  if (bagsPerAcre <= 0) return 0;
  return round2(quantity / bagsPerAcre);
}

export function sumAcresFromBagLines(lines: BagLineWithStandard[]): number {
  return round2(
    lines.reduce((sum, line) => sum + acresFromBags(line.quantity, line.bagsPerAcre), 0),
  );
}

export function getAcresConsumedByOtherLines(lines: BagLineWithStandard[]): number {
  return sumAcresFromBagLines(lines);
}

export function getAvailableAcresForLine(remainingAcres: number, otherAcres: number): number {
  return Math.max(0, round2(remainingAcres - otherAcres));
}

export function getMaxBagsForAvailableAcres(availableAcres: number, bagsPerAcre: number): number {
  if (bagsPerAcre <= 0 || availableAcres <= 0) return 0;
  return roundBags(availableAcres * bagsPerAcre);
}

export function isAcresDispatchWithinTolerance(
  consumedAcres: number,
  remainingAcres: number,
): boolean {
  if (consumedAcres <= remainingAcres + ACRES_TOLERANCE) return true;
  const overshoot = round2(consumedAcres - remainingAcres);
  return overshoot > 0 && overshoot <= BAG_ROUNDING_ACRES_OVERSHOOT;
}

/** Remaining acres after consume — never negative. */
export function remainingAcresAfterConsume(remainingAcres: number, consumedAcres: number): number {
  return Math.max(0, round2(remainingAcres - consumedAcres));
}

/**
 * Assert acres-based size lines stay within half-up max bags per line.
 * Slight acre overshoot from rounding is allowed (remaining floors at 0).
 */
export function assertAcresLinesWithinMaxBags(
  lines: BagLineWithStandard[],
  remainingAcres: number,
): void {
  const bagLines: BagLineWithStandard[] = [];

  for (const line of lines) {
    if (line.bagsPerAcre <= 0) {
      throw new Error("Acres-based dispatches require a bags-per-acre standard on each size.");
    }

    const otherAcres = getAcresConsumedByOtherLines(bagLines);
    const availableAcres = getAvailableAcresForLine(remainingAcres, otherAcres);
    const maxBags = getMaxBagsForAvailableAcres(availableAcres, line.bagsPerAcre);

    if (line.quantity > maxBags) {
      throw new Error("Dispatch quantity exceeds remaining acres for a selected requisition.");
    }

    bagLines.push(line);
  }

  const consumedAcres = sumAcresFromBagLines(bagLines);
  if (!isAcresDispatchWithinTolerance(consumedAcres, remainingAcres)) {
    throw new Error("Dispatch quantity exceeds remaining acres for a selected requisition.");
  }
}
