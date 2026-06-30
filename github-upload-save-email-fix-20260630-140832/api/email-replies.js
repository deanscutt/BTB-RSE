const { sendGmailReply } = require("../lib/gmail-service");

module.exports = async function handler(request, response) {
  if (request.method !== "POST") {
    response.status(405).json({ sent: false, reason: "Use POST for email replies." });
    return;
  }

  try {
    const payload = typeof request.body === "object" && request.body !== null ? request.body : JSON.parse(request.body || "{}");
    const result = await sendGmailReply(payload);
    response.status(result.sent ? 200 : 503).json(result);
  } catch (error) {
    response.status(500).json({ sent: false, reason: error.message });
  }
};
