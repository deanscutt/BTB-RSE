const freelancers = [
  { id: 1, name: "Maya Hughes", role: "Promoter", location: "London", status: "available", unavailableDates: ["2026-06-30"] },
  {
    id: 2,
    name: "Theo Martin",
    role: "Sound engineer",
    location: "Manchester",
    status: "available",
    unavailableDates: [],
    email: "theo@peppermint.local",
    whatsapp: "+44 7700 900102"
  },
  { id: 3, name: "Nia Clarke", role: "DJ", location: "Bristol", status: "limited", unavailableDates: ["2026-06-27"] },
  { id: 4, name: "Jon Bell", role: "Crew", location: "Leeds", status: "available", unavailableDates: [] },
  { id: 5, name: "Asha Patel", role: "DJ", location: "London", status: "available", unavailableDates: ["2026-06-28", "2026-06-29"] },
  {
    id: 6,
    name: "Sam Brooks",
    role: "Lighting engineer",
    location: "Brighton",
    status: "available",
    unavailableDates: ["2026-07-02"],
    email: "sam@peppermint.local",
    whatsapp: "+44 7700 900106"
  },
  {
    id: 7,
    name: "Riley Stone",
    role: "Sound engineer",
    location: "London",
    status: "available",
    unavailableDates: ["2026-06-29"],
    email: "riley@peppermint.local",
    whatsapp: "+44 7700 900107"
  }
];

const events = [
  {
    id: 101,
    title: "Retail summer launch",
    date: "2026-06-28",
    time: "10:00",
    loadInTime: "08:00",
    doorsTime: "10:00",
    endTime: "16:00",
    venue: "Dock",
    promoterId: 1,
    status: "confirmed",
    roles: ["Sound engineer", "Lighting engineer", "Crew"],
    roleAssignments: { "Sound engineer": 2, "Lighting engineer": 6, Crew: 4 },
    crew: [2, 6, 4],
    setTimes: "10:00 - Guest arrival\n12:00 - Product demo\n15:30 - Final guest rotation",
    notes: "Use Dock entrance for load in. Client contact will meet crew on arrival.",
    docs: ["Event brief.pdf", "Floor plan.pdf"]
  },
  {
    id: 102,
    title: "Private members evening",
    date: "2026-06-29",
    time: "17:30",
    loadInTime: "15:00",
    doorsTime: "17:30",
    endTime: "23:00",
    venue: "Riverside Upstairs",
    promoterId: 1,
    status: "contract-sent",
    roles: ["DJ", "Crew"],
    roleAssignments: { DJ: 3, Crew: 4 },
    crew: [3, 4],
    setTimes: "17:30 - Doors\n19:00 - Welcome drinks\n22:30 - Last entry",
    notes: "Keep Riverside Upstairs clear for client photography before doors.",
    docs: ["Client notes.docx"]
  },
  {
    id: 103,
    title: "Brand sampling roadshow",
    date: "2026-07-01",
    time: "08:45",
    loadInTime: "07:30",
    doorsTime: "08:45",
    endTime: "18:00",
    venue: "Garden",
    promoterId: 1,
    status: "pencil",
    roles: ["Sound engineer", "DJ"],
    roleAssignments: { "Sound engineer": 2, DJ: 5 },
    crew: [2, 5],
    setTimes: "08:45 - Stand opens\n13:00 - Sampling push\n17:30 - Breakdown prep",
    notes: "Bring spare branded stock and confirm photography consent signage.",
    docs: ["Risk assessment.pdf", "Call sheet.xlsx"]
  }
];

const generalDocuments = [];
let selectedEventId = events[0].id;
let selectedAvailabilityPersonId = freelancers[0].id;
let availabilityMonthOffset = 0;
let draftUnavailableDates = [];
let draftAmUnavailableDates = [];
let calendarFocusDate = new Date("2026-06-26T12:00:00");
let crewFocusDate = new Date("2026-06-26T12:00:00");
let rotaFocusDate = new Date("2026-06-26T12:00:00");
const availabilityStartDate = new Date("2026-06-01T12:00:00");
const maxAvailabilityMonthOffset = 6;
const indefiniteRepeatYears = 10;
const accessProfiles = {
  admin: {
    label: "Admin",
    allowedViews: ["dashboard", "calendar", "rota", "docs", "email", "profiles", "crew"],
    dashboardPanels: ["calendar", "event", "docs", "rota", "profiles", "crew"],
    canAddAvailability: false,
    canCreateEvents: true,
    canEditEvents: true,
    canAttachDocs: true,
    canNotifyCrew: true,
    canExportRota: true,
    canGenerateSheet: true
  },
  technician: {
    label: "Sound engineer",
    allowedViews: ["dashboard", "rota", "crew", "myprofile", "report"],
    dashboardPanels: ["event", "rota", "crew"],
    canAddAvailability: true,
    canCreateEvents: false,
    canEditEvents: false,
    canAttachDocs: false,
    canNotifyCrew: false,
    canExportRota: false,
    canGenerateSheet: true
  },
  dj: {
    label: "DJ",
    allowedViews: ["dashboard", "rota", "myprofile"],
    dashboardPanels: ["event", "rota"],
    canAddAvailability: true,
    canCreateEvents: false,
    canEditEvents: false,
    canAttachDocs: false,
    canNotifyCrew: false,
    canExportRota: false,
    canGenerateSheet: false
  },
  promoter: {
    label: "Promoter",
    allowedViews: ["dashboard", "calendar", "myprofile"],
    dashboardPanels: ["calendar", "event"],
    canAddAvailability: false,
    canCreateEvents: true,
    canEditEvents: true,
    canAttachDocs: true,
    canNotifyCrew: false,
    canExportRota: false,
    canGenerateSheet: true
  }
};
const staffProfileConfig = {
  technician: {
    profileLabel: "Sound engineer profile",
    roles: ["Sound engineer"],
    coverLabel: "sound engineer"
  },
  dj: {
    profileLabel: "DJ profile",
    roles: ["DJ"],
    coverLabel: "DJ"
  }
};
const viewConfig = {
  dashboard: {
    title: "BTB/RSE",
    subtitle: "Dashboard home gives you the full operational picture at a glance.",
    panels: ["calendar", "event", "crew", "docs", "rota"],
    showStats: true
  },
  calendar: {
    title: "Calendar",
    subtitle: "Review upcoming event dates, select bookings, and see event details beside the calendar.",
    panels: ["calendar", "event"],
    showStats: true
  },
  crew: {
    title: "Crew availability",
    subtitle: "See who is unavailable by date, filter freelancers by role, and open the availability calendar.",
    panels: ["crew"],
    showStats: true
  },
  profiles: {
    title: "Profiles",
    subtitle: "Create and manage profiles for sound engineers, lighting engineers, DJs, and crew.",
    panels: ["profiles"],
    showStats: true
  },
  myprofile: {
    title: "My profile",
    subtitle: "Update your contact details, passcode, and profile picture.",
    panels: ["myprofile"],
    showStats: true
  },
  rota: {
    title: "Rota",
    subtitle: "Check the weekly schedule, assigned freelancers, staffing, and availability clashes.",
    panels: ["rota"],
    showStats: true
  },
  docs: {
    title: "Documents",
    subtitle: "Keep event files attached to the selected booking and add new documents when needed.",
    panels: ["docs", "event"],
    showStats: true
  },
  email: {
    title: "Email",
    subtitle: "Manage the production Gmail account used for admin notifications and operational drafts.",
    panels: ["email"],
    showStats: true
  },
  report: {
    title: "Report",
    subtitle: "Log an equipment issue on site and prepare an email for the production team.",
    panels: ["report"],
    showStats: false
  }
};
let activeView = "dashboard";
let calendarView = "week";
let crewAvailabilityView = "week";
let rotaView = "week";
let activeUserLevel = "admin";
let isLoggedIn = false;
let editingEventId = null;
let activeTechnicianId =
  freelancers.find((person) => person.role === "Sound engineer")?.id ||
  freelancers.find((person) => person.role === "Technician")?.id ||
  freelancers[0].id;
let activeDjId = freelancers.find((person) => person.role === "DJ")?.id || freelancers[0].id;
let activePromoterId = freelancers.find((person) => person.role === "Promoter")?.id || freelancers[0].id;
let selectedCoverEventId = null;
let eventSheetEventId = null;
let repeatSpecificDates = [];
let editingProfileId = null;
let activeProfileRole = null;
let rotaAssignmentEventId = null;
let pendingRotaWhatsappMessages = [];
let pendingEventDocuments = [];
let documentEventPickerDocumentId = null;
let documentEventPickerFocusDate = new Date("2026-06-26T12:00:00");
const documentEventPickerSelectedIds = new Set();
let weatherForecastStatus = "idle";
let weatherForecastData = null;
let tubeStatusState = "idle";
let tubeStatusData = null;
let tubeStatusExpanded = false;
let unlockedProfileState = null;
let selfProfilePhotoDraft = null;
let selfProfilePhotoFileDraft = null;
let selfProfilePhotoCropState = null;
const unlockedPasscodeKeys = new Set();
const passcodeStorageKey = "peppermint-profile-passcodes";
const profileReviewStorageKey = "peppermint-profile-review-prompts";
const rememberedLoginStorageKey = "peppermint-remembered-login";
const activeLoginSessionStorageKey = "peppermint-active-login-session";
const activeLoginHistoryStateKey = "peppermintActiveLogin";
const activeLoginWindowNameKey = "peppermintActiveLogin";
const pendingCoverStorageKey = "peppermint-pending-cover-requests";
const coverAcceptedRedirectStorageKey = "peppermint-cover-accepted-redirect";
const appDataStorageKey = "peppermint-app-data-v1";
const productionEmailAddress = "production@betweenthebridges.co.uk";
let inboxEmailCount = 0;
let unreadInboxEmailCount = 0;
let emailInboxState = {
  loading: false,
  connected: false,
  setup: "",
  error: "",
  messages: []
};
let selectedInboxEmailId = null;
const savingEmailAttachmentKeys = new Set();
let coverSyncInFlight = false;
let appDataPersistenceReady = false;
let appDataStorageWarningShown = false;
let appDataRemoteReady = false;
let appDataRemoteLoadPromise = null;
let appDataRemoteSaveTimer = null;
let appDataRemoteWarningShown = false;
let appDataLocalChangeCounter = 0;
let appDataLoadedFromStorage = false;
let appDataLastSavedAt = new Date().toISOString();
const coverProductionWhatsapp = "+447444285646";
const emailNotificationPath = "/api/email-notifications";
const emailInboxPath = "/api/email-inbox";
const emailReadPath = "/api/email-read";
const emailRepliesPath = "/api/email-replies";
const emailAttachmentsPath = "/api/email-attachments";
const appStatePath = "/api/app-state";
const blobUploadPath = "/api/blob-upload";
const blobDeletePath = "/api/blob-delete";
const coverRequestsPath = "/api/cover-requests";
const coverWhatsappGroupUrls = {
  btb: "https://chat.whatsapp.com/IxhlxUmAGS8IcXX2qLJywr?mode=gi_t",
  riverside: "https://chat.whatsapp.com/CR1GQX8ED7ZGhNBFCMjMaS?mode=gi_t"
};
const coverWhatsappGroupVenues = {
  dock: coverWhatsappGroupUrls.btb,
  pier: coverWhatsappGroupUrls.btb,
  garden: coverWhatsappGroupUrls.btb,
  "whole site btb": coverWhatsappGroupUrls.btb,
  "riverside yard": coverWhatsappGroupUrls.riverside,
  "riverside upstairs": coverWhatsappGroupUrls.riverside,
  "riverside whole site": coverWhatsappGroupUrls.riverside
};
const dashboardPanelTargets = {
  calendar: "calendar",
  event: "calendar",
  docs: "docs",
  rota: "rota",
  profiles: "profiles",
  crew: "crew",
  myprofile: "myprofile",
  report: "report",
  email: "email"
};

const loginScreen = document.querySelector("#loginScreen");
const loginForm = document.querySelector("#loginForm");
const loginLevelSelect = document.querySelector("#loginLevelSelect");
const loginProfileField = document.querySelector("#loginProfileField");
const loginProfileLabel = document.querySelector("#loginProfileLabel");
const loginEmailInput = document.querySelector("#loginEmailInput");
const rememberDevice = document.querySelector("#rememberDevice");
const appShell = document.querySelector("#appShell");
const workspace = document.querySelector("#workspace");
const workspaceTitle = document.querySelector("#workspaceTitle");
const workspaceSubtitle = document.querySelector("#workspaceSubtitle");
const logoutButton = document.querySelector("#logoutButton");
const appBrandMark = document.querySelector("#appBrandMark");
const sidebarPanel = document.querySelector(".sidebar-panel");
const themeToggle = document.querySelector("#themeToggle");
const themeToggleLabel = document.querySelector("#themeToggleLabel");
const statsGrid = document.querySelector(".stats-grid");
const mainGrid = document.querySelector(".main-grid");
const panels = [...document.querySelectorAll("[data-panel]")];
const weatherSummary = document.querySelector("#weatherSummary");
const weatherList = document.querySelector("#weatherList");
const weatherUpdated = document.querySelector("#weatherUpdated");
const refreshWeather = document.querySelector("#refreshWeather");
const dashboardTube = document.querySelector("#dashboardTube");
const dashboardEmail = document.querySelector("#dashboardEmail");
const tubeSummary = document.querySelector("#tubeSummary");
const tubeList = document.querySelector("#tubeList");
const tubeUpdated = document.querySelector("#tubeUpdated");
const refreshTubeStatus = document.querySelector("#refreshTubeStatus");
const tubeExpandToggle = document.querySelector("#tubeExpandToggle");
const unreadEmailCount = document.querySelector("#unreadEmailCount");
const unreadEmailLabel = document.querySelector("#unreadEmailLabel");
const unreadEmailAccount = document.querySelector("#unreadEmailAccount");
const openEmailDashboard = document.querySelector("#openEmailDashboard");
const calendarTitle = document.querySelector("#calendarTitle");
const calendarStrip = document.querySelector("#calendarStrip");
const myBookingsFilter = document.querySelector("#myBookingsFilter");
const myBookingsToggle = document.querySelector("#myBookingsToggle");
const calendarVenueFilterField = document.querySelector("#calendarVenueFilterField");
const calendarVenueFilter = document.querySelector("#calendarVenueFilter");
const previousCalendarPeriod = document.querySelector("#previousCalendarPeriod");
const nextCalendarPeriod = document.querySelector("#nextCalendarPeriod");
const availabilityBoard = document.querySelector("#availabilityBoard");
const crewPanelEyebrow = document.querySelector("#crewPanelEyebrow");
const crewAvailabilityTitle = document.querySelector("#crewAvailabilityTitle");
const crewAvailabilityViewControl = document.querySelector("#crewAvailabilityView");
const crewPeriodControls = document.querySelector("#crewPeriodControls");
const crewPeriodLabel = document.querySelector("#crewPeriodLabel");
const previousCrewPeriod = document.querySelector("#previousCrewPeriod");
const nextCrewPeriod = document.querySelector("#nextCrewPeriod");
const crewList = document.querySelector("#crewList");
const documentList = document.querySelector("#documentList");
const profileForm = document.querySelector("#profileForm");
const profileList = document.querySelector("#profileList");
const profileSubmitButton = document.querySelector("#profileSubmitButton");
const cancelProfileEdit = document.querySelector("#cancelProfileEdit");
const selfProfileForm = document.querySelector("#selfProfileForm");
const selfProfileTitle = document.querySelector("#selfProfileTitle");
const selfProfilePhoto = document.querySelector("#selfProfilePhoto");
const selfProfilePhotoPreview = document.querySelector("#selfProfilePhotoPreview");
const profilePhotoEditor = document.querySelector("#profilePhotoEditor");
const profilePhotoFrame = document.querySelector("#profilePhotoFrame");
const profilePhotoScale = document.querySelector("#profilePhotoScale");
const profilePhotoReset = document.querySelector("#profilePhotoReset");
const rotaBoard = document.querySelector("#rotaBoard");
const rotaDistribution = document.querySelector("#rotaDistribution");
const rotaTitle = document.querySelector("#rotaTitle");
const rotaPeriodLabel = document.querySelector("#rotaPeriodLabel");
const rotaVenueFilterField = document.querySelector("#rotaVenueFilterField");
const rotaVenueFilter = document.querySelector("#rotaVenueFilter");
const rotaMyBookingsFilter = document.querySelector("#rotaMyBookingsFilter");
const rotaMyBookingsToggle = document.querySelector("#rotaMyBookingsToggle");
const previousRotaPeriod = document.querySelector("#previousRotaPeriod");
const nextRotaPeriod = document.querySelector("#nextRotaPeriod");
const confirmRotaShifts = document.querySelector("#confirmRotaShifts");
const addBookingsToCalendarButton = document.querySelector("#addBookingsToCalendar");
const generateRotaButton = document.querySelector("#generateRota");
const roleFilter = document.querySelector("#roleFilter");
const selectedEventTitle = document.querySelector("#selectedEventTitle");
const selectedEventStatus = document.querySelector("#selectedEventStatus");
const eventDetails = document.querySelector("#eventDetails");
const eventModal = document.querySelector("#eventModal");
const eventForm = document.querySelector("#eventForm");
const eventModalTitle = document.querySelector("#eventModalTitle");
const eventSubmitButton = document.querySelector("#eventSubmitButton");
const deleteEventButton = document.querySelector("#deleteEventButton");
const eventViewModal = document.querySelector("#eventViewModal");
const eventViewTitle = document.querySelector("#eventViewTitle");
const eventViewStatus = document.querySelector("#eventViewStatus");
const eventViewDetails = document.querySelector("#eventViewDetails");
const eventViewPreviousButton = document.querySelector("#eventViewPrevious");
const eventViewNextButton = document.querySelector("#eventViewNext");
const eventDocumentsSection = document.querySelector("#eventDocumentsSection");
const eventDocumentsInput = document.querySelector("#eventDocuments");
const eventDocumentList = document.querySelector("#eventDocumentList");
const quickAttachDocInput = document.querySelector("#quickAttachDocInput");
const documentEventModal = document.querySelector("#documentEventModal");
const documentEventTitle = document.querySelector("#documentEventTitle");
const documentEventMonthLabel = document.querySelector("#documentEventMonthLabel");
const documentEventCalendar = document.querySelector("#documentEventCalendar");
const previousDocumentEventMonth = document.querySelector("#previousDocumentEventMonth");
const nextDocumentEventMonth = document.querySelector("#nextDocumentEventMonth");
const confirmDocumentEvents = document.querySelector("#confirmDocumentEvents");
const eventExitModal = document.querySelector("#eventExitModal");
const saveEventBeforeCloseButton = document.querySelector("#saveEventBeforeClose");
const discardEventChangesButton = document.querySelector("#discardEventChanges");
const eventSheetModal = document.querySelector("#eventSheetModal");
const eventSheetModalTitle = document.querySelector("#eventSheetModalTitle");
const eventSheetSummary = document.querySelector("#eventSheetSummary");
const printEventSheetButton = document.querySelector("#printEventSheetButton");
const saveEventSheetButton = document.querySelector("#saveEventSheetButton");
const rotaAssignModal = document.querySelector("#rotaAssignModal");
const rotaAssignForm = document.querySelector("#rotaAssignForm");
const rotaAssignTitle = document.querySelector("#rotaAssignTitle");
const rotaAssignSummary = document.querySelector("#rotaAssignSummary");
const rotaEngineerSelect = document.querySelector("#rotaEngineerSelect");
const rotaDjSelect = document.querySelector("#rotaDjSelect");
const rotaAssignNote = document.querySelector("#rotaAssignNote");
const rotaWhatsappModal = document.querySelector("#rotaWhatsappModal");
const rotaWhatsappSummary = document.querySelector("#rotaWhatsappSummary");
const rotaWhatsappList = document.querySelector("#rotaWhatsappList");
const openRotaWhatsappMessagesButton = document.querySelector("#openRotaWhatsappMessages");
const passcodeModal = document.querySelector("#passcodeModal");
const passcodeForm = document.querySelector("#passcodeForm");
const passcodeTitle = document.querySelector("#passcodeTitle");
const passcodeSummary = document.querySelector("#passcodeSummary");
const passcodeFieldLabel = document.querySelector("#passcodeFieldLabel");
const profilePasscode = document.querySelector("#profilePasscode");
const passcodeSubmitButton = document.querySelector("#passcodeSubmitButton");
const availabilityModal = document.querySelector("#availabilityModal");
const availabilityForm = document.querySelector("#availabilityForm");
const availabilityPerson = document.querySelector("#availabilityPerson");
const availabilityMonthLabel = document.querySelector("#availabilityMonthLabel");
const availabilityPicker = document.querySelector("#availabilityPicker");
const previousAvailabilityMonth = document.querySelector("#previousAvailabilityMonth");
const nextAvailabilityMonth = document.querySelector("#nextAvailabilityMonth");
const availabilityExitModal = document.querySelector("#availabilityExitModal");
const saveAvailabilityBeforeCloseButton = document.querySelector("#saveAvailabilityBeforeClose");
const discardAvailabilityChangesButton = document.querySelector("#discardAvailabilityChanges");
const toast = document.querySelector("#toast");
const printSheet = document.querySelector("#printSheet");
const timeSelects = [...document.querySelectorAll(".time-select")];
const loadInTimeSelect = eventForm.querySelector("select[name='loadInTime']");
const doorsTimeSelect = eventForm.querySelector("select[name='doorsTime']");
const endTimeSelect = eventForm.querySelector("select[name='endTime']");
const eventPromoterSelect = eventForm.querySelector("select[name='promoterId']");
const timeOptions = [];
const roleOptions = ["Sound engineer", "Lighting engineer", "DJ", "Crew"];
const profileRoles = ["Promoter", "Sound engineer", "Lighting engineer", "DJ", "Crew"];
const passcodeProfileRoles = ["Promoter", "Sound engineer", "DJ"];
const engineerRoles = ["Sound engineer", "Lighting engineer"];
const eventPhoneRoles = ["Sound engineer", "Lighting engineer", "DJ"];
const rolePickerToggle = document.querySelector("#rolePickerToggle");
const rolePickerMenu = document.querySelector("#rolePickerMenu");
const roleAssignmentList = document.querySelector("#roleAssignmentList");
const rolePickerSummary = document.querySelector("#rolePickerSummary");
const eventRepeatFields = document.querySelector("#eventRepeatFields");
const repeatMode = document.querySelector("#repeatMode");
const repeatSpecificFields = document.querySelector("#repeatSpecificFields");
const repeatSpecificDate = document.querySelector("#repeatSpecificDate");
const addRepeatDate = document.querySelector("#addRepeatDate");
const repeatDateList = document.querySelector("#repeatDateList");
const repeatWeeklyFields = document.querySelector("#repeatWeeklyFields");
const repeatUntil = document.querySelector("#repeatUntil");
const repeatIndefinitely = document.querySelector("#repeatIndefinitely");
const reportForm = document.querySelector("#reportForm");
const reportDate = document.querySelector("#reportDate");
const reportMedia = document.querySelector("#reportMedia");
const reportAttachmentList = document.querySelector("#reportAttachmentList");
const emailInboxStatus = document.querySelector("#emailInboxStatus");
const refreshEmailInbox = document.querySelector("#refreshEmailInbox");
const emailInboxList = document.querySelector("#emailInboxList");
const emailMessageView = document.querySelector("#emailMessageView");
const emailReplyForm = document.querySelector("#emailReplyForm");
const emailReplyDraft = document.querySelector("#emailReplyDraft");
const emailReplyAll = document.querySelector("#emailReplyAll");
const emailReplyAttachments = document.querySelector("#emailReplyAttachments");
const emailReplyClearAttachments = document.querySelector("#emailReplyClearAttachments");
const emailReplyAttachmentList = document.querySelector("#emailReplyAttachmentList");

function initials(name) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("");
}

function formatDate(dateString) {
  return new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short" }).format(
    new Date(`${dateString}T12:00:00`)
  );
}

function formatMonth(date) {
  return new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric" }).format(date);
}

function eventTimeSummary(event) {
  return [
    `Load in ${event.loadInTime || "TBC"}`,
    `Doors ${event.doorsTime || event.time || "TBC"}`,
    `End ${event.endTime || "TBC"}`
  ].join(" · ");
}

function freelancerById(id) {
  return freelancers.find((person) => person.id === Number(id));
}

function assignedPeopleForEvent(event) {
  const assignedFromRoles = Object.values(event.roleAssignments || {})
    .map((id) => freelancerById(id))
    .filter(Boolean);
  const assignedFromCrew = (event.crew || [])
    .map((id) => freelancerById(id))
    .filter(Boolean);
  const peopleById = new Map([...assignedFromCrew, ...assignedFromRoles].map((person) => [person.id, person]));

  return [...peopleById.values()];
}

function roleAssignmentText(event, role) {
  const person = event.roleAssignments ? freelancerById(event.roleAssignments[role]) : null;

  return person ? `${role}: ${person.name}` : role;
}

function roleSheetAssignment(event, role) {
  const person = event.roleAssignments ? freelancerById(event.roleAssignments[role]) : null;

  if (!person) {
    return "Needed";
  }

  return eventPhoneRoles.includes(role)
    ? `${person.name} - ${profilePhoneNumber(person) || "No phone saved"}`
    : person.name;
}

function roleSheetLine(event, role) {
  const assignment = roleSheetAssignment(event, role);

  return assignment === "Needed" ? role : `${role}: ${assignment}`;
}

function profilePhoneNumber(person) {
  return String(person?.phone || person?.whatsapp || "").trim();
}

function bookedStaffRows(event) {
  return assignedPeopleForEvent(event).map((person) => {
    const roles = assignedRolesForPerson(event, person.id);
    const roleText = roles.length ? roles.join(", ") : person.role || "Crew";
    const phone = profilePhoneNumber(person);

    return {
      id: person.id,
      name: person.name,
      detail: [roleText, phone].filter(Boolean).join(" · ")
    };
  });
}

function unfilledEventRoles(event) {
  const assignments = event.roleAssignments || {};

  return (event.roles || []).filter((role) => !assignments[role]);
}

function shiftConfirmedBy(event, personId) {
  return Boolean(event.shiftConfirmations?.[personId]);
}

function shiftNotificationPending(event, personId) {
  return Boolean(event.shiftNotifications?.[personId] && !shiftConfirmedBy(event, personId));
}

