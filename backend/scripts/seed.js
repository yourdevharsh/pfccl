import { ensureStorage, getRootRecord, saveRootRecord } from "../services/storage.js";

await ensureStorage();
const root = await getRootRecord();
await saveRootRecord({ id: "pfccl", name: "PFCCL", ...root });
console.log("Storage initialized. No sample companies were created.");
