const express = require("express");
const bcrypt = require("bcrypt");
const pool = require("../config/db");
const jwt = require("jsonwebtoken");

const router = express.Router();

router.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res
      .status(400)
      .json({ error: "Name, email, and password are all required." });
  }

  try {
    const existing = await pool.query(
      "SELECT id FROM businesses WHERE email = $1",
      [email],
    );
    if (existing.rows.length > 0) {
      return res
        .status(409)
        .json({ error: "An account with this email already exists." });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      "INSERT INTO businesses (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email, created_at",
      [name, email, passwordHash],
    );

    res.status(201).json({ business: result.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Something went wrong. Please try again." });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  try {
    const result = await pool.query(
      "SELECT * FROM businesses WHERE email = $1",
      [email],
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const business = result.rows[0];
    const passwordMatches = await bcrypt.compare(
      password,
      business.password_hash,
    );

    if (!passwordMatches) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const token = jwt.sign(
      { businessId: business.id, email: business.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.json({
      token,
      business: { id: business.id, name: business.name, email: business.email },
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Something went wrong. Please try again." });
  }
});

module.exports = router;
