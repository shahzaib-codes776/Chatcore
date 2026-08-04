const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 10000, // close idle clients ourselves before Neon does
  connectionTimeoutMillis: 10000,
});

// IMPORTANT: This handler catches errors from idle clients in the pool
// (e.g. Neon closing a connection after inactivity). Without it, such
// errors crash the entire Node process.
pool.on("error", (err) => {
  console.error(
    "Unexpected database pool error (connection was recycled, this is normal):",
    err.message,
  );
});

pool
  .connect()
  .then((client) => {
    console.log("Database connected successfully");
    client.release();
  })
  .catch((err) => console.error("Database connection error:", err.message));

// Extra safety net: if anything still slips through as an uncaught error
// anywhere in the app, log it instead of letting the whole process crash.
process.on("uncaughtException", (err) => {
  console.error("Uncaught exception (server stayed alive):", err.message);
});

module.exports = pool;
