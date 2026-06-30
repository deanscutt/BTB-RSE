const { listInbox } = require("../lib/gmail-service");

module.exports = async function handler(request, response) {
  if (request.method !== "GET") {
    response.status(405).json({ error: "Use GET for the email inbox." });
    return;
  }

  try {
    const inbox = await listInbox({ maxResults: Number(request.query?.limit || 50) });
    response.status(200).json(inbox);
  } catch (error) {
    response.status(500).json({ connected: false, messages: [], unread: 0, error: error.message });
  }
};
