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
const sidebar = document.querySelector(".sidebar");
const sidebarToggle = document.querySelector("#sidebarToggle");

sidebarToggle?.addEventListener("click", () => {
  sidebar?.classList.toggle("open");
});

let requestCounter = 0;
let activeRequests = 0;
let completedRequests = 0;
let failedRequests = 0;
let historyRecords = [];
let currentRequest = null;
let toastTimer = null;

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

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

function addLog(message, type = "") {
  const emptyState = logsContainer.querySelector(".empty-state");
  if (emptyState) emptyState.remove();

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
  logsContainer.innerHTML = `
    <div class="empty-state">
      <div class="empty-icon">⌘</div>
      <strong>No activity yet</strong>
      <p>Logs will appear here when you start a demo request.</p>
    </div>
  `;
  logStatus.textContent = "Waiting for request";
}

function updateStats() {
  $("#totalRequests").textContent = historyRecords.length + activeRequests;
  $("#completedRequests").textContent = completedRequests;
  $("#pendingRequests").textContent = activeRequests;
  $("#failedRequests").textContent = failedRequests;
  $("#historyCount").textContent =
    `${historyRecords.length} record${historyRecords.length === 1 ? "" : "s"}`;
}

function maskImei(imei) {
  return `${imei.slice(0, 4)}••••••${imei.slice(-5)}`;
}

function isValidImei(imei) {
  if (!/^\d{15}$/.test(imei)) return false;

  let sum = 0;

  for (let i = 0; i < imei.length; i++) {
    let digit = Number(imei[i]);

    if (i % 2 === 1) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }

    sum += digit;
  }

  return sum % 10 === 0;
}

function makeRequestId() {
  requestCounter++;
  const datePart = Date.now().toString().slice(-6);
  return `SU-${datePart}-${String(requestCounter).padStart(3, "0")}`;
}

function renderHistory() {
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

      if (index === 0) cell.className = "request-id";
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

  logStatus.textContent = `Processing ${request.id}`;

  for (let i = 0; i < stages.length; i++) {
    const [message, type] = stages[i];

    addLog(`[${request.id}] ${message}`, type);
    await sleep(900 + Math.random() * 500);
  }

  addLog(
    `[${request.id}] Demo completed — no device was unlocked or changed.`,
    "warning"
  );

  logStatus.textContent = "Demo request completed";
  activeRequests--;
  completedRequests++;

  addHistory(request, "DEMO COMPLETE");
  updateStats();

  submitBtn.disabled = false;
  submitBtn.innerHTML = "<span>Start Request</span><span>→</span>";

  showToast("Demo request completed.");
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const brand = brandInput.value.trim();
  const model = modelInput.value.trim();
  const imei = imeiInput.value.trim();
  const service = serviceInput.value;

  if (!brand || !model || !imei) {
    showToast("Please complete all required fields.");
    return;
  }

  if (!isValidImei(imei)) {
    showToast("Enter a valid 15-digit IMEI.");
    addLog("Request rejected: IMEI format/checksum validation failed.", "error");
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

  submitBtn.disabled = true;
  submitBtn.innerHTML = "<span>Processing Demo...</span><span>⌁</span>";

  addLog(`New demo request created: ${request.id}`, "success");
  addLog(`Device: ${brand} ${model}`);
  addLog(`Service: ${service}`);
  addLog(`IMEI: ${maskImei(imei)}`);
  addLog("Simulation started. No external service is contacted.", "warning");

  await runDemo(request);
});

$("#clearLogs").addEventListener("click", () => {
  clearLogs();
  showToast("Activity logs cleared.");
});

$("#pasteBtn").addEventListener("click", async () => {
  try {
    const text = await navigator.clipboard.readText();
    imeiInput.value = text.replace(/\D/g, "").slice(0, 15);
    showToast("IMEI pasted.");
  } catch {
    showToast("Clipboard access unavailable. Paste manually.");
  }
});

imeiInput.addEventListener("input", () => {
  imeiInput.value = imeiInput.value.replace(/\D/g, "").slice(0, 15);
});

$("#menuBtn").addEventListener("click", () => {
  $("#sidebar").classList.toggle("open");
});

document.querySelectorAll(".nav-item").forEach((item) => {
  item.addEventListener("click", () => {
    document.querySelectorAll(".nav-item").forEach((nav) => {
      nav.classList.remove("active");
    });

    item.classList.add("active");
    $("#sidebar").classList.remove("open");
  });
});

updateStats();
