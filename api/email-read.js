const { markGmailMessageRead } = require("../lib/gmail-service");

module.exports = async function handler(request, response) {
  if (request.method !== "POST") {
    response.status(405).json({ marked: false, reason: "Use POST to mark an email as read." });
    return;
  }

  try {
    const payload = typeof request.body === "object" && request.body !== null ? request.body : JSON.parse(request.body || "{}");
    const result = await markGmailMessageRead(payload);
    response.status(result.marked ? 200 : 503).json(result);
  } catch (error) {
    response.status(500).json({ marked: false, reason: error.message });
  }
};