function formatAttachmentSize(size) {
  if (!Number(size)) {
    return "";
  }

  if (size < 1024 * 1024) {
    return `${Math.ceil(size / 1024)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function normaliseEmail(value = "") {
  return String(value || "").trim().toLowerCase();
}

function normaliseEventDocument(doc, eventId, index) {
  if (typeof doc === "string") {
    return {
      id: `event-${eventId}-doc-${index}`,
      name: doc,
      type: "Document",
      size: 0,
      url: "",
      placeholder: true
    };
  }

  return {
    id: doc.id || `event-${eventId}-doc-${index}`,
    name: doc.name || `Document ${index + 1}`,
    type: doc.type || "Document",
    size: Number(doc.size) || 0,
    url: doc.url || "",
    downloadUrl: doc.downloadUrl || doc.url || "",
    pathname: doc.pathname || "",
    storage: doc.storage || (doc.pathname ? "blob" : ""),
    placeholder: Boolean(doc.placeholder)
  };
}

function eventDocuments(event) {
  event.docs = (event.docs || []).map((doc, index) => normaliseEventDocument(doc, event.id, index));

  return event.docs;
}

function documentIdentity(doc) {
  return doc.id || `${doc.name || "document"}::${doc.url || ""}`;
}

function sameDocument(firstDoc, secondDoc) {
  const firstId = firstDoc.id;
  const secondId = secondDoc.id;

  if (firstId && secondId) {
    return firstId === secondId;
  }

  return firstDoc.name === secondDoc.name && firstDoc.url === secondDoc.url;
}

function addDocumentsToLibrary(docs) {
  docs.forEach((doc) => {
    const normalisedDoc = normaliseEventDocument(doc, 0, generalDocuments.length);

    if (!generalDocuments.some((libraryDoc) => sameDocument(libraryDoc, normalisedDoc))) {
      generalDocuments.push(clonePlainData(normalisedDoc));
    }
  });
}

function ensureEventDocumentsInLibrary() {
  events.forEach((event) => addDocumentsToLibrary(eventDocuments(event)));
}

function fileDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.addEventListener("load", () => resolve(String(reader.result || "")));
    reader.addEventListener("error", () => reject(reader.error || new Error("File could not be read.")));
    reader.readAsDataURL(file);
  });
}

async function uploadFileToBlob(file, folder) {
  const dataUrl = await fileDataUrl(file);

  try {
    const response = await fetch(blobUploadUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filename: file.name,
        contentType: file.type || "application/octet-stream",
        size: file.size,
        folder,
        dataUrl
      })
    });
    const result = await response.json().catch(() => ({}));

    if (!response.ok || !result.uploaded) {
      throw new Error(result.reason || "File could not be uploaded to Blob.");
    }

    return {
      id: `doc-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name: file.name,
      type: file.type || "Document",
      size: Number(result.size) || file.size,
      url: result.url,
      downloadUrl: result.downloadUrl || result.url,
      pathname: result.pathname || "",
      storage: "blob",
      placeholder: false
    };
  } catch (error) {
    showToast(`${error.message} Saving file on this device instead.`);
    return {
      id: `doc-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name: file.name,
      type: file.type || "Document",
      size: file.size,
      url: dataUrl,
      downloadUrl: dataUrl,
      pathname: "",
      storage: "local",
      placeholder: false
    };
  }
}

async function deleteBlobRecord(record = {}) {
  if (record.storage !== "blob" && !record.pathname) {
    return { deleted: true };
  }

  try {
    const response = await fetch(blobDeleteUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pathname: record.pathname || "",
        url: record.url || ""
      })
    });
    const result = await response.json().catch(() => ({}));

    if (!response.ok || result.deleted === false) {
      throw new Error(result.reason || "Blob file could not be deleted.");
    }

    return result;
  } catch (error) {
    showToast(`${error.message} Removed from the planner.`);
    return { deleted: false, reason: error.message };
  }
}

async function documentFromFile(file) {
  return {
    ...(await uploadFileToBlob(file, "documents"))
  };
}

async function documentsFromFiles(files) {
  return Promise.all([...files].map(documentFromFile));
}

function libraryPlaceholderEvent() {
  return {
    id: 0,
    title: "Document library",
    date: toDateKey(new Date()),
    venue: "General storage"
  };
}

function placeholderDocumentUrl(event, doc) {
  const body = [
    doc.name,
    "",
    `Attached to: ${event.title}`,
    `Event date: ${formatDate(event.date)}`,
    `Venue: ${event.venue}`,
    "",
    "This is a placeholder for a saved document filename in the demo planner. Uploaded files can be viewed and saved directly."
  ].join("\n");
  const blob = new Blob([body], { type: "text/plain" });

  return URL.createObjectURL(blob);
}

function documentUrl(event, doc) {
  return doc.url || placeholderDocumentUrl(event, doc);
}

function documentDownloadUrl(event, doc) {
  return doc.downloadUrl || documentUrl(event, doc);
}

function documentDownloadName(doc) {
  return doc.url ? doc.name : `${doc.name}.txt`;
}

function allDocumentRecords() {
  ensureEventDocumentsInLibrary();

  return generalDocuments.map((doc, index) => {
    const normalisedDoc = normaliseEventDocument(doc, 0, index);
    const attachedEvents = events
      .map((event) => {
        const docIndex = eventDocuments(event).findIndex((eventDoc) => sameDocument(eventDoc, normalisedDoc));

        return docIndex === -1 ? null : { event, docIndex };
      })
      .filter(Boolean);

    return {
      id: `library-${documentIdentity(normalisedDoc)}`,
      doc: normalisedDoc,
      attachedEvents,
      libraryIndex: index,
      source: "library"
    };
  });
}

function documentAttachedToEvent(event, doc) {
  return eventDocuments(event).some((eventDoc) => sameDocument(eventDoc, doc));
}

function documentContextEvent(record) {
  return record.event || libraryPlaceholderEvent();
}

function canDeleteEventDocuments() {
  return currentAccess().canAttachDocs;
}

function renderAttachmentRows(event, docs = eventDocuments(event), actions = true) {
  if (!docs.length) {
    return `<div class="empty-state">No documents attached.</div>`;
  }

  return docs
    .map((doc, index) => {
      const meta = [doc.type || "Document", formatAttachmentSize(doc.size)].filter(Boolean).join(" · ");

      return `
        <article class="attachment-row">
          <div>
            <strong>${escapeHtml(doc.name)}</strong>
            <small>${escapeHtml(meta || "Document")}</small>
          </div>
          ${
            actions
              ? `<div class="attachment-actions">
                  <button class="text-button" type="button" data-doc-action="view" data-doc-index="${index}">View</button>
                  <button class="text-button" type="button" data-doc-action="save" data-doc-index="${index}">Save</button>
                  ${
                    canDeleteEventDocuments()
                      ? `<button class="text-button danger-button" type="button" data-doc-action="delete" data-doc-index="${index}">Remove from event</button>`
                      : ""
                  }
                </div>`
              : ""
          }
        </article>
      `;
    })
    .join("");
}

function openEventDocument(event, docIndex) {
  const doc = eventDocuments(event)[docIndex];

  if (!doc) {
    showToast("Document not found.");
    return;
  }

  window.open(documentUrl(event, doc), "_blank", "noopener,noreferrer");
}

function saveEventDocument(event, docIndex) {
  const doc = eventDocuments(event)[docIndex];

  if (!doc) {
    showToast("Document not found.");
    return;
  }

  const link = document.createElement("a");
  link.href = documentDownloadUrl(event, doc);
  link.download = documentDownloadName(doc);
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function refreshDocumentSurfaces(event) {
  renderEventDetails();
  renderDocs();

  if (eventViewModal.open) {
    renderEventViewContent(event);
  }

  if (eventModal.open && editingEventId === event.id) {
    renderEventDocumentList(event);
  }

  persistAppState();
}

function deleteEventDocument(event, docIndex) {
  if (!canDeleteEventDocuments()) {
    showToast("This user level cannot delete documents.");
    return;
  }

  const docs = eventDocuments(event);
  const targetDoc = docs[docIndex];

  if (!targetDoc) {
    showToast("Document not found.");
    return;
  }

  if (!window.confirm(`Remove "${targetDoc.name}" from ${event.title}? It will stay in Documents.`)) {
    return;
  }

  const [removedDoc] = docs.splice(docIndex, 1);

  event.docs = docs;
  refreshDocumentSurfaces(event);
  showToast(`${removedDoc.name} removed from ${event.title} and kept in Documents.`);
}

function bindDocumentActions(container, event) {
  container.querySelectorAll("[data-doc-action]").forEach((button) => {
    button.addEventListener("click", () => {
      const docIndex = Number(button.dataset.docIndex);

      if (button.dataset.docAction === "view") {
        openEventDocument(event, docIndex);
      } else if (button.dataset.docAction === "save") {
        saveEventDocument(event, docIndex);
      } else if (button.dataset.docAction === "delete") {
        deleteEventDocument(event, docIndex);
      }
    });
  });
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function multilineHtml(value) {
  return escapeHtml(value || "No details added.").replaceAll("\n", "<br>");
}

function eventNeedsList(event) {
  const needs = event.needs || {};
  const options = [
    ["wristbands", "Wristbands"],
    ["djSetup", "DJ set up"],
    ["microphones", "Microphones"],
    ["playlist", "Playlist"]
  ];

  return options.filter(([key]) => needs[key]).map(([, label]) => label);
}

function eventClientSummary(event) {
  const client = event.client || {};
  const parts = [
    client.name ? `Name: ${client.name}` : "",
    client.contact ? `Contact: ${client.contact}` : "",
    client.guestNumbers ? `Guests: ${client.guestNumbers}` : ""
  ].filter(Boolean);

  return parts.length ? parts.join(" · ") : "No client details added";
}

function normaliseProfileRole(role = "") {
  return role === "Producer" ? "Promoter" : role;
}

function normaliseProfileRoles() {
  freelancers.forEach((person) => {
    person.role = normaliseProfileRole(person.role);
  });
}

function promoterProfiles() {
  return freelancers.filter((person) => normaliseProfileRole(person.role) === "Promoter");
}

function eventPromoter(event) {
  const promoterId = Number(event?.promoterId || 0);

  const person = promoterId ? freelancerById(promoterId) : null;

  return normaliseProfileRole(person?.role) === "Promoter" ? person : null;
}

function eventPromoterLabel(event) {
  return eventPromoter(event)?.name || "No promoter selected";
}

function eventBarSummary(event) {
  const bar = event.bar || {};
  const parts = [
    bar.type ? `Type: ${bar.type}` : "",
    bar.welcomeDrinks ? "Welcome drinks" : "",
    bar.notes ? `Notes: ${bar.notes}` : ""
  ].filter(Boolean);

  return parts.length ? parts.join(" · ") : "No bar details added";
}

function eventFoodSummary(event) {
  const food = event.food || {};
  const dietaryRequirements = Array.isArray(food.dietaryRequirements)
    ? food.dietaryRequirements.join(", ")
    : food.dietaryRequirements;
  const parts = [
    food.type ? `Food: ${food.type}` : "",
    dietaryRequirements ? `Dietary: ${dietaryRequirements}` : "",
    food.notes ? `Notes: ${food.notes}` : ""
  ].filter(Boolean);

  return parts.length ? parts.join(" · ") : "No food details added";
}

function eventNeedsSummary(event) {
  const needs = eventNeedsList(event);

  return needs.length ? needs.join(", ") : "No extra event needs selected";
}

function eventOperationsSummary(event) {
  return [
    `Client: ${eventClientSummary(event)}`,
    `Bar: ${eventBarSummary(event)}`,
    `Food: ${eventFoodSummary(event)}`,
    `Event needs: ${eventNeedsSummary(event)}`
  ].join("\n");
}

function weatherCodeLabel(code) {
  const labels = {
    0: "Clear",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Freezing fog",
    51: "Light drizzle",
    53: "Drizzle",
    55: "Heavy drizzle",
    61: "Light rain",
    63: "Rain",
    65: "Heavy rain",
    71: "Light snow",
    73: "Snow",
    75: "Heavy snow",
    80: "Rain showers",
    81: "Heavy showers",
    82: "Violent showers",
    95: "Thunderstorm",
    96: "Thunderstorm with hail",
    99: "Heavy thunderstorm"
  };

  return labels[code] || "Changeable";
}

function weatherIcon(code) {
  if ([0, 1].includes(code)) {
    return "Sun";
  }

  if ([2, 3, 45, 48].includes(code)) {
    return "Cloud";
  }

  if ([71, 73, 75].includes(code)) {
    return "Snow";
  }

  if ([95, 96, 99].includes(code)) {
    return "Storm";
  }

  return "Rain";
}

function formatForecastDay(dateString) {
  return new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric" }).format(new Date(`${dateString}T12:00:00`));
}

function weatherForecastUrl() {
  const params = new URLSearchParams({
    latitude: "51.506",
    longitude: "-0.116",
    current: "temperature_2m,weather_code,wind_speed_10m",
    daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max",
    forecast_days: "5",
    timezone: "Europe/London"
  });

  return `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
}

function normaliseWeatherForecast(data) {
  return {
    current: {
      temperature: Math.round(data.current?.temperature_2m),
      wind: Math.round(data.current?.wind_speed_10m || 0),
      code: data.current?.weather_code || 0
    },
    days: (data.daily?.time || []).map((date, index) => ({
      date,
      code: data.daily.weather_code?.[index] || 0,
      max: Math.round(data.daily.temperature_2m_max?.[index]),
      min: Math.round(data.daily.temperature_2m_min?.[index]),
      rain: data.daily.precipitation_probability_max?.[index] ?? 0
    }))
  };
}

function renderWeatherForecast() {
  if (weatherForecastStatus === "idle" || weatherForecastStatus === "loading") {
    weatherSummary.innerHTML = `<strong>Loading forecast</strong><span>Checking the latest conditions.</span>`;
    weatherList.innerHTML = "";
    weatherUpdated.textContent = "Forecast for Between The Bridges area";
    return;
  }

  if (weatherForecastStatus === "error" || !weatherForecastData) {
    weatherSummary.innerHTML = `<strong>Forecast unavailable</strong><span>Try refreshing in a moment.</span>`;
    weatherList.innerHTML = `<div class="empty-state">Weather could not be loaded.</div>`;
    weatherUpdated.textContent = "Forecast for Between The Bridges area";
    return;
  }

  const { current, days } = weatherForecastData;

  weatherSummary.innerHTML = `
    <div class="weather-icon">${weatherIcon(current.code)}</div>
    <div>
      <strong>${current.temperature}°C · ${weatherCodeLabel(current.code)}</strong>
      <span>Wind ${current.wind} km/h · South Bank</span>
    </div>
  `;
  weatherList.innerHTML = days
    .slice(0, 5)
    .map(
      (day) => `
        <article class="weather-day">
          <div>
            <strong>${formatForecastDay(day.date)}</strong>
            <span>${weatherCodeLabel(day.code)}</span>
          </div>
          <div>
            <strong>${day.max}° / ${day.min}°</strong>
            <span>${day.rain}% rain</span>
          </div>
        </article>
      `
    )
    .join("");
  weatherUpdated.textContent = `Updated ${new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" }).format(new Date())}`;
}

async function loadWeatherForecast(force = false) {
  if (weatherForecastStatus === "loading" || (weatherForecastData && !force)) {
    renderWeatherForecast();
    return;
  }

  weatherForecastStatus = "loading";
  renderWeatherForecast();

  try {
    const response = await fetch(weatherForecastUrl());

    if (!response.ok) {
      throw new Error("Weather forecast unavailable");
    }

    weatherForecastData = normaliseWeatherForecast(await response.json());
    weatherForecastStatus = "ready";
  } catch {
    weatherForecastStatus = "error";
  }

  renderWeatherForecast();
}

function tubeStatusUrl() {
  return "https://api.tfl.gov.uk/Line/Mode/tube/Status";
}

function normaliseTubeStatus(lines) {
  return lines
    .map((line) => {
      const statuses = line.lineStatuses || [];
      const statusLabels = statuses.map((status) => status.statusSeverityDescription).filter(Boolean);
      const disruption = statuses.find((status) => status.reason)?.reason || "";

      return {
        id: line.id,
        name: line.name,
        status: statusLabels.length ? [...new Set(statusLabels)].join(", ") : "Unknown",
        disruption
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

function renderTubeStatus() {
  dashboardTube.classList.toggle("is-expanded", tubeStatusExpanded);
  tubeExpandToggle.textContent = tubeStatusExpanded ? "Less" : "More";
  tubeExpandToggle.setAttribute("aria-expanded", String(tubeStatusExpanded));

  if (tubeStatusState === "idle" || tubeStatusState === "loading") {
    tubeSummary.innerHTML = `<strong>Loading Tube status</strong><span>Checking TfL line updates.</span>`;
    tubeList.innerHTML = "";
    tubeUpdated.textContent = "London Underground live status";
    return;
  }

  if (tubeStatusState === "error" || !tubeStatusData) {
    tubeSummary.innerHTML = `<strong>Tube status unavailable</strong><span>Try refreshing in a moment.</span>`;
    tubeList.innerHTML = `<div class="empty-state">TfL status could not be loaded.</div>`;
    tubeUpdated.textContent = "London Underground live status";
    return;
  }

  const disruptedLines = tubeStatusData.filter((line) => line.status !== "Good Service");

  tubeSummary.innerHTML = `
    <strong>${disruptedLines.length ? `${disruptedLines.length} line${disruptedLines.length === 1 ? "" : "s"} disrupted` : "Good service"}</strong>
    <span>${disruptedLines.length ? "Check affected routes before travelling." : "No Tube disruptions currently reported."}</span>
  `;
  tubeList.innerHTML = tubeStatusData
    .map(
      (line) => `
        <article class="tube-line ${line.status === "Good Service" ? "good" : "disrupted"}">
          <div>
            <strong>${escapeHtml(line.name)}</strong>
            <span>${escapeHtml(line.status)}</span>
          </div>
          <small>${escapeHtml(line.disruption || "No disruption details reported.")}</small>
        </article>
      `
    )
    .join("");
  tubeUpdated.textContent = `Updated ${new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" }).format(new Date())}`;
}

async function loadTubeStatus(force = false) {
  if (tubeStatusState === "loading" || (tubeStatusData && !force)) {
    renderTubeStatus();
    return;
  }

  tubeStatusState = "loading";
  renderTubeStatus();

  try {
    const response = await fetch(tubeStatusUrl());

    if (!response.ok) {
      throw new Error("Tube status unavailable");
    }

    tubeStatusData = normaliseTubeStatus(await response.json());
    tubeStatusState = "ready";
  } catch {
    tubeStatusState = "error";
  }

  renderTubeStatus();
}

function openEventSheetOptions(event) {
  eventSheetEventId = event.id;
  eventSheetModalTitle.textContent = event.title;
  eventSheetSummary.textContent = `${formatDate(event.date)} - ${event.venue}`;
  eventSheetModal.showModal();
}

function currentEventSheet() {
  return events.find((event) => event.id === eventSheetEventId) || selectedEvent();
}

function safePdfText(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[^\x20-\x7E\n]/g, " ")
    .replace(/[ \t]+/g, " ")
    .trim();
}

function pdfEscape(value) {
  return safePdfText(value)
    .replaceAll("\\", "\\\\")
    .replaceAll("(", "\\(")
    .replaceAll(")", "\\)");
}

function wrapPdfText(value, maxChars) {
  return safePdfText(value)
    .split("\n")
    .flatMap((paragraph) => {
      const words = paragraph.split(" ").filter(Boolean);
      const lines = [];
      let line = "";

      words.forEach((word) => {
        const nextLine = line ? `${line} ${word}` : word;

        if (nextLine.length > maxChars && line) {
          lines.push(line);
          line = word;
        } else {
          line = nextLine;
        }
      });

      return lines.concat(line || "");
    });
}

function buildPdfDocument(contentStream) {
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
    `<< /Length ${contentStream.length} >>\nstream\n${contentStream}\nendstream`
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  objects.forEach((object, index) => {
    offsets[index + 1] = pdf.length;
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return pdf;
}

function pdfRgb(color, operator) {
  return `${color[0]} ${color[1]} ${color[2]} ${operator}`;
}

function drawPdfRect(operations, x, top, width, height, options = {}) {
  const bottom = top - height;
  const fill = options.fill ? pdfRgb(options.fill, "rg") : "";
  const stroke = pdfRgb(options.stroke || [0, 0, 0], "RG");
  const mode = options.fill ? "B" : "S";

  operations.push(`q ${fill} ${stroke} ${options.lineWidth || 0.7} w ${x} ${bottom} ${width} ${height} re ${mode} Q`);
}

function drawPdfLine(operations, x1, y1, x2, y2, lineWidth = 0.7) {
  operations.push(`q 0 0 0 RG ${lineWidth} w ${x1} ${y1} m ${x2} ${y2} l S Q`);
}

function addPdfText(operations, text, x, y, size = 8, font = "F1", color = [0, 0, 0]) {
  operations.push(`q ${pdfRgb(color, "rg")} BT /${font} ${size} Tf 1 0 0 1 ${x} ${y} Tm (${pdfEscape(text)}) Tj ET Q`);
}

function addPdfWrappedText(operations, text, x, top, width, height, options = {}) {
  const size = options.size || 8;
  const lineHeight = options.lineHeight || size + 2;
  const maxChars = Math.max(12, Math.floor(width / (size * 0.48)));
  const maxLines = Math.max(1, Math.floor((height - 6) / lineHeight));
  const lines = wrapPdfText(text || options.emptyText || "", maxChars);
  const visibleLines = lines.slice(0, maxLines);

  if (lines.length > maxLines) {
    visibleLines[maxLines - 1] = `${visibleLines[maxLines - 1].slice(0, Math.max(0, maxChars - 3))}...`;
  }

  visibleLines.forEach((line, index) => {
    addPdfText(operations, line, x, top - 11 - index * lineHeight, size, options.font || "F1", options.color || [0, 0, 0]);
  });
}

function drawPdfSectionHeader(operations, title, x, top, width, height = 14) {
  drawPdfRect(operations, x, top, width, height, { fill: [0.29, 0.73, 0.76] });
  addPdfText(operations, title, x + 4, top - 10, 8, "F2", [1, 1, 1]);
}

function drawPdfInfoBox(operations, label, value, x, top, width, height) {
  const headerHeight = 14;

  drawPdfRect(operations, x, top, width, height);
  drawPdfSectionHeader(operations, label, x, top, width, headerHeight);
  addPdfWrappedText(operations, value || "TBC", x + 5, top - headerHeight - 4, width - 10, height - headerHeight - 4, {
    size: 10,
    font: "F2"
  });
}

function drawPdfTableSection(operations, title, rows, x, top, width, height, labelWidth = 84) {
  const headerHeight = 14;
  const rowHeight = (height - headerHeight) / rows.length;

  drawPdfRect(operations, x, top, width, height);
  drawPdfSectionHeader(operations, title, x, top, width, headerHeight);
  drawPdfLine(operations, x + labelWidth, top - headerHeight, x + labelWidth, top - height);

  rows.forEach((row, index) => {
    const rowTop = top - headerHeight - index * rowHeight;

    if (index > 0) {
      drawPdfLine(operations, x, rowTop, x + width, rowTop);
    }

    addPdfWrappedText(operations, row.label, x + 4, rowTop, labelWidth - 8, rowHeight, { size: 7, font: "F2" });
    addPdfWrappedText(operations, row.value || "", x + labelWidth + 5, rowTop, width - labelWidth - 10, rowHeight, { size: 8 });
  });
}

function drawPdfTextSection(operations, title, value, x, top, width, height, options = {}) {
  const headerHeight = 14;

  drawPdfRect(operations, x, top, width, height);
  drawPdfSectionHeader(operations, title, x, top, width, headerHeight);
  addPdfWrappedText(operations, value || options.emptyText || "", x + 6, top - headerHeight - 4, width - 12, height - headerHeight - 8, {
    size: options.size || 8,
    lineHeight: options.lineHeight || 10,
    emptyText: options.emptyText || ""
  });
}

function eventSheetPdfBlob(event) {
  const roleLines = event.roles.length ? event.roles.map((role) => roleSheetLine(event, role)) : ["No staffing added"];
  const barLines = [
    event.bar?.type ? `Type: ${event.bar.type}` : "Type: TBC",
    event.bar?.welcomeDrinks ? "Welcome drinks: Yes" : "Welcome drinks: No",
    event.bar?.notes ? `Notes: ${event.bar.notes}` : "Notes: No bar notes"
  ];
  const dietaryText = Array.isArray(event.food?.dietaryRequirements)
    ? event.food.dietaryRequirements.join(", ")
    : event.food?.dietaryRequirements;
  const foodLines = [
    event.food?.type ? `Food: ${event.food.type}` : "Food: TBC",
    dietaryText ? `Dietary: ${dietaryText}` : "Dietary: None confirmed",
    event.food?.notes ? `Notes: ${event.food.notes}` : "Notes: No food notes"
  ];
  const needsLines = eventNeedsList(event);
  const operations = [];
  const pageWidth = 595;
  const sheetX = 38;
  const sheetTop = 800;
  const sheetWidth = 519;
  const gap = 6;
  const headerHeight = 42;
  const metaTop = sheetTop - headerHeight;
  const metaHeight = 44;
  const gridTop = metaTop - metaHeight - 8;
  const columnWidth = (sheetWidth - gap) / 2;
  const rightX = sheetX + columnWidth + gap;
  const rowHeight = 112;
  const setTimesHeight = 92;
  const operationsHeight = 84;
  const needsHeight = 82;
  const bottomHeight = 108;
  const sectionGap = 7;
  const setTimesTop = gridTop - rowHeight - sectionGap;
  const clientTop = setTimesTop - setTimesHeight - sectionGap;
  const foodTop = clientTop - operationsHeight - sectionGap;
  const bottomTop = foodTop - needsHeight - sectionGap;
  const teal = [0.29, 0.73, 0.76];
  const white = [1, 1, 1];
  const detailRows = [
    { label: "Date of Event:", value: formatDate(event.date) },
    { label: "Name of Event:", value: event.title },
    { label: "Promoter:", value: eventPromoterLabel(event) },
    { label: "Venue:", value: event.venue },
    { label: "Guests:", value: event.client?.guestNumbers || "TBC" }
  ];
  const clientRows = [
    { label: "Client:", value: event.client?.name || "TBC" },
    { label: "Contact:", value: event.client?.contact || "TBC" },
    { label: "Guests:", value: event.client?.guestNumbers || "TBC" }
  ];
  const timingRows = [
    { label: "Load in:", value: event.loadInTime || "TBC" },
    { label: "Doors:", value: event.doorsTime || event.time || "TBC" },
    { label: "End:", value: event.endTime || "TBC" }
  ];

  drawPdfRect(operations, sheetX, sheetTop, sheetWidth, headerHeight, { fill: teal, lineWidth: 0.9 });
  addPdfText(operations, "EVENT SHEET", sheetX + 8, sheetTop - 12, 8, "F2", white);
  addPdfWrappedText(operations, event.title, sheetX + 8, sheetTop - 18, 342, 24, { size: 16, font: "F2", color: white, lineHeight: 17 });
  addPdfText(operations, `${formatDate(event.date)} - ${event.venue}`, sheetX + 352, sheetTop - 19, 10, "F2", white);
  addPdfText(operations, `${event.client?.guestNumbers || "TBC"} guests`, sheetX + 352, sheetTop - 33, 8, "F1", white);

  [
    ["Date", formatDate(event.date)],
    ["Venue", event.venue],
    ["Load in", event.loadInTime || "TBC"],
    ["Doors", event.doorsTime || event.time || "TBC"],
    ["End", event.endTime || "TBC"]
  ].forEach(([label, value], index) => {
    const boxWidth = (sheetWidth - gap * 4) / 5;

    drawPdfInfoBox(operations, label, value, sheetX + index * (boxWidth + gap), metaTop, boxWidth, metaHeight);
  });

  drawPdfTableSection(operations, "Event Details", detailRows, sheetX, gridTop, columnWidth, rowHeight, 86);
  drawPdfTableSection(operations, "Timings", timingRows, rightX, gridTop, columnWidth, rowHeight, 74);
  drawPdfTextSection(operations, "Set Times", event.setTimes || "No set times added.", sheetX, setTimesTop, columnWidth, setTimesHeight, {
    size: 7.5,
    lineHeight: 9
  });
  drawPdfTextSection(operations, "Staffing", roleLines.join("\n"), rightX, setTimesTop, columnWidth, setTimesHeight, {
    emptyText: "No staffing added",
    size: 7.5,
    lineHeight: 9
  });
  drawPdfTableSection(operations, "Client", clientRows, sheetX, clientTop, columnWidth, operationsHeight, 62);
  drawPdfTextSection(operations, "Bar", barLines.join("\n"), rightX, clientTop, columnWidth, operationsHeight, {
    size: 7.5,
    lineHeight: 9
  });
  drawPdfTextSection(operations, "Food", foodLines.join("\n"), sheetX, foodTop, columnWidth, needsHeight, {
    size: 7.5,
    lineHeight: 9
  });
  drawPdfTextSection(operations, "Event Needs", needsLines.length ? needsLines.join("\n") : "No extra event needs selected", rightX, foodTop, columnWidth, needsHeight, {
    size: 7.5,
    lineHeight: 9
  });
  drawPdfTextSection(operations, "Notes", event.notes || "No notes added.", sheetX, bottomTop, sheetWidth, bottomHeight, {
    size: 7.5,
    lineHeight: 9
  });

  drawPdfLine(operations, sheetX, bottomTop - bottomHeight - 12, sheetX + sheetWidth, bottomTop - bottomHeight - 12, 0.5);
  addPdfText(operations, "Peppermint Crew Planner", sheetX, bottomTop - bottomHeight - 26, 8, "F1");
  addPdfText(operations, "One-page A4 event sheet", pageWidth - sheetX - 102, bottomTop - bottomHeight - 26, 8, "F1");

  return new Blob([buildPdfDocument(operations.join("\n"))], { type: "application/pdf" });
}

function eventSheetFileName(event) {
  const slug = safePdfText(event.title)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${slug || "event"}-event-sheet.pdf`;
}

function saveEventSheetPdf(event) {
  const pdfUrl = URL.createObjectURL(eventSheetPdfBlob(event));
  const link = document.createElement("a");

  link.href = pdfUrl;
  link.download = eventSheetFileName(event);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(pdfUrl), 1000);
  showToast(`${event.title} PDF saved.`);
}

function printEventSheet(event) {
  const assigned = assignedPeopleForEvent(event);
  const roleRows = event.roles
    .map((role) => `<tr><td>${escapeHtml(role)}</td><td>${escapeHtml(roleSheetAssignment(event, role))}</td></tr>`)
    .join("");

  printSheet.innerHTML = `
    <main class="sheet-page">
      <section class="sheet-header">
        <div>
          <h1>${escapeHtml(event.title)}</h1>
          <p>${escapeHtml(formatDate(event.date))} - ${escapeHtml(event.venue)}</p>
        </div>
        <div>
          <strong>Event sheet</strong>
          <p>${escapeHtml(event.client?.guestNumbers || "TBC")} guests</p>
        </div>
      </section>
      <section class="sheet-meta">
        <div class="sheet-box"><h2>Load in</h2><strong>${escapeHtml(event.loadInTime || "TBC")}</strong></div>
        <div class="sheet-box"><h2>Doors</h2><strong>${escapeHtml(event.doorsTime || event.time || "TBC")}</strong></div>
        <div class="sheet-box"><h2>End</h2><strong>${escapeHtml(event.endTime || "TBC")}</strong></div>
        <div class="sheet-box"><h2>Crew</h2><strong>${assigned.length}</strong></div>
      </section>
      <section class="sheet-grid">
        <div class="sheet-box"><h2>Promoter</h2><p class="sheet-notes">${escapeHtml(eventPromoterLabel(event))}</p></div>
        <div class="sheet-box"><h2>Staffing</h2><table>${roleRows || "<tr><td>No staffing</td><td>Unassigned</td></tr>"}</table></div>
        <div class="sheet-box"><h2>Client</h2><p class="sheet-notes">${multilineHtml(eventClientSummary(event))}</p></div>
        <div class="sheet-box"><h2>Bar</h2><p class="sheet-notes">${multilineHtml(eventBarSummary(event))}</p></div>
        <div class="sheet-box"><h2>Food</h2><p class="sheet-notes">${multilineHtml(eventFoodSummary(event))}</p></div>
        <div class="sheet-box"><h2>Event needs</h2><p class="sheet-notes">${multilineHtml(eventNeedsSummary(event))}</p></div>
        <div class="sheet-box sheet-full"><h2>Set times</h2><p class="sheet-notes">${multilineHtml(event.setTimes)}</p></div>
        <div class="sheet-box sheet-full"><h2>Notes</h2><p class="sheet-notes">${multilineHtml(event.notes)}</p></div>
      </section>
      <section class="sheet-footer">
        <span>Peppermint Crew Planner</span>
        <span>Print on one side of A4</span>
      </section>
    </main>
  `;
  document.body.classList.add("printing-event-sheet");
  const clearPrintMode = () => document.body.classList.remove("printing-event-sheet");
  window.addEventListener("afterprint", clearPrintMode, { once: true });
  window.print();
  window.setTimeout(clearPrintMode, 2500);
}

function generateEventSheet(event) {
  openEventSheetOptions(event);
}

function buildTimeOptions() {
  for (let hour = 0; hour < 24; hour += 1) {
    for (const minute of ["00", "15", "30", "45"]) {
      timeOptions.push(`${String(hour).padStart(2, "0")}:${minute}`);
    }
  }
}

function setTimeSelectOptions(select, minimumTime) {
  const currentValue = select.value;
  const availableTimes = minimumTime ? timeOptions.filter((time) => time >= minimumTime) : timeOptions;
  const options = availableTimes.map((value) => `<option value="${value}">${value}</option>`).join("");

  select.innerHTML = `<option value="">Select time</option>${options}`;

  if (availableTimes.includes(currentValue)) {
    select.value = currentValue;
  }
}

function updateEventTimeSelects(changedSelect) {
  setTimeSelectOptions(loadInTimeSelect, "07:00");
  setTimeSelectOptions(doorsTimeSelect, loadInTimeSelect.value);
  setTimeSelectOptions(endTimeSelect, doorsTimeSelect.value);

  if (changedSelect === loadInTimeSelect && doorsTimeSelect.value && doorsTimeSelect.value < loadInTimeSelect.value) {
    doorsTimeSelect.value = "";
    setTimeSelectOptions(endTimeSelect);
  }

  if (changedSelect === doorsTimeSelect && endTimeSelect.value && endTimeSelect.value < doorsTimeSelect.value) {
    endTimeSelect.value = "";
  }
}

function setEventTimeFields(event) {
  loadInTimeSelect.value = event.loadInTime || "";
  updateEventTimeSelects(loadInTimeSelect);
  doorsTimeSelect.value = event.doorsTime || event.time || "";
  updateEventTimeSelects(doorsTimeSelect);
  endTimeSelect.value = event.endTime || "";
}

function eventFormDate() {
  return eventForm.elements.date.value;
}

function renderRepeatDateList() {
  repeatDateList.innerHTML = repeatSpecificDates.length
    ? repeatSpecificDates
        .map((date) => `<button type="button" data-repeat-date="${escapeHtml(date)}">${escapeHtml(date)} x</button>`)
        .join("")
    : "No repeat dates added";
}

function updateRepeatFields() {
  const mode = repeatMode.value;
  const isWeekly = mode === "weekly";
  const isIndefinite = repeatIndefinitely.checked;

  repeatSpecificFields.hidden = mode !== "specific";
  repeatWeeklyFields.hidden = !isWeekly;
  repeatUntil.disabled = isWeekly && isIndefinite;

  if (isIndefinite) {
    repeatUntil.value = "";
  }
}

function resetRepeatFields() {
  repeatSpecificDates = [];
  repeatMode.value = "none";
  repeatSpecificDate.value = "";
  repeatUntil.value = "";
  repeatIndefinitely.checked = false;
  eventRepeatFields.hidden = false;
  updateRepeatFields();
  renderRepeatDateList();
}

function addSpecificRepeatDate() {
  const date = repeatSpecificDate.value;

  if (!date) {
    showToast("Choose a repeat date first.");
    return;
  }

  repeatSpecificDates = [...new Set([...repeatSpecificDates, date])].sort();
  repeatSpecificDate.value = "";
  renderRepeatDateList();
}

function removeSpecificRepeatDate(date) {
  repeatSpecificDates = repeatSpecificDates.filter((repeatDate) => repeatDate !== date);
  renderRepeatDateList();
}

function weeklyRepeatDates(startDate, endDate) {
  const dates = [];
  let nextDate = addDays(new Date(`${startDate}T12:00:00`), 7);
  const finalDate = new Date(`${endDate}T12:00:00`);

  while (nextDate <= finalDate) {
    dates.push(toDateKey(nextDate));
    nextDate = addDays(nextDate, 7);
  }

  return dates;
}

function clonePlainData(value) {
  return JSON.parse(JSON.stringify(value));
}

function replaceCollection(target, source = []) {
  target.splice(0, target.length, ...source.map(clonePlainData));
}

function storedDateValue(value, fallbackDate) {
  const date = value ? new Date(`${value}T12:00:00`) : null;

  return date && !Number.isNaN(date.getTime()) ? date : fallbackDate;
}

function serialisedAppState() {
  return {
    version: 1,
    savedAt: appDataLastSavedAt,
    freelancers: freelancers.map(clonePlainData),
    events: events.map(clonePlainData),
    generalDocuments: generalDocuments.map(clonePlainData),
    profilePasscodes: readStoredPasscodes(),
    selectedEventId,
    calendarFocusDate: toDateKey(calendarFocusDate),
    crewFocusDate: toDateKey(crewFocusDate),
    rotaFocusDate: toDateKey(rotaFocusDate)
  };
}

function stateSavedAtTime(state = {}) {
  const savedAt = state?.savedAt ? new Date(state.savedAt) : null;

  return savedAt && !Number.isNaN(savedAt.getTime()) ? savedAt.getTime() : 0;
}

function applyPersistentAppState(state = {}) {
  if (Array.isArray(state.freelancers)) {
    replaceCollection(freelancers, state.freelancers);
    normaliseProfileRoles();
  }

  if (Array.isArray(state.events)) {
    replaceCollection(events, state.events);
  }

  if (Array.isArray(state.generalDocuments)) {
    replaceCollection(generalDocuments, state.generalDocuments);
  }

  selectedEventId = events.some((event) => event.id === Number(state.selectedEventId)) ? Number(state.selectedEventId) : events[0]?.id || 0;
  calendarFocusDate = storedDateValue(state.calendarFocusDate, calendarFocusDate);
  crewFocusDate = storedDateValue(state.crewFocusDate, crewFocusDate);
  rotaFocusDate = storedDateValue(state.rotaFocusDate, rotaFocusDate);
  syncStaffProfileSelections();

  if (state.profilePasscodes && typeof state.profilePasscodes === "object" && !Array.isArray(state.profilePasscodes)) {
    writeStoredPasscodes(state.profilePasscodes);
  }

  if (state.savedAt) {
    appDataLastSavedAt = state.savedAt;
  }
}

function loadPersistentAppState() {
  appDataPersistenceReady = true;

  try {
    const rawState = window.localStorage?.getItem(appDataStorageKey);

    if (!rawState) {
      return;
    }

    const state = JSON.parse(rawState);

    appDataLoadedFromStorage = true;
    applyPersistentAppState(state);
  } catch {
    appDataStorageWarningShown = true;
    showToast("Saved app data could not be loaded.");
  }
}

function reportRemoteAppStateIssue(message = "Shared database is unavailable. Changes are saved on this device for now.") {
  if (appDataRemoteWarningShown) {
    return;
  }

  appDataRemoteWarningShown = true;
  showToast(message);
}

function markAppDataChanged() {
  appDataLocalChangeCounter += 1;
  appDataLastSavedAt = new Date().toISOString();

  return appDataLastSavedAt;
}

async function loadRemoteAppState() {
  const requestChangeCounter = appDataLocalChangeCounter;

  try {
    const response = await fetch(appStateUrl());
    const result = await response.json().catch(() => ({}));

    if (!response.ok || result.connected === false) {
      throw new Error(result.reason || "Shared database is unavailable.");
    }

    appDataRemoteReady = true;

    if (appDataLocalChangeCounter !== requestChangeCounter) {
      await persistAppState({ immediateRemote: true });
      return;
    }

    if (result.found && result.state) {
      const remoteSavedAt = stateSavedAtTime(result.state);
      const localSavedAt = stateSavedAtTime({ savedAt: appDataLastSavedAt });

      if (appDataLoadedFromStorage && localSavedAt > remoteSavedAt) {
        await persistAppState({ immediateRemote: true });
        return;
      }

      applyPersistentAppState(result.state);
      renderAvailabilityOptions();
      renderTechnicianProfileOptions();
      beginAvailabilityDraft();
      renderAvailabilityPicker();
      render();
      return;
    }

    await persistAppState({ immediateRemote: true });
  } catch (error) {
    reportRemoteAppStateIssue(error.message || undefined);
  }
}

function scheduleRemoteAppStateSave() {
  if (!appDataRemoteReady) {
    return;
  }

  window.clearTimeout(appDataRemoteSaveTimer);
  appDataRemoteSaveTimer = window.setTimeout(saveRemoteAppState, 900);
}

async function saveRemoteAppStateNow() {
  if (!appDataRemoteReady && appDataRemoteLoadPromise) {
    await appDataRemoteLoadPromise;
  }

  if (!appDataRemoteReady) {
    return {
      saved: false,
      reason: "Shared database is still unavailable. Changes are saved on this device for now."
    };
  }

  window.clearTimeout(appDataRemoteSaveTimer);
  return saveRemoteAppState();
}

async function saveRemoteAppState() {
  try {
    const response = await fetch(appStateUrl(), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(serialisedAppState())
    });
    const result = await response.json().catch(() => ({}));

    if (!response.ok || result.saved === false) {
      throw new Error(result.reason || "Shared database save failed.");
    }

    appDataRemoteWarningShown = false;
    return { saved: true, updatedAt: result.updatedAt || null };
  } catch (error) {
    reportRemoteAppStateIssue(error.message || undefined);
    return { saved: false, reason: error.message || "Shared database save failed." };
  }
}

async function persistAppState({ immediateRemote = false } = {}) {
  if (!appDataPersistenceReady) {
    return { localSaved: false, saved: false, reason: "App storage is not ready yet." };
  }

  let localSaved = true;

  try {
    window.localStorage?.setItem(appDataStorageKey, JSON.stringify(serialisedAppState()));
  } catch {
    localSaved = false;
    if (!appDataStorageWarningShown) {
      appDataStorageWarningShown = true;
      showToast("Some data could not be saved on this device. Try removing large documents or photos.");
    }
  }

  if (immediateRemote) {
    const remoteResult = await saveRemoteAppStateNow();

    return { localSaved, ...remoteResult };
  }

  scheduleRemoteAppStateSave();
  return { localSaved, saved: false, queued: appDataRemoteReady };
}

async function persistAppStateWithConfirmation(successMessage, localOnlyPrefix = "Changes saved on this device") {
  const result = await persistAppState({ immediateRemote: true });

  if (result.saved) {
    showToast(successMessage);
    return result;
  }

  if (result.localSaved) {
    showToast(`${localOnlyPrefix}. ${result.reason || "Shared database did not confirm the save yet."}`);
    return result;
  }

  showToast(result.reason || "Changes could not be saved.");
  return result;
}

function dateFromKey(dateKey) {
  return new Date(`${dateKey}T12:00:00`);
}

function dayOffsetBetween(startDate, endDate) {
  return Math.round((dateFromKey(endDate) - dateFromKey(startDate)) / 86400000);
}

function repeatMetadataForPlan(plan, seriesId, startDate, sequence) {
  if (plan.mode === "none") {
    return {};
  }

  return {
    repeatSeriesId: seriesId,
    repeatMode: plan.mode,
    repeatStartDate: startDate,
    repeatEndDate: plan.endDate,
    repeatIndefinite: plan.indefinite,
    repeatGeneratedUntil: plan.generatedUntil,
    repeatSequence: sequence,
    repeatDetached: false
  };
}

function eventIsRepeating(event) {
  return Boolean(event?.repeatSeriesId && !event.repeatDetached);
}

function futureRepeatEventsForEvent(event) {
  if (!eventIsRepeating(event)) {
    return [];
  }

  return events
    .filter(
      (candidate) =>
        candidate.repeatSeriesId === event.repeatSeriesId &&
        !candidate.repeatDetached &&
        candidate.date >= event.date
    )
    .sort(eventSort);
}

function repeatEditScopeForEvent(event) {
  const futureEvents = futureRepeatEventsForEvent(event);

  if (futureEvents.length <= 1) {
    return "current";
  }

  return window.confirm("This event has repeat dates. Update this event and all future repeats? Press Cancel to update only this event.")
    ? "future"
    : "current";
}

function preservedStaffingForEvent(event) {
  return {
    roles: [...(event.roles || [])],
    roleAssignments: { ...(event.roleAssignments || {}) },
    crew: [...(event.crew || [])]
  };
}

function updateFutureRepeatEvents(targetEvent, eventData, attachedDocs = []) {
  const futureEvents = futureRepeatEventsForEvent(targetEvent);
  const dateOffset = dayOffsetBetween(targetEvent.date, eventData.date);

  futureEvents.forEach((event, index) => {
    const nextDate = event.id === targetEvent.id ? eventData.date : toDateKey(addDays(dateFromKey(event.date), dateOffset));
    const staffing = event.id === targetEvent.id ? {} : preservedStaffingForEvent(event);

    Object.assign(event, clonePlainData(eventData), staffing, {
      date: nextDate,
      repeatDetached: false,
      repeatSequence: event.repeatSequence ?? index
    });
    appendDocumentsToEvent(event, attachedDocs);
  });

  return futureEvents.length;
}

function indefiniteRepeatEndDate(startDate) {
  return toDateKey(addMonths(new Date(`${startDate}T12:00:00`), indefiniteRepeatYears * 12));
}

function repeatPlanForEvent(startDate) {
  if (editingEventId !== null || repeatMode.value === "none") {
    return {
      dates: [startDate],
      mode: "none",
      indefinite: false,
      endDate: "",
      generatedUntil: ""
    };
  }

  if (repeatMode.value === "specific") {
    const extraDates = repeatSpecificDates.filter((date) => date !== startDate).sort();
    const dates = [startDate, ...extraDates];

    if (dates.length === 1) {
      showToast("Add at least one repeat date.");
      return null;
    }

    return {
      dates,
      mode: "specific",
      indefinite: false,
      endDate: dates[dates.length - 1],
      generatedUntil: dates[dates.length - 1]
    };
  }

  if (repeatMode.value === "weekly") {
    const isIndefinite = repeatIndefinitely.checked;
    const endDate = isIndefinite ? indefiniteRepeatEndDate(startDate) : repeatUntil.value;

    if (!isIndefinite && (!repeatUntil.value || repeatUntil.value <= startDate)) {
      showToast("Choose a weekly repeat end date after the event date.");
      return null;
    }

    const dates = [startDate, ...weeklyRepeatDates(startDate, endDate)];

    if (dates.length === 1) {
      showToast("Choose a weekly repeat end date at least one week later.");
      return null;
    }

    return {
      dates,
      mode: "weekly",
      indefinite: isIndefinite,
      endDate: isIndefinite ? "" : repeatUntil.value,
      generatedUntil: endDate
    };
  }

  return {
    dates: [startDate],
    mode: "none",
    indefinite: false,
    endDate: "",
    generatedUntil: ""
  };
}

function eventFormAvailabilityContext(date = eventFormDate()) {
  return {
    date,
    loadInTime: loadInTimeSelect.value,
    doorsTime: doorsTimeSelect.value,
    time: doorsTimeSelect.value
  };
}

function availableFreelancersForDate(date) {
  if (!date) {
    return [];
  }

  return freelancers.filter((person) => availabilityForEvent(person, eventFormAvailabilityContext(date)) !== "unavailable");
}

function availablePeopleForEventRoles(event, roles) {
  return freelancers
    .filter((person) => roles.includes(person.role) && availabilityForEvent(person, event) !== "unavailable")
    .sort((a, b) => a.role.localeCompare(b.role) || a.name.localeCompare(b.name));
}

function soundEngineers() {
  return freelancers.filter((person) => person.role === "Sound engineer");
}

function rotaVenueGroup(venue) {
  if (["Dock", "Pier", "Garden"].includes(venue)) {
    return "Dock / Pier / Garden";
  }

  if (["Riverside Yard", "Riverside Upstairs"].includes(venue)) {
    return "Riverside Yard / Upstairs";
  }

  return venue || "No venue";
}

function rotaShiftGroupKey(event) {
  return `${event.date}::${rotaVenueGroup(event.venue)}`;
}

function rotaShiftGroupsForEvents(eventList) {
  const groups = new Map();

  eventList.forEach((event) => {
    const key = rotaShiftGroupKey(event);
    const group = groups.get(key) || {
      key,
      date: event.date,
      venueGroup: rotaVenueGroup(event.venue),
      events: []
    };

    group.events.push(event);
    groups.set(key, group);
  });

  return [...groups.values()].sort((a, b) => eventSort(a.events[0], b.events[0]) || a.venueGroup.localeCompare(b.venueGroup));
}

function soundEngineerAvailableForShiftGroup(person, group) {
  return group.events.every((event) => availabilityForEvent(person, event) !== "unavailable");
}

function availableSoundEngineersForShiftGroup(group) {
  return soundEngineers().filter((person) => soundEngineerAvailableForShiftGroup(person, group));
}

function assignedPersonIdForRoles(event, roles) {
  const assignments = event.roleAssignments || {};
  const assignedEntry = roles
    .map((role) => assignments[role])
    .find((personId) => personId && roles.includes(freelancerById(personId)?.role));

  return assignedEntry ? Number(assignedEntry) : "";
}

function assignedSoundEngineer(event) {
  const assignedId = assignedPersonIdForRoles(event, ["Sound engineer"]);

  return assignedId ? freelancerById(assignedId) : null;
}

function assignedSoundEngineerForShiftGroup(group) {
  const assignedPeople = group.events.map(assignedSoundEngineer);

  if (!assignedPeople.length || assignedPeople.some((person) => !person)) {
    return null;
  }

  const firstEngineer = assignedPeople[0];
  const hasSameEngineer = assignedPeople.every((person) => person.id === firstEngineer.id);

  return hasSameEngineer && soundEngineerAvailableForShiftGroup(firstEngineer, group) ? firstEngineer : null;
}

function preferredExistingSoundEngineerForShiftGroup(group, assignmentCounts, availabilityCounts) {
  const assignedCounts = new Map();

  group.events.forEach((event) => {
    const assigned = assignedSoundEngineer(event);

    if (assigned && soundEngineerAvailableForShiftGroup(assigned, group)) {
      assignedCounts.set(assigned.id, (assignedCounts.get(assigned.id) || 0) + 1);
    }
  });

  return [...assignedCounts.entries()]
    .map(([personId, count]) => ({
      person: freelancerById(personId),
      count
    }))
    .filter((entry) => entry.person)
    .sort(
      (a, b) =>
        b.count - a.count ||
        compareSoundEngineerForRota(a.person, b.person, assignmentCounts, availabilityCounts)
    )[0]?.person || null;
}

function soundEngineerShiftGroupNeedsAutoAssignment(group) {
  return !assignedSoundEngineerForShiftGroup(group);
}

function soundEngineerAvailabilityCounts(eventList) {
  const shiftGroups = rotaShiftGroupsForEvents(eventList);

  return new Map(
    soundEngineers().map((person) => [
      person.id,
      shiftGroups.filter((group) => soundEngineerAvailableForShiftGroup(person, group)).length
    ])
  );
}

function soundEngineerAssignmentCounts(eventList) {
  const counts = new Map(soundEngineers().map((person) => [person.id, 0]));

  rotaShiftGroupsForEvents(eventList).forEach((group) => {
    const assigned = assignedSoundEngineerForShiftGroup(group);

    if (assigned) {
      counts.set(assigned.id, (counts.get(assigned.id) || 0) + 1);
    }
  });

  return counts;
}

function setShiftGroupSoundEngineer(group, person) {
  group.events.forEach((event) => {
    setEventRoleAssignment(event, "Sound engineer", person.id);
    syncEventCrewFromAssignments(event);
  });
}

function compareSoundEngineerForRota(a, b, assignmentCounts, availabilityCounts) {
  const aAvailability = Math.max(availabilityCounts.get(a.id) || 0, 1);
  const bAvailability = Math.max(availabilityCounts.get(b.id) || 0, 1);
  const aAssignments = assignmentCounts.get(a.id) || 0;
  const bAssignments = assignmentCounts.get(b.id) || 0;
  const loadCompare = aAssignments / aAvailability - bAssignments / bAvailability;

  if (loadCompare !== 0) {
    return loadCompare;
  }

  if (aAssignments !== bAssignments) {
    return aAssignments - bAssignments;
  }

  if (aAvailability !== bAvailability) {
    return bAvailability - aAvailability;
  }

  return a.name.localeCompare(b.name);
}

function generateSoundEngineerRota() {
  if (activeUserLevel !== "admin") {
    showToast("Only admin can generate the rota.");
    return;
  }

  const periodEvents = currentConfirmedRotaPeriodEvents();
  const engineers = soundEngineers();

  if (!periodEvents.length) {
    showToast(`No confirmed events to rota in ${periodLabel(rotaFocusDate, rotaView)}.`);
    return;
  }

  if (!engineers.length) {
    showToast("Add at least one sound engineer profile before generating the rota.");
    return;
  }

  const availabilityCounts = soundEngineerAvailabilityCounts(periodEvents);
  const assignmentCounts = soundEngineerAssignmentCounts(periodEvents);
  const shiftGroups = rotaShiftGroupsForEvents(periodEvents);
  const keptAssignments = shiftGroups.filter((group) => !soundEngineerShiftGroupNeedsAutoAssignment(group)).length;
  let assignedCount = 0;
  let unavailableCount = 0;

  shiftGroups
    .filter(soundEngineerShiftGroupNeedsAutoAssignment)
    .sort(
      (a, b) =>
        availableSoundEngineersForShiftGroup(a).length - availableSoundEngineersForShiftGroup(b).length ||
        eventSort(a.events[0], b.events[0])
    )
    .forEach((group) => {
      const candidate =
        preferredExistingSoundEngineerForShiftGroup(group, assignmentCounts, availabilityCounts) ||
        availableSoundEngineersForShiftGroup(group).sort((a, b) =>
          compareSoundEngineerForRota(a, b, assignmentCounts, availabilityCounts)
        )[0];

      if (!candidate) {
        unavailableCount += 1;
        return;
      }

      setShiftGroupSoundEngineer(group, candidate);
      assignmentCounts.set(candidate.id, (assignmentCounts.get(candidate.id) || 0) + 1);
      assignedCount += 1;
    });

  render();
  showToast(
    `Generated rota for confirmed events in ${periodLabel(rotaFocusDate, rotaView)}: ${assignedCount} sound shift${assignedCount === 1 ? "" : "s"} assigned, ${keptAssignments} kept${unavailableCount ? `, ${unavailableCount} without available sound engineer` : ""}.`
  );
}

function assignmentSelectOptions(event, roles, selectedPersonId, emptyLabel) {
  const people = availablePeopleForEventRoles(event, roles);
  const selectedId = Number(selectedPersonId);
  const options = people
    .map((person) => {
      const availability = availabilityForEvent(person, event);
      const availabilityText = availability === "limited" ? " · limited" : "";
      const selected = person.id === selectedId ? " selected" : "";

      return `<option value="${person.id}"${selected}>${escapeHtml(person.name)} · ${escapeHtml(person.role)}${availabilityText}</option>`;
    })
    .join("");

  return `<option value="">${emptyLabel}</option>${options}`;
}

function setEventRoleAssignment(event, role, personId) {
  event.roles = event.roles || [];
  event.roleAssignments = event.roleAssignments || {};
  event.shiftConfirmations = event.shiftConfirmations || {};
  event.shiftNotifications = event.shiftNotifications || {};
  const previousPersonId = event.roleAssignments[role];

  if (!personId) {
    if (previousPersonId) {
      delete event.shiftConfirmations[previousPersonId];
      delete event.shiftNotifications[previousPersonId];
    }

    delete event.roleAssignments[role];
    return;
  }

  if (previousPersonId && Number(previousPersonId) !== Number(personId)) {
    delete event.shiftConfirmations[previousPersonId];
    delete event.shiftConfirmations[personId];
    delete event.shiftNotifications[previousPersonId];
    delete event.shiftNotifications[personId];
  }

  event.roleAssignments[role] = Number(personId);

  if (!event.roles.includes(role)) {
    event.roles.push(role);
  }
}

function syncEventCrewFromAssignments(event) {
  event.crew = [...new Set(Object.values(event.roleAssignments || {}).map(Number).filter(Boolean))];
}

function engineerShiftDistribution(eventList) {
  const engineers = freelancers
    .filter((person) => engineerRoles.includes(person.role))
    .sort((a, b) => a.name.localeCompare(b.name));
  const counts = new Map(engineers.map((person) => [person.id, 0]));

  rotaShiftGroupsForEvents(eventList).forEach((group) => {
    const countedIds = new Set();

    group.events.forEach((event) => {
      Object.entries(event.roleAssignments || {}).forEach(([role, personId]) => {
        const person = freelancerById(personId);

        if (engineerRoles.includes(role) && person && engineerRoles.includes(person.role)) {
          countedIds.add(person.id);
        }
      });
    });

    countedIds.forEach((personId) => {
      counts.set(personId, (counts.get(personId) || 0) + 1);
    });
  });

  return engineers
    .map((person) => ({
      person,
      count: counts.get(person.id) || 0
    }))
    .sort((a, b) => b.count - a.count || a.person.name.localeCompare(b.person.name));
}

function renderRotaDistribution(eventList) {
  rotaDistribution.hidden = activeUserLevel !== "admin" || activeView !== "rota";

  if (rotaDistribution.hidden) {
    rotaDistribution.innerHTML = "";
    return;
  }

  const distribution = engineerShiftDistribution(eventList);
  const shiftGroups = rotaShiftGroupsForEvents(eventList);
  const maxCount = Math.max(1, ...distribution.map((entry) => entry.count));

  rotaDistribution.innerHTML = distribution.length
    ? `
      <div class="distribution-head">
        <div>
          <p class="eyebrow">Engineer distribution</p>
          <strong>${periodLabel(rotaFocusDate, rotaView)}</strong>
        </div>
        <small>${shiftGroups.length} engineer shift${shiftGroups.length === 1 ? "" : "s"} · ${eventList.length} event${eventList.length === 1 ? "" : "s"} in view</small>
      </div>
      <div class="distribution-list">
        ${distribution
          .map((entry) => {
            const percentage = Math.max(6, Math.round((entry.count / maxCount) * 100));

            return `
              <article class="distribution-row">
                <div>
                  <strong>${escapeHtml(entry.person.name)}</strong>
                  <span>${escapeHtml(entry.person.role)}</span>
                </div>
                <div class="distribution-meter" aria-hidden="true">
                  <span style="width: ${percentage}%"></span>
                </div>
                <strong>${entry.count}</strong>
              </article>
            `;
          })
          .join("")}
      </div>
    `
    : `<div class="empty-state">Add engineer profiles to see shift distribution.</div>`;
}

function freelancerSelectOptions(date) {
  const availableFreelancers = availableFreelancersForDate(date);
  const placeholder = date ? "Select available freelancer" : "Select event date first";
  const options = availableFreelancers
    .map((person) => `<option value="${person.id}">${escapeHtml(person.name)} · ${escapeHtml(person.role)}</option>`)
    .join("");

  return `<option value="">${placeholder}</option>${options}`;
}

function eventPromoterOptions(selectedId = "") {
  const selectedValue = String(selectedId || "");
  const options = promoterProfiles()
    .map((person) => `<option value="${person.id}" ${String(person.id) === selectedValue ? "selected" : ""}>${escapeHtml(person.name)}</option>`)
    .join("");

  return `<option value="">No promoter selected</option>${options}`;
}

function renderEventPromoterOptions(selectedId = eventPromoterSelect?.value || "") {
  if (!eventPromoterSelect) {
    return;
  }

  eventPromoterSelect.innerHTML = eventPromoterOptions(selectedId);
  eventPromoterSelect.value = promoterProfiles().some((person) => String(person.id) === String(selectedId)) ? String(selectedId) : "";
}

function refreshRoleFreelancerOptions() {
  const date = eventFormDate();

  roleAssignmentList.querySelectorAll("select[name='roleFreelancer']").forEach((select) => {
    const currentValue = select.value;
    const stillAvailable = !currentValue || availableFreelancersForDate(date).some((person) => person.id === Number(currentValue));

    select.innerHTML = freelancerSelectOptions(date);
    select.value = stillAvailable ? currentValue : "";
  });
}

function renderRoleAssignmentPicker() {
  roleAssignmentList.innerHTML = roleOptions
    .map(
      (role) => `
        <div class="role-assignment-row">
          <label class="role-check">
            <input type="checkbox" name="eventRole" value="${role}" />
            <span>${role}</span>
          </label>
          <select name="roleFreelancer" data-role="${role}" disabled>
            ${freelancerSelectOptions(eventFormDate())}
          </select>
        </div>
      `
    )
    .join("");

  roleAssignmentList.querySelectorAll("input[name='eventRole']").forEach((checkbox) => {
    checkbox.addEventListener("change", updateRolePickerState);
  });
}

function updateRolePickerState() {
  const selectedRoles = [...roleAssignmentList.querySelectorAll("input[name='eventRole']:checked")].map((input) => input.value);

  roleAssignmentList.querySelectorAll("select[name='roleFreelancer']").forEach((select) => {
    const isSelected = selectedRoles.includes(select.dataset.role);
    select.disabled = !isSelected;

    if (!isSelected) {
      select.value = "";
    }
  });

  rolePickerSummary.textContent = selectedRoles.length
    ? `${selectedRoles.length} staffing need${selectedRoles.length === 1 ? "" : "s"} selected`
    : "Select staffing";
}

function resetRolePicker() {
  roleAssignmentList.querySelectorAll("input[name='eventRole']").forEach((checkbox) => {
    checkbox.checked = false;
  });
  refreshRoleFreelancerOptions();
  updateRolePickerState();
  rolePickerMenu.hidden = true;
  rolePickerToggle.setAttribute("aria-expanded", "false");
}

function setRolePickerFromEvent(event) {
  resetRolePicker();
  refreshRoleFreelancerOptions();

  event.roles.forEach((role) => {
    const checkbox = roleAssignmentList.querySelector(`input[name='eventRole'][value="${role}"]`);
    const select = roleAssignmentList.querySelector(`select[name='roleFreelancer'][data-role="${role}"]`);

    if (checkbox) {
      checkbox.checked = true;
    }

    if (select && event.roleAssignments?.[role]) {
      select.value = String(event.roleAssignments[role]);
    }
  });

  updateRolePickerState();
}

function selectedDietaryRequirements(event) {
  const dietaryRequirements = event.food?.dietaryRequirements || [];

  return Array.isArray(dietaryRequirements) ? dietaryRequirements : [dietaryRequirements].filter(Boolean);
}

function setDietaryRequirementsFromEvent(event) {
  const selectedDietaries = selectedDietaryRequirements(event);

  eventForm.querySelectorAll("input[name='dietaryRequirements']").forEach((input) => {
    input.checked = selectedDietaries.includes(input.value);
  });
}

function clearPendingEventDocuments() {
  pendingEventDocuments = [];
  eventDocumentsInput.value = "";
}

function renderEventDocumentList(event = null) {
  if (!currentAccess().canAttachDocs) {
    eventDocumentList.innerHTML = "No documents attached";
    return;
  }

  const existingDocs = event ? eventDocuments(event) : [];
  const selectedDocs = pendingEventDocuments;
  const existingMarkup = existingDocs.length
    ? renderAttachmentRows(event, existingDocs, true)
    : "";
  const selectedMarkup = selectedDocs.length
    ? renderAttachmentRows({ id: 0, title: "Pending upload", date: toDateKey(new Date()), venue: "" }, selectedDocs, false)
    : "";

  const hasDocuments = Boolean(existingMarkup || selectedMarkup);

  eventDocumentList.innerHTML = hasDocuments ? `${existingMarkup}${selectedMarkup}` : "No documents attached";

  if (event && existingDocs.length) {
    bindDocumentActions(eventDocumentList, event);
  }
}

function selectedEventDocumentUploads() {
  return currentAccess().canAttachDocs ? pendingEventDocuments.map(clonePlainData) : [];
}

function appendDocumentsToEvent(event, docs) {
  if (!docs.length) {
    return;
  }

  addDocumentsToLibrary(docs);
  event.docs = [...eventDocuments(event), ...docs.map(clonePlainData)];
}

function openCreateEventModal(date = "") {
  if (!currentAccess().canCreateEvents) {
    showToast("This user level can view events but cannot create them.");
    return;
  }

  editingEventId = null;
  eventForm.reset();
  eventForm.elements.date.value = date;
  eventForm.elements.status.value = "pencil";
  renderEventPromoterOptions(activeUserLevel === "promoter" ? activePromoterId : "");
  clearPendingEventDocuments();
  updateEventTimeSelects();
  resetRepeatFields();
  resetRolePicker();
  renderEventDocumentList();
  eventModalTitle.textContent = "New event";
  eventSubmitButton.textContent = "Create event";
  deleteEventButton.hidden = true;
  eventModal.showModal();
}

function openEditEventModal(event) {
  if (!currentAccess().canEditEvents) {
    showToast("This user level can view events but cannot edit them.");
    return;
  }

  editingEventId = event.id;
  eventForm.elements.title.value = event.title;
  eventForm.elements.date.value = event.date;
  eventForm.elements.status.value = eventStatusValue(event.status);
  setEventTimeFields(event);
  eventForm.elements.venue.value = event.venue;
  renderEventPromoterOptions(event.promoterId || "");
  eventForm.elements.clientName.value = event.client?.name || "";
  eventForm.elements.clientContact.value = event.client?.contact || "";
  eventForm.elements.guestNumbers.value = event.client?.guestNumbers || "";
  eventForm.elements.barType.value = event.bar?.type || "";
  eventForm.elements.welcomeDrinks.checked = Boolean(event.bar?.welcomeDrinks);
  eventForm.elements.barNotes.value = event.bar?.notes || "";
  eventForm.elements.foodType.value = event.food?.type || "";
  setDietaryRequirementsFromEvent(event);
  eventForm.elements.foodNotes.value = event.food?.notes || "";
  eventForm.elements.needsWristbands.checked = Boolean(event.needs?.wristbands);
  eventForm.elements.needsDjSetup.checked = Boolean(event.needs?.djSetup);
  eventForm.elements.needsMicrophones.checked = Boolean(event.needs?.microphones);
  eventForm.elements.needsPlaylist.checked = Boolean(event.needs?.playlist);
  eventForm.elements.setTimes.value = event.setTimes || "";
  eventForm.elements.notes.value = event.notes || "";
  clearPendingEventDocuments();
  resetRepeatFields();
  eventRepeatFields.hidden = true;
  setRolePickerFromEvent(event);
  renderEventDocumentList(event);
  eventModalTitle.textContent = "Edit event";
  eventSubmitButton.textContent = "Save event";
  deleteEventButton.hidden = false;
  eventModal.showModal();
}

function resetEventFormState() {
  eventForm.reset();
  clearPendingEventDocuments();
  updateEventTimeSelects();
  resetRepeatFields();
  resetRolePicker();
  renderEventDocumentList();
  editingEventId = null;
  deleteEventButton.hidden = true;
}

function requestEventFormClose() {
  if (!eventModal.open) {
    return;
  }

  if (!eventExitModal.open) {
    eventExitModal.showModal();
  }
}

function discardEventFormChanges() {
  if (eventExitModal.open) {
    eventExitModal.close();
  }

  eventModal.close();
  resetEventFormState();
}

function saveEventFormBeforeClose() {
  if (eventExitModal.open) {
    eventExitModal.close();
  }

  eventForm.requestSubmit();
}

function eventsToDeleteForEvent(event) {
  if (!eventIsRepeating(event)) {
    return [event];
  }

  const futureEvents = futureRepeatEventsForEvent(event);

  if (futureEvents.length <= 1) {
    return [event];
  }

  return window.confirm("Delete this event and all future repeat bookings? Press Cancel to delete only this event.")
    ? futureEvents
    : [event];
}

function cancellationRecipientsForEvent(event) {
  const seen = new Set();

  return assignedPeopleForEvent(event)
    .filter((person) => {
      const email = normaliseEmail(person.email);

      if (!email || seen.has(email)) {
        return false;
      }

      seen.add(email);
      return true;
    })
    .map((person) => ({
      name: person.name,
      email: person.email
    }));
}

function cancellationNoticeBody(event) {
  return [
    "Hi,",
    "",
    "This booking has been cancelled:",
    "",
    `Event: ${event.title}`,
    `Date: ${formatDate(event.date)}`,
    `Venue: ${event.venue || "Venue TBC"}`,
    `Times: ${eventTimeSummary(event)}`,
    "",
    "You have been removed from the rota for this shift.",
    "",
    "Thanks,",
    "Peppermint Production"
  ].join("\n");
}

function cancellationNoticePayload(event, recipients) {
  return {
    to: recipients.map((person) => person.email),
    subject: `Cancelled: ${event.title} - ${formatDate(event.date)}`,
    body: cancellationNoticeBody(event)
  };
}

function cancellationNoticesForDeletedEvents(targetEvents) {
  return targetEvents
    .filter((targetEvent) => eventStatusValue(targetEvent.status) === "confirmed")
    .map((targetEvent) => ({
      event: clonePlainData(targetEvent),
      recipients: cancellationRecipientsForEvent(targetEvent)
    }))
    .filter((notice) => notice.recipients.length);
}

async function sendCancellationNotices(notices) {
  if (!notices.length) {
    return;
  }

  const results = await Promise.all(
    notices.map((notice) =>
      sendEmailNotification(cancellationNoticePayload(notice.event, notice.recipients), { fallbackDraft: false })
    )
  );
  const sentCount = results.filter((result) => result.sent).length;
  const recipientCount = notices.reduce((total, notice) => total + notice.recipients.length, 0);

  if (sentCount === notices.length) {
    showToast(`Cancellation notice sent to ${recipientCount} booked freelancer${recipientCount === 1 ? "" : "s"}.`);
    return;
  }

  showToast("Event deleted, but at least one cancellation email could not be sent automatically.");
}

function deleteEvent(event, { closeEventView = false } = {}) {
  if (!currentAccess().canEditEvents) {
    showToast("This user level cannot delete events.");
    return;
  }

  if (!event) {
    showToast("Event not found.");
    return;
  }

  if (!window.confirm(`Delete ${event.title}? Documents will stay in general storage.`)) {
    return;
  }

  const targetEvents = eventsToDeleteForEvent(event);
  const cancellationNotices = cancellationNoticesForDeletedEvents(targetEvents);
  const targetIds = new Set(targetEvents.map((targetEvent) => targetEvent.id));

  for (let index = events.length - 1; index >= 0; index -= 1) {
    if (targetIds.has(events[index].id)) {
      events.splice(index, 1);
    }
  }
  markAppDataChanged();

  if (eventExitModal.open) {
    eventExitModal.close();
  }

  if (eventModal.open && targetIds.has(editingEventId)) {
    eventModal.close();
    resetEventFormState();
  }

  if (closeEventView && eventViewModal.open) {
    eventViewModal.close();
  }

  selectedEventId = visibleEventsForCurrentUser()[0]?.id || events[0]?.id || 0;
  renderAvailabilityOptions();
  renderTechnicianProfileOptions();
  render();
  persistAppState({ immediateRemote: true });
  sendCancellationNotices(cancellationNotices).catch((error) => {
    showToast(`Event deleted, but cancellation email failed: ${error.message}`);
  });
  showToast(
    targetEvents.length === 1
      ? `${event.title} deleted.`
      : `${targetEvents.length} repeat bookings deleted.`
  );
}

function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function addDays(date, days) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days, 12);
}

function addMonths(date, months) {
  return new Date(date.getFullYear(), date.getMonth() + months, 1, 12);
}

function startOfWeek(date) {
  const mondayOffset = (date.getDay() + 6) % 7;

  return addDays(date, -mondayOffset);
}

function calendarWeekDays(date) {
  const weekStart = startOfWeek(date);

  return Array.from({ length: 7 }, (_, index) => {
    const dayDate = addDays(weekStart, index);

    return {
      label: new Intl.DateTimeFormat("en-GB", { weekday: "short" }).format(dayDate),
      day: String(dayDate.getDate()).padStart(2, "0"),
      date: toDateKey(dayDate),
      isBlank: false
    };
  });
}

function formatWeekRange(date) {
  const weekStart = startOfWeek(date);
  const weekEnd = addDays(weekStart, 6);
  const formatter = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" });

  return `${formatter.format(weekStart)} - ${formatter.format(weekEnd)}`;
}

function periodLabel(date, view) {
  return view === "month" ? formatMonth(date) : formatWeekRange(date);
}

function shiftPeriod(date, view, direction) {
  return view === "month" ? addMonths(date, direction) : addDays(date, direction * 7);
}

function periodBounds(date, view) {
  if (view === "month") {
    return {
      start: new Date(date.getFullYear(), date.getMonth(), 1, 12),
      end: new Date(date.getFullYear(), date.getMonth() + 1, 0, 12)
    };
  }

  const start = startOfWeek(date);

  return {
    start,
    end: addDays(start, 6)
  };
}

function eventSort(a, b) {
  const dateCompare = a.date.localeCompare(b.date);

  if (dateCompare !== 0) {
    return dateCompare;
  }

  return (a.loadInTime || a.time || "").localeCompare(b.loadInTime || b.time || "");
}

function eventsForPeriod(focusDate, view) {
  const { start, end } = periodBounds(focusDate, view);
  const startDate = toDateKey(start);
  const endDate = toDateKey(end);

  return events
    .filter((event) => event.date >= startDate && event.date <= endDate)
    .sort(eventSort);
}

function calendarDaysForView(date, view) {
  if (view === "month") {
    return monthDatesForDate(date).map((monthDate) => {
      if (!monthDate) {
        return { isBlank: true };
      }

      return {
        isBlank: false,
        label: new Intl.DateTimeFormat("en-GB", { weekday: "short" }).format(monthDate),
        day: String(monthDate.getDate()).padStart(2, "0"),
        date: toDateKey(monthDate)
      };
    });
  }

  return calendarWeekDays(date);
}

function monthForOffset(offset) {
  return new Date(availabilityStartDate.getFullYear(), availabilityStartDate.getMonth() + offset, 1, 12);
}

function monthDates(offset) {
  const month = monthForOffset(offset);
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const firstWeekday = (month.getDay() + 6) % 7;
  const cells = [];

  for (let index = 0; index < firstWeekday; index += 1) {
    cells.push(null);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(new Date(year, monthIndex, day, 12));
  }

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  return cells;
}

function monthDatesForDate(date) {
  const firstOfMonth = new Date(date.getFullYear(), date.getMonth(), 1, 12);
  const year = firstOfMonth.getFullYear();
  const monthIndex = firstOfMonth.getMonth();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const firstWeekday = (firstOfMonth.getDay() + 6) % 7;
  const cells = [];

  for (let index = 0; index < firstWeekday; index += 1) {
    cells.push(null);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(new Date(year, monthIndex, day, 12));
  }

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  return cells;
}

function eventStatusValue(status) {
  const statusMap = {
    draft: "pencil",
    pending: "contract-sent",
    pencil: "pencil",
    "contract-sent": "contract-sent",
    confirmed: "confirmed"
  };

  return statusMap[status] || "pencil";
}

function eventStatusLabel(status) {
  const labels = {
    pencil: "Pencil",
    "contract-sent": "Contract sent",
    confirmed: "Confirmed"
  };

  return labels[eventStatusValue(status)];
}

function eventVenueClass(venue) {
  const venueMap = {
    Dock: "venue-dock",
    Pier: "venue-pier",
    Garden: "venue-garden",
    "Whole site BTB": "venue-whole-site-btb",
    "Riverside Yard": "venue-riverside-yard",
    "Riverside Upstairs": "venue-riverside-upstairs",
    "Riverside whole site": "venue-riverside-whole-site"
  };

  return venueMap[venue] || "venue-default";
}

function statusLabel(status) {
  const value = status || "";

  if (["pencil", "contract-sent", "draft", "pending"].includes(value)) {
    return eventStatusLabel(value);
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
}

function selectedEvent() {
  const visibleEvents = visibleEventsForCurrentUser();

  return visibleEvents.find((event) => event.id === selectedEventId) || visibleEvents[0] || events.find((event) => event.id === selectedEventId) || events[0];
}

function selectedAvailabilityPerson() {
  return freelancers.find((person) => person.id === selectedAvailabilityPersonId) || freelancers[0];
}

function currentAccess() {
  return accessProfiles[activeUserLevel] || accessProfiles.admin;
}

function passcodeProtectedLevel(level = activeUserLevel) {
  return ["admin", "technician", "dj", "promoter"].includes(level);
}

function staffProfileForLevel(level = activeUserLevel) {
  return staffProfileConfig[level] || null;
}

function isStaffProfileUser(level = activeUserLevel) {
  return Boolean(staffProfileForLevel(level));
}

function eventVisibleToCurrentUser(event) {
  return !isStaffProfileUser() || eventStatusValue(event.status) === "confirmed";
}

function visibleEventsForCurrentUser() {
  return events.filter(eventVisibleToCurrentUser);
}

function isSoundEngineerUser() {
  return activeUserLevel === "technician";
}

function availabilityButtonVisibleForCurrentView() {
  if (!currentAccess().canAddAvailability) {
    return false;
  }

  return !isSoundEngineerUser() || ["dashboard", "rota"].includes(activeView);
}

function readStoredPasscodes() {
  try {
    return JSON.parse(window.localStorage?.getItem(passcodeStorageKey) || "{}");
  } catch {
    return {};
  }
}

function writeStoredPasscodes(passcodes) {
  try {
    window.localStorage?.setItem(passcodeStorageKey, JSON.stringify(passcodes));
  } catch {
    // Passcodes only support the local prototype; the app should keep working if storage is unavailable.
  }
}

function readProfileReviewPrompts() {
  try {
    return JSON.parse(window.localStorage?.getItem(profileReviewStorageKey) || "{}");
  } catch {
    return {};
  }
}

function writeProfileReviewPrompts(prompts) {
  try {
    window.localStorage?.setItem(profileReviewStorageKey, JSON.stringify(prompts));
  } catch {
    // This prompt is a convenience, so failed storage should not block login.
  }
}

function readCookieValue(name) {
  try {
    const prefix = `${encodeURIComponent(name)}=`;
    const cookie = document.cookie
      .split(";")
      .map((item) => item.trim())
      .find((item) => item.startsWith(prefix));

    return cookie ? decodeURIComponent(cookie.slice(prefix.length)) : "";
  } catch {
    return "";
  }
}

function writeCookieValue(name, value, maxAgeSeconds = null) {
  try {
    const maxAge = Number.isFinite(maxAgeSeconds) ? `; Max-Age=${maxAgeSeconds}` : "";

    document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; Path=/; SameSite=Lax${maxAge}`;
  } catch {
    // Cookie fallback is optional.
  }
}

function clearCookieValue(name) {
  writeCookieValue(name, "", 0);
}

function readLoginRecordFromCookie(name) {
  const value = readCookieValue(name);

  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function writeActiveLoginHistoryState(record) {
  try {
    const currentState = typeof history.state === "object" && history.state !== null ? history.state : {};

    history.replaceState({ ...currentState, [activeLoginHistoryStateKey]: record }, "", window.location.href);
  } catch {
    // History state is a refresh-only fallback.
  }
}

function readActiveLoginHistoryState() {
  try {
    return history.state?.[activeLoginHistoryStateKey] || null;
  } catch {
    return null;
  }
}

function clearActiveLoginHistoryState() {
  try {
    const currentState = typeof history.state === "object" && history.state !== null ? { ...history.state } : {};

    delete currentState[activeLoginHistoryStateKey];
    history.replaceState(currentState, "", window.location.href);
  } catch {
    // History state is optional.
  }
}

function readWindowNameState() {
  try {
    return JSON.parse(window.name || "{}");
  } catch {
    return {};
  }
}

function writeActiveLoginWindowName(record) {
  try {
    window.name = JSON.stringify({ ...readWindowNameState(), [activeLoginWindowNameKey]: record });
  } catch {
    // Window name is a same-tab refresh fallback.
  }
}

function readActiveLoginWindowName() {
  return readWindowNameState()[activeLoginWindowNameKey] || null;
}

function clearActiveLoginWindowName() {
  try {
    const state = readWindowNameState();

    delete state[activeLoginWindowNameKey];
    window.name = Object.keys(state).length ? JSON.stringify(state) : "";
  } catch {
    // Window name fallback is optional.
  }
}

function readRememberedLogin() {
  try {
    return JSON.parse(window.localStorage?.getItem(rememberedLoginStorageKey) || "null") || readLoginRecordFromCookie(rememberedLoginStorageKey);
  } catch {
    return readLoginRecordFromCookie(rememberedLoginStorageKey);
  }
}

function loginRecordSnapshot(active = true) {
  const subject = passcodeSubjectForLevel();
  const profileId = loginProfileConfigForLevel(activeUserLevel) ? activeStaffProfileId(activeUserLevel) : null;
  const profile = profileId ? freelancerById(profileId) : null;

  return {
    level: activeUserLevel,
    profileId,
    email: profile?.email || (activeUserLevel === "admin" ? productionEmailAddress : ""),
    passcodeKey: subject?.key || "",
    active
  };
}

function writeActiveLoginSession() {
  const snapshot = loginRecordSnapshot(true);

  try {
    window.sessionStorage?.setItem(activeLoginSessionStorageKey, JSON.stringify(snapshot));
  } catch {
    // Refresh login is a convenience; storage failures should not block the app.
  }

  writeCookieValue(activeLoginSessionStorageKey, JSON.stringify(snapshot));
  writeActiveLoginHistoryState(snapshot);
  writeActiveLoginWindowName(snapshot);
}

function clearActiveLoginSession() {
  try {
    window.sessionStorage?.removeItem(activeLoginSessionStorageKey);
  } catch {
    // Refresh login is optional.
  }

  clearCookieValue(activeLoginSessionStorageKey);
  clearActiveLoginHistoryState();
  clearActiveLoginWindowName();
}

function readActiveLoginSession() {
  try {
    return (
      JSON.parse(window.sessionStorage?.getItem(activeLoginSessionStorageKey) || "null") ||
      readLoginRecordFromCookie(activeLoginSessionStorageKey) ||
      readActiveLoginHistoryState() ||
      readActiveLoginWindowName()
    );
  } catch {
    return readLoginRecordFromCookie(activeLoginSessionStorageKey) || readActiveLoginHistoryState() || readActiveLoginWindowName();
  }
}

function writeRememberedLogin(active = true) {
  if (!rememberDevice.checked) {
    try {
      window.localStorage?.removeItem(rememberedLoginStorageKey);
    } catch {
      // Remembering the device is optional.
    }
    clearCookieValue(rememberedLoginStorageKey);
    return;
  }

  const snapshot = loginRecordSnapshot(active);

  try {
    window.localStorage?.setItem(rememberedLoginStorageKey, JSON.stringify(snapshot));
  } catch {
    // Remembering the device is optional.
  }

  writeCookieValue(rememberedLoginStorageKey, JSON.stringify(snapshot), 60 * 60 * 24 * 90);
}

function deactivateRememberedLoginSession() {
  const remembered = readRememberedLogin();

  if (!remembered) {
    return;
  }

  const nextRemembered = { ...remembered, active: false };

  try {
    window.localStorage?.setItem(rememberedLoginStorageKey, JSON.stringify(nextRemembered));
  } catch {
    // Remembered login is optional.
  }

  writeCookieValue(rememberedLoginStorageKey, JSON.stringify(nextRemembered), 60 * 60 * 24 * 90);
}

function applyRememberedLoginToForm() {
  const remembered = readRememberedLogin();

  if (!remembered || !accessProfiles[remembered.level]) {
    rememberDevice.checked = false;
    return;
  }

  loginLevelSelect.value = remembered.level;
  if (remembered.profileId) {
    setActiveStaffProfileId(remembered.profileId, remembered.level);
  }
  loginEmailInput.value = remembered.email || loginEmailForLevel(remembered.level);
  rememberDevice.checked = true;
}

function rememberedLoginMatchesCurrentSubject() {
  const remembered = readRememberedLogin();
  const subject = passcodeSubjectForLevel();

  return Boolean(
    rememberDevice.checked &&
      remembered &&
      remembered.active !== false &&
      remembered.level === activeUserLevel &&
      remembered.passcodeKey &&
      remembered.passcodeKey === subject?.key
  );
}

function loginRecordMatchesSubject(record) {
  const subject = passcodeSubjectForLevel();

  return Boolean(
    record &&
      record.active !== false &&
      record.level === activeUserLevel &&
      record.passcodeKey &&
      record.passcodeKey === subject?.key
  );
}

function applyLoginRecord(record) {
  if (!record || !accessProfiles[record.level]) {
    return false;
  }

  loginLevelSelect.value = record.level;
  if (record.profileId) {
    setActiveStaffProfileId(record.profileId, record.level);
  }
  setUserLevel(record.level);
  loginEmailInput.value = record.email || loginEmailForLevel(record.level);
  renderLoginProfileOptions();
  return true;
}

function resumeStoredLogin() {
  const remembered = readRememberedLogin();
  const sessionLogin = readActiveLoginSession();
  const loginRecord = sessionLogin?.active !== false ? sessionLogin : remembered?.active !== false ? remembered : null;

  if (!applyLoginRecord(loginRecord) || !loginRecordMatchesSubject(loginRecord)) {
    return false;
  }

  rememberDevice.checked = Boolean(remembered?.active !== false && remembered.passcodeKey === loginRecord.passcodeKey);
  unlockedPasscodeKeys.add(passcodeSubjectForLevel().key);
  rememberUnlockedProfileState();
  completeLogin(`${currentAccess().label} access restored.`);
  return true;
}

function profileReviewKey(level = activeUserLevel) {
  return `${level}:${activeStaffProfileId(level)}`;
}

function profilePasscodeKey(profileId) {
  return `profile:${profileId}`;
}

function profileCanHavePasscode(profile) {
  return Boolean(profile && passcodeProfileRoles.includes(profile.role));
}

function removeStoredPasscode(key) {
  const passcodes = readStoredPasscodes();

  delete passcodes[key];
  writeStoredPasscodes(passcodes);
  unlockedPasscodeKeys.delete(key);
}

function removeRememberedLoginForPasscodeKey(key) {
  const remembered = readRememberedLogin();

  if (remembered?.passcodeKey !== key) {
    return;
  }

  try {
    window.localStorage?.removeItem(rememberedLoginStorageKey);
  } catch {
    // Remembered login is optional and should never block an admin reset.
  }

  clearCookieValue(rememberedLoginStorageKey);
}

function removeActiveLoginForPasscodeKey(key) {
  const sessionLogin = readActiveLoginSession();

  if (sessionLogin?.passcodeKey === key) {
    clearActiveLoginSession();
  }
}

function passcodeSubjectForLevel(level = activeUserLevel) {
  if (level === "admin") {
    return {
      key: "profile:admin",
      label: "Admin",
      levelLabel: "Admin",
      digits: 6
    };
  }

  if (level === "technician" || level === "dj" || level === "promoter") {
    const person = freelancerById(activeStaffProfileId(level));

    return {
      key: person ? profilePasscodeKey(person.id) : profilePasscodeKey(level),
      label: person?.name || accessProfiles[level].label,
      levelLabel: accessProfiles[level].label,
      digits: 4
    };
  }
}

function passcodeIsUnlocked(level = activeUserLevel) {
  if (!passcodeProtectedLevel(level)) {
    return true;
  }

  return unlockedPasscodeKeys.has(passcodeSubjectForLevel(level).key);
}

function rememberUnlockedProfileState() {
  unlockedProfileState = {
    level: activeUserLevel,
    technicianId: activeTechnicianId,
    djId: activeDjId,
    promoterId: activePromoterId
  };
}

function staffProfilePeopleForLevel(level = activeUserLevel) {
  const config = staffProfileForLevel(level);

  if (!config) {
    return freelancers;
  }

  const people = freelancers.filter((person) => config.roles.includes(person.role));

  return people.length ? people : freelancers;
}

function loginProfileConfigForLevel(level) {
  if (level === "technician" || level === "dj") {
    return staffProfileForLevel(level);
  }

  if (level === "promoter") {
    return {
      profileLabel: "Promoter profile",
      roles: ["Promoter"],
      coverLabel: "promoter"
    };
  }

  return null;
}

function loginProfilePeopleForLevel(level) {
  const config = loginProfileConfigForLevel(level);

  if (!config) {
    return [];
  }

  const people = freelancers.filter((person) => config.roles.includes(person.role));

  return people;
}

function loginEmailForLevel(level) {
  if (level === "admin") {
    return productionEmailAddress;
  }

  const profile = freelancerById(activeStaffProfileId(level));

  return profile?.email || "";
}

function profileForLoginEmail(level, email) {
  const loginEmail = normaliseEmail(email);

  if (!loginEmail) {
    return null;
  }

  return loginProfilePeopleForLevel(level).find((person) => normaliseEmail(person.email) === loginEmail) || null;
}

function validateLoginEmailForLevel(level) {
  const loginEmail = normaliseEmail(loginEmailInput.value);

  if (level === "admin") {
    return loginEmail === normaliseEmail(productionEmailAddress)
      ? { ok: true }
      : { ok: false, message: `Admin login must use ${productionEmailAddress}.` };
  }

  const config = loginProfileConfigForLevel(level);

  if (!config) {
    return { ok: true };
  }

  const profile = profileForLoginEmail(level, loginEmail);

  if (!loginEmail) {
    return { ok: false, message: "Enter the email saved on your profile." };
  }

  if (!profile) {
    return { ok: false, message: `No ${accessProfiles[level].label.toLowerCase()} profile found for that email.` };
  }

  return { ok: true, profile };
}

function activeStaffProfileId(level = activeUserLevel) {
  if (level === "dj") {
    return activeDjId;
  }

  if (level === "technician") {
    return activeTechnicianId;
  }

  if (level === "promoter") {
    return activePromoterId;
  }

  return selectedAvailabilityPersonId;
}

function setActiveStaffProfileId(id, level = activeUserLevel) {
  const profileId = Number(id);

  if (level === "dj") {
    activeDjId = profileId;
  } else if (level === "technician") {
    activeTechnicianId = profileId;
  } else if (level === "promoter") {
    activePromoterId = profileId;
  }

  selectedAvailabilityPersonId = profileId;
}

function isTechnicianCalendarFiltered() {
  return isStaffProfileUser() && myBookingsToggle.checked;
}

function isTechnicianRotaFiltered() {
  return isStaffProfileUser() && rotaMyBookingsToggle.checked;
}

function isTechnicianBookedForEvent(event) {
  return assignedPeopleForEvent(event).some((person) => person.id === activeStaffProfileId());
}

function technicianBookedEvents() {
  return visibleEventsForCurrentUser().filter(isTechnicianBookedForEvent).sort(eventSort);
}

function nextStaffBookedEvent() {
  if (!isStaffProfileUser()) {
    return null;
  }

  const bookedEvents = technicianBookedEvents();
  const todayKey = toDateKey(new Date());
  const nextEvent = bookedEvents.find((event) => event.date >= todayKey);

  return nextEvent || bookedEvents[0] || null;
}

function staffCalendarBookedEvents() {
  if (!isStaffProfileUser()) {
    return [];
  }

  return visibleEventsForCurrentUser()
    .filter(isTechnicianBookedForEvent)
    .filter((event) => eventStatusValue(event.status) === "confirmed")
    .sort(eventSort);
}

function calendarFileName(person) {
  const slug = (person?.name || "bookings")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${slug || "bookings"}-btb-rse-bookings.ics`;
}

function parseEventDateTime(dateKey, timeValue) {
  if (!/^\d{2}:\d{2}$/.test(timeValue || "")) {
    return null;
  }

  const [year, month, day] = dateKey.split("-").map(Number);
  const [hours, minutes] = timeValue.split(":").map(Number);

  return new Date(year, month - 1, day, hours, minutes, 0);
}

function calendarDateStamp(date) {
  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
    "T",
    String(date.getUTCHours()).padStart(2, "0"),
    String(date.getUTCMinutes()).padStart(2, "0"),
    String(date.getUTCSeconds()).padStart(2, "0"),
    "Z"
  ].join("");
}

function calendarLocalDateTimeStamp(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
    "T",
    String(date.getHours()).padStart(2, "0"),
    String(date.getMinutes()).padStart(2, "0"),
    "00"
  ].join("");
}

function calendarDateOnlyStamp(dateKey) {
  return dateKey.replaceAll("-", "");
}

function escapeCalendarText(value) {
  return String(value || "")
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");
}

function foldCalendarLine(line) {
  const chunks = [];

  for (let index = 0; index < line.length; index += 72) {
    chunks.push(`${index ? " " : ""}${line.slice(index, index + 72)}`);
  }

  return chunks.join("\r\n");
}

function calendarContent(lines) {
  return lines.map(foldCalendarLine).join("\r\n");
}

function calendarEventTiming(event) {
  const start = parseEventDateTime(event.date, event.loadInTime || event.doorsTime || event.time);
  const end = parseEventDateTime(event.date, event.endTime);

  if (!start) {
    return {
      allDay: true,
      startDate: event.date,
      endDate: toDateKey(addDays(dateFromKey(event.date), 1))
    };
  }

  const resolvedEnd = end || new Date(start.getTime() + 60 * 60 * 1000);

  if (resolvedEnd <= start) {
    resolvedEnd.setDate(resolvedEnd.getDate() + 1);
  }

  return { allDay: false, start, end: resolvedEnd };
}

function calendarDescription(event, person) {
  return [
    eventTimeSummary(event),
    `Venue: ${event.venue}`,
    `Role: ${assignmentLabelForPerson(event, person.id)}`,
    event.setTimes ? `Set times: ${event.setTimes}` : "",
    event.notes ? `Notes: ${event.notes}` : ""
  ]
    .filter(Boolean)
    .join("\n");
}

function staffBookingCalendarEntry(event, person, timestamp) {
  const timing = calendarEventTiming(event);
  const lines = [
    "BEGIN:VEVENT",
    `UID:btb-rse-${event.id}-${person.id}@peppermint-crew-planner`,
    `DTSTAMP:${timestamp}`,
    `SUMMARY:${escapeCalendarText(`${event.title} - ${event.venue}`)}`,
    `LOCATION:${escapeCalendarText(event.venue)}`,
    `DESCRIPTION:${escapeCalendarText(calendarDescription(event, person))}`
  ];

  if (timing.allDay) {
    lines.push(`DTSTART;VALUE=DATE:${calendarDateOnlyStamp(timing.startDate)}`);
    lines.push(`DTEND;VALUE=DATE:${calendarDateOnlyStamp(timing.endDate)}`);
  } else {
    lines.push(`DTSTART;TZID=Europe/London:${calendarLocalDateTimeStamp(timing.start)}`);
    lines.push(`DTEND;TZID=Europe/London:${calendarLocalDateTimeStamp(timing.end)}`);
  }

  lines.push("END:VEVENT");

  return calendarContent(lines);
}

function staffBookingsCalendarFile(eventsToExport, person) {
  const timestamp = calendarDateStamp(new Date());
  const eventLines = eventsToExport.flatMap((event) => staffBookingCalendarEntry(event, person, timestamp).split("\r\n"));

  return calendarContent([
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//BTB RSE//Crew Planner//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:BTB/RSE bookings",
    "X-WR-TIMEZONE:Europe/London",
    ...eventLines,
    "END:VCALENDAR"
  ]);
}

function downloadStaffBookingsCalendar() {
  const person = freelancerById(activeStaffProfileId());
  const bookedEvents = staffCalendarBookedEvents();

  if (!person || !bookedEvents.length) {
    showToast("No confirmed bookings to add to your calendar.");
    return;
  }

  const blob = new Blob([staffBookingsCalendarFile(bookedEvents, person)], { type: "text/calendar;charset=utf-8" });
  const calendarUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = calendarUrl;
  link.download = calendarFileName(person);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(calendarUrl), 1000);
  showToast(`${bookedEvents.length} booking${bookedEvents.length === 1 ? "" : "s"} saved for calendar import.`);
}

function ensureSelectedCoverEvent() {
  const bookedEvents = technicianBookedEvents();

  if (!bookedEvents.length) {
    selectedCoverEventId = null;
    return null;
  }

  if (!bookedEvents.some((event) => event.id === selectedCoverEventId)) {
    selectedCoverEventId = bookedEvents[0].id;
  }

  return bookedEvents.find((event) => event.id === selectedCoverEventId);
}

function availableCoverTechnicians(event) {
  const assignedIds = new Set(assignedPeopleForEvent(event).map((person) => person.id));
  const coverRoles = staffProfileConfig.technician.roles;
  const currentEngineerId = activeStaffProfileId();

  return freelancers.filter(
    (person) =>
      coverRoles.includes(person.role) &&
      person.id !== currentEngineerId &&
      !assignedIds.has(person.id) &&
      availabilityForEvent(person, event) !== "unavailable"
  );
}

function coverContactText(person) {
  return `${person.email || "No email saved"} · ${person.whatsapp || "No WhatsApp saved"}`;
}

function assignmentLabelForPerson(event, personId) {
  const roles = Object.entries(event.roleAssignments || {})
    .filter(([, assignedPersonId]) => Number(assignedPersonId) === Number(personId))
    .map(([role]) => role);

  return roles.length ? roles.join(", ") : "Crew";
}

function assignedRolesForPerson(event, personId) {
  return Object.entries(event.roleAssignments || {})
    .filter(([, assignedPersonId]) => Number(assignedPersonId) === Number(personId))
    .map(([role]) => role);
}

function whatsappNumberForLink(value) {
  const digits = String(value || "").replace(/\D/g, "");

  if (!digits) {
    return "";
  }

  if (digits.startsWith("00")) {
    return digits.slice(2);
  }

  if (digits.startsWith("0")) {
    return `44${digits.slice(1)}`;
  }

  return digits;
}

function rotaWhatsappShiftLine(event, personId) {
  return `${formatDate(event.date)} - ${event.title} - ${event.venue} - ${assignmentLabelForPerson(event, personId)} - ${eventTimeSummary(event)}`;
}

function rotaWhatsappMessage(person, eventList) {
  const firstName = person.name.split(" ")[0] || person.name;
  const shiftLines = eventList.map((event) => `- ${rotaWhatsappShiftLine(event, person.id)}`).join("\n");

  return `Hi ${firstName}, please log in to Peppermint Crew Planner and confirm your ${formatMonth(rotaFocusDate)} shifts:\n\n${shiftLines}\n\nThanks`;
}

function rotaWhatsappUrl(person, eventList) {
  const phone = whatsappNumberForLink(person.whatsapp);

  if (!phone) {
    return "";
  }

  return `https://wa.me/${phone}?text=${encodeURIComponent(rotaWhatsappMessage(person, eventList))}`;
}

function whatsappMessageUrl(phoneNumber, message) {
  const phone = whatsappNumberForLink(phoneNumber);

  if (!phone) {
    return "";
  }

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

function openWhatsappMessage(phoneNumber, message) {
  const url = whatsappMessageUrl(phoneNumber, message);

  if (!url) {
    return { sent: false, reason: "No WhatsApp number saved" };
  }

  window.open(url, "_blank", "noopener,noreferrer");
  return { sent: true };
}

function whatsappShareMessageUrl(message) {
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

function coverWhatsappRecipients(candidates) {
  const recipients = [
    { name: "Dean", whatsapp: coverProductionWhatsapp },
    ...candidates
  ];
  const seenNumbers = new Set();

  return recipients
    .map((person) => ({
      name: person.name || "Dean",
      phone: whatsappNumberForLink(person.whatsapp)
    }))
    .filter((recipient) => {
      if (!recipient.phone || seenNumbers.has(recipient.phone)) {
        return false;
      }

      seenNumbers.add(recipient.phone);
      return true;
    });
}

function appServerPath(path) {
  if (window.location.protocol === "file:") {
    return `http://127.0.0.1:4173${path}`;
  }

  return path;
}

function mailtoHref(to, params = {}) {
  const query = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join("&");

  return `mailto:${to}${query ? `?${query}` : ""}`;
}

function emailNotificationUrl() {
  return appServerPath(emailNotificationPath);
}

function emailInboxUrl() {
  return appServerPath(`${emailInboxPath}?limit=50`);
}

function emailReadUrl() {
  return appServerPath(emailReadPath);
}

function emailRepliesUrl() {
  return appServerPath(emailRepliesPath);
}

function emailAttachmentsUrl() {
  return appServerPath(emailAttachmentsPath);
}

function appStateUrl() {
  return appServerPath(appStatePath);
}

function blobUploadUrl() {
  return appServerPath(blobUploadPath);
}

function blobDeleteUrl() {
  return appServerPath(blobDeletePath);
}

function openEmailDraft({ to, cc, bcc, subject, body }) {
  window.location.href = mailtoHref(to, { cc, bcc, subject, body });
}

async function sendEmailNotification(payload, options = {}) {
  const { fallbackDraft = true } = options;

  try {
    const response = await fetch(emailNotificationUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const result = await response.json().catch(() => ({}));

    if (!response.ok || !result.sent) {
      throw new Error(result.error || result.reason || "Email service unavailable");
    }

    return { sent: true, fallbackDraft: false };
  } catch (error) {
    if (fallbackDraft) {
      openEmailDraft(payload);
    }

    return { sent: false, fallbackDraft, reason: error.message };
  }
}

function selectedInboxEmail() {
  return emailInboxState.messages.find((message) => message.id === selectedInboxEmailId) || emailInboxState.messages[0] || null;
}

function formatEmailDate(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "No date";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function replySubject(subject = "") {
  return /^re:/i.test(subject) ? subject : `Re: ${subject || "(no subject)"}`;
}

function quotedReplyBody(message) {
  return [
    "",
    "",
    `On ${formatEmailDate(message.date)}, ${message.from || message.fromEmail} wrote:`,
    ...(message.body || message.snippet || "").split("\n").map((line) => `> ${line}`)
  ].join("\n");
}

function sanitizeEmailStyle(value = "") {
  const allowedProperties = new Set(["color", "background-color", "font-weight", "font-style", "text-decoration"]);

  return String(value)
    .split(";")
    .map((rule) => rule.trim())
    .filter(Boolean)
    .map((rule) => {
      const [property, ...valueParts] = rule.split(":");
      const name = String(property || "").trim().toLowerCase();
      const styleValue = valueParts.join(":").trim();

      if (!allowedProperties.has(name) || /url\s*\(|expression\s*\(/i.test(styleValue)) {
        return "";
      }

      return `${name}: ${styleValue}`;
    })
    .filter(Boolean)
    .join("; ");
}

function sanitizeEmailHtml(html = "") {
  const parser = new DOMParser();
  const doc = parser.parseFromString(String(html || ""), "text/html");
  const allowedAttributes = new Set(["href", "title", "alt", "colspan", "rowspan"]);

  doc.querySelectorAll("script, style, iframe, object, embed, link, meta, form, input, button, textarea, select").forEach((node) => node.remove());
  doc.body.querySelectorAll("*").forEach((node) => {
    [...node.attributes].forEach((attribute) => {
      const name = attribute.name.toLowerCase();
      const value = attribute.value || "";

      if (name.startsWith("on")) {
        node.removeAttribute(attribute.name);
        return;
      }

      if (name === "style") {
        const safeStyle = sanitizeEmailStyle(value);

        if (safeStyle) {
          node.setAttribute("style", safeStyle);
        } else {
          node.removeAttribute("style");
        }

        return;
      }

      if (name === "href") {
        if (!/^(https?:|mailto:|tel:)/i.test(value)) {
          node.removeAttribute(attribute.name);
          return;
        }

        node.setAttribute("target", "_blank");
        node.setAttribute("rel", "noopener noreferrer");
        return;
      }

      if (!allowedAttributes.has(name)) {
        node.removeAttribute(attribute.name);
      }
    });
  });

  return doc.body.innerHTML.trim();
}

function renderEmailBody(message) {
  const safeHtml = message.bodyHtml ? sanitizeEmailHtml(message.bodyHtml) : "";

  if (safeHtml) {
    return `<div class="email-message-body email-message-html">${safeHtml}</div>`;
  }

  return `<div class="email-message-body">${escapeHtml(message.body || message.snippet || "No message body available.").replaceAll("\n", "<br />")}</div>`;
}

function focusEmailReply(replyAll = false) {
  if (emailReplyForm.hidden) {
    return;
  }

  if (emailReplyAll) {
    emailReplyAll.checked = Boolean(replyAll);
    applyEmailReplyAllMode();
  }

  emailReplyForm.scrollIntoView({ behavior: "smooth", block: "start" });
  window.setTimeout(() => emailReplyForm.elements.body.focus(), 180);
}

async function markSelectedEmailRead() {
  const message = selectedInboxEmail();

  if (!message || !message.unread) {
    return;
  }

  try {
    const response = await fetch(emailReadUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messageId: message.id })
    });
    const result = await response.json().catch(() => ({}));

    if (!response.ok || !result.marked) {
      throw new Error(result.reason || "Email could not be marked as read.");
    }

    message.unread = false;
    unreadInboxEmailCount = Math.max(0, unreadInboxEmailCount - 1);
    renderEmailInbox();
    renderUnreadEmailWidget();
    showToast("Email marked as read.");
  } catch (error) {
    showToast(error.message || "Email could not be marked as read.");
  }
}

function safeEmailDocumentIdPart(value = "") {
  return String(value || "attachment")
    .replace(/[^\w.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "attachment";
}

function emailAttachmentDocumentId(message, attachment) {
  return `email-${safeEmailDocumentIdPart(message.id)}-${safeEmailDocumentIdPart(attachment.id || attachment.attachmentId || attachment.filename || attachment.name)}`;
}

function emailAttachmentAlreadySaved(message, attachment) {
  const documentId = emailAttachmentDocumentId(message, attachment);

  return generalDocuments.some((doc) => doc.id === documentId);
}

function replyAllCcText(message) {
  return (message.replyAllCc || []).join(", ");
}

function applyEmailReplyAllMode() {
  const message = selectedInboxEmail();

  if (!emailReplyForm || !emailReplyAll || !message) {
    return;
  }

  emailReplyForm.elements.cc.value = emailReplyAll.checked ? replyAllCcText(message) : "";
}

function selectedEmailReplyFiles() {
  return [...(emailReplyAttachments?.files || [])];
}

function renderEmailReplyAttachmentList() {
  const files = selectedEmailReplyFiles();

  if (!emailReplyAttachmentList) {
    return;
  }

  if (emailReplyClearAttachments) {
    emailReplyClearAttachments.hidden = !files.length;
  }

  emailReplyAttachmentList.innerHTML = files.length
    ? files
        .map(
          (file) => `
            <span>
              <strong>${escapeHtml(file.name || "Attachment")}</strong>
              <small>${escapeHtml(formatAttachmentSize(file.size) || file.type || "File")}</small>
            </span>
          `
        )
        .join("")
    : "No attachments selected";
}

async function emailReplyAttachmentsPayload() {
  const files = selectedEmailReplyFiles();
  const totalSize = files.reduce((total, file) => total + Number(file.size || 0), 0);

  if (totalSize > 18 * 1024 * 1024) {
    throw new Error("Attachments are too large to send together.");
  }

  return Promise.all(
    files.map(async (file) => {
      const dataUrl = await fileDataUrl(file);
      const data = dataUrl.includes(",") ? dataUrl.split(",").pop() : dataUrl;

      return {
        filename: file.name || "attachment",
        contentType: file.type || "application/octet-stream",
        size: Number(file.size) || 0,
        data
      };
    })
  );
}

function renderEmailAttachments(message) {
  const attachments = message.attachments || [];

  if (!attachments.length) {
    return "";
  }

  return `
    <div class="email-attachment-list">
      ${attachments
        .map((attachment, index) => {
          const name = attachment.filename || attachment.name || `Attachment ${index + 1}`;
          const meta = [attachment.contentType || "Document", formatAttachmentSize(attachment.size)].filter(Boolean).join(" · ");
          const documentId = emailAttachmentDocumentId(message, attachment);
          const isSaving = savingEmailAttachmentKeys.has(documentId);
          const isSaved = emailAttachmentAlreadySaved(message, attachment);
          const disabled = isSaving || isSaved || !currentAccess().canAttachDocs;
          const buttonLabel = isSaved ? "Saved" : isSaving ? "Saving" : "Save to Documents";

          return `
            <article class="email-attachment-row">
              <div>
                <strong>${escapeHtml(name)}</strong>
                <small>${escapeHtml(meta || "Document")}</small>
              </div>
              <button class="ghost-button" type="button" data-email-attachment-index="${index}" ${disabled ? "disabled" : ""}>${buttonLabel}</button>
            </article>
          `;
        })
        .join("")}
    </div>
  `;
}

async function saveEmailAttachmentToDocuments(attachmentIndex) {
  const message = selectedInboxEmail();
  const attachment = (message?.attachments || [])[attachmentIndex];

  if (!currentAccess().canAttachDocs) {
    showToast("This user level cannot upload documents.");
    return;
  }

  if (!message || !attachment) {
    showToast("Attachment not found.");
    return;
  }

  const documentId = emailAttachmentDocumentId(message, attachment);

  if (emailAttachmentAlreadySaved(message, attachment)) {
    showToast(`${attachment.filename || attachment.name || "Attachment"} is already in Documents.`);
    return;
  }

  savingEmailAttachmentKeys.add(documentId);
  renderEmailInbox();

  try {
    const response = await fetch(emailAttachmentsUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messageId: message.id,
        attachmentId: attachment.id || attachment.attachmentId,
        filename: attachment.filename || attachment.name || "email-attachment",
        contentType: attachment.contentType || "application/octet-stream",
        documentId
      })
    });
    const result = await response.json().catch(() => ({}));

    if (!response.ok || !result.saved || !result.document) {
      throw new Error(result.reason || "Attachment could not be saved.");
    }

    addDocumentsToLibrary([result.document]);
    render();
    showToast(`${result.document.name} saved to Documents.`);
  } catch (error) {
    showToast(error.message || "Attachment could not be saved.");
  } finally {
    savingEmailAttachmentKeys.delete(documentId);
    renderEmailInbox();
  }
}

function renderEmailInbox() {
  if (!emailInboxList || !emailMessageView) {
    return;
  }

  const statusText = emailInboxState.loading
    ? "Loading inbox"
    : emailInboxState.error
      ? "Inbox unavailable"
      : emailInboxState.connected
        ? `${inboxEmailCount} inbox message${inboxEmailCount === 1 ? "" : "s"}`
        : "Gmail setup needed";

  emailInboxStatus.textContent = statusText;

  if (refreshEmailInbox) {
    refreshEmailInbox.disabled = emailInboxState.loading;
  }

  if (!emailInboxState.messages.length) {
    emailInboxList.innerHTML = `<div class="empty-state">${emailInboxState.loading ? "Loading messages." : "No inbox messages found."}</div>`;
    emailMessageView.innerHTML = `<div class="empty-state">${emailInboxState.error || "Select an inbox message to read and reply."}</div>`;
    emailReplyForm.hidden = true;
    return;
  }

  if (!selectedInboxEmailId || !emailInboxState.messages.some((message) => message.id === selectedInboxEmailId)) {
    selectedInboxEmailId = emailInboxState.messages[0].id;
  }

  emailInboxList.innerHTML = emailInboxState.messages
    .map(
      (message) => `
        <button class="email-inbox-item ${message.id === selectedInboxEmailId ? "selected" : ""} ${message.unread ? "unread" : ""}" type="button" data-email-id="${escapeHtml(message.id)}">
          <span>${escapeHtml(message.from || message.fromEmail || "Unknown sender")}</span>
          <strong>${escapeHtml(message.subject || "(no subject)")}</strong>
          <small>${escapeHtml(message.snippet || "No preview")} · ${escapeHtml(formatEmailDate(message.date))}</small>
        </button>
      `
    )
    .join("");

  emailInboxList.querySelectorAll("[data-email-id]").forEach((button) => {
    button.addEventListener("click", () => {
      selectedInboxEmailId = button.dataset.emailId;
      renderEmailInbox();
    });
  });

  const message = selectedInboxEmail();
  const replyAllAvailable = Boolean(replyAllCcText(message));

  emailMessageView.innerHTML = `
    <div class="email-message-head">
      <div>
        <span>${escapeHtml(message.from || message.fromEmail || "Unknown sender")}</span>
        <strong>${escapeHtml(message.subject || "(no subject)")}</strong>
        <small>${escapeHtml(formatEmailDate(message.date))}</small>
      </div>
      <div class="email-message-actions">
        ${message.unread ? `<span class="status-pill needs-action">Unread</span>` : ""}
        <button class="ghost-button" type="button" data-email-message-action="reply">Reply</button>
        <button class="ghost-button" type="button" data-email-message-action="reply-all" ${replyAllAvailable ? "" : "disabled"}>Reply all</button>
        <button class="ghost-button" type="button" data-email-message-action="mark-read" ${message.unread ? "" : "disabled"}>Mark as read</button>
      </div>
    </div>
    ${renderEmailBody(message)}
    ${renderEmailAttachments(message)}
  `;

  emailMessageView.querySelector("[data-email-message-action='reply']")?.addEventListener("click", () => focusEmailReply(false));
  emailMessageView.querySelector("[data-email-message-action='reply-all']")?.addEventListener("click", () => focusEmailReply(true));
  emailMessageView.querySelector("[data-email-message-action='mark-read']")?.addEventListener("click", markSelectedEmailRead);
  emailMessageView.querySelectorAll("[data-email-attachment-index]").forEach((button) => {
    button.addEventListener("click", () => {
      saveEmailAttachmentToDocuments(Number(button.dataset.emailAttachmentIndex));
    });
  });

  emailReplyForm.hidden = false;
  emailReplyForm.elements.messageId.value = message.id || "";
  emailReplyForm.elements.threadId.value = message.threadId || "";
  emailReplyForm.elements.to.value = (message.replyToEmails?.length ? message.replyToEmails : [message.fromEmail].filter(Boolean)).join(", ");
  emailReplyForm.elements.cc.value = "";
  emailReplyForm.elements.subject.value = replySubject(message.subject);
  emailReplyForm.elements.body.value = quotedReplyBody(message);
  if (emailReplyAll) {
    emailReplyAll.checked = false;
    emailReplyAll.disabled = !replyAllCcText(message);
  }
  if (emailReplyAttachments) {
    emailReplyAttachments.value = "";
    renderEmailReplyAttachmentList();
  }
}

async function loadEmailInbox(force = false) {
  if (emailInboxState.loading && !force) {
    return;
  }

  emailInboxState = { ...emailInboxState, loading: true, error: "" };
  renderEmailInbox();
  renderUnreadEmailWidget();

  try {
    const response = await fetch(emailInboxUrl());
    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(result.error || "Inbox could not be loaded.");
    }

    emailInboxState = {
      loading: false,
      connected: Boolean(result.connected),
      setup: result.setup || "",
      error: "",
      messages: result.messages || []
    };
    inboxEmailCount = emailInboxState.messages.length;
    unreadInboxEmailCount = Number(result.unread) || emailInboxState.messages.filter((message) => message.unread).length;
  } catch (error) {
    emailInboxState = {
      loading: false,
      connected: false,
      setup: "",
      error: error.message,
      messages: []
    };
    inboxEmailCount = 0;
    unreadInboxEmailCount = 0;
  }

  renderEmailInbox();
  renderUnreadEmailWidget();
}

function baseEmailReplyPayload() {
  const data = new FormData(emailReplyForm);

  return {
    messageId: String(data.get("messageId") || ""),
    threadId: String(data.get("threadId") || ""),
    to: String(data.get("to") || "").trim(),
    cc: String(data.get("cc") || "").trim(),
    subject: String(data.get("subject") || "").trim(),
    body: String(data.get("body") || "").trim()
  };
}

async function emailReplyPayload(options = {}) {
  const payload = baseEmailReplyPayload();

  if (options.includeAttachments) {
    const attachments = await emailReplyAttachmentsPayload();

    if (attachments.length) {
      payload.attachments = attachments;
    }
  }

  return payload;
}

function openReplyDraft() {
  const files = selectedEmailReplyFiles();

  openEmailDraft(baseEmailReplyPayload());

  if (files.length) {
    showToast("Draft opened. Add the selected attachments in your mail app.");
  }
}

async function sendInboxReply() {
  if (!emailReplyForm.reportValidity()) {
    return;
  }

  try {
    const payload = await emailReplyPayload({ includeAttachments: true });
    const response = await fetch(emailRepliesUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const result = await response.json().catch(() => ({}));

    if (!response.ok || !result.sent) {
      throw new Error(result.reason || "Reply could not be sent automatically.");
    }

    if (emailReplyAttachments) {
      emailReplyAttachments.value = "";
      renderEmailReplyAttachmentList();
    }

    showToast(`Reply sent${payload.attachments?.length ? ` with ${payload.attachments.length} attachment${payload.attachments.length === 1 ? "" : "s"}` : ""}.`);
    loadEmailInbox(true);
  } catch (error) {
    openEmailDraft(baseEmailReplyPayload());
    showToast(`${error.message} Draft opened instead.`);
  }
}

function renderUnreadEmailWidget() {
  if (!dashboardEmail) {
    return;
  }

  unreadEmailCount.textContent = String(unreadInboxEmailCount);
  unreadEmailLabel.textContent = `Unread message${unreadInboxEmailCount === 1 ? "" : "s"}`;
  unreadEmailAccount.textContent = productionEmailAddress;
}

function coverEmailEventLines(event) {
  return [
    `Event: ${event.title}`,
    `Date: ${formatDate(event.date)}`,
    `Venue: ${event.venue}`,
    `Times: ${eventTimeSummary(event)}`,
    `Status: ${eventStatusLabel(event.status)}`
  ];
}

function coverRequestEmailBody(event, requestedBy, channel, candidates) {
  const availableEngineers = candidates.length
    ? candidates.map((person) => `- ${person.name} (${coverContactText(person)})`).join("\n")
    : "- None available";

  return [
    "Cover request sent",
    "",
    ...coverEmailEventLines(event),
    `Requested by: ${requestedBy?.name || "Unknown engineer"}`,
    `Role(s): ${assignmentLabelForPerson(event, requestedBy?.id)}`,
    `Request sent by: ${channel === "whatsapp" ? "WhatsApp" : "Email"}`,
    "",
    "Available engineers offered:",
    availableEngineers
  ].join("\n");
}

function coverOfferEmailBody(event, requestedBy, acceptUrl = "") {
  return [
    "Hi,",
    "",
    `${requestedBy?.name || "A sound engineer"} is looking for cover for the following shift:`,
    "",
    ...coverEmailEventLines(event),
    `Role(s): ${assignmentLabelForPerson(event, requestedBy?.id)}`,
    "",
    acceptUrl ? `Confirm cover: ${acceptUrl}` : "",
    acceptUrl ? "" : "",
    "If anyone can cover this shift, please reply so production can update the rota.",
    "",
    "Thanks"
  ].filter((line, index, lines) => line || lines[index - 1]).join("\n");
}

function coverOfferWhatsappBody(event, requestedBy, acceptUrl = "") {
  return [
    "Cover needed",
    "",
    `${requestedBy?.name || "A sound engineer"} is looking for cover for this shift:`,
    "",
    ...coverEmailEventLines(event),
    `Role(s): ${assignmentLabelForPerson(event, requestedBy?.id)}`,
    "",
    acceptUrl ? `Confirm cover: ${acceptUrl}` : "",
    acceptUrl ? "" : "",
    "Please reply here if you can cover it so production can update the rota.",
    "",
    "Thanks"
  ].filter((line, index, lines) => line || lines[index - 1]).join("\n");
}

function coverWhatsappGroupVenueKey(venue = "") {
  return String(venue || "").trim().toLowerCase();
}

function coverWhatsappGroupUrlForEvent(event) {
  return coverWhatsappGroupVenues[coverWhatsappGroupVenueKey(event?.venue)] || coverWhatsappGroupUrls.btb;
}

function coverWhatsappGroupMessageUrl(event, message) {
  const url = new URL(coverWhatsappGroupUrlForEvent(event));

  url.searchParams.set("text", message);
  return url.toString();
}

function coverAcceptUrl(token) {
  return `${window.location.origin}/cover-accept.html?token=${encodeURIComponent(token)}`;
}

function readPendingCoverRequests() {
  try {
    return JSON.parse(window.localStorage?.getItem(pendingCoverStorageKey) || "[]");
  } catch {
    return [];
  }
}

function writePendingCoverRequests(requests) {
  try {
    window.localStorage?.setItem(pendingCoverStorageKey, JSON.stringify(requests));
  } catch {
    // Cover request syncing is a convenience layer over the local prototype data.
  }
}

function trackPendingCoverRequest(record, event, previousEngineerId) {
  const pending = readPendingCoverRequests().filter((item) => item.token !== record.token);

  pending.push({
    token: record.token,
    eventId: event.id,
    previousEngineerId,
    createdAt: new Date().toISOString()
  });
  writePendingCoverRequests(pending);
}

function applyAcceptedCoverRequest(record, pendingRequest) {
  const accepted = record.accepted;
  const event = events.find((booking) => booking.id === Number(pendingRequest.eventId || record.event?.id));

  if (!accepted || !event) {
    return false;
  }

  const previousEngineerId = Number(pendingRequest.previousEngineerId || record.requestedBy?.id);
  const rolesToTransfer = assignedRolesForPerson(event, previousEngineerId);

  if (!rolesToTransfer.length) {
    return false;
  }

  rolesToTransfer.forEach((role) => setEventRoleAssignment(event, role, accepted.id));
  syncEventCrewFromAssignments(event);
  event.shiftConfirmations = event.shiftConfirmations || {};
  event.shiftNotifications = event.shiftNotifications || {};
  event.shiftConfirmations[accepted.id] = true;
  delete event.shiftConfirmations[previousEngineerId];
  delete event.shiftNotifications[previousEngineerId];
  delete event.shiftNotifications[accepted.id];
  return true;
}

async function syncAcceptedCoverRequests(silent = true) {
  if (coverSyncInFlight) {
    return;
  }

  const pending = readPendingCoverRequests();

  if (!pending.length) {
    return;
  }

  coverSyncInFlight = true;
  const remaining = [];
  let appliedCount = 0;

  try {
    for (const pendingRequest of pending) {
      const response = await fetch(`${coverRequestsPath}?token=${encodeURIComponent(pendingRequest.token)}`);
      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.request) {
        remaining.push(pendingRequest);
        continue;
      }

      if (result.request.accepted) {
        if (applyAcceptedCoverRequest(result.request, pendingRequest)) {
          appliedCount += 1;
        }
      } else {
        remaining.push(pendingRequest);
      }
    }
  } finally {
    coverSyncInFlight = false;
  }

  writePendingCoverRequests(remaining);

  if (appliedCount) {
    render();
    if (!silent) {
      showToast(`${appliedCount} accepted cover request${appliedCount === 1 ? "" : "s"} updated in the rota.`);
    }
  }
}

function readCoverAcceptedRedirect() {
  const params = new URLSearchParams(window.location.search);

  if (params.get("coverAccepted") !== "1") {
    return null;
  }

  try {
    return JSON.parse(window.localStorage?.getItem(coverAcceptedRedirectStorageKey) || "null");
  } catch {
    return null;
  }
}

function clearCoverAcceptedRedirect() {
  try {
    window.localStorage?.removeItem(coverAcceptedRedirectStorageKey);
  } catch {
    // The redirect handoff is temporary; failed cleanup should not block the dashboard.
  }

  if (window.history?.replaceState) {
    window.history.replaceState({}, "", window.location.pathname || "/");
  }
}

function userLevelForCoverRole(role = "") {
  const normalisedRole = String(role).toLowerCase();

  if (normalisedRole.includes("dj")) {
    return "dj";
  }

  if (normalisedRole.includes("producer") || normalisedRole.includes("promoter")) {
    return "promoter";
  }

  return "technician";
}

function coverAssignmentRole(payload = {}) {
  const acceptedRole = String(payload.accepted?.role || "").trim();
  const requestRole = String(payload.role || "").split(",")[0].split(":")[0].trim();
  const role = requestRole || acceptedRole || "Sound engineer";

  return profileRoles.includes(role) || roleOptions.includes(role) ? role : "Sound engineer";
}

function ensureCoverRedirectProfile(payload = {}) {
  const accepted = payload.accepted || {};
  const acceptedId = Number(accepted.id);
  const profileId = acceptedId || nextFreelancerId();
  const role = accepted.role || coverAssignmentRole(payload);
  let profile = freelancerById(profileId);

  if (!profile) {
    profile = {
      id: profileId,
      name: accepted.name || "Accepted cover",
      role,
      location: "",
      status: "available",
      unavailableDates: [],
      amUnavailableDates: []
    };
    freelancers.push(profile);
  } else {
    profile.name = accepted.name || profile.name;
    profile.role = accepted.role || profile.role;
  }

  return profile;
}

function ensureCoverRedirectEvent(payload = {}, profileId) {
  const sourceEvent = payload.event || {};
  const eventId = Number(sourceEvent.id) || Date.now();
  const role = coverAssignmentRole(payload);
  let event = events.find((booking) => booking.id === eventId);

  if (!event) {
    event = {
      id: eventId,
      title: sourceEvent.title || "Accepted cover shift",
      date: sourceEvent.date || toDateKey(new Date()),
      time: sourceEvent.time || sourceEvent.doorsTime || "",
      loadInTime: sourceEvent.loadInTime || "",
      doorsTime: sourceEvent.doorsTime || sourceEvent.time || "",
      endTime: sourceEvent.endTime || "",
      venue: sourceEvent.venue || "Venue TBC",
      status: eventStatusValue(sourceEvent.status || "confirmed"),
      roles: [role],
      roleAssignments: {},
      crew: [],
      setTimes: "",
      notes: "Accepted cover shift.",
      docs: []
    };
    events.push(event);
  }

  setEventRoleAssignment(event, role, profileId);
  syncEventCrewFromAssignments(event);
  event.shiftConfirmations = event.shiftConfirmations || {};
  event.shiftNotifications = event.shiftNotifications || {};
  event.shiftConfirmations[profileId] = true;
  delete event.shiftNotifications[profileId];
  selectedEventId = event.id;
  calendarFocusDate = new Date(`${event.date}T12:00:00`);
  rotaFocusDate = new Date(`${event.date}T12:00:00`);

  return event;
}

function openDashboardFromAcceptedCover() {
  const payload = readCoverAcceptedRedirect();

  if (!payload?.accepted) {
    clearCoverAcceptedRedirect();
    return false;
  }

  const profile = ensureCoverRedirectProfile(payload);
  const event = ensureCoverRedirectEvent(payload, profile.id);
  const level = payload.level || userLevelForCoverRole(profile.role);

  setActiveStaffProfileId(profile.id, level);
  setUserLevel(level);
  activeView = "dashboard";
  rememberUnlockedProfileState();
  showAppShell();
  writeActiveLoginSession();
  render();
  clearCoverAcceptedRedirect();
  showToast(`${profile.name} accepted cover for ${event.title}.`);
  return true;
}

async function createCoverRequest(event, requestedBy, candidates) {
  const response = await fetch(coverRequestsPath, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      event: {
        id: event.id,
        title: event.title,
        date: event.date,
        venue: event.venue,
        status: event.status,
        loadInTime: event.loadInTime,
        doorsTime: event.doorsTime,
        endTime: event.endTime,
        time: event.time
      },
      requestedBy: requestedBy
        ? {
            id: requestedBy.id,
            name: requestedBy.name,
            role: requestedBy.role,
            email: requestedBy.email || ""
          }
        : null,
      role: assignmentLabelForPerson(event, requestedBy?.id),
      candidates: candidates.map((person) => ({
        id: person.id,
        name: person.name,
        role: person.role,
        email: person.email || "",
        whatsapp: person.whatsapp || ""
      }))
    })
  });
  const result = await response.json().catch(() => ({}));

  if (!response.ok || !result.request?.token) {
    throw new Error(result.reason || "Cover confirmation link could not be created.");
  }

  return result.request;
}

async function openCoverOfferWhatsappDraft(event, requestedBy, candidates, acceptUrl) {
  const message = coverOfferWhatsappBody(event, requestedBy, acceptUrl);
  let copied = false;

  try {
    await navigator.clipboard?.writeText(message);
    copied = true;
  } catch {
    copied = false;
  }

  window.open(coverWhatsappGroupMessageUrl(event, message), "_blank", "noopener,noreferrer");
  return {
    sent: true,
    copied
  };
}

function coverOfferEmailRecipients(candidates) {
  return candidates.map((person) => person.email).filter(Boolean);
}

function emailResultLabel(result, sentText, fallbackText) {
  return result.sent ? sentText : fallbackText;
}

async function sendCoverRequestNotifications(event, channel, candidates) {
  const requestedBy = freelancerById(activeStaffProfileId());
  const coverRequest = await createCoverRequest(event, requestedBy, candidates);
  const acceptUrl = coverAcceptUrl(coverRequest.token);

  trackPendingCoverRequest(coverRequest, event, requestedBy?.id);

  if (channel === "whatsapp") {
    const candidateResult = await openCoverOfferWhatsappDraft(event, requestedBy, candidates, acceptUrl);

    return { productionResult: candidateResult, candidateResult };
  }

  const productionResult = { sent: true };
  let candidateResult = null;

  if (channel === "email") {
    const recipients = coverOfferEmailRecipients(candidates);

    openEmailDraft({
      to: productionEmailAddress,
      cc: recipients.join(","),
      subject: `Cover needed - ${event.title} - ${formatDate(event.date)}`,
      body: coverOfferEmailBody(event, requestedBy, acceptUrl)
    });
    candidateResult = { sent: true, fallbackDraft: true, ccCount: recipients.length };
  }

  return { productionResult, candidateResult };
}

function engineerNotificationPlanForEvents(eventList) {
  const plan = new Map();

  eventList.forEach((event) => {
    assignedEngineersForEvent(event).forEach((person) => {
      if (shiftConfirmedBy(event, person.id)) {
        return;
      }

      const entry = plan.get(person.id) || { person, events: [] };
      entry.events.push(event);
      plan.set(person.id, entry);
    });
  });

  return [...plan.values()];
}

function openPendingRotaWhatsappMessages(silent = false) {
  if (!pendingRotaWhatsappMessages.length) {
    if (!silent) {
      showToast("No WhatsApp messages ready.");
    }
    return;
  }

  pendingRotaWhatsappMessages.forEach((entry) => {
    window.open(entry.url, "_blank", "noopener,noreferrer");
  });

  if (!silent) {
    showToast(`${pendingRotaWhatsappMessages.length} WhatsApp message${pendingRotaWhatsappMessages.length === 1 ? "" : "s"} opened.`);
  }
}

function prepareRotaWhatsappMessages(notificationPlan, autoOpen = true) {
  const missingWhatsapp = [];

  pendingRotaWhatsappMessages = notificationPlan
    .map((entry) => {
      const url = rotaWhatsappUrl(entry.person, entry.events);

      if (!url) {
        missingWhatsapp.push(entry.person.name);
        return null;
      }

      return {
        ...entry,
        url,
        message: rotaWhatsappMessage(entry.person, entry.events)
      };
    })
    .filter(Boolean);

  rotaWhatsappSummary.innerHTML = `
    <strong>${escapeHtml(formatMonth(rotaFocusDate))}</strong>
    <small>${pendingRotaWhatsappMessages.length} WhatsApp draft${pendingRotaWhatsappMessages.length === 1 ? "" : "s"} ready${missingWhatsapp.length ? ` - missing WhatsApp for ${escapeHtml(missingWhatsapp.join(", "))}` : ""}</small>
  `;
  rotaWhatsappList.innerHTML = pendingRotaWhatsappMessages.length
    ? pendingRotaWhatsappMessages
        .map(
          (entry) => `
            <article class="whatsapp-message-card">
              <div>
                <strong>${escapeHtml(entry.person.name)}</strong>
                <span>${entry.events.length} shift${entry.events.length === 1 ? "" : "s"} - ${escapeHtml(entry.person.whatsapp)}</span>
                <p>${multilineHtml(entry.message)}</p>
              </div>
              <a class="ghost-button" href="${escapeHtml(entry.url)}" target="_blank" rel="noopener noreferrer">Open WhatsApp</a>
            </article>
          `
        )
        .join("")
    : `<div class="empty-state">In-app notifications are queued, but none of the selected engineers have WhatsApp numbers saved.</div>`;
  openRotaWhatsappMessagesButton.disabled = !pendingRotaWhatsappMessages.length;
  if (!rotaWhatsappModal.open) {
    rotaWhatsappModal.showModal();
  }

  if (autoOpen) {
    openPendingRotaWhatsappMessages(true);
  }

  return {
    readyCount: pendingRotaWhatsappMessages.length,
    missingCount: missingWhatsapp.length
  };
}

async function offerCover(channel) {
  const event = ensureSelectedCoverEvent();

  if (!event) {
    showToast("Choose a booked shift before sending a cover offer.");
    return;
  }

  const candidates = availableCoverTechnicians(event);

  if (!candidates.length) {
    showToast(`No available sound engineers found for ${event.venue} on ${formatDate(event.date)}.`);
    return;
  }

  renderCrew();
  let notificationResult;

  try {
    notificationResult = await sendCoverRequestNotifications(event, channel, candidates);
  } catch (error) {
    showToast(error.message || "Cover request could not be created.");
    return;
  }

  if (channel === "whatsapp") {
    const copiedText = notificationResult.candidateResult.copied ? " Cover request copied ready to paste." : " Copy the cover details from the app if WhatsApp does not prefill them.";

    showToast(`WhatsApp group opened.${copiedText}`);
    return;
  }

  const candidateText =
    channel === "email"
      ? emailResultLabel(
          notificationResult.candidateResult,
          `cover email draft opened with ${notificationResult.candidateResult.ccCount} available engineer${notificationResult.candidateResult.ccCount === 1 ? "" : "s"} on Cc`,
          "cover email draft could not be opened"
        )
      : `cover offer recorded for ${channelLabel}`;

  showToast(`${candidateText}.`);
}

function currentRotaPeriodEvents() {
  return venueFilteredRotaEvents(visibleRotaEventsForPeriod(rotaFocusDate, rotaView));
}

function currentConfirmedRotaPeriodEvents() {
  return currentRotaPeriodEvents().filter((event) => eventStatusValue(event.status) === "confirmed");
}

function currentRotaMonthEventsForEngineerNotifications() {
  return eventsForPeriod(rotaFocusDate, "month")
    .filter((event) => eventStatusValue(event.status) === "confirmed")
    .sort(eventSort);
}

function assignedEngineersForEvent(event) {
  return assignedPeopleForEvent(event).filter((person) => engineerRoles.includes(person.role));
}

function notifyEngineersForRotaMonth() {
  const eventList = currentRotaMonthEventsForEngineerNotifications();
  const notificationPlan = engineerNotificationPlanForEvents(eventList);
  const notifiedShiftCount = notificationPlan.reduce((total, entry) => total + entry.events.length, 0);

  notificationPlan.forEach((entry) => {
    entry.events.forEach((event) => {
      event.shiftNotifications = event.shiftNotifications || {};
      event.shiftNotifications[entry.person.id] = true;
    });
  });

  if (!notificationPlan.length) {
    showToast(`No unconfirmed engineer shifts in ${formatMonth(rotaFocusDate)}.`);
    return;
  }

  render();
  const whatsappResult = prepareRotaWhatsappMessages(notificationPlan);
  const whatsappText = whatsappResult.readyCount
    ? ` WhatsApp draft${whatsappResult.readyCount === 1 ? "" : "s"} opened for ${whatsappResult.readyCount} engineer${whatsappResult.readyCount === 1 ? "" : "s"}.`
    : " No WhatsApp numbers saved for those engineers.";

  showToast(`${notificationPlan.length} engineer${notificationPlan.length === 1 ? "" : "s"} notified to log in and confirm ${notifiedShiftCount} shift${notifiedShiftCount === 1 ? "" : "s"} in ${formatMonth(rotaFocusDate)}.${whatsappText}`);
}

function pendingShiftNotificationsForPerson(personId) {
  return events
    .filter((event) => eventStatusValue(event.status) === "confirmed")
    .filter((event) => assignedPeopleForEvent(event).some((person) => person.id === Number(personId)))
    .filter((event) => shiftNotificationPending(event, personId))
    .sort(eventSort);
}

function showPendingShiftNotificationPrompt() {
  if (!isSoundEngineerUser()) {
    return false;
  }

  const pendingNotifications = pendingShiftNotificationsForPerson(activeStaffProfileId());

  if (!pendingNotifications.length) {
    return false;
  }

  showToast(`${pendingNotifications.length} shift${pendingNotifications.length === 1 ? "" : "s"} waiting for confirmation. Open rota to confirm.`);
  return true;
}

function currentEngineerRotaEvents() {
  if (!isSoundEngineerUser()) {
    return [];
  }

  return eventsForPeriod(rotaFocusDate, rotaView)
    .filter(eventVisibleToCurrentUser)
    .filter(isTechnicianBookedForEvent)
    .sort(eventSort);
}

function unconfirmedEngineerRotaEvents() {
  const personId = activeStaffProfileId();

  return currentEngineerRotaEvents().filter((event) => !shiftConfirmedBy(event, personId));
}

function confirmAllEngineerRotaShifts() {
  if (!isSoundEngineerUser()) {
    return;
  }

  const eventList = currentEngineerRotaEvents();

  if (!eventList.length) {
    showToast("No assigned shifts to confirm in this rota period.");
    return;
  }

  const personId = activeStaffProfileId();
  const unconfirmedEvents = eventList.filter((event) => !shiftConfirmedBy(event, personId));

  if (!unconfirmedEvents.length) {
    showToast("All visible shifts are already confirmed.");
    return;
  }

  unconfirmedEvents.forEach((event) => {
    event.shiftConfirmations = event.shiftConfirmations || {};
    event.shiftNotifications = event.shiftNotifications || {};
    event.shiftConfirmations[personId] = true;
    delete event.shiftNotifications[personId];
  });
  render();
  showToast(`${unconfirmedEvents.length} shift${unconfirmedEvents.length === 1 ? "" : "s"} confirmed.`);
}

function visibleCalendarEvents() {
  const visibleEvents = visibleEventsForCurrentUser();
  const bookingFilteredEvents = isTechnicianCalendarFiltered() ? visibleEvents.filter(isTechnicianBookedForEvent) : visibleEvents;

  return venueFilteredCalendarEvents(bookingFilteredEvents);
}

function dashboardCalendarVenueFilterVisible() {
  return activeView === "dashboard" && ["admin", "promoter"].includes(activeUserLevel);
}

function calendarVenueFilterVisible() {
  return activeView === "calendar" || dashboardCalendarVenueFilterVisible();
}

function venueFilteredCalendarEvents(eventList) {
  if (!calendarVenueFilterVisible()) {
    return eventList;
  }

  const venue = calendarVenueFilter.value;

  return venue === "all" ? eventList : eventList.filter((event) => event.venue === venue);
}

function visibleRotaEventsForPeriod(date, view) {
  const periodEvents = eventsForPeriod(date, view).filter(eventVisibleToCurrentUser);

  return isTechnicianRotaFiltered() ? periodEvents.filter(isTechnicianBookedForEvent) : periodEvents;
}

function venueFilteredRotaEvents(eventList) {
  if (activeUserLevel !== "admin" || activeView !== "rota") {
    return eventList;
  }

  const venue = rotaVenueFilter.value;

  return venue === "all" ? eventList : eventList.filter((event) => event.venue === venue);
}

function ensureSelectedEventMatchesCalendarFilter() {
  const visibleEvents = visibleCalendarEvents();

  if (!visibleEvents.length) {
    return;
  }

  if (!visibleEvents.some((event) => event.id === selectedEventId)) {
    selectedEventId = visibleEvents[0].id;
  }
}

function beginAvailabilityDraft() {
  const person = selectedAvailabilityPerson();

  draftUnavailableDates = [...(person.unavailableDates || [])];
  draftAmUnavailableDates = [...(person.amUnavailableDates || [])];
}

function dateListsMatch(first = [], second = []) {
  const firstDates = [...new Set(first)].sort();
  const secondDates = [...new Set(second)].sort();

  return firstDates.length === secondDates.length && firstDates.every((date, index) => date === secondDates[index]);
}

function hasUnsavedAvailabilityChanges() {
  const person = selectedAvailabilityPerson();

  if (!person) {
    return false;
  }

  saveVisibleAvailabilityDates();
  return !dateListsMatch(draftUnavailableDates, person.unavailableDates || []) ||
    !dateListsMatch(draftAmUnavailableDates, person.amUnavailableDates || []);
}

function focusAvailabilitySaveButton() {
  const saveButton = availabilityExitModal.open
    ? saveAvailabilityBeforeCloseButton
    : availabilityForm.querySelector("button[type='submit']");

  window.setTimeout(() => saveButton?.focus(), 0);
}

function saveAvailabilityChanges() {
  const person = selectedAvailabilityPerson();

  if (person) {
    saveVisibleAvailabilityDates();
    person.unavailableDates = [...draftUnavailableDates];
    person.amUnavailableDates = [...draftAmUnavailableDates];
    showToast(`${person.name}'s unavailable dates have been updated.`);
  }

  if (availabilityExitModal.open) {
    availabilityExitModal.close();
  }

  availabilityModal.close();
  render();
}

function discardAvailabilityChanges() {
  if (availabilityExitModal.open) {
    availabilityExitModal.close();
  }

  availabilityModal.close();
}

function requestAvailabilityClose() {
  if (!availabilityModal.open) {
    return true;
  }

  if (hasUnsavedAvailabilityChanges()) {
    if (!availabilityExitModal.open) {
      availabilityExitModal.showModal();
    }

    focusAvailabilitySaveButton();
    return false;
  }

  availabilityModal.close();
  return true;
}

function saveVisibleAvailabilityDates() {
  const visibleDates = [...availabilityPicker.querySelectorAll("input[name='unavailableDate']")].map((input) => input.value);
  const checkedDates = [...availabilityPicker.querySelectorAll("input[name='unavailableDate']:checked")].map((input) => input.value);
  const visibleAmDates = [...availabilityPicker.querySelectorAll("input[name='amUnavailableDate']")].map((input) => input.value);
  const checkedAmDates = [...availabilityPicker.querySelectorAll("input[name='amUnavailableDate']:checked")].map((input) => input.value);
  const savedDatesOutsideVisibleMonth = draftUnavailableDates.filter((date) => !visibleDates.includes(date));
  const savedAmDatesOutsideVisibleMonth = draftAmUnavailableDates.filter((date) => !visibleAmDates.includes(date));

  draftUnavailableDates = [...new Set([...savedDatesOutsideVisibleMonth, ...checkedDates])].sort();
  draftAmUnavailableDates = [...new Set([...savedAmDatesOutsideVisibleMonth, ...checkedAmDates])]
    .filter((date) => !draftUnavailableDates.includes(date))
    .sort();
}

function availabilityDate(value) {
  return typeof value === "string" ? value : value.date;
}

function availabilityStartTime(value) {
  return typeof value === "string" ? "" : value.loadInTime || value.doorsTime || value.time || "";
}

function isMorningAvailabilityCheck(value) {
  const startTime = availabilityStartTime(value);

  return Boolean(startTime && startTime < "12:00");
}

function isUnavailable(person, value) {
  return (person.unavailableDates || []).includes(availabilityDate(value));
}

function isAmUnavailable(person, value) {
  return isMorningAvailabilityCheck(value) && (person.amUnavailableDates || []).includes(availabilityDate(value));
}

function hasAvailabilityClash(person, value) {
  return isUnavailable(person, value) || isAmUnavailable(person, value);
}

function availabilityForEvent(person, value) {
  if (hasAvailabilityClash(person, value)) {
    return "unavailable";
  }

  return person.status;
}

function availabilitySummaryText(person) {
  const fullDayCount = (person.unavailableDates || []).length;
  const amCount = (person.amUnavailableDates || []).length;
  const parts = [];

  if (fullDayCount) {
    parts.push(`${fullDayCount} full day`);
  }

  if (amCount) {
    parts.push(`${amCount} AM`);
  }

  return parts.length ? `${parts.join(" · ")} unavailable` : "No unavailable dates";
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.setTimeout(() => toast.classList.remove("show"), 2600);
}

function setDefaultReportDate() {
  if (!reportDate.value) {
    reportDate.value = toDateKey(new Date());
  }
}

function selectedReportFiles() {
  return [...reportMedia.files];
}

function renderReportAttachmentList() {
  const files = selectedReportFiles();

  reportAttachmentList.innerHTML = files.length
    ? files.map((file) => `<span>${escapeHtml(file.name)}</span>`).join("")
    : "No media selected";
}

function reportEmailSubject(venue, date) {
  return `${venue} equipment report - ${date}`;
}

function sendEquipmentReport() {
  if (!reportForm.reportValidity()) {
    return;
  }

  const data = new FormData(reportForm);
  const venue = data.get("venue");
  const date = data.get("reportDate");
  const issue = data.get("issue");
  const technician = selectedAvailabilityPerson();
  const files = selectedReportFiles().map((file) => file.name);
  const attachmentNote = files.length
    ? `Selected media files:\n${files.map((fileName) => `- ${fileName}`).join("\n")}\n\nPlease attach these photos or videos before sending.`
    : "No photos or videos selected.";
  const body = [
    "Equipment issue report",
    "",
    `Venue: ${venue}`,
    `Date of report: ${date}`,
    `Sound engineer: ${technician.name}`,
    "",
    "Issue:",
    issue,
    "",
    attachmentNote
  ].join("\n");
  window.location.href = mailtoHref("teahorseltd@gmail.com", {
    cc: productionEmailAddress,
    subject: reportEmailSubject(venue, date),
    body
  });
  showToast("Email draft prepared. Attach selected media before sending.");
}

function readStoredTheme() {
  try {
    return window.localStorage?.getItem("peppermint-theme") || "dark";
  } catch {
    return "dark";
  }
}

function writeStoredTheme(theme) {
  try {
    window.localStorage?.setItem("peppermint-theme", theme);
  } catch {
    // Storage can be unavailable in preview contexts; the toggle should still work.
  }
}

function applyTheme(theme) {
  const nextTheme = theme === "light" ? "light" : "dark";

  document.body.dataset.theme = nextTheme;
  themeToggle.checked = nextTheme === "light";
  themeToggleLabel.textContent = nextTheme === "light" ? "Light" : "Dark";
  writeStoredTheme(nextTheme);
}

function registerAppInstallWorker() {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js", { updateViaCache: "none" })
      .then((registration) => registration.update?.())
      .catch(() => {
        // The app is still usable if a browser blocks service workers.
      });
  });
}

function showLoginScreen() {
  isLoggedIn = false;
  applyRememberedLoginToForm();
  renderLoginProfileOptions();
  loginScreen.hidden = false;
  appShell.hidden = true;
  window.setTimeout(() => loginLevelSelect.focus(), 0);
}

function showAppShell() {
  isLoggedIn = true;
  loginScreen.hidden = true;
  appShell.hidden = false;
}

function logout() {
  isLoggedIn = false;
  unlockedPasscodeKeys.clear();
  unlockedProfileState = null;
  clearActiveLoginSession();
  deactivateRememberedLoginSession();
  activeView = "dashboard";
  profilePasscode.value = "";
  document.querySelectorAll("dialog[open]").forEach((dialog) => dialog.close());
  setUserLevel("admin");
  showLoginScreen();
  showToast("Logged out.");
}

function promptProfileReviewIfNeeded() {
  if (!["technician", "dj", "promoter"].includes(activeUserLevel)) {
    return false;
  }

  const key = profileReviewKey();
  const prompts = readProfileReviewPrompts();

  if (prompts[key]) {
    return false;
  }

  prompts[key] = true;
  writeProfileReviewPrompts(prompts);
  setActiveView("myprofile");
  renderSelfProfile();
  showToast("Please check your profile details before you carry on.");
  return true;
}

function completeLogin(message = "") {
  showAppShell();
  writeActiveLoginSession();
  writeRememberedLogin(true);
  render();

  if (!promptProfileReviewIfNeeded() && !showPendingShiftNotificationPrompt()) {
    showToast(message || `${currentAccess().label} access enabled.`);
  }
}

function beginLogin(level) {
  const emailValidation = validateLoginEmailForLevel(level);

  if (!emailValidation.ok) {
    showToast(emailValidation.message);
    loginEmailInput.focus();
    return;
  }

  if (emailValidation.profile) {
    setActiveStaffProfileId(emailValidation.profile.id, level);
  }

  setUserLevel(level);
  render();

  if (requestPasscodeIfNeeded()) {
    return;
  }

  completeLogin();
}

function openPasscodeModal() {
  const subject = passcodeSubjectForLevel();
  const savedPasscode = readStoredPasscodes()[subject.key];
  const isSetup = !savedPasscode;

  passcodeTitle.textContent = isSetup ? `Create ${subject.levelLabel} passcode` : `Unlock ${subject.label}`;
  passcodeSummary.innerHTML = isSetup
    ? `<strong>${escapeHtml(subject.label)}</strong><small>Create a ${subject.digits} digit passcode for this ${subject.levelLabel.toLowerCase()}.</small>`
    : `<strong>${escapeHtml(subject.label)}</strong><small>Enter the ${subject.digits} digit passcode to open this ${subject.levelLabel.toLowerCase()}.</small>`;
  passcodeFieldLabel.textContent = `${subject.digits} digit passcode`;
  profilePasscode.minLength = subject.digits;
  profilePasscode.maxLength = subject.digits;
  profilePasscode.pattern = `[0-9]{${subject.digits}}`;
  passcodeSubmitButton.textContent = isSetup ? "Create passcode" : "Unlock profile";
  profilePasscode.value = "";
  passcodeModal.showModal();
  window.setTimeout(() => profilePasscode.focus(), 0);
}

function requestPasscodeIfNeeded() {
  if (rememberedLoginMatchesCurrentSubject()) {
    unlockedPasscodeKeys.add(passcodeSubjectForLevel().key);
    rememberUnlockedProfileState();
    return false;
  }

  if (passcodeIsUnlocked()) {
    rememberUnlockedProfileState();
    return false;
  }

  openPasscodeModal();
  return true;
}

function cancelPasscodeLogin() {
  const fallback = unlockedProfileState;

  if (!isLoggedIn) {
    profilePasscode.value = "";
    passcodeModal.close();
    showLoginScreen();
    showToast("Login cancelled.");
    return;
  }

  if (!fallback) {
    profilePasscode.value = "";
    showToast("Admin passcode required.");
    window.setTimeout(() => profilePasscode.focus(), 0);
    return;
  }

  activeTechnicianId = fallback.technicianId;
  activeDjId = fallback.djId;
  activePromoterId = fallback.promoterId || activePromoterId;
  profilePasscode.value = "";
  passcodeModal.close();
  setUserLevel(fallback.level);
  render();
  showToast("Profile locked.");
}

function setUserLevel(level) {
  activeUserLevel = accessProfiles[level] ? level : "admin";
  loginLevelSelect.value = activeUserLevel;
  document.body.dataset.userLevel = activeUserLevel;

  if (isStaffProfileUser()) {
    selectedAvailabilityPersonId = activeStaffProfileId();
    renderTechnicianProfileOptions();
  }

  ensureSelectedEventMatchesCalendarFilter();
  setActiveView(activeView);
}

function renderLoginProfileOptions() {
  const level = loginLevelSelect.value;
  const config = loginProfileConfigForLevel(level);
  const previousLevel = loginEmailInput.dataset.level || "";
  const levelChanged = previousLevel !== level;

  loginProfileField.hidden = false;
  loginEmailInput.dataset.level = level;

  if (level === "admin") {
    loginProfileLabel.textContent = "Admin email";
    loginEmailInput.placeholder = productionEmailAddress;
    loginEmailInput.value = levelChanged || !loginEmailInput.value ? productionEmailAddress : loginEmailInput.value;
    return;
  }

  if (!config) {
    loginProfileField.hidden = true;
    loginEmailInput.value = "";
    return;
  }

  loginProfileLabel.textContent = `${accessProfiles[level].label} email`;
  loginEmailInput.placeholder = "name@example.com";
}

function applyActionPermissions() {
  const access = currentAccess();
  const isSoundEngineer = isSoundEngineerUser();
  const hasStaffProfile = isStaffProfileUser();
  const profileConfig = staffProfileForLevel();
  const newEventVisible = access.canCreateEvents && (
    activeUserLevel !== "admin" || ["dashboard", "calendar"].includes(activeView)
  );

  document.querySelector("#openAvailability").hidden = !availabilityButtonVisibleForCurrentView();
  document.querySelector("#openEvent").hidden = !newEventVisible;
  document.querySelector("#attachDoc").hidden = !access.canAttachDocs;
  eventDocumentsSection.hidden = !access.canAttachDocs;
  document.querySelector("#exportRota").hidden = !access.canExportRota;
  confirmRotaShifts.hidden = !isSoundEngineer;
  addBookingsToCalendarButton.hidden = !hasStaffProfile;
  generateRotaButton.hidden = activeUserLevel !== "admin";
  rotaVenueFilterField.hidden = activeUserLevel !== "admin" || activeView !== "rota";
  sidebarPanel.hidden = activeUserLevel === "dj";
  if (!hasStaffProfile) {
    myBookingsToggle.checked = false;
    rotaMyBookingsToggle.checked = false;
  }

  myBookingsFilter.hidden = !hasStaffProfile;
  calendarVenueFilterField.hidden = !calendarVenueFilterVisible();
  rotaMyBookingsFilter.hidden = !hasStaffProfile;
  crewAvailabilityViewControl.hidden = activeUserLevel !== "admin";
  crewPeriodControls.hidden = isSoundEngineer;
  roleFilter.hidden = isSoundEngineer;

  document.querySelectorAll(".nav-item[data-view='crew']").forEach((item) => {
    const label = item.querySelector("span:last-child");
    const title = isSoundEngineer ? "Find cover" : "Crew";

    if (label) {
      label.textContent = title;
    }

    item.setAttribute("aria-label", title);
  });

  if (activeUserLevel !== "admin") {
    crewAvailabilityView = "week";
  }
}

function setActiveView(view) {
  const access = currentAccess();
  activeView = viewConfig[view] && access.allowedViews.includes(view) ? view : access.allowedViews[0];
  const config = viewConfig[activeView];
  const visiblePanelList = activeView === "dashboard" ? access.dashboardPanels : config.panels;

  workspace.dataset.view = activeView;
  const isTechnicianCoverView = activeUserLevel === "technician" && activeView === "crew";

  workspaceTitle.textContent = isTechnicianCoverView ? "Find cover" : config.title;
  workspaceSubtitle.textContent = isTechnicianCoverView
    ? "Select one of your booked shifts and offer it to available sound engineers."
    : config.subtitle;
  statsGrid.hidden = !config.showStats || (activeUserLevel === "dj" && activeView !== "dashboard");
  if (activeUserLevel === "technician" && activeView === "dashboard") {
    if (dashboardTube.parentElement !== workspace) {
      workspace.insertBefore(dashboardTube, mainGrid);
    }
  } else if (dashboardTube.parentElement !== statsGrid) {
    statsGrid.insertBefore(dashboardTube, dashboardEmail);
  }
  dashboardTube.hidden = !(activeUserLevel === "technician" && activeView === "dashboard");
  dashboardTube.style.order = "";
  dashboardEmail.hidden = !(activeUserLevel === "admin" && activeView === "dashboard");
  mainGrid.classList.toggle("focused-grid", activeView !== "dashboard");

  panels.forEach((panel) => {
    const isVisible = visiblePanelList.includes(panel.dataset.panel);

    panel.hidden = !isVisible;
    panel.classList.toggle("large-panel", activeView !== "dashboard" && isVisible);
    panel.style.order = activeView === "dashboard" && isVisible ? String(visiblePanelList.indexOf(panel.dataset.panel)) : "";
  });

  document.querySelectorAll(".nav-item").forEach((item) => {
    const isAllowed = access.allowedViews.includes(item.dataset.view);

    item.hidden = !isAllowed;
    item.classList.toggle("active", item.dataset.view === activeView);
    item.style.order = isAllowed ? String(access.allowedViews.indexOf(item.dataset.view)) : "";
  });
  applyActionPermissions();

  if (activeView === "calendar") {
    renderCalendar();
    renderEventDetails();
  } else if (activeView === "rota") {
    renderRota();
  } else {
    rotaDistribution.hidden = true;
  }
}

function renderCalendar() {
  ensureSelectedEventMatchesCalendarFilter();
  const calendarEvents = visibleCalendarEvents();
  const titlePrefix = isTechnicianCalendarFiltered() ? "My " : "";
  calendarTitle.textContent = calendarView === "week"
    ? `${titlePrefix}${formatWeekRange(calendarFocusDate)}`
    : `${titlePrefix}${formatMonth(calendarFocusDate)}`;
  calendarStrip.classList.toggle("month-calendar", calendarView === "month");

  document.querySelectorAll("[data-calendar-view]").forEach((button) => {
    button.classList.toggle("active", button.dataset.calendarView === calendarView);
  });

  const days = calendarView === "week"
    ? calendarWeekDays(calendarFocusDate)
    : monthDatesForDate(calendarFocusDate).map((date) => {
        if (!date) {
          return { isBlank: true };
        }

        return {
          isBlank: false,
          label: new Intl.DateTimeFormat("en-GB", { weekday: "short" }).format(date),
          day: String(date.getDate()).padStart(2, "0"),
          date: toDateKey(date)
        };
      });

  calendarStrip.innerHTML = days
    .map((day) => {
      if (day.isBlank) {
        return `<div class="day-column blank-day" aria-hidden="true"></div>`;
      }

      const dayEvents = calendarEvents.filter((event) => event.date === day.date);
      const chips = dayEvents
        .map(
          (event) => `
            <button class="event-chip ${eventStatusValue(event.status)} ${eventVenueClass(event.venue)} ${event.id === selectedEventId ? "selected" : ""}" type="button" data-event-id="${event.id}">
              <span class="venue-chip-label"><span aria-hidden="true"></span>${escapeHtml(event.venue || "No venue")}</span>
              <strong>${escapeHtml(event.title)}</strong>
              <small>${eventStatusLabel(event.status)} · ${event.doorsTime || event.time || "TBC"} doors · ${assignedPeopleForEvent(event).length} booked</small>
            </button>
          `
        )
        .join("");

      return `
        <div class="day-column ${currentAccess().canCreateEvents ? "can-create-event" : ""}" data-calendar-date="${day.date}" aria-label="${day.label} ${day.day}">
          <div>
            <strong>${day.label}</strong>
            <span>${day.day}</span>
          </div>
          ${chips || (calendarView === "week" ? "<span>No bookings</span>" : "")}
        </div>
      `;
    })
    .join("");

  calendarStrip.querySelectorAll("[data-event-id]").forEach((button) => {
    button.addEventListener("click", () => {
      selectedEventId = Number(button.dataset.eventId);
      const event = selectedEvent();

      render();
      if (activeView === "calendar") {
        openEventViewModal(event);
      }
    });
  });

  calendarStrip.querySelectorAll("[data-calendar-date]").forEach((dayColumn) => {
    dayColumn.addEventListener("dblclick", (event) => {
      if (!currentAccess().canCreateEvents || event.target.closest("[data-event-id]")) {
        return;
      }

      openCreateEventModal(dayColumn.dataset.calendarDate);
    });
  });
}

function eventDetailsHtml(event) {
  const access = currentAccess();
  const actionButtons = [
    access.canEditEvents ? `<button class="ghost-button" type="button" data-event-action="edit">Edit event</button>` : "",
    access.canGenerateSheet ? `<button class="ghost-button" type="button" data-event-action="sheet">PDF sheet</button>` : "",
    access.canEditEvents ? `<button class="text-button danger-button" type="button" data-event-action="delete">Delete event</button>` : ""
  ].join("");
  const bookedStaff = bookedStaffRows(event);
  const unfilledRoles = unfilledEventRoles(event);
  const bookedStaffHtml = bookedStaff.length
    ? bookedStaff
        .map(
          (person) => `
            <span class="staff-pill">
              <strong>${escapeHtml(person.name)}</strong>
              <small>${escapeHtml(person.detail)}</small>
            </span>
          `
        )
        .join("")
    : "<small>No staff booked</small>";
  const unfilledRolesHtml = unfilledRoles.length
    ? `<small class="event-role-needed">Needed: ${escapeHtml(unfilledRoles.join(", "))}</small>`
    : "";

  return `
    <div class="event-meta">
      <div>
        <strong>${escapeHtml(formatDate(event.date))} · ${escapeHtml(event.doorsTime || event.time || "TBC")} doors</strong>
        <small><span class="venue-pill ${eventVenueClass(event.venue)}"><span aria-hidden="true"></span>${escapeHtml(event.venue || "No venue")}</span> · ${escapeHtml(eventTimeSummary(event))}</small>
      </div>
      <div class="event-actions">
        ${actionButtons}
      </div>
    </div>
    <div>
      <p class="eyebrow">Promoter</p>
      <small>${escapeHtml(eventPromoterLabel(event))}</small>
    </div>
    <div>
      <p class="eyebrow">Booked staff</p>
      <div class="assigned-list booked-staff-list">${bookedStaffHtml}</div>
      ${unfilledRolesHtml}
    </div>
    <div>
      <p class="eyebrow">Client</p>
      <small>${escapeHtml(eventClientSummary(event))}</small>
    </div>
    <div>
      <p class="eyebrow">Bar</p>
      <small>${escapeHtml(eventBarSummary(event))}</small>
    </div>
    <div>
      <p class="eyebrow">Food</p>
      <small>${escapeHtml(eventFoodSummary(event))}</small>
    </div>
    <div>
      <p class="eyebrow">Event needs</p>
      <div class="required-list">${eventNeedsList(event).length ? eventNeedsList(event).map((need) => `<span class="role-pill">${escapeHtml(need)}</span>`).join("") : "<small>No extra event needs selected</small>"}</div>
    </div>
    <div>
      <p class="eyebrow">Set times</p>
      <small>${escapeHtml(event.setTimes ? event.setTimes.replaceAll("\n", " · ") : "No set times added")}</small>
    </div>
    <div>
      <p class="eyebrow">Notes</p>
      <small>${escapeHtml(event.notes || "No notes added")}</small>
    </div>
    <div>
      <p class="eyebrow">Documents</p>
      <div class="event-attachment-list">${renderAttachmentRows(event)}</div>
    </div>
  `;
}

function bindEventDetailActions(container, event, closeEventView = false) {
  container.querySelector("[data-event-action='edit']")?.addEventListener("click", () => {
    if (closeEventView && eventViewModal.open) {
      eventViewModal.close();
    }

    openEditEventModal(event);
  });
  container.querySelector("[data-event-action='sheet']")?.addEventListener("click", () => {
    if (closeEventView && eventViewModal.open) {
      eventViewModal.close();
    }

    generateEventSheet(event);
  });
  container.querySelector("[data-event-action='delete']")?.addEventListener("click", () => {
    deleteEvent(event, { closeEventView });
  });
  bindDocumentActions(container, event);
}

function renderEventDetails() {
  const visibleCalendarEventList = visibleCalendarEvents();

  if ((activeView === "calendar" || dashboardCalendarVenueFilterVisible()) && !visibleCalendarEventList.length) {
    selectedEventTitle.textContent = "No events";
    selectedEventStatus.hidden = true;
    eventDetails.innerHTML = `<div class="empty-state">No events match the selected calendar filters.</div>`;
    return;
  }

  const event = activeView === "dashboard" && isStaffProfileUser() ? nextStaffBookedEvent() : selectedEvent();

  if (!event) {
    selectedEventTitle.textContent = "No booked events";
    selectedEventStatus.hidden = true;
    eventDetails.innerHTML = `<div class="empty-state">No confirmed bookings are assigned to this profile yet.</div>`;
    return;
  }

  if (isStaffProfileUser() && !eventVisibleToCurrentUser(event)) {
    selectedEventTitle.textContent = "No confirmed events";
    selectedEventStatus.hidden = true;
    eventDetails.innerHTML = `<div class="empty-state">Confirmed events will appear here once they are ready for the team.</div>`;
    return;
  }

  if (activeView === "dashboard" && isStaffProfileUser()) {
    selectedEventId = event.id;
  }

  selectedEventTitle.textContent = event.title;
  selectedEventStatus.hidden = false;
  selectedEventStatus.textContent = eventStatusLabel(event.status);
  selectedEventStatus.className = `status-pill ${eventStatusValue(event.status)}`;
  eventDetails.innerHTML = eventDetailsHtml(event);
  bindEventDetailActions(eventDetails, event);
}

function eventViewNavigationEvents() {
  let eventList = [];

  if (activeView === "calendar") {
    eventList = visibleCalendarEvents();
  } else if (activeView === "rota") {
    eventList = venueFilteredRotaEvents(visibleRotaEventsForPeriod(rotaFocusDate, rotaView));
  } else {
    eventList = visibleEventsForCurrentUser();
  }

  const eventsById = new Map();
  eventList.forEach((event) => {
    if (event?.id && !eventsById.has(event.id)) {
      eventsById.set(event.id, event);
    }
  });

  return [...eventsById.values()].sort(eventSort);
}

function updateEventViewNavigation(event) {
  const navigationEvents = eventViewNavigationEvents();
  const currentIndex = navigationEvents.findIndex((item) => item.id === event.id);
  const previousEvent = currentIndex > 0 ? navigationEvents[currentIndex - 1] : null;
  const nextEvent = currentIndex >= 0 && currentIndex < navigationEvents.length - 1 ? navigationEvents[currentIndex + 1] : null;
  const hasNavigation = navigationEvents.length > 1;

  eventViewPreviousButton.hidden = !hasNavigation;
  eventViewNextButton.hidden = !hasNavigation;
  eventViewPreviousButton.disabled = !previousEvent;
  eventViewNextButton.disabled = !nextEvent;
  eventViewPreviousButton.dataset.eventId = previousEvent?.id || "";
  eventViewNextButton.dataset.eventId = nextEvent?.id || "";
  eventViewPreviousButton.title = previousEvent ? `Previous: ${previousEvent.title}` : "Previous event";
  eventViewNextButton.title = nextEvent ? `Next: ${nextEvent.title}` : "Next event";
}

function renderEventViewContent(event) {
  eventViewTitle.textContent = event.title;
  eventViewStatus.hidden = false;
  eventViewStatus.textContent = eventStatusLabel(event.status);
  eventViewStatus.className = `status-pill ${eventStatusValue(event.status)}`;
  eventViewDetails.innerHTML = eventDetailsHtml(event);
  bindEventDetailActions(eventViewDetails, event, true);
  updateEventViewNavigation(event);
}

function openEventViewModal(event) {
  selectedEventId = event.id;
  renderEventViewContent(event);
  eventViewModal.showModal();
}

function navigateEventView(direction) {
  const navigationEvents = eventViewNavigationEvents();
  const currentIndex = navigationEvents.findIndex((event) => event.id === selectedEventId);
  const targetEvent = navigationEvents[currentIndex + direction];

  if (!targetEvent) {
    return;
  }

  selectedEventId = targetEvent.id;
  render();
  renderEventViewContent(targetEvent);
}

function renderCrew() {
  if (isSoundEngineerUser()) {
    renderFindCover();
    return;
  }

  crewPanelEyebrow.textContent = "Availability";
  crewList.classList.remove("find-cover-list");
  const filter = roleFilter.value;
  const people = freelancers.filter((person) => filter === "all" || person.role === filter);
  const event = selectedEvent();

  crewList.innerHTML = people
    .map((person) => {
      const availability = availabilityForEvent(person, event);
      const unavailableLabel = availabilitySummaryText(person);

      return `
        <article class="crew-person">
          <div class="crew-main">
            <div class="avatar">${initials(person.name)}</div>
            <div>
              <strong>${person.name}</strong>
              <span class="crew-meta">${person.role} · ${person.location} · ${unavailableLabel}</span>
            </div>
          </div>
          <span class="availability-dot ${availability}" title="${statusLabel(availability)}"></span>
        </article>
      `;
    })
    .join("");
}

function renderFindCover() {
  const activeEngineerId = activeStaffProfileId();
  const technician = freelancerById(activeEngineerId);
  const bookedEvents = technicianBookedEvents();
  const event = ensureSelectedCoverEvent();
  const candidates = event ? availableCoverTechnicians(event) : [];
  const shiftOptions = bookedEvents
    .map((booking) => {
      const assignment = assignmentLabelForPerson(booking, activeEngineerId);

      return `<option value="${booking.id}" ${booking.id === selectedCoverEventId ? "selected" : ""}>${escapeHtml(formatDate(booking.date))} · ${escapeHtml(booking.venue)} · ${escapeHtml(assignment)}</option>`;
    })
    .join("");

  crewPanelEyebrow.textContent = "Sound engineer portal";
  crewAvailabilityTitle.textContent = "Find cover";
  crewList.classList.add("find-cover-list");

  if (!bookedEvents.length) {
    crewList.innerHTML = `
      <section class="find-cover-card">
        <div>
          <p class="eyebrow">Shift cover</p>
          <h3>No booked shifts</h3>
          <small>${escapeHtml(technician?.name || "This sound engineer")} does not have any booked shifts to offer for cover yet.</small>
        </div>
      </section>
    `;
    return;
  }

  const candidateList = candidates.length
    ? candidates
        .map(
          (person) => `
            <article class="cover-candidate">
              <div class="crew-main">
                <div class="avatar">${initials(person.name)}</div>
                <div>
                  <strong>${escapeHtml(person.name)}</strong>
                  <span class="crew-meta">${escapeHtml(person.location)} · ${escapeHtml(coverContactText(person))}</span>
                </div>
              </div>
              <span class="availability-dot ${availabilityForEvent(person, event)}" title="${statusLabel(availabilityForEvent(person, event))}"></span>
            </article>
          `
        )
        .join("")
    : `<div class="empty-state">No available sound engineers for this shift.</div>`;
  crewList.innerHTML = `
    <section class="find-cover-card">
      <label>
        Shift to cover
        <select id="coverShiftSelect">
          ${shiftOptions}
        </select>
      </label>
      <div class="cover-shift-summary">
        <div>
          <p class="eyebrow">Selected shift</p>
          <h3>${escapeHtml(event.venue)}</h3>
          <small>${escapeHtml(formatDate(event.date))} · ${escapeHtml(eventTimeSummary(event))}</small>
        </div>
        <span class="role-pill">${escapeHtml(assignmentLabelForPerson(event, activeEngineerId))}</span>
      </div>
      <div class="cover-actions">
        <button class="ghost-button" type="button" data-cover-channel="email" ${candidates.length ? "" : "disabled"}>Offer by email</button>
        <button class="primary-button" type="button" data-cover-channel="whatsapp" ${candidates.length ? "" : "disabled"}>Offer by WhatsApp</button>
      </div>
    </section>
    <section class="find-cover-card">
      <div class="section-head compact-head">
        <div>
          <p class="eyebrow">Available sound engineers</p>
          <h3>${candidates.length} available</h3>
        </div>
      </div>
      <div class="cover-candidate-list">${candidateList}</div>
    </section>
  `;

  document.querySelector("#coverShiftSelect")?.addEventListener("change", (event) => {
    selectedCoverEventId = Number(event.target.value);
    renderCrew();
  });

  document.querySelectorAll("[data-cover-channel]").forEach((button) => {
    button.addEventListener("click", () => offerCover(button.dataset.coverChannel));
  });
}

function renderAvailabilityBoard() {
  if (isStaffProfileUser()) {
    availabilityBoard.hidden = true;
    availabilityBoard.innerHTML = "";
    return;
  }

  const isMonthView = activeUserLevel === "admin" && crewAvailabilityView === "month";
  const crewView = isMonthView ? "month" : "week";
  const days = calendarDaysForView(crewFocusDate, crewView);
  const label = periodLabel(crewFocusDate, crewView);

  availabilityBoard.hidden = false;
  crewAvailabilityTitle.textContent = `${label} unavailable dates`;
  crewPeriodLabel.textContent = label;
  availabilityBoard.classList.toggle("availability-month", isMonthView);

  document.querySelectorAll("[data-crew-availability-view]").forEach((button) => {
    button.classList.toggle("active", button.dataset.crewAvailabilityView === crewAvailabilityView);
  });

  availabilityBoard.innerHTML = days
    .map((day) => {
      if (day.isBlank) {
        return `<div class="availability-day availability-blank" aria-hidden="true"></div>`;
      }

      const unavailablePeople = freelancers.filter((person) => isUnavailable(person, day.date));
      const amUnavailablePeople = freelancers.filter((person) => (person.amUnavailableDates || []).includes(day.date) && !isUnavailable(person, day.date));
      const names = [
        ...unavailablePeople.map((person) => `<span class="mini-pill">${person.name.split(" ")[0]}</span>`),
        ...amUnavailablePeople.map((person) => `<span class="mini-pill am-pill">${person.name.split(" ")[0]} AM</span>`)
      ].join("");

      return `
        <div class="availability-day">
          <div>
            <strong>${day.label}</strong>
            <span>${day.day}</span>
          </div>
          <div class="mini-pill-list">${names || "<small>Everyone free</small>"}</div>
        </div>
      `;
    })
    .join("");
}

function renderDocs() {
  const records = allDocumentRecords();
  const canAttach = currentAccess().canAttachDocs;

  if (!records.length) {
    documentList.innerHTML = `<div class="empty-state">No documents uploaded yet.</div>`;
    return;
  }

  documentList.innerHTML = records
    .map((record, index) => {
      const meta = [record.doc.type || "Document", formatAttachmentSize(record.doc.size)].filter(Boolean).join(" · ");
      const attachedLabel = record.attachedEvents.length
        ? `Attached to ${record.attachedEvents.length} event${record.attachedEvents.length === 1 ? "" : "s"}`
        : "General storage";
      const attachedEventList = record.attachedEvents.length
        ? `<div class="document-event-list">${record.attachedEvents
            .map(
              ({ event, docIndex }) => `
                <span class="role-pill">
                  ${escapeHtml(event.title)}
                  <button class="text-button danger-button" type="button" data-library-doc-action="detach" data-library-doc-index="${index}" data-event-id="${event.id}" data-doc-index="${docIndex}">Remove</button>
                </span>
              `
            )
            .join("")}</div>`
        : "";
      const firstAttachableEvent = events.find((event) => !documentAttachedToEvent(event, record.doc));

      return `
        <article class="document-library-row">
          <div class="document-library-main">
            <strong>${escapeHtml(record.doc.name)}</strong>
            <small>${escapeHtml(meta || "Document")} · ${escapeHtml(attachedLabel)}</small>
            ${attachedEventList}
          </div>
          <div class="document-library-actions">
            <button class="text-button" type="button" data-library-doc-action="view" data-library-doc-index="${index}">View</button>
            <button class="text-button" type="button" data-library-doc-action="save" data-library-doc-index="${index}">Save</button>
            ${
              canAttach
                ? `<button class="ghost-button" type="button" data-library-doc-action="attach" data-library-doc-index="${index}" ${firstAttachableEvent ? "" : "disabled"}>Add to event</button>
                  <button class="text-button danger-button" type="button" data-library-doc-action="remove" data-library-doc-index="${index}">Delete everywhere</button>`
                : ""
            }
          </div>
        </article>
      `;
    })
    .join("");

  bindDocumentLibraryActions(records);
}

function bindDocumentLibraryActions(records) {
  documentList.querySelectorAll("[data-library-doc-action]").forEach((button) => {
    button.addEventListener("click", async () => {
      const record = records[Number(button.dataset.libraryDocIndex)];

      if (!record) {
        showToast("Document not found.");
        return;
      }

      const action = button.dataset.libraryDocAction;
      const contextEvent = documentContextEvent(record);

      if (action === "view") {
        window.open(documentUrl(contextEvent, record.doc), "_blank", "noopener,noreferrer");
        return;
      }

      if (action === "save") {
        const link = document.createElement("a");
        link.href = documentDownloadUrl(contextEvent, record.doc);
        link.download = documentDownloadName(record.doc);
        document.body.appendChild(link);
        link.click();
        link.remove();
        return;
      }

      if (action === "attach") {
        openDocumentEventPicker(record);
        return;
      }

      if (action === "remove") {
        if (!window.confirm(`Delete "${record.doc.name}" from Documents and every event?`)) {
          return;
        }

        await deleteBlobRecord(record.doc);
        events.forEach((event) => {
          event.docs = eventDocuments(event).filter((doc) => !sameDocument(doc, record.doc));
        });
        generalDocuments.splice(record.libraryIndex, 1);
        if (record.doc.url?.startsWith("blob:")) {
          URL.revokeObjectURL(record.doc.url);
        }
        render();
        showToast(`${record.doc.name} deleted from Documents and all events.`);
        return;
      }

      if (action === "detach") {
        const targetEvent = events.find((event) => event.id === Number(button.dataset.eventId));
        const docIndex = Number(button.dataset.docIndex);

        if (targetEvent) {
          deleteEventDocument(targetEvent, docIndex);
        }
      }
    });
  });
}

function documentEventPickerRecord() {
  if (!documentEventPickerDocumentId) {
    return null;
  }

  return allDocumentRecords().find((record) => documentIdentity(record.doc) === documentEventPickerDocumentId) || null;
}

function openDocumentEventPicker(record) {
  documentEventPickerDocumentId = documentIdentity(record.doc);
  documentEventPickerSelectedIds.clear();
  const firstAvailableEvent = events.find((event) => !documentAttachedToEvent(event, record.doc));
  const focusDate = firstAvailableEvent || events[0];

  if (focusDate?.date) {
    documentEventPickerFocusDate = new Date(`${focusDate.date}T12:00:00`);
  }

  renderDocumentEventPicker();
  documentEventModal.showModal();
}

function renderDocumentEventPicker() {
  const record = documentEventPickerRecord();

  if (!record) {
    documentEventTitle.textContent = "Choose events";
    documentEventCalendar.innerHTML = `<div class="empty-state">Document not found.</div>`;
    confirmDocumentEvents.disabled = true;
    return;
  }

  documentEventTitle.textContent = record.doc.name;
  documentEventMonthLabel.textContent = formatMonth(documentEventPickerFocusDate);
  confirmDocumentEvents.disabled = !documentEventPickerSelectedIds.size;

  const days = monthDatesForDate(documentEventPickerFocusDate);

  documentEventCalendar.innerHTML = days
    .map((date) => {
      if (!date) {
        return `<div class="document-event-day document-event-blank" aria-hidden="true"></div>`;
      }

      const dateKey = toDateKey(date);
      const dayEvents = events.filter((event) => event.date === dateKey);
      const eventButtons = dayEvents
        .map((event) => {
          const attached = documentAttachedToEvent(event, record.doc);
          const selected = documentEventPickerSelectedIds.has(event.id);

          return `
            <button class="document-event-option ${attached ? "attached" : ""} ${selected ? "selected" : ""}" type="button" data-document-event-id="${event.id}" ${attached ? "disabled" : ""}>
              <strong>${escapeHtml(event.title)}</strong>
              <span>${escapeHtml(event.venue)} · ${escapeHtml(event.doorsTime || event.time || "TBC")}</span>
              <small>${attached ? "Already attached" : selected ? "Selected" : "Tap to select"}</small>
            </button>
          `;
        })
        .join("");

      return `
        <div class="document-event-day">
          <div class="document-event-day-head">
            <strong>${date.getDate()}</strong>
            <span>${new Intl.DateTimeFormat("en-GB", { weekday: "short" }).format(date)}</span>
          </div>
          <div class="document-event-options">${eventButtons || "<small>No events</small>"}</div>
        </div>
      `;
    })
    .join("");

  documentEventCalendar.querySelectorAll("[data-document-event-id]").forEach((button) => {
    button.addEventListener("click", () => {
      const eventId = Number(button.dataset.documentEventId);

      if (documentEventPickerSelectedIds.has(eventId)) {
        documentEventPickerSelectedIds.delete(eventId);
      } else {
        documentEventPickerSelectedIds.add(eventId);
      }

      renderDocumentEventPicker();
    });
  });
}

function addDocumentToSelectedEvents() {
  const record = documentEventPickerRecord();
  const selectedEvents = events.filter((event) => documentEventPickerSelectedIds.has(event.id));

  if (!record || !selectedEvents.length) {
    showToast("Select at least one event.");
    return;
  }

  selectedEvents.forEach((event) => {
    if (!documentAttachedToEvent(event, record.doc)) {
      appendDocumentsToEvent(event, [record.doc]);
    }
  });
  selectedEventId = selectedEvents[0].id;
  documentEventPickerSelectedIds.clear();
  documentEventModal.close();
  render();
  showToast(`${record.doc.name} added to ${selectedEvents.length} event${selectedEvents.length === 1 ? "" : "s"}.`);
}

function openDashboardPanelTarget(panelName) {
  const access = currentAccess();
  const targetView = dashboardPanelTargets[panelName];

  if (!targetView || activeView !== "dashboard" || !access.allowedViews.includes(targetView)) {
    return;
  }

  setActiveView(targetView);
  if (targetView === "email") {
    loadEmailInbox();
  }
}

function managedProfiles() {
  return freelancers
    .filter((person) => profileRoles.includes(person.role))
    .sort((a, b) => profileRoles.indexOf(a.role) - profileRoles.indexOf(b.role) || a.name.localeCompare(b.name));
}

function profileAssignmentCount(profileId) {
  return events.filter((event) => assignedPeopleForEvent(event).some((person) => person.id === Number(profileId))).length;
}

function nextFreelancerId() {
  return Math.max(0, ...freelancers.map((person) => person.id)) + 1;
}

function syncStaffProfileSelections() {
  const soundEngineers = staffProfilePeopleForLevel("technician");
  const djs = staffProfilePeopleForLevel("dj");
  const promoters = loginProfilePeopleForLevel("promoter");

  if (!soundEngineers.some((person) => person.id === activeTechnicianId)) {
    activeTechnicianId = soundEngineers[0]?.id || freelancers[0]?.id || 0;
  }

  if (!djs.some((person) => person.id === activeDjId)) {
    activeDjId = djs[0]?.id || freelancers[0]?.id || 0;
  }

  if (!promoters.some((person) => person.id === activePromoterId)) {
    activePromoterId = promoters[0]?.id || 0;
  }

  if (!freelancerById(selectedAvailabilityPersonId)) {
    selectedAvailabilityPersonId = isStaffProfileUser() ? activeStaffProfileId() : freelancers[0]?.id || 0;
  }
}

function resetProfileForm() {
  editingProfileId = null;
  profileForm.reset();
  profileForm.elements.profileId.value = "";
  profileSubmitButton.textContent = "Create profile";
  cancelProfileEdit.hidden = true;
}

function scrollProfileFormIntoView() {
  profileForm.scrollIntoView({ behavior: "smooth", block: "start" });
  window.setTimeout(() => {
    profileForm.elements.name.focus({ preventScroll: true });
  }, 250);
}

function editProfile(profileId) {
  const profile = freelancerById(profileId);

  if (!profile) {
    return;
  }

  editingProfileId = profile.id;
  profileForm.elements.profileId.value = String(profile.id);
  profileForm.elements.name.value = profile.name || "";
  profileForm.elements.role.value = profile.role || "Sound engineer";
  profileForm.elements.location.value = profile.location || "";
  profileForm.elements.email.value = profile.email || "";
  profileForm.elements.whatsapp.value = profile.whatsapp || "";
  profileSubmitButton.textContent = "Save profile";
  cancelProfileEdit.hidden = false;
  scrollProfileFormIntoView();
}

function removeProfileFromEvents(profileId) {
  events.forEach((event) => {
    Object.entries(event.roleAssignments || {}).forEach(([role, assignedId]) => {
      if (Number(assignedId) === Number(profileId)) {
        delete event.roleAssignments[role];
      }
    });

    if (event.shiftNotifications) {
      delete event.shiftNotifications[profileId];
    }

    if (event.shiftConfirmations) {
      delete event.shiftConfirmations[profileId];
    }

    if (Number(event.promoterId) === Number(profileId)) {
      event.promoterId = null;
    }

    event.crew = (event.crew || []).filter((id) => Number(id) !== Number(profileId));
  });
}

async function deleteProfile(profileId) {
  const profile = freelancerById(profileId);

  if (!profile) {
    return;
  }

  if (!window.confirm(`Delete ${profile.name}'s profile? This will remove them from event staffing.`)) {
    return;
  }

  markAppDataChanged();
  removeProfileFromEvents(profile.id);
  removeStoredPasscode(`profile:${profile.id}`);
  await deleteBlobRecord({
    storage: profile.photoStorage || (profile.photoPathname ? "blob" : ""),
    pathname: profile.photoPathname || "",
    url: profile.photoUrl || ""
  });
  freelancers.splice(freelancers.indexOf(profile), 1);
  syncStaffProfileSelections();
  resetProfileForm();
  render();
  await persistAppStateWithConfirmation(`${profile.name}'s profile has been deleted.`, `${profile.name}'s profile was deleted on this device`);
}

async function resetProfilePasscode(profileId) {
  if (activeUserLevel !== "admin") {
    showToast("Only admin can reset passcodes.");
    return;
  }

  const profile = freelancerById(profileId);

  if (!profile || !profileCanHavePasscode(profile)) {
    showToast("This profile does not use a login passcode.");
    return;
  }

  if (!window.confirm(`Reset ${profile.name}'s passcode? They will create a new one next time they log in.`)) {
    return;
  }

  const key = profilePasscodeKey(profile.id);

  removeStoredPasscode(key);
  removeRememberedLoginForPasscodeKey(key);
  removeActiveLoginForPasscodeKey(key);
  markAppDataChanged();
  await persistAppStateWithConfirmation(`${profile.name}'s passcode has been reset.`, `${profile.name}'s passcode reset was saved on this device`);
}

function renderProfiles() {
  const profiles = managedProfiles();
  const roleCounts = new Map(profileRoles.map((role) => [role, profiles.filter((profile) => profile.role === role).length]));
  const firstPopulatedRole = profileRoles.find((role) => roleCounts.get(role)) || profileRoles[0];
  const selectedRole = profileRoles.includes(activeProfileRole) ? activeProfileRole : firstPopulatedRole;
  const filteredProfiles = profiles.filter((profile) => profile.role === selectedRole);

  activeProfileRole = selectedRole;

  const roleSummaries = profileRoles
    .map((role) => {
      const count = roleCounts.get(role) || 0;
      const isActive = role === selectedRole;

      return `
        <button class="profile-summary-card ${isActive ? "active" : ""}" type="button" data-profile-role="${escapeHtml(role)}" aria-pressed="${isActive}">
          <span>${escapeHtml(role)}</span>
          <strong>${count}</strong>
        </button>
      `;
    })
    .join("");

  const profileCards = filteredProfiles.length
    ? filteredProfiles
        .map((profile) => {
          const assignmentCount = profileAssignmentCount(profile.id);
          const contact = [profile.email, profile.whatsapp].filter(Boolean).join(" · ") || "No contact details";
          const resetPasscodeButton = profileCanHavePasscode(profile)
            ? `<button class="ghost-button" type="button" data-reset-profile-passcode="${profile.id}">Reset passcode</button>`
            : "";

          return `
            <article class="profile-card">
              <div class="crew-main">
                ${profileAvatarHtml(profile)}
                <div>
                  <strong>${escapeHtml(profile.name)}</strong>
                  <span class="crew-meta">${escapeHtml(profile.role)} · ${escapeHtml(profile.location || "No location")} · ${escapeHtml(contact)}</span>
                  <small>${assignmentCount} active event assignment${assignmentCount === 1 ? "" : "s"}</small>
                </div>
              </div>
              <div class="profile-card-actions">
                <button class="ghost-button" type="button" data-edit-profile="${profile.id}">Edit</button>
                ${resetPasscodeButton}
                <button class="text-button danger-button" type="button" data-delete-profile="${profile.id}">Delete</button>
              </div>
            </article>
          `;
        })
        .join("")
    : `<div class="empty-state">No ${escapeHtml(selectedRole.toLowerCase())} profiles yet.</div>`;

  profileList.innerHTML = `
    <div class="profile-summary">${roleSummaries}</div>
    <div class="profile-list-heading">
      <strong>${escapeHtml(selectedRole)} profiles</strong>
      <small>${filteredProfiles.length} profile${filteredProfiles.length === 1 ? "" : "s"}</small>
    </div>
    <div class="profile-card-list">${profileCards}</div>
  `;
}

function profileAvatarHtml(profile, className = "avatar") {
  if (profile?.photoUrl) {
    return `<div class="${className} photo-avatar"><img src="${escapeHtml(profile.photoUrl)}" alt="" /></div>`;
  }

  return `<div class="${className}">${initials(profile?.name || "")}</div>`;
}

function activeSelfProfile() {
  if (!["technician", "dj", "promoter"].includes(activeUserLevel)) {
    return null;
  }

  return freelancerById(activeStaffProfileId(activeUserLevel));
}

function renderAppBrandMark() {
  if (!appBrandMark) {
    return;
  }

  const profile = activeSelfProfile();
  const photoUrl = selfProfilePhotoDraft || profile?.photoUrl;

  appBrandMark.classList.toggle("has-profile-photo", Boolean(photoUrl));
  appBrandMark.innerHTML = photoUrl
    ? `<img src="${escapeHtml(photoUrl)}" alt="" />`
    : "P";
}

function renderSelfProfilePhoto(profile) {
  if (!selfProfilePhotoPreview) {
    return;
  }

  const photoUrl = selfProfilePhotoDraft || profile?.photoUrl;
  selfProfilePhotoPreview.innerHTML = photoUrl
    ? `<img src="${escapeHtml(photoUrl)}" alt="" />`
    : `<span>${initials(profile?.name || "")}</span>`;
  renderAppBrandMark();
}

function profilePhotoFrameSize() {
  return Math.round(profilePhotoFrame?.getBoundingClientRect().width || 190);
}

function profilePhotoCropMetrics(frameSize = profilePhotoFrameSize()) {
  const state = selfProfilePhotoCropState;

  if (!state?.loaded || !state.naturalWidth || !state.naturalHeight) {
    return null;
  }

  const coverScale = Math.max(frameSize / state.naturalWidth, frameSize / state.naturalHeight);
  const scale = coverScale * state.zoom;

  return {
    frameSize,
    scale,
    displayWidth: state.naturalWidth * scale,
    displayHeight: state.naturalHeight * scale
  };
}

function clampProfilePhotoOffsets() {
  const metrics = profilePhotoCropMetrics();

  if (!metrics || !selfProfilePhotoCropState) {
    return;
  }

  const maxX = Math.max(0, (metrics.displayWidth - metrics.frameSize) / 2);
  const maxY = Math.max(0, (metrics.displayHeight - metrics.frameSize) / 2);

  selfProfilePhotoCropState.offsetX = Math.min(maxX, Math.max(-maxX, selfProfilePhotoCropState.offsetX));
  selfProfilePhotoCropState.offsetY = Math.min(maxY, Math.max(-maxY, selfProfilePhotoCropState.offsetY));
}

function renderProfilePhotoFrame() {
  if (!profilePhotoEditor || !profilePhotoFrame || !profilePhotoScale) {
    return;
  }

  const state = selfProfilePhotoCropState;
  profilePhotoEditor.hidden = !state;

  if (!state) {
    profilePhotoFrame.innerHTML = "";
    return;
  }

  profilePhotoScale.value = String(state.zoom);

  if (!state.loaded) {
    profilePhotoFrame.innerHTML = `<div class="empty-state">Loading image.</div>`;
    return;
  }

  clampProfilePhotoOffsets();
  const metrics = profilePhotoCropMetrics();
  let image = profilePhotoFrame.querySelector("img");

  if (!image || image.src !== state.sourceUrl) {
    profilePhotoFrame.innerHTML = `<img src="${escapeHtml(state.sourceUrl)}" alt="" />`;
    image = profilePhotoFrame.querySelector("img");
  }

  image.style.width = `${metrics.displayWidth}px`;
  image.style.height = `${metrics.displayHeight}px`;
  image.style.transform = `translate(-50%, -50%) translate(${state.offsetX}px, ${state.offsetY}px)`;
}

function croppedProfilePhotoCanvas(size = 512) {
  const state = selfProfilePhotoCropState;
  const metrics = profilePhotoCropMetrics();

  if (!state?.loaded || !metrics) {
    return null;
  }

  const sourceSize = metrics.frameSize / metrics.scale;
  const sourceCenterX = state.naturalWidth / 2 - state.offsetX / metrics.scale;
  const sourceCenterY = state.naturalHeight / 2 - state.offsetY / metrics.scale;
  const sourceX = Math.min(state.naturalWidth - sourceSize, Math.max(0, sourceCenterX - sourceSize / 2));
  const sourceY = Math.min(state.naturalHeight - sourceSize, Math.max(0, sourceCenterY - sourceSize / 2));
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  canvas.width = size;
  canvas.height = size;
  context.drawImage(state.image, sourceX, sourceY, sourceSize, sourceSize, 0, 0, size, size);

  return canvas;
}

function updateCroppedProfilePhotoDraft() {
  const canvas = croppedProfilePhotoCanvas();

  if (!canvas) {
    return;
  }

  selfProfilePhotoDraft = canvas.toDataURL("image/jpeg", 0.9);
  renderSelfProfilePhoto(activeSelfProfile());
}

function resetProfilePhotoCrop() {
  if (!selfProfilePhotoCropState) {
    return;
  }

  selfProfilePhotoCropState.zoom = 1;
  selfProfilePhotoCropState.offsetX = 0;
  selfProfilePhotoCropState.offsetY = 0;
  renderProfilePhotoFrame();
  updateCroppedProfilePhotoDraft();
}

function clearSelfProfilePhotoDraft() {
  selfProfilePhotoDraft = null;
  selfProfilePhotoFileDraft = null;
  selfProfilePhotoCropState = null;
  if (selfProfilePhoto) {
    selfProfilePhoto.value = "";
  }
  renderProfilePhotoFrame();
}

function setProfilePhotoCropSource(file, dataUrl) {
  const image = new Image();

  selfProfilePhotoFileDraft = file;
  selfProfilePhotoCropState = {
    sourceUrl: dataUrl,
    fileName: file.name || "profile-picture.jpg",
    image,
    loaded: false,
    naturalWidth: 0,
    naturalHeight: 0,
    zoom: 1,
    offsetX: 0,
    offsetY: 0,
    drag: null
  };
  renderProfilePhotoFrame();

  image.addEventListener("load", () => {
    if (selfProfilePhotoCropState?.image !== image) {
      return;
    }

    selfProfilePhotoCropState.loaded = true;
    selfProfilePhotoCropState.naturalWidth = image.naturalWidth;
    selfProfilePhotoCropState.naturalHeight = image.naturalHeight;
    renderProfilePhotoFrame();
    updateCroppedProfilePhotoDraft();
  });
  image.src = dataUrl;
}

function croppedProfilePhotoFile() {
  const canvas = croppedProfilePhotoCanvas(768);

  if (!canvas || !selfProfilePhotoFileDraft) {
    return Promise.resolve(selfProfilePhotoFileDraft);
  }

  const filename = (selfProfilePhotoCropState?.fileName || selfProfilePhotoFileDraft.name || "profile-picture.jpg").replace(/\.[^.]+$/, "") || "profile-picture";

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        resolve(selfProfilePhotoFileDraft);
        return;
      }

      resolve(new File([blob], `${filename}.jpg`, { type: "image/jpeg" }));
    }, "image/jpeg", 0.9);
  });
}

