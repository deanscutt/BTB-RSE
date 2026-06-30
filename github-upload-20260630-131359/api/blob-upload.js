const { uploadBlobFile } = require("../lib/blob-store");

function payload(request) {
  if (typeof request.body === "object" && request.body !== null) {
    return request.body;
  }

  return JSON.parse(request.body || "{}");
}

module.exports = async function handler(request, response) {
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");
  response.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");

  if (request.method === "OPTIONS") {
    response.status(204).end();
    return;
  }

  if (request.method !== "POST") {
    response.status(405).json({ uploaded: false, reason: "Use POST for Blob uploads." });
    return;
  }

  try {
    const result = await uploadBlobFile(payload(request));

    response.status(result.uploaded ? 200 : 503).json(result);
  } catch (error) {
    response.status(500).json({ uploaded: false, reason: error.message });
  }
};

module.exports.config = {
  api: {
    bodyParser: {
      sizeLimit: "25mb"
    }
  }
};
