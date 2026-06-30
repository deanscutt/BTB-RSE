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

async function sendResendEmail(payload, options = {}) {
  if (!resendApiKey || !emailFrom) {
    return {
      sent: false,
      reason: options.unconfiguredReason || "Email service is not configured. Set RESEND_API_KEY and EMAIL_FROM in Vercel."
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

  return { sent: true, id: result.id, recipientCount: to.length + cc.length + bcc.length };
}

module.exports = {
  defaultProductionEmail,
  normaliseRecipients,
  sendResendEmail
};
