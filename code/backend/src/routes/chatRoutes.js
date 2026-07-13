const express = require("express");
const pool = require("../config/db");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const router = express.Router();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.post("/:businessId", async (req, res) => {
  const { businessId } = req.params;
  const { message, name, email } = req.body;

  if (!message) {
    return res.status(400).json({ error: "message is required." });
  }

  try {
    const business = await pool.query(
      "SELECT name, business_info FROM businesses WHERE id = $1",
      [businessId],
    );

    if (business.rows.length === 0) {
      return res.status(404).json({ error: "Business not found." });
    }

    // Save this as a lead so the business owner can see who messaged them
    await pool.query(
      "INSERT INTO leads (business_id, name, email, message) VALUES ($1, $2, $3, $4)",
      [businessId, name || null, email || null, message],
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

    res.json({ reply });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Something went wrong." });
  }
});

module.exports = router;
