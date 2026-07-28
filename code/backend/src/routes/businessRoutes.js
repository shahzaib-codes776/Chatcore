const express = require("express");
const pool = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");
const multer = require("multer");
const { PDFParse } = require("pdf-parse");

const upload = multer({ storage: multer.memoryStorage() });

const router = express.Router();

router.get("/me", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name, email, business_info, widget_color, welcome_message, created_at FROM businesses WHERE id = $1",
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
      "SELECT id, name, email, message, needs_human, created_at FROM leads WHERE business_id = $1 ORDER BY created_at DESC",
      [req.business.businessId],
    );
    res.json({ leads: result.rows });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Something went wrong." });
  }
});
router.post(
  "/upload-document",
  authMiddleware,
  upload.single("document"),
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded." });
    }

    try {
      let extractedText = "";

      if (req.file.mimetype === "application/pdf") {
        const parser = new PDFParse({ data: req.file.buffer });
        const result = await parser.getText();
        extractedText = result.text;
        await parser.destroy();
      }

      const current = await pool.query(
        "SELECT business_info FROM businesses WHERE id = $1",
        [req.business.businessId],
      );

      const existingInfo = current.rows[0].business_info || "";
      const updatedInfo = existingInfo
        ? `${existingInfo}\n\n--- From uploaded document ---\n${extractedText}`
        : extractedText;

      const result = await pool.query(
        "UPDATE businesses SET business_info = $1 WHERE id = $2 RETURNING id, name, email, business_info, created_at",
        [updatedInfo, req.business.businessId],
      );

      res.json({ business: result.rows[0] });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ error: "Failed to process the document." });
    }
  },
);
router.put("/branding", authMiddleware, async (req, res) => {
  const { widget_color, welcome_message } = req.body;

  try {
    const result = await pool.query(
      "UPDATE businesses SET widget_color = $1, welcome_message = $2 WHERE id = $3 RETURNING id, name, email, business_info, widget_color, welcome_message, created_at",
      [widget_color, welcome_message, req.business.businessId],
    );

    res.json({ business: result.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Something went wrong." });
  }
});

router.get("/analytics", authMiddleware, async (req, res) => {
  try {
    const totalResult = await pool.query(
      "SELECT COUNT(*) as total FROM leads WHERE business_id = $1",
      [req.business.businessId],
    );

    const dailyResult = await pool.query(
      `SELECT DATE(created_at) as date, COUNT(*) as count
       FROM leads WHERE business_id = $1
       GROUP BY DATE(created_at)
       ORDER BY date ASC`,
      [req.business.businessId],
    );

    res.json({
      total: parseInt(totalResult.rows[0].total),
      daily: dailyResult.rows,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Something went wrong." });
  }
});
// List all conversations for this business, newest first
router.get("/conversations", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.id, c.visitor_name, c.visitor_email, c.needs_human, c.resolved, c.created_at,
              (SELECT content FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message
       FROM conversations c
       WHERE c.business_id = $1
       ORDER BY c.created_at DESC`,
      [req.business.businessId],
    );
    res.json({ conversations: result.rows });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Something went wrong." });
  }
});

// Get full message history for one conversation
router.get("/conversations/:id/messages", authMiddleware, async (req, res) => {
  try {
    const check = await pool.query(
      "SELECT id FROM conversations WHERE id = $1 AND business_id = $2",
      [req.params.id, req.business.businessId],
    );
    if (check.rows.length === 0) {
      return res.status(404).json({ error: "Conversation not found." });
    }

    const messages = await pool.query(
      "SELECT sender, content, created_at FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC",
      [req.params.id],
    );
    res.json({ messages: messages.rows });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Something went wrong." });
  }
});

// Business owner sends a reply into a conversation
router.post("/conversations/:id/reply", authMiddleware, async (req, res) => {
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: "message is required." });
  }

  try {
    const check = await pool.query(
      "SELECT id FROM conversations WHERE id = $1 AND business_id = $2",
      [req.params.id, req.business.businessId],
    );
    if (check.rows.length === 0) {
      return res.status(404).json({ error: "Conversation not found." });
    }

    await pool.query(
      "INSERT INTO messages (conversation_id, sender, content) VALUES ($1, 'business', $2)",
      [req.params.id, message],
    );

    await pool.query("UPDATE conversations SET resolved = true WHERE id = $1", [
      req.params.id,
    ]);

    res.json({ success: true });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Something went wrong." });
  }
});

module.exports = router;