function renderSelfProfile() {
  const profile = activeSelfProfile();

  if (!selfProfileForm || !selfProfileTitle) {
    return;
  }

  if (!profile) {
    selfProfileTitle.textContent = "Profile details";
    selfProfilePhotoPreview.innerHTML = "";
    clearSelfProfilePhotoDraft();
    selfProfileForm.querySelectorAll("input, button").forEach((control) => {
      control.disabled = true;
    });
    return;
  }

  selfProfileForm.querySelectorAll("input, button").forEach((control) => {
    control.disabled = false;
  });
  selfProfileTitle.textContent = profile.name || "Profile details";
  selfProfileForm.elements.name.value = profile.name || "";
  selfProfileForm.elements.role.value = profile.role || currentAccess().label;
  selfProfileForm.elements.location.value = profile.location || "";
  selfProfileForm.elements.email.value = profile.email || "";
  selfProfileForm.elements.whatsapp.value = profile.whatsapp || "";
  selfProfileForm.elements.newPasscode.value = "";
  selfProfileForm.elements.confirmPasscode.value = "";
  selfProfileForm.elements.newPasscode.minLength = passcodeSubjectForLevel().digits;
  selfProfileForm.elements.newPasscode.maxLength = passcodeSubjectForLevel().digits;
  selfProfileForm.elements.confirmPasscode.minLength = passcodeSubjectForLevel().digits;
  selfProfileForm.elements.confirmPasscode.maxLength = passcodeSubjectForLevel().digits;
  renderSelfProfilePhoto(profile);
}

