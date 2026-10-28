import { ensureStorage, ensureDatabase } from "../services/storage.js";
import { connectDatabase, disconnectDatabase } from "../services/prisma.js";
import { ensureInitialSuperAdmin } from "../services/auth.js";

await ensureStorage();
await connectDatabase();
await ensureDatabase();
await ensureInitialSuperAdmin();
console.log("Database and document storage initialized. The initial Super admin exists. No sample companies were created.");
await disconnectDatabase();
