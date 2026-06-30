const {
  acceptCoverRequest,
  createCoverRequest,
  getCoverRequest,
  publicCoverRequest
} = require("../lib/cover-store");
const { sendCoverFilledEmail } = require("../lib/cover-email");

function sendJson(response, statusCode, payload) {
  response.status(statusCode).json(payload);
}

function requestPayload(request) {
  if (typeof request.body === "object" && request.body !== null) {
    return request.body;
  }

  return JSON.parse(request.body || "{}");
}

module.exports = async function handler(request, response) {
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");
  response.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");

  if (request.method === "OPTIONS") {
    response.status(204).end();
    return;
  }

  try {
    if (request.method === "GET") {
      const token = request.query?.token;
      const record = getCoverRequest(token);

      if (!record) {
        sendJson(response, 404, { found: false, reason: "Cover request not found." });
        return;
      }

      sendJson(response, 200, { found: true, request: publicCoverRequest(record) });
      return;
    }

    if (request.method !== "POST") {
      sendJson(response, 405, { ok: false, reason: "Use GET or POST for cover requests." });
      return;
    }

    const payload = requestPayload(request);

    if (payload.action === "accept") {
      const result = acceptCoverRequest(payload.token, payload.engineerId, payload.engineerName);

      if (result.status === "missing") {
        sendJson(response, 404, { accepted: false, reason: "Cover request not found." });
        return;
      }

      if (result.status === "taken") {
        sendJson(response, 409, { accepted: false, taken: true, request: publicCoverRequest(result.record) });
        return;
      }

      if (result.status === "invalid") {
        sendJson(response, 400, { accepted: false, reason: "Choose one of the available engineers for this cover request." });
        return;
      }

      const emailResult = await sendCoverFilledEmail(result.record).catch((error) => ({
        sent: false,
        reason: error.message
      }));

      sendJson(response, 200, { accepted: true, request: publicCoverRequest(result.record), email: emailResult });
      return;
    }

    const record = createCoverRequest(payload);

    sendJson(response, 201, { ok: true, request: publicCoverRequest(record) });
  } catch (error) {
    sendJson(response, 500, { ok: false, reason: error.message });
  }
};