async function saveSelfProfile() {
  const profile = activeSelfProfile();

  if (!profile) {
    showToast("No profile is selected.");
    return;
  }

  const data = new FormData(selfProfileForm);
  const name = String(data.get("name") || "").trim();
  const newPasscode = String(data.get("newPasscode") || "").trim();
  const confirmPasscode = String(data.get("confirmPasscode") || "").trim();
  const subject = passcodeSubjectForLevel();

  if (!name) {
    showToast("Add your name first.");
    return;
  }

  if (newPasscode || confirmPasscode) {
    const passcodePattern = new RegExp(`^\\d{${subject.digits}}$`);

    if (!passcodePattern.test(newPasscode)) {
      showToast(`Enter a ${subject.digits} digit passcode.`);
      return;
    }

    if (newPasscode !== confirmPasscode) {
      showToast("The passcode confirmation does not match.");
      return;
    }

    const passcodes = readStoredPasscodes();
    passcodes[subject.key] = newPasscode;
    writeStoredPasscodes(passcodes);
    unlockedPasscodeKeys.add(subject.key);
  }

  const changedAt = markAppDataChanged();
  Object.assign(profile, {
    name,
    location: String(data.get("location") || "").trim(),
    email: String(data.get("email") || "").trim(),
    whatsapp: String(data.get("whatsapp") || "").trim(),
    updatedAt: changedAt
  });

  if (selfProfilePhotoFileDraft) {
    showToast("Uploading profile picture...");
    const croppedPhoto = await croppedProfilePhotoFile();
    const uploadedPhoto = await uploadFileToBlob(croppedPhoto || selfProfilePhotoFileDraft, "profile-photos");

    if (profile.photoPathname && profile.photoPathname !== uploadedPhoto.pathname) {
      await deleteBlobRecord({
        storage: profile.photoStorage || "blob",
        pathname: profile.photoPathname,
        url: profile.photoUrl || ""
      });
    }

    profile.photoUrl = uploadedPhoto.url;
    profile.photoPathname = uploadedPhoto.pathname;
    profile.photoStorage = uploadedPhoto.storage;
    clearSelfProfilePhotoDraft();
  } else if (selfProfilePhotoDraft) {
    profile.photoUrl = selfProfilePhotoDraft;
    profile.photoPathname = "";
    profile.photoStorage = "local";
    clearSelfProfilePhotoDraft();
  }

  syncStaffProfileSelections();
  renderLoginProfileOptions();
  if (isLoggedIn) {
    writeActiveLoginSession();
    writeRememberedLogin(true);
  }
  setActiveView("dashboard");
  render();
  await persistAppStateWithConfirmation("Profile details saved.", "Profile details saved on this device");
}

