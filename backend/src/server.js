import "dotenv/config";
import app from "./app.js";
import { testConnection } from "./config/database.js";

const PORT = process.env.PORT || 4000;

// Ensure DB reachable before accepting traffic
(async () => {
  await testConnection();
  app.listen(PORT, () => {
    console.log(`✅ API listening on http://localhost:${PORT}`);
  });
})();
