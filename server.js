const fs = require("fs");
const http = require("http");
const path = require("path");

const rootDir = __dirname;

loadLocalEnv();

const port = Number(process.env.PORT || 4173);
const host = process.env.HOST || "0.0.0.0";
const resendApiKey = process.env.RESEND_API_KEY || "";
const emailFrom = process.env.EMAIL_FROM || "";
const defaultProductionEmail = process.env.PRODUCTION_EMAIL || "production@betweenthebridges.co.uk";
const { listInbox, saveGmailAttachmentToDocuments, sendGmailReply } = require("./lib/gmail-service");
const {
  acceptCoverRequest,
  createCoverRequest,
  getCoverRequest,
  publicCoverRequest
} = require("./lib/cover-store");
const { sendCoverFilledEmail } = require("./lib/cover-email");
const { readAppState, writeAppState } = require("./lib/app-state-store");
const { deleteBlobFile, uploadBlobFile } = require("./lib/blob-store");

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".webmanifest": "application/manifest+json; charset=utf-8"
};

function loadLocalEnv() {
  const envPath = path.join(rootDir, ".env");

  if (!fs.existsSync(envPath)) {
    return;
  }

  fs.readFileSync(envPath, "utf8")
    .split(/\r?\n/)
    .forEach((line) => {
      const trimmed = line.trim();

      if (!trimmed || trimmed.startsWith("#")) {
        return;
      }

      const equalsIndex = trimmed.indexOf("=");

      if (equalsIndex === -1) {
        return;
      }

      const key = trimmed.slice(0, equalsIndex).trim();
      let value = trimmed.slice(equalsIndex + 1).trim();

      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }

      if (!process.env[key]) {
        process.env[key] = value;
      }
    });
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
    "Content-Type": "application/json; charset=utf-8"
  });
  response.end(JSON.stringify(payload));
}

async function handleAppState(request, response) {
  if (request.method === "OPTIONS") {
    sendJson(response, 204, {});
    return;
  }

  try {
    if (request.method === "GET") {
      const result = await readAppState();

      sendJson(response, 200, result);
      return;
    }

    if (request.method === "PUT") {
      const body = await readRequestBody(request, 10_000_000);
      const payload = JSON.parse(body || "{}");
      const result = await writeAppState(payload);

      sendJson(response, result.saved ? 200 : 503, result);
      return;
    }

    sendJson(response, 405, { saved: false, reason: "Use GET or PUT for app state." });
  } catch (error) {
    sendJson(response, 500, { connected: false, saved: false, reason: error.message });
  }
}

async function handleBlobUpload(request, response) {
  if (request.method === "OPTIONS") {
    sendJson(response, 204, {});
    return;
  }

  if (request.method !== "POST") {
    sendJson(response, 405, { uploaded: false, reason: "Use POST for Blob uploads." });
    return;
  }

  try {
    const body = await readRequestBody(request, 25_000_000);
    const result = await uploadBlobFile(JSON.parse(body || "{}"));

    sendJson(response, result.uploaded ? 200 : 503, result);
  } catch (error) {
    sendJson(response, 500, { uploaded: false, reason: error.message });
  }
}

async function handleBlobDelete(request, response) {
  if (request.method === "OPTIONS") {
    sendJson(response, 204, {});
    return;
  }

  if (request.method !== "POST") {
    sendJson(response, 405, { deleted: false, reason: "Use POST for Blob deletes." });
    return;
  }

  try {
    const body = await readRequestBody(request);
    const result = await deleteBlobFile(JSON.parse(body || "{}"));

    sendJson(response, result.deleted ? 200 : 503, result);
  } catch (error) {
    sendJson(response, 500, { deleted: false, reason: error.message });
  }
}

function normaliseRecipients(value) {
  if (Array.isArray(value)) {
    return value.map(String).map((item) => item.trim()).filter(Boolean);
  }

  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function readRequestBody(request, maxBytes = 1_000_000) {
  return new Promise((resolve, reject) => {
    let body = "";

    request.on("data", (chunk) => {
      body += chunk;

      if (body.length > maxBytes) {
        request.destroy();
        reject(new Error("Request body is too large"));
      }
    });
    request.on("end", () => resolve(body));
    request.on("error", reject);
  });
}

async function sendResendEmail(payload) {
  if (!resendApiKey || !emailFrom) {
    return {
      sent: false,
      reason: "Email service is not configured. Set RESEND_API_KEY and EMAIL_FROM before starting the app server."
    };
  }

  const to = normaliseRecipients(payload.to || defaultProductionEmail);
  const cc = normaliseRecipients(payload.cc);
  const bcc = normaliseRecipients(payload.bcc);
  const subject = String(payload.subject || "").trim();
  const text = String(payload.body || "").trim();

  if (!to.length || !subject || !text) {
    return { sent: false, reason: "Email needs a recipient, subject, and message body." };
  }

  const emailPayload = {
    from: emailFrom,
    to,
    subject,
    text
  };

  if (cc.length) {
    emailPayload.cc = cc;
  }

  if (bcc.length) {
    emailPayload.bcc = bcc;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(emailPayload)
  });
  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    return { sent: false, reason: result.message || "Email provider rejected the notification." };
  }

  return { sent: true, id: result.id };
}