function rotaAssignmentEvent() {
  return events.find((event) => event.id === rotaAssignmentEventId);
}

function renderRotaAssignmentOptions(event) {
  const assignedEngineerId = assignedPersonIdForRoles(event, engineerRoles);
  const assignedDjId = assignedPersonIdForRoles(event, ["DJ"]);
  const availableEngineers = availablePeopleForEventRoles(event, engineerRoles).length;
  const availableDjs = availablePeopleForEventRoles(event, ["DJ"]).length;

  rotaEngineerSelect.innerHTML = assignmentSelectOptions(event, engineerRoles, assignedEngineerId, "No engineer assigned");
  rotaDjSelect.innerHTML = assignmentSelectOptions(event, ["DJ"], assignedDjId, "No DJ assigned");
  rotaAssignNote.textContent = `${availableEngineers} available engineer${availableEngineers === 1 ? "" : "s"} · ${availableDjs} available DJ${availableDjs === 1 ? "" : "s"} for ${formatDate(event.date)}.`;
}

function openRotaAssignmentModal(eventId) {
  if (activeUserLevel !== "admin") {
    return;
  }

  const event = events.find((item) => item.id === Number(eventId));

  if (!event) {
    return;
  }

  selectedEventId = event.id;
  rotaAssignmentEventId = event.id;
  rotaAssignTitle.textContent = event.title;
  rotaAssignSummary.innerHTML = `
    <strong>${escapeHtml(formatDate(event.date))} · ${escapeHtml(event.venue)}</strong>
    <small>${escapeHtml(eventTimeSummary(event))}</small>
  `;
  renderRotaAssignmentOptions(event);
  rotaAssignModal.showModal();
}

