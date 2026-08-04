const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
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

// Test the connection once at startup, then release the client back
// to the pool immediately so it's managed by the pool's error handler
// above, not left dangling outside the pool's control.
pool
  .connect()
  .then((client) => {
    console.log("Database connected successfully");
    client.release();
  })
  .catch((err) => console.error("Database connection error:", err.message));

module.exports = pool;