async function handleEmailNotification(request, response) {
  if (request.method === "OPTIONS") {
    sendJson(response, 204, {});
    return;
  }

  if (request.method !== "POST") {
    sendJson(response, 405, { sent: false, reason: "Use POST for email notifications." });
    return;
  }

  try {
    const body = await readRequestBody(request);
    const payload = JSON.parse(body || "{}");
    const result = await sendResendEmail(payload);

    sendJson(response, result.sent ? 200 : 503, result);
  } catch (error) {
    sendJson(response, 500, { sent: false, reason: error.message });
  }
}

async function handleEmailInbox(request, response) {
  if (request.method !== "GET") {
    sendJson(response, 405, { error: "Use GET for the email inbox." });
    return;
  }

  try {
    const requestUrl = new URL(request.url, `http://${request.headers.host || "127.0.0.1"}`);
    const inbox = await listInbox({ maxResults: Number(requestUrl.searchParams.get("limit") || 50) });
    sendJson(response, 200, inbox);
  } catch (error) {
    sendJson(response, 500, { connected: false, messages: [], unread: 0, error: error.message });
  }
}

async function handleEmailReply(request, response) {
  if (request.method === "OPTIONS") {
    sendJson(response, 204, {});
    return;
  }

  if (request.method !== "POST") {
    sendJson(response, 405, { sent: false, reason: "Use POST for email replies." });
    return;
  }

  try {
    const body = await readRequestBody(request);
    const payload = JSON.parse(body || "{}");
    const result = await sendGmailReply(payload);

    sendJson(response, result.sent ? 200 : 503, result);
  } catch (error) {
    sendJson(response, 500, { sent: false, reason: error.message });
  }
}

async function handleEmailAttachment(request, response) {
  if (request.method === "OPTIONS") {
    sendJson(response, 204, {});
    return;
  }

  if (request.method !== "POST") {
    sendJson(response, 405, { saved: false, reason: "Use POST for email attachments." });
    return;
  }

  try {
    const body = await readRequestBody(request);
    const payload = JSON.parse(body || "{}");
    const result = await saveGmailAttachmentToDocuments(payload);

    sendJson(response, result.saved ? 200 : 503, result);
  } catch (error) {
    sendJson(response, 500, { saved: false, reason: error.message });
  }
}

async function handleCoverRequests(request, response) {
  if (request.method === "OPTIONS") {
    sendJson(response, 204, {});
    return;
  }

  const requestUrl = new URL(request.url, `http://${request.headers.host || "127.0.0.1"}`);

  try {
    if (request.method === "GET") {
      const record = getCoverRequest(requestUrl.searchParams.get("token"));

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

    const body = await readRequestBody(request);
    const payload = JSON.parse(body || "{}");

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
}

function serveStatic(request, response) {
  if (!["GET", "HEAD"].includes(request.method)) {
    response.writeHead(405);
    response.end("Method not allowed");
    return;
  }

  const url = new URL(request.url, `http://${request.headers.host || "127.0.0.1"}`);
  const requestedPath = decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname);
  const filePath = path.resolve(rootDir, `.${requestedPath}`);

  if (!filePath.startsWith(rootDir)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (!path.extname(requestedPath)) {
        const indexPath = path.join(rootDir, "index.html");

        fs.readFile(indexPath, (indexError, indexContent) => {
          if (indexError) {
            response.writeHead(404);
            response.end("Not found");
            return;
          }

          response.writeHead(200, {
            "Content-Type": contentTypes[".html"]
          });
          response.end(request.method === "HEAD" ? "" : indexContent);
        });
        return;
      }

      response.writeHead(404);
      response.end("Not found");
      return;
    }

    response.writeHead(200, {
      "Content-Type": contentTypes[path.extname(filePath)] || "application/octet-stream"
    });
    response.end(request.method === "HEAD" ? "" : content);
  });
}

const server = http.createServer((request, response) => {
  if (request.url === "/health") {
    sendJson(response, 200, { ok: true });
    return;
  }

  if (request.url.startsWith("/api/email-notifications")) {
    handleEmailNotification(request, response);
    return;
  }

  if (request.url.startsWith("/api/email-inbox")) {
    handleEmailInbox(request, response);
    return;
  }

  if (request.url.startsWith("/api/email-replies")) {
    handleEmailReply(request, response);
    return;
  }

  if (request.url.startsWith("/api/email-attachments")) {
    handleEmailAttachment(request, response);
    return;
  }

  if (request.url.startsWith("/api/cover-requests")) {
    handleCoverRequests(request, response);
    return;
  }

  if (request.url.startsWith("/api/app-state")) {
    handleAppState(request, response);
    return;
  }

  if (request.url.startsWith("/api/blob-upload")) {
    handleBlobUpload(request, response);
    return;
  }

  if (request.url.startsWith("/api/blob-delete")) {
    handleBlobDelete(request, response);
    return;
  }

  serveStatic(request, response);
});

server.listen(port, host, () => {
  console.log(`Peppermint Crew Planner running at http://127.0.0.1:${port}/`);
});
