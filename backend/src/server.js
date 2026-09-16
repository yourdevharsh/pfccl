import { createApp } from "../app.js";
import { config } from "../config.js";

const app = await createApp();
app.listen(config.port, config.host, () => {
  console.log(`PFCCL API listening on http://localhost:${config.port}`);
});
