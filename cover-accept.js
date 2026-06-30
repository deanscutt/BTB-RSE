const coverAcceptForm = document.querySelector("#coverAcceptForm");
const coverAcceptTitle = document.querySelector("#coverAcceptTitle");
const coverAcceptSummary = document.querySelector("#coverAcceptSummary");
const coverAcceptStatus = document.querySelector("#coverAcceptStatus");
const coverEngineerField = document.querySelector("#coverEngineerField");
const coverEngineerOptions = document.querySelector("#coverEngineerOptions");
const coverAcceptButton = document.querySelector("#coverAcceptButton");
const coverToken = new URLSearchParams(window.location.search).get("token") || "";
const coverAcceptedRedirectStorageKey = "peppermint-cover-accepted-redirect";
const rememberedLoginStorageKey = "peppermint-remembered-login";
const activeLoginSessionStorageKey = "peppermint-active-login-session";
let coverRequest = null;

function setCoverStatus(message, isError = false) {
  coverAcceptStatus.textContent = message;
  coverAcceptStatus.style.color = isError ? "var(--coral)" : "var(--muted)";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatCoverDate(dateString) {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(new Date(`${dateString}T12:00:00`));
}

function coverTimeSummary(event) {
  return [
    event.loadInTime ? `${event.loadInTime} load in` : "",
    event.doorsTime ? `${event.doorsTime} doors` : "",
    event.endTime ? `${event.endTime} finish` : ""
  ]
    .filter(Boolean)
    .join(" · ") || "Times TBC";
}

function readCookieValue(name) {
  const prefix = `${name}=`;
  const item = document.cookie
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(prefix));

  if (!item) {
    return "";
  }

  try {
    return decodeURIComponent(item.slice(prefix.length));
  } catch {
    return "";
  }
}

function readLoginRecord(key, storage = window.localStorage) {
  try {
    return JSON.parse(storage?.getItem(key) || "null");
  } catch {
    return null;
  }
}

function readCookieLoginRecord(key) {
  try {
    const value = readCookieValue(key);

    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

function detectedLoggedInProfileId() {
  const sessionLogin =
    readLoginRecord(activeLoginSessionStorageKey, window.sessionStorage) ||
    readCookieLoginRecord(activeLoginSessionStorageKey);
  const rememberedLogin =
    readLoginRecord(rememberedLoginStorageKey, window.localStorage) ||
    readCookieLoginRecord(rememberedLoginStorageKey);
  const record = sessionLogin?.active !== false ? sessionLogin : rememberedLogin?.active !== false ? rememberedLogin : null;

  return record?.level === "technician" ? record.profileId || "" : "";
}

function selectedCoverCandidate() {
  const checked = coverEngineerOptions.querySelector('input[name="coverEngineer"]:checked');

  if (!checked) {
    return null;
  }

  return coverRequest?.candidates?.find((person) => String(person.id) === String(checked.value)) || null;
}

function syncCoverAcceptButton() {
  coverAcceptButton.disabled = !selectedCoverCandidate();
}

function renderCoverEngineerOptions() {
  coverEngineerOptions.innerHTML = coverRequest.candidates
    .map(
      (person) => `
        <label class="cover-engineer-option">
          <input type="checkbox" name="coverEngineer" value="${escapeHtml(person.id)}" />
          <span>
            <strong>${escapeHtml(person.name)}</strong>
            <small>${escapeHtml(person.role)}</small>
          </span>
        </label>
      `
    )
    .join("");

  coverEngineerOptions.querySelectorAll('input[name="coverEngineer"]').forEach((input) => {
    input.addEventListener("change", () => {
      if (input.checked) {
        coverEngineerOptions.querySelectorAll('input[name="coverEngineer"]').forEach((option) => {
          if (option !== input) {
            option.checked = false;
          }
        });
      }

      syncCoverAcceptButton();
    });
  });
}

function coverEmailStatusText(emailResult) {
  if (!emailResult) {
    return "";
  }

  if (emailResult.sent) {
    return emailResult.requestedEngineerIncluded
      ? " Confirmation email sent to production and the engineer who offered the shift."
      : " Confirmation email sent to production. The original engineer has no email saved.";
  }

  return emailResult.reason ? ` Confirmation email could not be sent automatically: ${emailResult.reason}` : " Confirmation email could not be sent automatically.";
}

async function acceptCoverCandidate(selectedCandidate, options = {}) {
  if (!selectedCandidate) {
    coverAcceptButton.disabled = false;
    setCoverStatus("Tick your name before accepting cover.", true);
    return false;
  }

  coverAcceptButton.disabled = true;
  setCoverStatus(options.auto ? `You are logged in as ${selectedCandidate.name}. Confirming cover...` : "Confirming cover...");

  const response = await fetch("/api/cover-requests", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "accept",
      token: coverToken,
      engineerId: selectedCandidate.id,
      engineerName: selectedCandidate.name
    })
  });
  const result = await response.json().catch(() => ({}));

  if (response.status === 409 && result.request?.accepted) {
    coverRequest = result.request;
    setCoverStatus(`${result.request.accepted.name} has already accepted this cover.`);
    return false;
  }

  if (!response.ok || !result.accepted) {
    if (options.auto) {
      coverEngineerField.hidden = false;
    }

    coverAcceptButton.disabled = false;
    syncCoverAcceptButton();
    setCoverStatus(result.reason || "Could not accept this cover. Please try again.", true);
    return false;
  }

  coverRequest = result.request;
  coverEngineerField.hidden = true;
  setCoverStatus(`Confirmed. ${result.request.accepted.name} has accepted this shift and is marked confirmed.${coverEmailStatusText(result.email)}`, Boolean(result.email && !result.email.sent));
  redirectToDashboard(result.request);
  return true;
}

