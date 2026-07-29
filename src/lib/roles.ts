export const DEFAULT_ROLE = "FIELD_OFFICER" as const;

export const SUPER_DEVELOPER_ROLE = "SUPER_DEVELOPER" as const;

export const ADMIN_ROLES = [SUPER_DEVELOPER_ROLE, "MANAGING_DIRECTOR"] as const;

export type AdminRoleValue = (typeof ADMIN_ROLES)[number];

export const AVAILABLE_ROLES = [
  { label: "Super Developer", value: SUPER_DEVELOPER_ROLE },
  { label: "Managing Director", value: "MANAGING_DIRECTOR" },
  { label: "Programme Manager", value: "PROGRAMME_MANAGER" },
  {
    label: "Accounts Settlements Manager",
    value: "ACCOUNTS_SETTLEMENTS_MANAGER",
  },
  { label: "Field Operations Manager", value: "FIELD_OPERATIONS_MANAGER" },
  {
    label: "Accounts Seeds Supply Manager",
    value: "ACCOUNTS_SEEDS_SUPPLY_MANAGER",
  },
  { label: "Field Officer", value: "FIELD_OFFICER" },
] as const;

export type RoleValue = (typeof AVAILABLE_ROLES)[number]["value"];

/** Roles that can be assigned in Access Control UI (excludes SUPER_DEVELOPER). */
export const ASSIGNABLE_ROLES = AVAILABLE_ROLES.filter(
  (role) => role.value !== SUPER_DEVELOPER_ROLE,
);

export type AssignableRoleValue = (typeof ASSIGNABLE_ROLES)[number]["value"];

export const ROLE_LABELS: Record<RoleValue, string> = Object.fromEntries(
  AVAILABLE_ROLES.map((role) => [role.value, role.label]),
) as Record<RoleValue, string>;

export function getRoleLabel(role: string | null | undefined) {
  if (!role) {
    return "Unassigned";
  }

  return ROLE_LABELS[role as RoleValue] ?? role;
}

export function isSuperDeveloperRole(role: string | null | undefined) {
  return role === SUPER_DEVELOPER_ROLE;
}

export function isAdminRole(role: string | null | undefined) {
  return ADMIN_ROLES.includes(role as AdminRoleValue);
}

export const HEAD_OFFICE_ROLES = [
  SUPER_DEVELOPER_ROLE,
  "MANAGING_DIRECTOR",
  "PROGRAMME_MANAGER",
] as const;

export type HeadOfficeRoleValue = (typeof HEAD_OFFICE_ROLES)[number];

export function isHeadOfficeRole(role: string | null | undefined) {
  return HEAD_OFFICE_ROLES.includes(role as HeadOfficeRoleValue);
}
