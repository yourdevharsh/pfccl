import { createApp } from "../app.js";
import { config } from "../config.js";
import { disconnectDatabase } from "../services/prisma.js";

const app = await createApp();
const server = app.listen(config.port, config.host, () => {
  console.log(`PFCCL API listening on http://localhost:${config.port}`);
});

async function shutdown(signal) {
  console.log(`Received ${signal}. Closing server...`);
  server.close(async () => {
    await disconnectDatabase();
    process.exit(0);
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