function coverDashboardLevel(person = {}) {
  const role = String(person.role || "").toLowerCase();

  if (role.includes("dj")) {
    return "dj";
  }

  if (role.includes("promoter") || role.includes("producer")) {
    return "promoter";
  }

  return "technician";
}

function rememberCoverAcceptedRedirect(record) {
  const accepted = record.accepted || {};

  try {
    window.localStorage?.setItem(
      coverAcceptedRedirectStorageKey,
      JSON.stringify({
        token: record.token || coverToken,
        level: coverDashboardLevel(accepted),
        profileId: accepted.id || "",
        accepted,
        event: record.event || {},
        requestedBy: record.requestedBy || {},
        role: record.role || "",
        createdAt: new Date().toISOString()
      })
    );
  } catch {
    // Redirect still works even if local storage is unavailable.
  }
}

function redirectToDashboard(record) {
  rememberCoverAcceptedRedirect(record);
  setCoverStatus(`Confirmed. ${record.accepted.name} has accepted this shift. Redirecting to their dashboard...`);
  window.setTimeout(() => {
    window.location.assign(`${window.location.origin}/?coverAccepted=1`);
  }, 1200);
}

async function loadCoverRequest() {
  if (!coverToken) {
    coverAcceptTitle.textContent = "Missing link";
    coverAcceptSummary.textContent = "This cover request link is missing its confirmation code.";
    setCoverStatus("Ask production to resend the cover request.", true);
    return;
  }

  const response = await fetch(`/api/cover-requests?token=${encodeURIComponent(coverToken)}`);
  const result = await response.json().catch(() => ({}));

  if (!response.ok || !result.found) {
    coverAcceptTitle.textContent = "Request not found";
    coverAcceptSummary.textContent = result.reason || "This cover request could not be found.";
    setCoverStatus("It may have expired or been replaced.", true);
    return;
  }

  coverRequest = result.request;
  const event = coverRequest.event || {};

  coverAcceptTitle.textContent = event.title || "Cover request";
  coverAcceptSummary.textContent = `${formatCoverDate(event.date)} · ${event.venue || "Venue TBC"} · ${coverTimeSummary(event)}`;

  if (coverRequest.accepted) {
    coverAcceptButton.disabled = true;
    setCoverStatus(`${coverRequest.accepted.name} has already accepted this cover.`);
    return;
  }

  renderCoverEngineerOptions();
  const remembered = detectedLoggedInProfileId();

  if (remembered && coverRequest.candidates.some((person) => String(person.id) === String(remembered))) {
    const rememberedOption = [...coverEngineerOptions.querySelectorAll('input[name="coverEngineer"]')].find((option) => String(option.value) === String(remembered));
    const rememberedCandidate = coverRequest.candidates.find((person) => String(person.id) === String(remembered));

    if (rememberedOption) {
      rememberedOption.checked = true;
    }

    if (rememberedCandidate) {
      coverEngineerField.hidden = true;
      syncCoverAcceptButton();
      acceptCoverCandidate(rememberedCandidate, { auto: true });
      return;
    }
  }

  coverEngineerField.hidden = false;
  syncCoverAcceptButton();
  setCoverStatus(coverRequest.candidates.length ? "First engineer to accept gets this shift. No extra login confirmation is needed." : "No available engineers are attached to this request.", !coverRequest.candidates.length);
}

coverAcceptForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!coverRequest || coverAcceptButton.disabled) {
    return;
  }

  acceptCoverCandidate(selectedCoverCandidate());
});

loadCoverRequest().catch((error) => {
  coverAcceptTitle.textContent = "Could not load";
  coverAcceptSummary.textContent = "This cover request could not be loaded.";
  setCoverStatus(error.message, true);
});
