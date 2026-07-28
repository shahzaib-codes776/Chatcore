const express = require("express");
const pool = require("../config/db");
const { sendHandoffAlert } = require("../config/mailer");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const router = express.Router();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const uncertainPhrases = [
  "not sure",
  "don't have",
  "isn't available",
  "contact",
  "not quite sure",
];

router.post("/:businessId", async (req, res) => {
  const { businessId } = req.params;
  const { message, name, email, conversationId } = req.body;

  if (!message) {
    return res.status(400).json({ error: "message is required." });
  }

  try {
    const business = await pool.query(
      "SELECT name, email,business_info, widget_color, welcome_message FROM businesses WHERE id = $1",
      [businessId],
    );

    if (business.rows.length === 0) {
      return res.status(404).json({ error: "Business not found." });
    }

    // Find the existing conversation, or start a new one
    let convoId = conversationId;
    if (convoId) {
      const check = await pool.query(
        "SELECT id FROM conversations WHERE id = $1 AND business_id = $2",
        [convoId, businessId],
      );
      if (check.rows.length === 0) convoId = null;
    }

    if (!convoId) {
      const newConvo = await pool.query(
        "INSERT INTO conversations (business_id, visitor_name, visitor_email) VALUES ($1, $2, $3) RETURNING id",
        [businessId, name || null, email || null],
      );
      convoId = newConvo.rows[0].id;
    }

    // Save the visitor's message
    await pool.query(
      "INSERT INTO messages (conversation_id, sender, content) VALUES ($1, 'visitor', $2)",
      [convoId, message],
    );

    const businessName = business.rows[0].name;
    const businessInfo =
      business.rows[0].business_info || "No information has been provided yet.";

    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    const prompt = `You are a helpful customer support assistant for a business called "${businessName}". Answer the visitor's question using ONLY the information below. If the answer isn't in the information provided, politely say you're not sure and suggest they contact the business directly. Keep answers short and friendly (2-4 sentences).

Business information:
${businessInfo}

Visitor's question: ${message}`;

    const result = await model.generateContent(prompt);
    const reply = result.response.text();

    // Save the AI's reply
    await pool.query(
      "INSERT INTO messages (conversation_id, sender, content) VALUES ($1, 'ai', $2)",
      [convoId, reply],
    );

    const needsHuman = uncertainPhrases.some((phrase) =>
      reply.toLowerCase().includes(phrase),
    );

    if (needsHuman) {
      await pool.query(
        "UPDATE conversations SET needs_human = true WHERE id = $1",
        [convoId],
      );
      await sendHandoffAlert(business.rows[0].email, businessName, message);
    }

    res.json({
      reply,
      conversationId: convoId,
      widget_color: business.rows[0].widget_color,
      welcome_message: business.rows[0].welcome_message,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Something went wrong." });
  }
});

router.get("/:businessId/config", async (req, res) => {
  const { businessId } = req.params;
  try {
    const result = await pool.query(
      "SELECT name, widget_color, welcome_message FROM businesses WHERE id = $1",
      [businessId],
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Business not found." });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Something went wrong." });
  }
});

// Public route: widget polls this to check for a new reply from the business owner
router.get(
  "/:businessId/conversation/:conversationId/messages",
  async (req, res) => {
    const { businessId, conversationId } = req.params;
    try {
      const check = await pool.query(
        "SELECT id FROM conversations WHERE id = $1 AND business_id = $2",
        [conversationId, businessId],
      );
      if (check.rows.length === 0) {
        return res.status(404).json({ error: "Conversation not found." });
      }

      const messages = await pool.query(
        "SELECT sender, content, created_at FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC",
        [conversationId],
      );
      res.json({ messages: messages.rows });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ error: "Something went wrong." });
    }
  },
);

module.exports = router;
