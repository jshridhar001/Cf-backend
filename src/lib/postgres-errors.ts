type PostgresErrorInfo = {
  code: string;
  constraint?: string;
};

function readPostgresError(error: unknown): PostgresErrorInfo | undefined {
  if (typeof error !== "object" || error === null) {
    return undefined;
  }

  const code = "code" in error ? error.code : undefined;
  if (typeof code === "string" && /^\d{5}$/.test(code)) {
    const constraint = "constraint_name" in error ? error.constraint_name : undefined;
    return {
      code,
      constraint: typeof constraint === "string" ? constraint : undefined,
    };
  }

  if ("cause" in error) {
    return readPostgresError(error.cause);
  }

  return undefined;
}

export function isUniqueViolation(error: unknown): boolean {
  return readPostgresError(error)?.code === "23505";
}

export function isForeignKeyViolation(error: unknown): boolean {
  return readPostgresError(error)?.code === "23503";
}

export function postgresConstraint(error: unknown): string | undefined {
  return readPostgresError(error)?.constraint;
}
