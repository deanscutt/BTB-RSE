const gmailUserEmail = process.env.GMAIL_USER_EMAIL || process.env.PRODUCTION_EMAIL || "production@betweenthebridges.co.uk";
const googleClientId = process.env.GOOGLE_CLIENT_ID || "";
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET || "";
const gmailRefreshToken = process.env.GMAIL_REFRESH_TOKEN || "";
const { uploadBlobBuffer } = require("./blob-store");

function gmailIsConfigured() {
  return Boolean(googleClientId && googleClientSecret && gmailRefreshToken);
}

function base64UrlBuffer(value = "") {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");

  return Buffer.from(padded, "base64");
}

function decodeBase64Url(value = "") {
  return base64UrlBuffer(value).toString("utf8");
}

function encodeBase64Url(value = "") {
  return Buffer.from(value).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function encodeBufferBase64Url(buffer) {
  return Buffer.from(buffer).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function encodeMimeBase64(buffer) {
  return Buffer.from(buffer).toString("base64").replace(/.{1,76}/g, "$&\r\n").trim();
}

function headerValue(headers = [], name) {
  return headers.find((header) => header.name.toLowerCase() === name.toLowerCase())?.value || "";
}

function htmlToText(html = "") {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function bodyPartHtml(part) {
  if (!part) {
    return "";
  }

  if (part.mimeType === "text/html" && part.body?.data) {
    return decodeBase64Url(part.body.data).trim();
  }

  return (part.parts || []).map(bodyPartHtml).find(Boolean) || "";
}

function bodyPartText(part) {
  if (!part) {
    return "";
  }

  if (part.mimeType === "text/plain" && part.body?.data) {
    return decodeBase64Url(part.body.data).trim();
  }

  if (part.mimeType === "text/html" && part.body?.data) {
    return htmlToText(decodeBase64Url(part.body.data));
  }

  const childParts = part.parts || [];
  const plainPart = childParts.map(bodyPartText).find(Boolean);

  return plainPart || "";
}

function emailAddress(value = "") {
  const match = value.match(/<([^>]+)>/);
  return (match ? match[1] : value).trim();
}

function emailAddresses(value = "") {
  const matches = String(value).match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) || [];
  const seen = new Set();

  return matches.filter((email) => {
    const key = email.toLowerCase();

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function normaliseEmailRecipients(value) {
  if (Array.isArray(value)) {
    return value.map(String).map((item) => item.trim()).filter(Boolean);
  }

  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function attachmentParts(part, attachments = []) {
  if (!part) {
    return attachments;
  }

  if (part.filename && part.body?.attachmentId) {
    attachments.push({
      id: part.body.attachmentId,
      attachmentId: part.body.attachmentId,
      filename: part.filename,
      name: part.filename,
      contentType: part.mimeType || "application/octet-stream",
      size: Number(part.body.size) || 0
    });
  }

  (part.parts || []).forEach((childPart) => attachmentParts(childPart, attachments));

  return attachments;
}

function escapeHeader(value = "") {
  return String(value).replace(/[\r\n]/g, " ").trim();
}

function escapeMimeParameter(value = "") {
  return escapeHeader(value).replace(/["\\]/g, "_") || "attachment";
}

function outgoingAttachmentBuffer(data = "") {
  const rawData = String(data || "");
  const base64 = rawData.includes(",") ? rawData.split(",").pop() : rawData;
  const normalised = base64.replace(/-/g, "+").replace(/_/g, "/");

  return Buffer.from(normalised, "base64");
}

function normaliseOutgoingAttachments(attachments = []) {
  if (!Array.isArray(attachments)) {
    return [];
  }

  return attachments
    .map((attachment, index) => {
      const body = outgoingAttachmentBuffer(attachment.data || attachment.content || "");

      if (!body.length) {
        return null;
      }

      return {
        filename: escapeMimeParameter(attachment.filename || attachment.name || `attachment-${index + 1}`),
        contentType: escapeHeader(attachment.contentType || attachment.type || "application/octet-stream") || "application/octet-stream",
        body
      };
    })
    .filter(Boolean);
}

async function gmailAccessToken() {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: googleClientId,
      client_secret: googleClientSecret,
      refresh_token: gmailRefreshToken,
      grant_type: "refresh_token"
    })
  });
  const result = await response.json().catch(() => ({}));

  if (!response.ok || !result.access_token) {
    throw new Error(result.error_description || result.error || "Gmail authentication failed.");
  }

  return result.access_token;
}

async function gmailRequest(path, options = {}) {
  const token = await gmailAccessToken();
  const response = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });
  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(result.error?.message || "Gmail request failed.");
  }

  return result;
}

function demoInbox() {
  return [
    {
      id: "demo-client-brief",
      threadId: "demo-client-brief",
      from: "Avery Cole <avery@client.example>",
      fromEmail: "avery@client.example",
      subject: "Updated brief for Riverside Upstairs",
      date: new Date("2026-06-28T09:15:00Z").toISOString(),
      snippet: "Please can you confirm the DJ arrival time and whether the client notes have reached the crew?",
      body: "Hi Dean,\n\nPlease can you confirm the DJ arrival time and whether the client notes have reached the crew?\n\nThanks,\nAvery",
      bodyHtml: "<p>Hi Dean,</p><p>Please can you confirm the DJ arrival time and whether the client notes have reached the crew?</p><p><span style=\"color:#d71920\">Red client notes should stay visible here.</span></p><p>Thanks,<br>Avery</p>",
      to: gmailUserEmail,
      cc: "",
      replyToEmails: ["avery@client.example"],
      replyAllCc: [],
      attachments: [],
      unread: true
    },
    {
      id: "demo-cover-query",
      threadId: "demo-cover-query",
      from: "Riley Stone <riley@peppermint.local>",
      fromEmail: "riley@peppermint.local",
      subject: "Cover option for Monday evening",
      date: new Date("2026-06-27T17:40:00Z").toISOString(),
      snippet: "I can cover Riverside Upstairs if Theo still needs someone for load in.",
      body: "Hi Dean,\n\nI can cover Riverside Upstairs if Theo still needs someone for load in.\n\nRiley",
      to: gmailUserEmail,
      cc: "",
      replyToEmails: ["riley@peppermint.local"],
      replyAllCc: [],
      attachments: [],
      unread: false
    },
    {
      id: "demo-supplier",
      threadId: "demo-supplier",
      from: "Teahorse Support <support@teahorse.example>",
      fromEmail: "support@teahorse.example",
      subject: "Re: Dock equipment report",
      date: new Date("2026-06-27T12:20:00Z").toISOString(),
      snippet: "We have logged the issue and can send a replacement cable set before doors.",
      body: "Hi,\n\nWe have logged the issue and can send a replacement cable set before doors.\n\nBest,\nTeahorse",
      to: gmailUserEmail,
      cc: "",
      replyToEmails: ["support@teahorse.example"],
      replyAllCc: [],
      attachments: [],
      unread: true
    }
  ];
}

async function listInbox({ maxResults = 10 } = {}) {
  if (!gmailIsConfigured()) {
    return {
      connected: false,
      account: gmailUserEmail,
      unread: demoInbox().filter((message) => message.unread).length,
      messages: demoInbox(),
      setup: "Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GMAIL_REFRESH_TOKEN to show the live Gmail inbox."
    };
  }

  const list = await gmailRequest(`/messages?labelIds=INBOX&maxResults=${Number(maxResults) || 10}`);
  const messages = await Promise.all(
    (list.messages || []).map(async (message) => {
      const detail = await gmailRequest(`/messages/${message.id}?format=full`);
      const headers = detail.payload?.headers || [];
      const from = headerValue(headers, "From");
      const to = headerValue(headers, "To");
      const cc = headerValue(headers, "Cc");
      const replyTo = headerValue(headers, "Reply-To");
      const subject = headerValue(headers, "Subject") || "(no subject)";
      const dateHeader = headerValue(headers, "Date");
      const bodyHtml = bodyPartHtml(detail.payload);
      const body = bodyPartText(detail.payload) || htmlToText(bodyHtml);
      const replyToEmails = emailAddresses(replyTo || from);
      const replyTargetKeys = new Set(replyToEmails.map((email) => email.toLowerCase()));
      const accountEmail = gmailUserEmail.toLowerCase();
      const replyAllCc = [...emailAddresses(to), ...emailAddresses(cc)].filter((email, index, emails) => {
        const key = email.toLowerCase();

        return key !== accountEmail && !replyTargetKeys.has(key) && emails.findIndex((item) => item.toLowerCase() === key) === index;
      });

      return {
        id: detail.id,
        threadId: detail.threadId,
        from,
        fromEmail: emailAddress(from),
        to,
        toEmails: emailAddresses(to),
        cc,
        ccEmails: emailAddresses(cc),
        replyToEmails,
        replyAllCc,
        subject,
        date: dateHeader ? new Date(dateHeader).toISOString() : new Date(Number(detail.internalDate || Date.now())).toISOString(),
        snippet: detail.snippet || body.slice(0, 160),
        body,
        bodyHtml,
        attachments: attachmentParts(detail.payload),
        unread: (detail.labelIds || []).includes("UNREAD")
      };
    })
  );

  return {
    connected: true,
    account: gmailUserEmail,
    unread: messages.filter((message) => message.unread).length,
    messages
  };
}

async function sendGmailReply({ threadId, to, cc, subject, body, attachments = [] }) {
  if (!gmailIsConfigured()) {
    return {
      sent: false,
      reason: "Gmail is not configured. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GMAIL_REFRESH_TOKEN."
    };
  }

  const toList = normaliseEmailRecipients(to);
  const ccList = normaliseEmailRecipients(cc);

  if (!toList.length || !subject || !body) {
    return { sent: false, reason: "Reply needs a recipient, subject, and message." };
  }

  const outgoingAttachments = normaliseOutgoingAttachments(attachments);
  const attachmentBytes = outgoingAttachments.reduce((total, attachment) => total + attachment.body.length, 0);

  if (attachmentBytes > 18 * 1024 * 1024) {
    return { sent: false, reason: "Attachments are too large to send together." };
  }

  const rawLines = [
    `From: ${escapeHeader(gmailUserEmail)}`,
    `To: ${escapeHeader(toList.join(", "))}`,
    "MIME-Version: 1.0",
  ];

  if (ccList.length) {
    rawLines.push(`Cc: ${escapeHeader(ccList.join(", "))}`);
  }

  rawLines.push(`Subject: ${escapeHeader(subject)}`);

  if (outgoingAttachments.length) {
    const boundary = `peppermint-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    rawLines.push(
      `Content-Type: multipart/mixed; boundary="${boundary}"`,
      "",
      `--${boundary}`,
      "Content-Type: text/plain; charset=utf-8",
      "Content-Transfer-Encoding: base64",
      "",
      encodeMimeBase64(Buffer.from(body, "utf8"))
    );

    outgoingAttachments.forEach((attachment) => {
      rawLines.push(
        `--${boundary}`,
        `Content-Type: ${attachment.contentType}; name="${attachment.filename}"`,
        "Content-Transfer-Encoding: base64",
        `Content-Disposition: attachment; filename="${attachment.filename}"`,
        "",
        encodeMimeBase64(attachment.body)
      );
    });

    rawLines.push(`--${boundary}--`);
  } else {
    rawLines.push(
      "Content-Type: text/plain; charset=utf-8",
      "Content-Transfer-Encoding: base64",
      "",
      encodeMimeBase64(Buffer.from(body, "utf8"))
    );
  }

  const raw = rawLines.join("\r\n");

  const result = await gmailRequest("/messages/send", {
    method: "POST",
    body: JSON.stringify({
      raw: encodeBufferBase64Url(Buffer.from(raw, "utf8")),
      threadId
    })
  });

  return { sent: true, id: result.id, threadId: result.threadId, attachmentCount: outgoingAttachments.length };
}

async function markGmailMessageRead({ messageId }) {
  if (!gmailIsConfigured()) {
    return {
      marked: true,
      demo: true,
      messageId,
      reason: "Gmail is not configured; demo inbox state updated in the app only."
    };
  }

  if (!messageId) {
    return { marked: false, reason: "Choose an email to mark as read." };
  }

  await gmailRequest(`/messages/${encodeURIComponent(messageId)}/modify`, {
    method: "POST",
    body: JSON.stringify({ removeLabelIds: ["UNREAD"] })
  });

  return { marked: true, messageId };
}

async function saveGmailAttachmentToDocuments({ messageId, attachmentId, filename, contentType, documentId }) {
  if (!gmailIsConfigured()) {
    return {
      saved: false,
      reason: "Gmail is not configured. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GMAIL_REFRESH_TOKEN."
    };
  }

  if (!messageId || !attachmentId) {
    return { saved: false, reason: "Choose an email attachment to save." };
  }

  const attachment = await gmailRequest(`/messages/${encodeURIComponent(messageId)}/attachments/${encodeURIComponent(attachmentId)}`);
  const fileBody = base64UrlBuffer(attachment.data || "");
  const name = filename || "email-attachment";
  const uploaded = await uploadBlobBuffer({
    body: fileBody,
    filename: name,
    contentType: contentType || "application/octet-stream",
    folder: "documents"
  });

  if (!uploaded.uploaded) {
    return { saved: false, reason: uploaded.reason || "Attachment could not be saved to documents." };
  }

  return {
    saved: true,
    document: {
      id: documentId || `email-${messageId}-${attachmentId}`,
      name,
      type: contentType || uploaded.contentType || "Document",
      size: Number(uploaded.size) || Number(attachment.sizeEstimate) || fileBody.length,
      url: uploaded.url,
      downloadUrl: uploaded.downloadUrl || uploaded.url,
      pathname: uploaded.pathname || "",
      storage: "blob",
      placeholder: false
    }
  };
}

module.exports = {
  demoInbox,
  gmailIsConfigured,
  listInbox,
  markGmailMessageRead,
  saveGmailAttachmentToDocuments,
  sendGmailReply
};
