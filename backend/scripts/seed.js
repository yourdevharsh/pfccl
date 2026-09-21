import { ensureStorage, ensureDatabase } from "../services/storage.js";
import { connectDatabase, disconnectDatabase } from "../services/prisma.js";

await ensureStorage();
await connectDatabase();
await ensureDatabase();
console.log("Database and document storage initialized. No sample companies were created.");
await disconnectDatabase();
