"use strict";

const $ = (selector) => document.querySelector(selector);

const form = $("#requestForm");
const brandInput = $("#brand");
const modelInput = $("#model");
const imeiInput = $("#imei");
const serviceInput = $("#service");
const submitBtn = $("#submitBtn");
const logsContainer = $("#logsContainer");
const historyBody = $("#historyBody");
const logStatus = $("#logStatus");
const toast = $("#toast");

/* Sidebar elements */
const sidebar = $(".sidebar");
const sidebarToggle = $("#sidebarToggle");
const menuBtn = $("#menuBtn");

/* Request state */
let requestCounter = 0;
let activeRequests = 0;
let completedRequests = 0;
let failedRequests = 0;
let historyRecords = [];
let currentRequest = null;
let toastTimer = null;

/* --------------------------------
   SIDEBAR
--------------------------------- */

function openSidebar() {
  if (!sidebar) return;

  sidebar.classList.add("open");
  sidebar.classList.remove("closed");

  document.body.classList.add("sidebar-open");

  if (sidebarToggle) {
    sidebarToggle.setAttribute("aria-expanded", "true");
  }

  if (menuBtn) {
    menuBtn.setAttribute("aria-expanded", "true");
  }
}

function closeSidebar() {
  if (!sidebar) return;

  sidebar.classList.remove("open");
  sidebar.classList.add("closed");

  document.body.classList.remove("sidebar-open");

  if (sidebarToggle) {
    sidebarToggle.setAttribute("aria-expanded", "false");
  }

  if (menuBtn) {
    menuBtn.setAttribute("aria-expanded", "false");
  }
}

function toggleSidebar() {
  if (!sidebar) return;

  if (sidebar.classList.contains("open")) {
    closeSidebar();
  } else {
    openSidebar();
  }
}

/* Sidebar toggle button */
sidebarToggle?.addEventListener("click", (event) => {
  event.preventDefault();
  event.stopPropagation();
  toggleSidebar();
});

/* Menu button */
menuBtn?.addEventListener("click", (event) => {
  event.preventDefault();
  event.stopPropagation();
  toggleSidebar();
});

/* Close sidebar when clicking outside on mobile */
document.addEventListener("click", (event) => {
  if (!sidebar || window.innerWidth > 768) return;

  const clickedSidebar = sidebar.contains(event.target);
  const clickedToggle = sidebarToggle?.contains(event.target);
  const clickedMenu = menuBtn?.contains(event.target);

  if (
    sidebar.classList.contains("open") &&
    !clickedSidebar &&
    !clickedToggle &&
    !clickedMenu
  ) {
    closeSidebar();
  }
});

/* Close sidebar using Escape */
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeSidebar();
  }
});

/* Reset sidebar state when switching between mobile and desktop */
window.addEventListener("resize", () => {
  if (window.innerWidth > 768) {
    sidebar?.classList.remove("closed");
    document.body.classList.remove("sidebar-open");

    if (sidebarToggle) {
      sidebarToggle.setAttribute("aria-expanded", "false");
    }

    if (menuBtn) {
      menuBtn.setAttribute("aria-expanded", "false");
    }
  } else if (!sidebar?.classList.contains("open")) {
    sidebar?.classList.add("closed");
  }
});

/* --------------------------------
   TIME AND DATE
--------------------------------- */

function getTime() {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
}

