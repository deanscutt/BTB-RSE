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

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml"
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
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json; charset=utf-8"
  });
  response.end(JSON.stringify(payload));
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

function serveStatic(request, response) {
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
      response.writeHead(404);
      response.end("Not found");
      return;
    }

    response.writeHead(200, {
      "Content-Type": contentTypes[path.extname(filePath)] || "application/octet-stream"
    });
    response.end(content);
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

  serveStatic(request, response);
});

server.listen(port, host, () => {
  console.log(`Peppermint Crew Planner running at http://127.0.0.1:${port}/`);
});
