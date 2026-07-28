import { buildApp } from "./app.js";

const start = async () => {
  try {
    // 1. Build the Fastify application (Plugins, DB, and Routes initialize here)
    const app = await buildApp();

    // 2. Define Port and Host
    const port = Number(process.env.PORT) || 8080;
    const host = process.env.HOST || "0.0.0.0";

    // 3. Start the engine
    await app.listen({ port, host });

    // Note: You do not need console.log here. Fastify's internal logger
    // will automatically print the startup URL and initialized routes.
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";

    // Fallback to native console if the Fastify logger fails to boot
    console.error("🚨 Failed to start Bhatti Agritech backend:", errorMessage);

    if (err instanceof Error && err.stack) {
      console.error(err.stack);
    }

    process.exit(1);
  }
};

// Execute the startup function
void start();
