const resendApiKey = process.env.RESEND_API_KEY || "";
const emailFrom = process.env.EMAIL_FROM || "";
const defaultProductionEmail = process.env.PRODUCTION_EMAIL || "production@betweenthebridges.co.uk";

function normaliseRecipients(value) {
  if (Array.isArray(value)) {
    return value.map(String).map((item) => item.trim()).filter(Boolean);
  }

  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function sendJson(response, statusCode, payload) {
  response.status(statusCode).json(payload);
}

async function sendResendEmail(payload) {
  if (!resendApiKey || !emailFrom) {
    return {
      sent: false,
      reason: "Email service is not configured. Set RESEND_API_KEY and EMAIL_FROM in Vercel."
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

module.exports = async function handler(request, response) {
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");
  response.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");

  if (request.method === "OPTIONS") {
    response.status(204).end();
    return;
  }

  if (request.method !== "POST") {
    sendJson(response, 405, { sent: false, reason: "Use POST for email notifications." });
    return;
  }

  try {
    const payload = typeof request.body === "object" && request.body !== null ? request.body : JSON.parse(request.body || "{}");
    const result = await sendResendEmail(payload);

    sendJson(response, result.sent ? 200 : 503, result);
  } catch (error) {
    sendJson(response, 500, { sent: false, reason: error.message });
  }
};
