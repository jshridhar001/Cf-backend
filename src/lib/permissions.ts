import { createAccessControl } from "better-auth/plugins/access";
import { adminAc, defaultStatements, userAc } from "better-auth/plugins/admin/access";

/** Merge Better Auth defaults with a custom module resource for future RBAC. */
export const statement = {
  ...defaultStatements,
  module: ["create", "read", "update", "delete", "assign_rights"],
} as const;

export const ac = createAccessControl(statement);

// --- Tier 1: system admins ---

export const superDeveloper = ac.newRole({
  ...adminAc.statements,
  user: ["impersonate-admins", ...adminAc.statements.user],
  module: ["create", "read", "update", "delete", "assign_rights"],
});

export const managingDirector = ac.newRole({
  ...adminAc.statements,
  user: ["impersonate-admins", ...adminAc.statements.user],
  module: ["create", "read", "update", "delete", "assign_rights"],
});

// --- Tier 2: management / field (scaffolded; currently userAc only) ---

export const programManager = ac.newRole({
  ...userAc.statements,
});

export const accountsSettlementManager = ac.newRole({
  ...userAc.statements,
});

export const fieldOperationsManager = ac.newRole({
  ...userAc.statements,
});

export const accountsSeedSupplyManager = ac.newRole({
  ...userAc.statements,
});

export const fieldOfficer = ac.newRole({
  ...userAc.statements,
});