function saveRotaAssignment() {
  const event = rotaAssignmentEvent();

  if (!event) {
    return;
  }

  const engineerId = Number(rotaEngineerSelect.value) || null;
  const djId = Number(rotaDjSelect.value) || null;
  const engineer = engineerId ? freelancerById(engineerId) : null;

  engineerRoles.forEach((role) => setEventRoleAssignment(event, role, null));

  if (engineer) {
    setEventRoleAssignment(event, engineer.role, engineer.id);
  }

  setEventRoleAssignment(event, "DJ", djId);
  syncEventCrewFromAssignments(event);
  rotaAssignModal.close();
  render();
  showToast(`${event.title} staffing updated from the rota.`);
}

function rotaStatusForEvent(event, unavailableAssigned) {
  if (unavailableAssigned.length) {
    return {
      className: "needs-action",
      text: `${unavailableAssigned.length} clash`
    };
  }

  if (isSoundEngineerUser() && isTechnicianBookedForEvent(event)) {
    return shiftConfirmedBy(event, activeStaffProfileId())
      ? { className: "confirmed", text: "Confirmed" }
      : { className: "needs-confirm", text: "To confirm" };
  }

  return { className: "", text: "Ready" };
}

function rotaRowHtml(event) {
  const assigned = assignedPeopleForEvent(event);
  const unavailableAssigned = assigned.filter((person) => hasAvailabilityClash(person, event));
  const rotaStatus = rotaStatusForEvent(event, unavailableAssigned);
  const isClickable = activeUserLevel === "admin" || ["technician", "dj", "promoter"].includes(activeUserLevel);
  const tagName = isClickable ? "button" : "article";
  const actionLabel = activeUserLevel === "admin" ? "Assign staff to" : "View details for";
  const actionAttributes = isClickable
    ? `type="button" data-rota-event-id="${event.id}" aria-label="${actionLabel} ${escapeHtml(event.title)}"`
    : "";

  return `
    <${tagName} class="rota-row ${isClickable ? "rota-clickable" : ""}" ${actionAttributes}>
      <div>
        <strong>${formatDate(event.date)}</strong>
        <span>${eventTimeSummary(event)}</span>
      </div>
      <div>
        <strong>${event.title}</strong>
        <span>${event.venue}</span>
      </div>
      <div class="required-list">${event.roles.length ? event.roles.map((role) => `<span class="role-pill">${roleAssignmentText(event, role)}</span>`).join("") : "<small>No staffing added</small>"}</div>
      <div class="assigned-list">
        ${
          assigned.length
            ? assigned
                .map((person) => {
                  const warning = hasAvailabilityClash(person, event) ? " warning" : "";
                  return `<span class="person-pill${warning}">${person.name}</span>`;
                })
                .join("")
            : "<small>No crew assigned</small>"
        }
      </div>
      <span class="rota-status ${rotaStatus.className}">
        ${rotaStatus.text}
      </span>
    </${tagName}>
  `;
}