function getDate() {
  return new Date().toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

/* --------------------------------
   TOAST NOTIFICATIONS
--------------------------------- */

function showToast(message) {
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

/* --------------------------------
   ACTIVITY LOGS
--------------------------------- */

function addLog(message, type = "") {
  if (!logsContainer) return;

  const emptyState = logsContainer.querySelector(".empty-state");

  if (emptyState) {
    emptyState.remove();
  }

  const line = document.createElement("div");
  line.className = `log-line ${type}`;

  const time = document.createElement("span");
  time.className = "log-time";
  time.textContent = getTime();

  const text = document.createElement("span");
  text.className = "log-message";
  text.textContent = message;

  line.append(time, text);
  logsContainer.appendChild(line);

  logsContainer.scrollTop = logsContainer.scrollHeight;
}

function clearLogs() {
  if (!logsContainer) return;

  logsContainer.innerHTML = `
    <div class="empty-state">
      <div class="empty-icon">⌘</div>
      <strong>No activity yet</strong>
      <p>Logs will appear here when you start a demo request.</p>
    </div>
  `;

  if (logStatus) {
    logStatus.textContent = "Waiting for request";
  }
}

/* --------------------------------
   DASHBOARD STATISTICS
--------------------------------- */

function updateStats() {
  const totalRequests = $("#totalRequests");
  const completedRequestsElement = $("#completedRequests");
  const pendingRequestsElement = $("#pendingRequests");
  const failedRequestsElement = $("#failedRequests");
  const historyCount = $("#historyCount");

  if (totalRequests) {
    totalRequests.textContent = historyRecords.length + activeRequests;
  }

  if (completedRequestsElement) {
    completedRequestsElement.textContent = completedRequests;
  }

  if (pendingRequestsElement) {
    pendingRequestsElement.textContent = activeRequests;
  }

  if (failedRequestsElement) {
    failedRequestsElement.textContent = failedRequests;
  }

  if (historyCount) {
    historyCount.textContent =
      `${historyRecords.length} record${historyRecords.length === 1 ? "" : "s"}`;
  }
}

/* --------------------------------
   IMEI VALIDATION
--------------------------------- */

function maskImei(imei) {
  if (!imei || imei.length < 9) {
    return "•••••••••••••••";
  }

  return `${imei.slice(0, 4)}••••••${imei.slice(-5)}`;
}

function isValidImei(imei) {
  if (!/^\d{15}$/.test(imei)) {
    return false;
  }

  let sum = 0;

  for (let i = 0; i < imei.length; i++) {
    let digit = Number(imei[i]);

    if (i % 2 === 1) {
      digit *= 2;

      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
  }

  return sum % 10 === 0;
}

/* --------------------------------
   REQUEST ID
--------------------------------- */

function makeRequestId() {
  requestCounter++;

  const datePart = Date.now().toString().slice(-6);

  return `SU-${datePart}-${String(requestCounter).padStart(3, "0")}`;
}

/* --------------------------------
   REQUEST HISTORY
--------------------------------- */

function renderHistory() {
  if (!historyBody) return;

  if (!historyRecords.length) {
    historyBody.innerHTML = `
      <tr class="empty-row">
        <td colspan="5">No requests have been submitted.</td>
      </tr>
    `;

    updateStats();
    return;
  }

  historyBody.innerHTML = "";

  historyRecords.forEach((record) => {
    const row = document.createElement("tr");

    const values = [
      record.id,
      record.device,
      record.imei,
      record.date
    ];

    values.forEach((value, index) => {
      const cell = document.createElement("td");
      cell.textContent = value;

      if (index === 0) {
        cell.className = "request-id";
      }

      row.appendChild(cell);
    });

    const statusCell = document.createElement("td");
    const badge = document.createElement("span");

    badge.className = "status-badge";
    badge.textContent = record.status;

    statusCell.appendChild(badge);
    row.appendChild(statusCell);

    historyBody.appendChild(row);
  });

  updateStats();
}

function addHistory(request, status) {
  historyRecords.unshift({
    id: request.id,
    device: `${request.brand} ${request.model}`,
    imei: maskImei(request.imei),
    date: getDate(),
    status
  });

  historyRecords = historyRecords.slice(0, 10);

  renderHistory();
}

/* --------------------------------
   DEMO REQUEST PROCESSING
--------------------------------- */

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runDemo(request) {
  const stages = [
    ["Request accepted by demo interface", "success"],
    ["Validating submitted device information", ""],
    ["Checking IMEI format and checksum", ""],
    ["Preparing simulated service session", ""],
    ["Running local eligibility simulation", ""],
    ["Generating demo service report", ""]
  ];

  if (logStatus) {
    logStatus.textContent = `Processing ${request.id}`;
  }

  for (let i = 0; i < stages.length; i++) {
    const [message, type] = stages[i];

    addLog(`[${request.id}] ${message}`, type);

    await sleep(900 + Math.random() * 500);
  }

  addLog(
    `[${request.id}] Demo completed — no device was unlocked or changed.`,
    "warning"
  );

  if (logStatus) {
    logStatus.textContent = "Demo request completed";
  }

  activeRequests = Math.max(0, activeRequests - 1);
  completedRequests++;

  addHistory(request, "DEMO COMPLETE");
  updateStats();

  if (submitBtn) {
    submitBtn.disabled = false;
    submitBtn.innerHTML = "<span>Start Request</span><span>→</span>";
  }

  currentRequest = null;

  showToast("Demo request completed.");
}

/* --------------------------------
   FORM SUBMISSION
--------------------------------- */

form?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const brand = brandInput?.value.trim() || "";
  const model = modelInput?.value.trim() || "";
  const imei = imeiInput?.value.trim() || "";
  const service = serviceInput?.value || "";

  if (!brand || !model || !imei) {
    showToast("Please complete all required fields.");
    return;
  }

  if (!isValidImei(imei)) {
    showToast("Enter a valid 15-digit IMEI.");

    addLog(
      "Request rejected: IMEI format/checksum validation failed.",
      "error"
    );

    return;
  }

  if (submitBtn?.disabled) {
    return;
  }

  const request = {
    id: makeRequestId(),
    brand,
    model,
    imei,
    service
  };

  currentRequest = request;

  activeRequests++;
  updateStats();

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML =
      "<span>Processing Demo...</span><span>⌁</span>";
  }

  addLog(`New demo request created: ${request.id}`, "success");
  addLog(`Device: ${brand} ${model}`);
  addLog(`Service: ${service}`);
  addLog(`IMEI: ${maskImei(imei)}`);

  addLog(
    "Simulation started. No external service is contacted.",
    "warning"
  );

  await runDemo(request);
});

/* --------------------------------
   CLEAR LOGS BUTTON
--------------------------------- */

$("#clearLogs")?.addEventListener("click", () => {
  clearLogs();
  showToast("Activity logs cleared.");
});

/* --------------------------------
   PASTE IMEI BUTTON
--------------------------------- */

$("#pasteBtn")?.addEventListener("click", async () => {
  try {
    const text = await navigator.clipboard.readText();

    if (imeiInput) {
      imeiInput.value = text.replace(/\D/g, "").slice(0, 15);
    }

    showToast("IMEI pasted.");
  } catch {
    showToast("Clipboard access unavailable. Paste manually.");
  }
});

/* --------------------------------
   IMEI INPUT FILTER
--------------------------------- */

imeiInput?.addEventListener("input", () => {
  imeiInput.value = imeiInput.value
    .replace(/\D/g, "")
    .slice(0, 15);
});

/* --------------------------------
   NAVIGATION ITEMS
--------------------------------- */

document.querySelectorAll(".nav-item").forEach((item) => {
  item.addEventListener("click", () => {
    document.querySelectorAll(".nav-item").forEach((nav) => {
      nav.classList.remove("active");
    });

    item.classList.add("active");

    closeSidebar();
  });
});

/* --------------------------------
   INITIALIZE DASHBOARD
--------------------------------- */

closeSidebar();
updateStats();
