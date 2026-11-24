import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildFarmerSeedReportRow,
  type FarmerReportRequisitionInput,
  type FarmerReportSizeInput,
} from "@/features/farmers/farmer-report.js";

const contractDate = new Date("2026-01-15T00:00:00.000Z");
const requisitionDate = new Date("2026-01-10T00:00:00.000Z");

const forecastSize = {
  id: "size-forecast",
  name: "Forecast",
  seedBagsPerAcre: 8,
};

function farmer(id: string, name: string, family: { id: string; name: string } | null = null) {
  return {
    id,
    name,
    accountNumber: `${id}-account`,
    station: { id: "station-1", name: "Station A" },
    family,
  };
}

function requisition(
  input: Pick<FarmerReportRequisitionInput, "requisitionId" | "requestedBags" | "requestedAcres"> &
    Partial<Pick<FarmerReportRequisitionInput, "status" | "farmer" | "variety" | "expectedSize">>,
): FarmerReportRequisitionInput {
  return {
    requisitionId: input.requisitionId,
    status: input.status ?? "APPROVED",
    requisitionDate,
    contractDate,
    farmer: input.farmer ?? farmer("farmer-1", "Aman"),
    variety: input.variety ?? { id: "variety-1", name: "Kufri" },
    expectedSize: input.expectedSize === undefined ? forecastSize : input.expectedSize,
    requestedBags: input.requestedBags,
    requestedAcres: input.requestedAcres,
  };
}

function size(
  sizeId: string,
  sizeName: string,
  bags: number,
  seedBagsPerAcre: number | null,
): FarmerReportSizeInput {
  return { sizeId, sizeName, bags, seedBagsPerAcre };
}

