const crypto = require("crypto");

const coverState = globalThis.__peppermintCoverRequests || {
  requests: new Map()
};

globalThis.__peppermintCoverRequests = coverState;

function publicPerson(person = {}) {
  if (!person) {
    return null;
  }

  return {
    id: person.id,
    name: person.name,
    role: person.role
  };
}

function createCoverRequest(payload) {
  const token = crypto.randomUUID();
  const now = new Date().toISOString();
  const candidates = Array.isArray(payload.candidates) ? payload.candidates : [];

  coverState.requests.set(token, {
    token,
    event: payload.event || {},
    requestedBy: payload.requestedBy || {},
    role: payload.role || "",
    candidates,
    accepted: null,
    createdAt: now
  });

  return coverState.requests.get(token);
}

function publicCoverRequest(record) {
  if (!record) {
    return null;
  }

  return {
    token: record.token,
    event: record.event,
    requestedBy: publicPerson(record.requestedBy),
    role: record.role,
    candidates: record.candidates.map(publicPerson),
    accepted: record.accepted,
    createdAt: record.createdAt
  };
}

function getCoverRequest(token) {
  return coverState.requests.get(String(token || "")) || null;
}

function acceptCoverRequest(token, engineerId, engineerName) {
  const record = getCoverRequest(token);

  if (!record) {
    return { status: "missing" };
  }

  if (record.accepted) {
    return { status: "taken", record };
  }

  const candidate = record.candidates.find((person) => String(person.id) === String(engineerId));

  if (!candidate) {
    return { status: "invalid", record };
  }

  const acceptedBy = candidate;

  record.accepted = {
    id: acceptedBy.id,
    name: acceptedBy.name || String(engineerName || "Unknown engineer").trim() || "Unknown engineer",
    role: acceptedBy.role || "Sound engineer",
    acceptedAt: new Date().toISOString()
  };

  return { status: "accepted", record };
}

module.exports = {
  acceptCoverRequest,
  createCoverRequest,
  getCoverRequest,
  publicCoverRequest
};
