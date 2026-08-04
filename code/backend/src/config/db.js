const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool
  .connect()
  .then(() => console.log("Database connected successfully"))
  .catch((err) => console.error("Database connection error:", err.message));

// IMPORTANT: Without this handler, Neon closing an idle connection
// (which it does periodically) crashes the entire Node process,
// causing Railway to restart the container and drop in-flight requests.
pool.on("error", (err) => {
  console.error(
    "Unexpected database pool error (connection was recycled, this is normal):",
    err.message,
  );
});

module.exports = pool;
