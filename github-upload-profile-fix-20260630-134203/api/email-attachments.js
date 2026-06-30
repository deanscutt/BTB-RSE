const { saveGmailAttachmentToDocuments } = require("../lib/gmail-service");

function payload(request) {
  if (typeof request.body === "object" && request.body !== null) {
    return request.body;
  }

  return JSON.parse(request.body || "{}");
}

module.exports = async function handler(request, response) {
  if (request.method !== "POST") {
    response.status(405).json({ saved: false, reason: "Use POST for email attachments." });
    return;
  }

  try {
    const result = await saveGmailAttachmentToDocuments(payload(request));
    response.status(result.saved ? 200 : 503).json(result);
  } catch (error) {
    response.status(500).json({ saved: false, reason: error.message });
  }
};