function rotaMonthEventHtml(event) {
  const assigned = assignedPeopleForEvent(event);
  const unavailableAssigned = assigned.filter((person) => hasAvailabilityClash(person, event));
  const bookedNames = assigned.length ? assigned.map((person) => person.name).join(", ") : "No one booked";
  const rotaStatus = rotaStatusForEvent(event, unavailableAssigned);
  const isClickable = activeUserLevel === "admin" || ["technician", "dj", "promoter"].includes(activeUserLevel);
  const tagName = isClickable ? "button" : "article";
  const actionLabel = activeUserLevel === "admin" ? "Assign staff to" : "View details for";
  const actionAttributes = isClickable
    ? `type="button" data-rota-event-id="${event.id}" aria-label="${actionLabel} ${escapeHtml(event.title)}"`
    : "";

  return `
    <${tagName} class="rota-event-card ${eventStatusValue(event.status)} ${eventVenueClass(event.venue)} ${unavailableAssigned.length ? "needs-action" : ""} ${isClickable ? "rota-clickable" : ""}" ${actionAttributes}>
      <strong>${escapeHtml(event.venue)}</strong>
      <span>${escapeHtml(bookedNames)}</span>
      ${isSoundEngineerUser() && isTechnicianBookedForEvent(event) ? `<small>${escapeHtml(rotaStatus.text)}</small>` : ""}
    </${tagName}>
  `;
}

