const { deleteBlobFile } = require("../lib/blob-store");

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
    response.status(405).json({ deleted: false, reason: "Use POST for Blob deletes." });
    return;
  }

  try {
    const result = await deleteBlobFile(payload(request));

    response.status(result.deleted ? 200 : 503).json(result);
  } catch (error) {
    response.status(500).json({ deleted: false, reason: error.message });
  }
};