describe("buildFarmerSeedReportRow", () => {
  it("returns the full request when nothing has been dispatched", () => {
    const row = buildFarmerSeedReportRow(
      requisition({
        requisitionId: "req-1",
        requestedBags: 100,
        requestedAcres: null,
      }),
      [],
    );

    assert.equal(row.quantityUnit, "BAGS");
    assert.equal(row.requestedBags, 100);
    assert.equal(row.requestedAcres, "12.5");
    assert.equal(row.dispatchedBags, 0);
    assert.equal(row.dispatchedAcres, "0");
    assert.equal(row.remainingBags, 100);
    assert.equal(row.remainingAcres, "12.5");
    assert.deepEqual(row.dispatchedSizes, []);
  });

  it("keeps a partial bag dispatch in bags and converts acres with the expected size", () => {
    const row = buildFarmerSeedReportRow(
      requisition({
        requisitionId: "req-1",
        requestedBags: 100,
        requestedAcres: null,
      }),
      [size("size-a", "Large", 40, 10)],
    );

    assert.equal(row.dispatchedBags, 40);
    assert.equal(row.dispatchedAcres, "4");
    assert.equal(row.remainingBags, 60);
    assert.equal(row.remainingAcres, "7.5");
    assert.equal(row.requestedBags, 100);
    assert.deepEqual(row.dispatchedSizes, [
      {
        sizeId: "size-a",
        sizeName: "Large",
        seedBagsPerAcre: 10,
        bags: 40,
        acres: "4",
      },
    ]);
  });

  it("collapses several dispatches of the same size into one bag total", () => {
    const row = buildFarmerSeedReportRow(
      requisition({
        requisitionId: "req-1",
        requestedBags: 100,
        requestedAcres: null,
      }),
      [size("size-a", "Large", 15, 10), size("size-a", "Large", 25, 10)],
    );

    assert.equal(row.dispatchedSizes.length, 1);
    assert.equal(row.dispatchedSizes[0]?.bags, 40);
    assert.equal(row.dispatchedBags, 40);
    assert.equal(row.dispatchedAcres, "4");
    assert.equal(row.requestedBags, 100);
  });

  it("sums acres from each dispatched size and leaves the request unchanged", () => {
    const row = buildFarmerSeedReportRow(
      requisition({
        requisitionId: "req-1",
        requestedBags: null,
        requestedAcres: "10.00",
      }),
      [size("size-b", "Small", 15, 5), size("size-a", "Large", 20, 10)],
    );

    assert.equal(row.quantityUnit, "ACRES");
    assert.equal(row.requestedAcres, "10.00");
    assert.equal(row.requestedBags, 80);
    assert.equal(row.dispatchedBags, 35);
    assert.equal(row.dispatchedAcres, "5");
    assert.equal(row.remainingAcres, "5");
    assert.equal(row.remainingBags, 40);
    assert.deepEqual(
      row.dispatchedSizes.map((line) => line.sizeName),
      ["Large", "Small"],
    );
    assert.deepEqual(
      row.dispatchedSizes.map((line) => line.acres),
      ["2", "3"],
    );
  });

  it("keeps two requisitions for the same farmer and variety separate", () => {
    const shared = {
      farmer: farmer("farmer-1", "Aman", { id: "family-1", name: "Aman Family" }),
      variety: { id: "variety-1", name: "Kufri" },
    };
    const first = buildFarmerSeedReportRow(
      requisition({
        requisitionId: "req-1",
        requestedBags: 40,
        requestedAcres: null,
        ...shared,
      }),
      [size("size-a", "Large", 10, 8)],
    );
    const second = buildFarmerSeedReportRow(
      requisition({
        requisitionId: "req-2",
        requestedBags: null,
        requestedAcres: "6.00",
        ...shared,
      }),
      [size("size-b", "Small", 10, 5)],
    );

    assert.equal(first.requestedBags, 40);
    assert.equal(first.dispatchedBags, 10);
    assert.equal(second.requestedAcres, "6.00");
    assert.equal(second.dispatchedBags, 10);
    assert.notEqual(first.requisitionId, second.requisitionId);
  });

  it("keeps the same variety on two farmers as two rows", () => {
    const variety = { id: "variety-1", name: "Kufri" };
    const first = buildFarmerSeedReportRow(
      requisition({
        requisitionId: "req-1",
        requestedBags: 20,
        requestedAcres: null,
        farmer: farmer("farmer-1", "Aman"),
        variety,
      }),
      [size("size-a", "Large", 5, 10)],
    );
    const second = buildFarmerSeedReportRow(
      requisition({
        requisitionId: "req-2",
        requestedBags: 30,
        requestedAcres: null,
        farmer: farmer("farmer-2", "Beena"),
        variety,
      }),
      [size("size-a", "Large", 30, 10)],
    );

    assert.equal(first.farmer.id, "farmer-1");
    assert.equal(first.remainingBags, 15);
    assert.equal(second.farmer.id, "farmer-2");
    assert.equal(second.remainingBags, 0);
  });

  it("returns a null family when the farmer has none", () => {
    const row = buildFarmerSeedReportRow(
      requisition({
        requisitionId: "req-1",
        requestedBags: 10,
        requestedAcres: null,
        farmer: farmer("farmer-1", "Aman", null),
      }),
      [],
    );

    assert.equal(row.farmer.family, null);
    assert.equal(row.farmer.accountNumber, "farmer-1-account");
    assert.deepEqual(row.farmer.station, { id: "station-1", name: "Station A" });
  });

  it("still reports a rejected requisition when no eligible dispatch remains", () => {
    const row = buildFarmerSeedReportRow(
      requisition({
        requisitionId: "req-1",
        requestedBags: 50,
        requestedAcres: null,
        status: "REJECTED",
      }),
      [],
    );

    assert.equal(row.status, "REJECTED");
    assert.equal(row.dispatchedBags, 0);
    assert.equal(row.remainingBags, 50);
  });

  it("does not subtract dispatched bags from requested acres", () => {
    const row = buildFarmerSeedReportRow(
      requisition({
        requisitionId: "req-1",
        requestedBags: null,
        requestedAcres: "10.00",
      }),
      [size("size-a", "Large", 4, 10)],
    );

    assert.equal(row.requestedAcres, "10.00");
    assert.equal(row.requestedBags, 80);
    assert.equal(row.dispatchedBags, 4);
    assert.equal(row.dispatchedAcres, "0.4");
    assert.equal(row.remainingAcres, "9.6");
    assert.equal(row.remainingBags, 77);
  });

  it("does not repeat the requested quantity for each size line", () => {
    const row = buildFarmerSeedReportRow(
      requisition({
        requisitionId: "req-1",
        requestedBags: null,
        requestedAcres: "10.00",
      }),
      [
        size("size-a", "Large", 8, 8),
        size("size-b", "Medium", 8, 8),
        size("size-c", "Small", 8, 8),
      ],
    );

    assert.equal(row.requestedAcres, "10.00");
    assert.equal(row.requestedBags, 80);
    assert.equal(row.dispatchedBags, 24);
    assert.equal(row.dispatchedSizes.length, 3);
  });

  it("leaves acre totals null when a dispatched size has no bags-per-acre rate", () => {
    const row = buildFarmerSeedReportRow(
      requisition({
        requisitionId: "req-1",
        requestedBags: 20,
        requestedAcres: null,
      }),
      [size("size-a", "Large", 10, null), size("size-b", "Small", 5, 10)],
    );

    assert.equal(row.dispatchedBags, 15);
    assert.equal(row.dispatchedAcres, null);
    assert.equal(row.remainingBags, 5);
    assert.equal(row.remainingAcres, null);
    assert.equal(row.dispatchedSizes[0]?.acres, null);
    assert.equal(row.dispatchedSizes[1]?.acres, "0.5");
  });

  it("leaves the converted unit null when the requisition has no expected size", () => {
    const bagsRow = buildFarmerSeedReportRow(
      requisition({
        requisitionId: "req-bags",
        requestedBags: 16,
        requestedAcres: null,
        expectedSize: null,
      }),
      [size("size-a", "Large", 8, 8)],
    );
    const acresRow = buildFarmerSeedReportRow(
      requisition({
        requisitionId: "req-acres",
        requestedBags: null,
        requestedAcres: "4.00",
        expectedSize: null,
      }),
      [size("size-a", "Large", 8, 8)],
    );

    assert.equal(bagsRow.requestedBags, 16);
    assert.equal(bagsRow.requestedAcres, null);
    assert.equal(bagsRow.dispatchedAcres, "1");
    assert.equal(bagsRow.remainingBags, 8);
    assert.equal(bagsRow.remainingAcres, null);

    assert.equal(acresRow.requestedAcres, "4.00");
    assert.equal(acresRow.requestedBags, null);
    assert.equal(acresRow.remainingAcres, "3");
    assert.equal(acresRow.remainingBags, null);
  });

  it("floors remaining acres at zero when bag rounding overshoots the request", () => {
    const row = buildFarmerSeedReportRow(
      requisition({
        requisitionId: "req-1",
        requestedBags: null,
        requestedAcres: "1.00",
      }),
      [size("size-a", "Large", 12, 10)],
    );

    assert.equal(row.dispatchedAcres, "1.2");
    assert.equal(row.remainingAcres, "0");
    assert.equal(row.remainingBags, 0);
  });
});
