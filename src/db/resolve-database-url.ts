export function resolveDatabaseUrl(): string {
  const isProduction = process.env.NODE_ENV === "production";
  const url = isProduction ? process.env.DATABASE_URL : process.env.DATABASE_URL_DEV;

  if (!url) {
    throw new Error(
      isProduction
        ? "DATABASE_URL environment variable is missing."
        : "DATABASE_URL_DEV environment variable is missing.",
    );
  }

  return url;
}
