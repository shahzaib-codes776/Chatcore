const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendHandoffAlert(toEmail, businessName, visitorMessage) {
  try {
    await transporter.sendMail({
      from: `"ChatCore" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: `${businessName}: A visitor needs your help`,
      text: `A visitor on your ChatCore widget asked something the AI couldn't answer confidently:\n\n"${visitorMessage}"\n\nLog in to your dashboard to reply.`,
    });
  } catch (err) {
    console.error("Email notification failed:", err.message);
  }
}

module.exports = { sendHandoffAlert };
