import "dotenv/config";
import { pathToFileURL } from "node:url";
import { sql } from "drizzle-orm";
import { db } from "@/db/index.js";
import { farmerContracts, farmerFamilies, farmers } from "@/db/schema/farmers.js";
import { localities, stations } from "@/db/schema/masters.js";

function stationLocality(
  stationRows: { id: string }[],
  localityRows: { id: string; stationId: string }[],
  index: number,
) {
  const station = stationRows[index % stationRows.length];
  const locality = localityRows.find((row) => row.stationId === station.id) ?? localityRows[0];
  return { stationId: station.id, localityId: locality.id };
}

export async function seedFarmers() {
  console.log("Seeding farmers...");

  const stationRows = await db.select({ id: stations.id }).from(stations);
  const localityRows = await db
    .select({ id: localities.id, stationId: localities.stationId })
    .from(localities);

  if (stationRows.length === 0 || localityRows.length === 0) {
    throw new Error("No stations/localities found. Run `pnpm db:seed:masters` first.");
  }

  await db.execute(sql`
    TRUNCATE TABLE
      "farmer_contract",
      "farmer",
      "farmer_family"
    CASCADE
  `);

  const familyPlace = stationLocality(stationRows, localityRows, 1);

  const [family] = await db
    .insert(farmerFamilies)
    .values({
      name: "Singh Family",
      accountNumber: "FAM-SEED-2001",
      stationId: familyPlace.stationId,
      localityId: familyPlace.localityId,
    })
    .returning();

  const farmerDefs = [
    {
      name: "Ramesh Kumar",
      accountNumber: "F-SEED-1001",
      mobileNumber: "9876543210",
      aadharNumber: "123456789012",
      panNumber: "ABCDE1234F",
      accountType: "INDIVIDUAL" as const,
      status: "ACTIVE" as const,
      place: stationLocality(stationRows, localityRows, 0),
      familyId: null,
      bankName: "State Bank of India",
      ifscCode: "SBIN0001234",
      bankAccountNumber: "12345678901",
      contracts: [
        {
          variety: "Kufri Jyoti",
          date: "2026-08-01",
          acres: "2.50",
          contractUrl: "https://example.com/contracts/ramesh-kufri-jyoti.pdf",
          hindiContractUrl: "https://example.com/contracts/ramesh-kufri-jyoti-hi.pdf",
        },
        {
          variety: "Kufri Bahar",
          date: "2026-08-15",
          acres: "1.25",
          contractUrl: "https://example.com/contracts/ramesh-kufri-bahar.pdf",
          hindiContractUrl: "https://example.com/contracts/ramesh-kufri-bahar-hi.pdf",
        },
      ],
    },
    {
      name: "Suresh Singh",
      accountNumber: "F-SEED-2001",
      mobileNumber: "9876543211",
      aadharNumber: "123456789013",
      panNumber: "FGHIJ5678K",
      accountType: "FAMILY_PRIMARY" as const,
      status: "ACTIVE" as const,
      place: familyPlace,
      familyId: family.id,
      bankName: "HDFC Bank",
      ifscCode: "HDFC0000123",
      bankAccountNumber: "987654321098",
      contracts: [
        {
          variety: "Kufri Pukhraj",
          date: "2026-07-20",
          acres: "4.00",
          contractUrl: "https://example.com/contracts/suresh-kufri-pukhraj.pdf",
          hindiContractUrl: "https://example.com/contracts/suresh-kufri-pukhraj-hi.pdf",
        },
      ],
    },
    {
      name: "Anita Singh",
      accountNumber: "F-SEED-2002",
      mobileNumber: "9876543212",
      aadharNumber: "123456789014",
      panNumber: "LMNOP9012Q",
      accountType: "FAMILY_MEMBER" as const,
      status: "ACTIVE" as const,
      place: familyPlace,
      familyId: family.id,
      bankName: "Punjab National Bank",
      ifscCode: "PUNB0123456",
      bankAccountNumber: "112233445566",
      contracts: [
        {
          variety: "Kufri Chipsona",
          date: "2026-07-22",
          acres: "1.75",
          contractUrl: "https://example.com/contracts/anita-kufri-chipsona.pdf",
          hindiContractUrl: "https://example.com/contracts/anita-kufri-chipsona-hi.pdf",
        },
      ],
    },
    {
      name: "Mohan Lal",
      accountNumber: "F-SEED-3001",
      mobileNumber: "9876543213",
      aadharNumber: "123456789015",
      panNumber: "RSTUV3456W",
      accountType: "INDIVIDUAL" as const,
      status: "ACTIVE" as const,
      place: stationLocality(stationRows, localityRows, 2),
      familyId: null,
      bankName: "ICICI Bank",
      ifscCode: "ICIC0000456",
      bankAccountNumber: "556677889900",
      contracts: [
        {
          variety: "Kufri Chandramukhi",
          date: "2026-06-10",
          acres: "3.00",
          contractUrl: "https://example.com/contracts/mohan-kufri-chandramukhi.pdf",
          hindiContractUrl: "https://example.com/contracts/mohan-kufri-chandramukhi-hi.pdf",
        },
        {
          variety: "Kufri Jyoti",
          date: "2026-06-18",
          acres: "0.75",
          contractUrl: "https://example.com/contracts/mohan-kufri-jyoti.pdf",
          hindiContractUrl: "https://example.com/contracts/mohan-kufri-jyoti-hi.pdf",
        },
      ],
    },
    {
      name: "Pritam Kaur",
      accountNumber: "F-SEED-4001",
      mobileNumber: "9876543214",
      aadharNumber: "123456789016",
      panNumber: "XYZAB7890C",
      accountType: "INDIVIDUAL" as const,
      status: "INACTIVE" as const,
      place: stationLocality(stationRows, localityRows, 3),
      familyId: null,
      bankName: "Axis Bank",
      ifscCode: "UTIB0000789",
      bankAccountNumber: "334455667788",
      contracts: [
        {
          variety: "Kufri Sindhuri",
          date: "2026-05-05",
          acres: "5.50",
          contractUrl: "https://example.com/contracts/pritam-kufri-sindhuri.pdf",
          hindiContractUrl: "https://example.com/contracts/pritam-kufri-sindhuri-hi.pdf",
        },
      ],
    },
  ];

  for (const def of farmerDefs) {
    const [farmer] = await db
      .insert(farmers)
      .values({
        name: def.name,
        accountNumber: def.accountNumber,
        mobileNumber: def.mobileNumber,
        aadharNumber: def.aadharNumber,
        panNumber: def.panNumber,
        accountType: def.accountType,
        status: def.status,
        stationId: def.place.stationId,
        localityId: def.place.localityId,
        familyId: def.familyId,
        bankName: def.bankName,
        ifscCode: def.ifscCode,
        bankAccountNumber: def.bankAccountNumber,
      })
      .returning();

    await db.insert(farmerContracts).values(
      def.contracts.map((contract) => ({
        farmerId: farmer.id,
        variety: contract.variety,
        date: contract.date,
        acres: contract.acres,
        contractUrl: contract.contractUrl,
        hindiContractUrl: contract.hindiContractUrl,
      })),
    );

    console.log(`Created ${def.accountType} farmer: ${farmer.name} (${farmer.accountNumber})`);
  }

  console.log("Seeded 5 farmers");
}

const isDirectRun =
  process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
  seedFarmers()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Seed failed:", error);
      process.exit(1);
    });
}
