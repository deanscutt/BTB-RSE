const { defaultProductionEmail, sendResendEmail } = require("./email-service");

function formatEventDate(dateString) {
  if (!dateString) {
    return "Date TBC";
  }

  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(new Date(`${dateString}T12:00:00`));
}

function eventTimeSummary(event = {}) {
  return [
    event.loadInTime ? `${event.loadInTime} load in` : "",
    event.doorsTime ? `${event.doorsTime} doors` : "",
    event.endTime ? `${event.endTime} finish` : "",
    event.time ? `${event.time}` : ""
  ]
    .filter(Boolean)
    .join(" · ") || "Times TBC";
}

function uniqueRecipients(recipients) {
  return [...new Set(recipients.map(String).map((item) => item.trim()).filter(Boolean))];
}

function coverFilledEmailBody(record) {
  const event = record.event || {};
  const accepted = record.accepted || {};
  const requestedBy = record.requestedBy || {};

  return [
    "Cover shift filled",
    "",
    `${accepted.name || "An engineer"} has accepted the cover request.`,
    "",
    `Event: ${event.title || "Untitled event"}`,
    `Date: ${formatEventDate(event.date)}`,
    `Venue: ${event.venue || "Venue TBC"}`,
    `Times: ${eventTimeSummary(event)}`,
    `Role(s): ${record.role || requestedBy.role || "Sound engineer"}`,
    "",
    `Original engineer: ${requestedBy.name || "Unknown engineer"}`,
    `Cover accepted by: ${accepted.name || "Unknown engineer"}`,
    "",
    "The rota will update automatically when the planner syncs."
  ].join("\n");
}

async function sendCoverFilledEmail(record) {
  const event = record.event || {};
  const requestedBy = record.requestedBy || {};
  const to = uniqueRecipients([defaultProductionEmail, requestedBy.email]);

  const result = await sendResendEmail(
    {
      to,
      subject: `Cover filled - ${event.title || "Shift"} - ${formatEventDate(event.date)}`,
      body: coverFilledEmailBody(record)
    },
    {
      unconfiguredReason: "Email service is not configured. Set RESEND_API_KEY and EMAIL_FROM in Vercel."
    }
  );

  return {
    ...result,
    requestedEngineerIncluded: Boolean(requestedBy.email)
  };
}

module.exports = {
  sendCoverFilledEmail
};
