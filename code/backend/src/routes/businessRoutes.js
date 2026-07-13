const express = require("express");
const pool = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/me", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name, email, business_info, created_at FROM businesses WHERE id = $1",
      [req.business.businessId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Business not found." });
    }

    res.json({ business: result.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Something went wrong." });
  }
});

router.put("/me", authMiddleware, async (req, res) => {
  const { business_info } = req.body;

  if (!business_info) {
    return res.status(400).json({ error: "business_info is required." });
  }

  try {
    const result = await pool.query(
      "UPDATE businesses SET business_info = $1 WHERE id = $2 RETURNING id, name, email, business_info, created_at",
      [business_info, req.business.businessId],
    );

    res.json({ business: result.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Something went wrong." });
  }
});
router.get("/leads", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name, email, message, created_at FROM leads WHERE business_id = $1 ORDER BY created_at DESC",
      [req.business.businessId],
    );
    res.json({ leads: result.rows });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Something went wrong." });
  }
});
module.exports = router;
