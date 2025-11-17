require('dotenv').config();
const app = require('./app');
const { testConnection } = require('./config/database');

const PORT = process.env.PORT || 4000;

(async () => {
  await testConnection();
  app.listen(PORT, () => {
    console.log(`✅ API listening on http://localhost:${PORT}`);
  });
})();