function bindRotaAssignmentButtons() {
  rotaBoard.querySelectorAll("[data-rota-event-id]").forEach((button) => {
    button.addEventListener("click", () => {
      if (activeUserLevel === "admin") {
        openRotaAssignmentModal(button.dataset.rotaEventId);
        return;
      }

      const event = events.find((booking) => booking.id === Number(button.dataset.rotaEventId));

      if (event) {
        openEventViewModal(event);
      }
    });
  });
}

function updateRotaActionControls() {
  generateRotaButton.disabled =
    activeUserLevel !== "admin" || !currentConfirmedRotaPeriodEvents().length || !soundEngineers().length;
  addBookingsToCalendarButton.disabled = !isStaffProfileUser() || !staffCalendarBookedEvents().length;

  if (!isSoundEngineerUser()) {
    confirmRotaShifts.disabled = false;
    confirmRotaShifts.textContent = "Confirm all shifts";
    return;
  }

  const eventList = currentEngineerRotaEvents();
  const unconfirmedEvents = unconfirmedEngineerRotaEvents();

  confirmRotaShifts.disabled = !eventList.length || !unconfirmedEvents.length;
  confirmRotaShifts.textContent = unconfirmedEvents.length
    ? `Confirm ${unconfirmedEvents.length} shift${unconfirmedEvents.length === 1 ? "" : "s"}`
    : eventList.length
      ? "All shifts confirmed"
      : "No shifts to confirm";
}

function renderRota() {
  const periodEvents = venueFilteredRotaEvents(visibleRotaEventsForPeriod(rotaFocusDate, rotaView));
  const label = periodLabel(rotaFocusDate, rotaView);
  const titlePrefix = isTechnicianRotaFiltered() ? "My " : "";
  const emptyDayText = isTechnicianRotaFiltered() ? "No bookings" : "No rota";
  const venueLabel = rotaVenueFilter.value === "all" ? "" : ` at ${rotaVenueFilter.value}`;
  const showPersonalDateList = rotaView === "month" && isTechnicianRotaFiltered();

  rotaTitle.textContent = rotaView === "month" ? `${titlePrefix}Monthly crew schedule` : `${titlePrefix}Weekly crew schedule`;
  rotaPeriodLabel.textContent = label;
  rotaBoard.classList.toggle("rota-month", rotaView === "month" && !showPersonalDateList);
  rotaBoard.classList.toggle("rota-booked-dates", showPersonalDateList);
  rotaBoard.setAttribute("aria-label", rotaView === "month" ? `${titlePrefix}Monthly rota` : `${titlePrefix}Weekly rota`);

  document.querySelectorAll("[data-rota-view]").forEach((button) => {
    button.classList.toggle("active", button.dataset.rotaView === rotaView);
  });
  updateRotaActionControls();
  renderRotaDistribution(periodEvents);

  if (showPersonalDateList) {
    const eventsByDate = periodEvents.reduce((groups, event) => {
      groups[event.date] = groups[event.date] || [];
      groups[event.date].push(event);
      return groups;
    }, {});
    const dateCards = Object.entries(eventsByDate)
      .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
      .map(([date, dateEvents]) => `
        <section class="rota-booked-date">
          <div class="rota-day-head">
            <strong>${escapeHtml(formatDate(date))}</strong>
            <span>${dateEvents.length} booking${dateEvents.length === 1 ? "" : "s"}</span>
          </div>
          <div class="rota-day-events">${dateEvents.map(rotaMonthEventHtml).join("")}</div>
        </section>
      `)
      .join("");

    rotaBoard.innerHTML = dateCards || `<div class="empty-state">No personal bookings${venueLabel} in ${label}.</div>`;
    bindRotaAssignmentButtons();
    return;
  }

  if (rotaView === "month") {
    const days = calendarDaysForView(rotaFocusDate, "month");

    rotaBoard.innerHTML = days
      .map((day) => {
        if (day.isBlank) {
          return `<div class="rota-day rota-blank" aria-hidden="true"></div>`;
        }

        const dayEvents = periodEvents.filter((event) => event.date === day.date);

        return `
          <div class="rota-day">
            <div class="rota-day-head">
              <strong>${day.label}</strong>
              <span>${day.day}</span>
            </div>
            <div class="rota-day-events">
              ${dayEvents.length ? dayEvents.map(rotaMonthEventHtml).join("") : `<small>${emptyDayText}</small>`}
            </div>
          </div>
        `;
      })
      .join("");
    bindRotaAssignmentButtons();
    return;
  }

  rotaBoard.innerHTML = periodEvents.length
    ? periodEvents.map(rotaRowHtml).join("")
    : `<div class="empty-state">${isTechnicianRotaFiltered() ? "No personal bookings" : "No rota entries"}${venueLabel} in ${label}.</div>`;
  bindRotaAssignmentButtons();
}

function renderAvailabilityOptions() {
  const people = isStaffProfileUser() ? staffProfilePeopleForLevel() : freelancers;

  availabilityPerson.innerHTML = people
    .map((person) => `<option value="${person.id}">${person.name} · ${person.role}</option>`)
    .join("");
  availabilityPerson.disabled = isStaffProfileUser();
}

function renderTechnicianProfileOptions() {
  syncStaffProfileSelections();
}

function renderAvailabilityPicker() {
  const person = selectedAvailabilityPerson();
  const month = monthForOffset(availabilityMonthOffset);

  availabilityPerson.value = String(person.id);
  availabilityMonthLabel.textContent = formatMonth(month);
  previousAvailabilityMonth.disabled = availabilityMonthOffset === 0;
  nextAvailabilityMonth.disabled = availabilityMonthOffset === maxAvailabilityMonthOffset;
  availabilityPicker.innerHTML = monthDates(availabilityMonthOffset)
    .map((date) => {
      if (!date) {
        return `<div class="date-spacer" aria-hidden="true"></div>`;
      }

      const dateKey = toDateKey(date);
      const checked = draftUnavailableDates.includes(dateKey) ? "checked" : "";
      const amChecked = draftAmUnavailableDates.includes(dateKey) ? "checked" : "";
      const dayName = new Intl.DateTimeFormat("en-GB", { weekday: "short" }).format(date);

      return `
        <div class="date-checkbox">
          <span>
            <strong>${date.getDate()}</strong>
            <small>${dayName}</small>
          </span>
          <div class="date-options">
            <label class="date-option">
              <input type="checkbox" name="amUnavailableDate" value="${dateKey}" ${amChecked} />
              <span>AM</span>
            </label>
            <label class="date-option">
              <input type="checkbox" name="unavailableDate" value="${dateKey}" ${checked} />
              <span>Full day</span>
            </label>
          </div>
        </div>
      `;
    })
    .join("");
}

function render() {
  renderAppBrandMark();
  renderWeatherForecast();
  renderTubeStatus();
  renderCalendar();
  renderEventDetails();
  renderAvailabilityBoard();
  renderCrew();
  renderDocs();
  renderUnreadEmailWidget();
  renderEmailInbox();
  renderProfiles();
  renderSelfProfile();
  renderEventPromoterOptions();
  renderRota();
  setDefaultReportDate();
  renderReportAttachmentList();
  setActiveView(activeView);
  persistAppState();
}

document.querySelector("#openEvent").addEventListener("click", () => openCreateEventModal());
document.querySelector("#openAvailability").addEventListener("click", () => {
  if (!currentAccess().canAddAvailability) {
    showToast("This user level cannot update availability.");
    return;
  }

  if (isStaffProfileUser()) {
    selectedAvailabilityPersonId = activeStaffProfileId();
  }

  availabilityMonthOffset = 0;
  renderAvailabilityOptions();
  beginAvailabilityDraft();
  renderAvailabilityPicker();
  availabilityModal.showModal();
});
document.querySelector("#reviewBookings").addEventListener("click", () => showToast("Showing events that still need confirmation."));
document.querySelector("#attachDoc").addEventListener("click", () => {
  if (!currentAccess().canAttachDocs) {
    showToast("This user level cannot upload documents.");
    return;
  }

  quickAttachDocInput.click();
});
quickAttachDocInput.addEventListener("change", async () => {
  const selectedFiles = [...quickAttachDocInput.files];

  if (!selectedFiles.length) {
    return;
  }

  showToast("Uploading documents to general storage...");
  const docs = await documentsFromFiles(selectedFiles);
  addDocumentsToLibrary(docs);
  quickAttachDocInput.value = "";
  render();
  showToast(`${docs.length} document${docs.length === 1 ? "" : "s"} uploaded to general storage.`);
});
eventDocumentsInput.addEventListener("change", async () => {
  const selectedFiles = [...eventDocumentsInput.files];

  if (selectedFiles.length) {
    showToast("Adding document files...");
  }

  pendingEventDocuments = await documentsFromFiles(selectedFiles);
  renderEventDocumentList(editingEventId ? events.find((event) => event.id === editingEventId) : null);
});
refreshWeather.addEventListener("click", () => loadWeatherForecast(true));
refreshTubeStatus.addEventListener("click", () => loadTubeStatus(true));
tubeExpandToggle.addEventListener("click", () => {
  tubeStatusExpanded = !tubeStatusExpanded;
  renderTubeStatus();
});
document.querySelector("#exportRota").addEventListener("click", () => {
  if (!currentAccess().canExportRota) {
    showToast("This user level cannot notify rota staff.");
    return;
  }

  notifyEngineersForRotaMonth();
});
confirmRotaShifts.addEventListener("click", confirmAllEngineerRotaShifts);
addBookingsToCalendarButton.addEventListener("click", downloadStaffBookingsCalendar);
generateRotaButton.addEventListener("click", generateSoundEngineerRota);
openRotaWhatsappMessagesButton.addEventListener("click", () => openPendingRotaWhatsappMessages());
previousDocumentEventMonth.addEventListener("click", () => {
  documentEventPickerFocusDate = new Date(
    documentEventPickerFocusDate.getFullYear(),
    documentEventPickerFocusDate.getMonth() - 1,
    1,
    12
  );
  renderDocumentEventPicker();
});
nextDocumentEventMonth.addEventListener("click", () => {
  documentEventPickerFocusDate = new Date(
    documentEventPickerFocusDate.getFullYear(),
    documentEventPickerFocusDate.getMonth() + 1,
    1,
    12
  );
  renderDocumentEventPicker();
});
confirmDocumentEvents.addEventListener("click", addDocumentToSelectedEvents);
openEmailDashboard.addEventListener("click", () => {
  setActiveView("email");
  loadEmailInbox();
});
document.querySelectorAll(".panel[data-panel] .section-head h2").forEach((title) => {
  title.addEventListener("click", () => {
    const panel = title.closest("[data-panel]");

    openDashboardPanelTarget(panel?.dataset.panel);
  });
});
document.querySelector("#dashboardEmail .email-widget-head strong")?.addEventListener("click", () => {
  openDashboardPanelTarget("email");
});
refreshEmailInbox.addEventListener("click", () => loadEmailInbox(true));
emailReplyDraft.addEventListener("click", openReplyDraft);
emailReplyAll.addEventListener("change", applyEmailReplyAllMode);
emailReplyAttachments.addEventListener("change", renderEmailReplyAttachmentList);
emailReplyClearAttachments.addEventListener("click", () => {
  emailReplyAttachments.value = "";
  renderEmailReplyAttachmentList();
});
emailReplyForm.addEventListener("submit", (event) => {
  event.preventDefault();
  sendInboxReply();
});
document.querySelectorAll("[data-calendar-view]").forEach((button) => {
  button.addEventListener("click", () => {
    calendarView = button.dataset.calendarView;
    render();
  });
});
calendarVenueFilter.addEventListener("change", () => {
  ensureSelectedEventMatchesCalendarFilter();
  renderCalendar();
  renderEventDetails();
});
document.querySelectorAll("[data-crew-availability-view]").forEach((button) => {
  button.addEventListener("click", () => {
    crewAvailabilityView = button.dataset.crewAvailabilityView;
    renderAvailabilityBoard();
  });
});
document.querySelectorAll("[data-rota-view]").forEach((button) => {
  button.addEventListener("click", () => {
    rotaView = button.dataset.rotaView;
    renderRota();
  });
});
rotaVenueFilter.addEventListener("change", renderRota);
previousCalendarPeriod.addEventListener("click", () => {
  calendarFocusDate = calendarView === "week" ? addDays(calendarFocusDate, -7) : addMonths(calendarFocusDate, -1);
  render();
});
nextCalendarPeriod.addEventListener("click", () => {
  calendarFocusDate = calendarView === "week" ? addDays(calendarFocusDate, 7) : addMonths(calendarFocusDate, 1);
  render();
});
previousCrewPeriod.addEventListener("click", () => {
  const view = activeUserLevel === "admin" && crewAvailabilityView === "month" ? "month" : "week";
  crewFocusDate = shiftPeriod(crewFocusDate, view, -1);
  renderAvailabilityBoard();
});
nextCrewPeriod.addEventListener("click", () => {
  const view = activeUserLevel === "admin" && crewAvailabilityView === "month" ? "month" : "week";
  crewFocusDate = shiftPeriod(crewFocusDate, view, 1);
  renderAvailabilityBoard();
});
previousRotaPeriod.addEventListener("click", () => {
  rotaFocusDate = shiftPeriod(rotaFocusDate, rotaView, -1);
  renderRota();
});
nextRotaPeriod.addEventListener("click", () => {
  rotaFocusDate = shiftPeriod(rotaFocusDate, rotaView, 1);
  renderRota();
});
timeSelects.forEach((select) => {
  select.addEventListener("change", () => {
    updateEventTimeSelects(select);
    refreshRoleFreelancerOptions();
    updateRolePickerState();
  });
});
eventForm.elements.date.addEventListener("change", () => {
  refreshRoleFreelancerOptions();
  updateRolePickerState();
});
repeatMode.addEventListener("change", updateRepeatFields);
repeatIndefinitely.addEventListener("change", updateRepeatFields);
addRepeatDate.addEventListener("click", addSpecificRepeatDate);
repeatDateList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-repeat-date]");

  if (button) {
    removeSpecificRepeatDate(button.dataset.repeatDate);
  }
});
themeToggle.addEventListener("change", () => {
  applyTheme(themeToggle.checked ? "light" : "dark");
});
loginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  beginLogin(loginLevelSelect.value);
});
loginLevelSelect.addEventListener("change", () => {
  loginEmailInput.value = "";
  renderLoginProfileOptions();
});
logoutButton.addEventListener("click", logout);
myBookingsToggle.addEventListener("change", () => {
  ensureSelectedEventMatchesCalendarFilter();
  render();
});
rotaMyBookingsToggle.addEventListener("change", renderRota);
rolePickerToggle.addEventListener("click", () => {
  const willOpen = rolePickerMenu.hidden;

  rolePickerMenu.hidden = !willOpen;
  rolePickerToggle.setAttribute("aria-expanded", String(willOpen));
});
printEventSheetButton.addEventListener("click", () => {
  const event = currentEventSheet();

  eventSheetModal.close();
  printEventSheet(event);
});
saveEventSheetButton.addEventListener("click", () => {
  const event = currentEventSheet();

  eventSheetModal.close();
  saveEventSheetPdf(event);
});
rotaAssignForm.addEventListener("submit", (event) => {
  event.preventDefault();
  saveRotaAssignment();
});
passcodeForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const subject = passcodeSubjectForLevel();
  const code = profilePasscode.value.trim();

  if (!new RegExp(`^\\d{${subject.digits}}$`).test(code)) {
    showToast(`Enter a ${subject.digits} digit passcode.`);
    profilePasscode.value = "";
    return;
  }

  const passcodes = readStoredPasscodes();
  const savedPasscode = passcodes[subject.key];

  if (savedPasscode && savedPasscode !== code) {
    showToast("Passcode not recognised.");
    profilePasscode.value = "";
    return;
  }

  if (!savedPasscode) {
    passcodes[subject.key] = code;
    writeStoredPasscodes(passcodes);
    markAppDataChanged();
    await persistAppState({ immediateRemote: true });
  }

  unlockedPasscodeKeys.add(subject.key);
  passcodeModal.close();
  rememberUnlockedProfileState();
  if (!isLoggedIn) {
    completeLogin(savedPasscode ? `${subject.label} unlocked.` : `${subject.label} passcode created.`);
    return;
  }

  render();
  if (!showPendingShiftNotificationPrompt()) {
    showToast(savedPasscode ? `${subject.label} unlocked.` : `${subject.label} passcode created.`);
  }
});
passcodeModal.addEventListener("cancel", (event) => {
  event.preventDefault();
  cancelPasscodeLogin();
});
eventModal.addEventListener("cancel", (event) => {
  event.preventDefault();
  requestEventFormClose();
});
profilePasscode.addEventListener("input", () => {
  const subject = passcodeSubjectForLevel();

  profilePasscode.value = profilePasscode.value.replace(/\D/g, "").slice(0, subject.digits);
});
document.querySelectorAll("[data-passcode-cancel]").forEach((button) => {
  button.addEventListener("click", cancelPasscodeLogin);
});
document.querySelectorAll("[data-event-close]").forEach((button) => {
  button.addEventListener("click", requestEventFormClose);
});
discardEventChangesButton.addEventListener("click", discardEventFormChanges);
saveEventBeforeCloseButton.addEventListener("click", saveEventFormBeforeClose);
deleteEventButton.addEventListener("click", () => {
  const event = events.find((item) => item.id === editingEventId);

  deleteEvent(event);
});
discardAvailabilityChangesButton.addEventListener("click", discardAvailabilityChanges);
saveAvailabilityBeforeCloseButton.addEventListener("click", saveAvailabilityChanges);
eventViewModal.addEventListener("click", (event) => {
  if (event.target === eventViewModal) {
    eventViewModal.close();
  }
});
eventViewPreviousButton.addEventListener("click", () => navigateEventView(-1));
eventViewNextButton.addEventListener("click", () => navigateEventView(1));
availabilityModal.addEventListener("click", (event) => {
  if (event.target === availabilityModal) {
    requestAvailabilityClose();
  }
});
availabilityModal.addEventListener("cancel", (event) => {
  event.preventDefault();
  requestAvailabilityClose();
});

document.querySelectorAll("[data-close]").forEach((button) => {
  button.addEventListener("click", () => {
    const dialog = button.closest("dialog");

    if (dialog === availabilityModal) {
      requestAvailabilityClose();
      return;
    }

    dialog.close();
  });
});

document.querySelectorAll(".nav-item").forEach((button) => {
  button.addEventListener("click", () => {
    setActiveView(button.dataset.view);
  });
});

reportMedia.addEventListener("change", renderReportAttachmentList);
reportForm.addEventListener("submit", (event) => {
  event.preventDefault();
  sendEquipmentReport();
});

profileForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (activeUserLevel !== "admin") {
    showToast("Only admin can manage profiles.");
    return;
  }

  const data = new FormData(profileForm);
  const profileId = Number(data.get("profileId"));
  const profileData = {
    name: String(data.get("name") || "").trim(),
    role: normaliseProfileRole(data.get("role")),
    location: String(data.get("location") || "").trim(),
    email: String(data.get("email") || "").trim(),
    whatsapp: String(data.get("whatsapp") || "").trim()
  };

  if (!profileData.name) {
    showToast("Add a profile name first.");
    return;
  }

  const changedAt = markAppDataChanged();
  const targetProfile = profileId ? freelancerById(profileId) : null;
  let successMessage = "";

  if (targetProfile) {
    Object.assign(targetProfile, profileData, { updatedAt: changedAt });
    activeProfileRole = profileData.role;
    successMessage = `${profileData.name}'s profile has been updated.`;
  } else {
    freelancers.push({
      id: nextFreelancerId(),
      status: "available",
      unavailableDates: [],
      amUnavailableDates: [],
      updatedAt: changedAt,
      ...profileData
    });
    activeProfileRole = profileData.role;
    successMessage = `${profileData.name}'s profile has been created.`;
  }

  syncStaffProfileSelections();
  resetProfileForm();
  renderAvailabilityOptions();
  renderTechnicianProfileOptions();
  refreshRoleFreelancerOptions();
  render();
  await persistAppStateWithConfirmation(successMessage, `${profileData.name}'s profile was saved on this device`);
});

selfProfilePhoto.addEventListener("change", () => {
  const [file] = selfProfilePhoto.files || [];

  if (!file) {
    clearSelfProfilePhotoDraft();
    renderSelfProfilePhoto(activeSelfProfile());
    return;
  }

  if (!file.type.startsWith("image/")) {
    clearSelfProfilePhotoDraft();
    showToast("Choose an image file for your profile picture.");
    return;
  }

  const reader = new FileReader();
  reader.addEventListener("load", () => {
    setProfilePhotoCropSource(file, String(reader.result || ""));
  });
  reader.readAsDataURL(file);
});

profilePhotoScale.addEventListener("input", () => {
  if (!selfProfilePhotoCropState) {
    return;
  }

  selfProfilePhotoCropState.zoom = Number(profilePhotoScale.value) || 1;
  renderProfilePhotoFrame();
  updateCroppedProfilePhotoDraft();
});

profilePhotoReset.addEventListener("click", resetProfilePhotoCrop);

profilePhotoFrame.addEventListener("pointerdown", (event) => {
  if (!selfProfilePhotoCropState?.loaded) {
    return;
  }

  profilePhotoFrame.setPointerCapture(event.pointerId);
  selfProfilePhotoCropState.drag = {
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    offsetX: selfProfilePhotoCropState.offsetX,
    offsetY: selfProfilePhotoCropState.offsetY
  };
});

profilePhotoFrame.addEventListener("pointermove", (event) => {
  const drag = selfProfilePhotoCropState?.drag;

  if (!drag || drag.pointerId !== event.pointerId) {
    return;
  }

  selfProfilePhotoCropState.offsetX = drag.offsetX + event.clientX - drag.startX;
  selfProfilePhotoCropState.offsetY = drag.offsetY + event.clientY - drag.startY;
  renderProfilePhotoFrame();
  updateCroppedProfilePhotoDraft();
});

function finishProfilePhotoDrag(event) {
  const drag = selfProfilePhotoCropState?.drag;

  if (!drag || drag.pointerId !== event.pointerId) {
    return;
  }

  selfProfilePhotoCropState.drag = null;
  updateCroppedProfilePhotoDraft();
}

profilePhotoFrame.addEventListener("pointerup", finishProfilePhotoDrag);
profilePhotoFrame.addEventListener("pointercancel", finishProfilePhotoDrag);

selfProfileForm.addEventListener("submit", (event) => {
  event.preventDefault();
  saveSelfProfile();
});

selfProfileForm.elements.newPasscode.addEventListener("input", () => {
  const digits = passcodeSubjectForLevel().digits;
  selfProfileForm.elements.newPasscode.value = selfProfileForm.elements.newPasscode.value.replace(/\D/g, "").slice(0, digits);
});

selfProfileForm.elements.confirmPasscode.addEventListener("input", () => {
  const digits = passcodeSubjectForLevel().digits;
  selfProfileForm.elements.confirmPasscode.value = selfProfileForm.elements.confirmPasscode.value.replace(/\D/g, "").slice(0, digits);
});

cancelProfileEdit.addEventListener("click", resetProfileForm);

profileList.addEventListener("click", (event) => {
  const roleButton = event.target.closest("[data-profile-role]");
  const editButton = event.target.closest("[data-edit-profile]");
  const resetPasscodeButton = event.target.closest("[data-reset-profile-passcode]");
  const deleteButton = event.target.closest("[data-delete-profile]");

  if (roleButton) {
    activeProfileRole = roleButton.dataset.profileRole;
    renderProfiles();
    return;
  }

  if (editButton) {
    editProfile(Number(editButton.dataset.editProfile));
  }

  if (resetPasscodeButton) {
    resetProfilePasscode(Number(resetPasscodeButton.dataset.resetProfilePasscode));
  }

  if (deleteButton) {
    deleteProfile(Number(deleteButton.dataset.deleteProfile));
  }
});

roleFilter.addEventListener("change", renderCrew);
availabilityPerson.addEventListener("change", () => {
  selectedAvailabilityPersonId = Number(availabilityPerson.value);
  availabilityMonthOffset = 0;
  beginAvailabilityDraft();
  renderAvailabilityPicker();
});
availabilityPicker.addEventListener("change", (event) => {
  if (!["unavailableDate", "amUnavailableDate"].includes(event.target.name) || !event.target.checked) {
    return;
  }

  const card = event.target.closest(".date-checkbox");
  const otherName = event.target.name === "unavailableDate" ? "amUnavailableDate" : "unavailableDate";
  const otherInput = card?.querySelector(`input[name='${otherName}']`);

  if (otherInput) {
    otherInput.checked = false;
  }
});
previousAvailabilityMonth.addEventListener("click", () => {
  if (availabilityMonthOffset === 0) {
    return;
  }

  saveVisibleAvailabilityDates();
  availabilityMonthOffset -= 1;
  renderAvailabilityPicker();
});
nextAvailabilityMonth.addEventListener("click", () => {
  if (availabilityMonthOffset === maxAvailabilityMonthOffset) {
    return;
  }

  saveVisibleAvailabilityDates();
  availabilityMonthOffset += 1;
  renderAvailabilityPicker();
});

eventForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const isEditing = editingEventId !== null;
  const access = currentAccess();

  if (isEditing && !access.canEditEvents) {
    showToast("This user level cannot edit events.");
    return;
  }

  if (!isEditing && !access.canCreateEvents) {
    showToast("This user level cannot create events.");
    return;
  }

  const data = new FormData(eventForm);
  const selectedRoleInputs = [...roleAssignmentList.querySelectorAll("input[name='eventRole']:checked")];
  const roles = selectedRoleInputs.map((input) => input.value);
  const eventDate = data.get("date");
  const repeatPlan = repeatPlanForEvent(eventDate);

  if (!repeatPlan) {
    return;
  }

  const repeatDates = repeatPlan.dates;

  const roleAssignments = {};
  roles.forEach((role) => {
    const freelancerSelect = roleAssignmentList.querySelector(`select[name='roleFreelancer'][data-role="${role}"]`);
    const selectedFreelancer = freelancerSelect?.value ? freelancerById(freelancerSelect.value) : null;

    if (selectedFreelancer && availabilityForEvent(selectedFreelancer, eventFormAvailabilityContext(eventDate)) !== "unavailable") {
      roleAssignments[role] = selectedFreelancer.id;
    }
  });

  const crew = [...new Set(Object.values(roleAssignments))];
  const targetEvent = isEditing ? events.find((item) => item.id === editingEventId) : null;
  const uploadedDocs = selectedEventDocumentUploads();
  const eventData = {
    title: data.get("title"),
    date: eventDate,
    time: data.get("doorsTime"),
    loadInTime: data.get("loadInTime"),
    doorsTime: data.get("doorsTime"),
    endTime: data.get("endTime"),
    venue: data.get("venue"),
    promoterId: Number(data.get("promoterId")) || null,
    status: eventStatusValue(data.get("status")),
    roles,
    roleAssignments,
    crew,
    client: {
      name: data.get("clientName"),
      contact: data.get("clientContact"),
      guestNumbers: data.get("guestNumbers")
    },
    bar: {
      type: data.get("barType"),
      welcomeDrinks: data.get("welcomeDrinks") === "on",
      notes: data.get("barNotes")
    },
    food: {
      type: data.get("foodType"),
      dietaryRequirements: data.getAll("dietaryRequirements"),
      notes: data.get("foodNotes")
    },
    needs: {
      wristbands: data.get("needsWristbands") === "on",
      djSetup: data.get("needsDjSetup") === "on",
      microphones: data.get("needsMicrophones") === "on",
      playlist: data.get("needsPlaylist") === "on"
    },
    setTimes: data.get("setTimes"),
    notes: data.get("notes")
  };

  let updatedRepeatCount = 0;
  let editedCurrentOnly = false;

  if (targetEvent) {
    const repeatEditScope = repeatEditScopeForEvent(targetEvent);

    if (repeatEditScope === "future") {
      updatedRepeatCount = updateFutureRepeatEvents(targetEvent, eventData, uploadedDocs);
    } else {
      Object.assign(targetEvent, eventData);
      appendDocumentsToEvent(targetEvent, uploadedDocs);

      if (eventIsRepeating(targetEvent)) {
        targetEvent.repeatDetached = true;
        editedCurrentOnly = true;
      }
    }

    selectedEventId = targetEvent.id;
  } else {
    const timestamp = Date.now();
    const repeatSeriesId = repeatPlan.mode === "none" ? null : timestamp;
    const newEvent = {
      id: timestamp,
      docs: uploadedDocs.map(clonePlainData),
      ...repeatMetadataForPlan(repeatPlan, repeatSeriesId, eventDate, 0),
      ...eventData
    };
    const repeatedEvents = repeatDates.slice(1).map((date, index) => ({
      id: timestamp + index + 1,
      docs: uploadedDocs.map(clonePlainData),
      ...repeatMetadataForPlan(repeatPlan, repeatSeriesId, eventDate, index + 1),
      ...eventData,
      date,
      roles: [],
      roleAssignments: {},
      crew: []
    }));

    events.push(newEvent);
    events.push(...repeatedEvents);
    selectedEventId = newEvent.id;
  }

  calendarFocusDate = new Date(`${eventData.date}T12:00:00`);
  crewFocusDate = new Date(`${eventData.date}T12:00:00`);
  rotaFocusDate = new Date(`${eventData.date}T12:00:00`);
  eventForm.reset();
  clearPendingEventDocuments();
  updateEventTimeSelects();
  resetRepeatFields();
  resetRolePicker();
  editingEventId = null;
  eventModal.close();
  render();
  showToast(
    targetEvent
      ? `${eventData.title} updated${updatedRepeatCount ? ` across ${updatedRepeatCount} repeat booking${updatedRepeatCount === 1 ? "" : "s"}` : editedCurrentOnly ? " for this booking only" : ""}.`
      : `${eventData.title} created as ${eventStatusLabel(eventData.status)}${
          repeatPlan.indefinite
            ? ` and set to repeat indefinitely`
            : repeatDates.length > 1
              ? ` with ${repeatDates.length - 1} repeat date${repeatDates.length === 2 ? "" : "s"}`
              : ""
        }.`
  );
});

availabilityForm.addEventListener("submit", (event) => {
  event.preventDefault();
  saveAvailabilityChanges();
});

function initialiseApp() {
  registerAppInstallWorker();
  buildTimeOptions();
  applyTheme(readStoredTheme());
  loadPersistentAppState();
  updateEventTimeSelects();
  renderRoleAssignmentPicker();
  resetRolePicker();
  renderAvailabilityOptions();
  renderTechnicianProfileOptions();
  beginAvailabilityDraft();
  renderAvailabilityPicker();
  setUserLevel("admin");
  render();

  if (!openDashboardFromAcceptedCover() && !resumeStoredLogin()) {
    showLoginScreen();
  }

  appDataRemoteLoadPromise = loadRemoteAppState();
  loadWeatherForecast();
  loadTubeStatus();
  loadEmailInbox();
  syncAcceptedCoverRequests();
}

window.addEventListener("focus", () => syncAcceptedCoverRequests());
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) {
    syncAcceptedCoverRequests();
  }
});
window.setInterval(() => syncAcceptedCoverRequests(), 15000);

initialiseApp();
