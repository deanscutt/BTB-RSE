const { readAppState, writeAppState } = require("../lib/app-state-store");

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
  response.setHeader("Access-Control-Allow-Methods", "GET, PUT, OPTIONS");

  if (request.method === "OPTIONS") {
    response.status(204).end();
    return;
  }

  try {
    if (request.method === "GET") {
      const result = await readAppState();

      sendJson(response, 200, result);
      return;
    }

    if (request.method === "PUT") {
      const payload = requestPayload(request);
      const result = await writeAppState(payload);

      sendJson(response, result.saved ? 200 : 503, result);
      return;
    }

    sendJson(response, 405, { saved: false, reason: "Use GET or PUT for app state." });
  } catch (error) {
    sendJson(response, 500, { connected: false, saved: false, reason: error.message });
  }
};

module.exports.config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb"
    }
  }
};
