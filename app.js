(() => {
  const $ = (id) => document.getElementById(id);
  const form = $("checkForm"), imeiInput = $("imei"), logLines = $("logLines");
  const toastStack = $("toastStack");
  let requestCount = 128, requestId = 82;

  const timeNow = () => new Date().toLocaleTimeString([], {hour12:false,hour:"2-digit",minute:"2-digit",second:"2-digit"});
  const addLog = (message, type = "info") => {
    const p = document.createElement("p");
    const time = document.createElement("time"); time.textContent = timeNow();
    const tag = document.createElement("span"); tag.className = `log-${type}`; tag.textContent = type === "ok" ? "[READY]" : type === "warn" ? "[WAIT]" : type === "error" ? "[ERROR]" : "[INFO]";
    p.append(time, tag, document.createTextNode(message));
    logLines.appendChild(p); logLines.scrollTop = logLines.scrollHeight;
  };
  const toast = (title, message, type = "info") => {
    const node = document.createElement("div"); node.className = `toast ${type === "ok" ? "success-toast" : type === "error" ? "error-toast" : ""}`;
    const icon = document.createElement("span"); icon.className = "toast-icon"; icon.textContent = type === "ok" ? "✓" : type === "error" ? "!" : "✦";
    const body = document.createElement("div"), strong = document.createElement("b"), small = document.createElement("small");
    strong.textContent = title; small.textContent = message; body.append(strong, small); node.append(icon, body); toastStack.appendChild(node);
    window.setTimeout(() => node.remove(), 4300);
  };
  const validImei = (value) => /^\d{15}$/.test(value) && luhn(value);
  function luhn(value) {
    let sum = 0;
    for (let i = 0; i < value.length; i++) {
      let n = Number(value[value.length - 1 - i]);
      if (i % 2 === 1) { n *= 2; if (n > 9) n -= 9; }
      sum += n;
    }
    return sum % 10 === 0;
  }
  const maskImei = (value) => "•••••••••••" + value.slice(-4);
  function addHistory(brand, imei, status) {
    const tbody = $("historyBody"), row = document.createElement("tr");
    const values = [`#SU-${String(requestId++).padStart(4,"0")}`, `${brand || "Unknown"} · Demo`, maskImei(imei), status, timeNow()];
    values.forEach((value, index) => {
      const td = document.createElement("td");
      if (index === 0) { const b = document.createElement("b"); b.textContent = value; td.appendChild(b); }
      else if (index === 3) { const chip = document.createElement("span"); chip.className = "status-chip " + (status === "Completed" ? "success" : "failed"); chip.textContent = value; td.appendChild(chip); }
      else td.textContent = value;
      row.appendChild(td);
    });
    tbody.prepend(row);
    while (tbody.children.length > 5) tbody.lastElementChild.remove();
  }

  imeiInput.addEventListener("input", () => { imeiInput.value = imeiInput.value.replace(/\D/g, "").slice(0,15); });
  $("pasteBtn").addEventListener("click", async () => {
    try { const text = await navigator.clipboard.readText(); imeiInput.value = text.replace(/\D/g,"").slice(0,15); toast("IMEI pasted", "Clipboard content inserted."); }
    catch { toast("Clipboard unavailable", "Paste the IMEI into the field manually.", "error"); }
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const imei = imeiInput.value.trim(), brand = $("brand").value, service = $("service").value;
    if (!validImei(imei)) { addLog("IMEI validation failed — enter a valid 15-digit IMEI.", "error"); toast("Invalid IMEI", "Please check the 15 digits and try again.", "error"); imeiInput.focus(); return; }
    if (!brand) { toast("Choose a brand", "Select the device brand before running the demo.", "error"); $("brand").focus(); return; }

    const button = form.querySelector(".primary-btn"); button.disabled = true; button.innerHTML = '<span>◌</span> RUNNING DEMO CHECK <b>…</b>';
    $("resultCard").classList.add("hidden");
    requestCount++; $("requestCount").textContent = requestCount.toLocaleString();
    addLog(`Starting ${service.toLowerCase()} for ${brand} device.`, "info");
    toast("Request started", "SMART UNLOCK is running a local interface demo.");
    const messages = [
      ["Connecting to demo service...", "info"],
      ["Checking IMEI format and checksum...", "info"],
      ["Device information request simulated.", "warn"],
      ["Demo workflow finished. No phone was unlocked or modified.", "ok"]
    ];
    messages.forEach(([message,type], index) => window.setTimeout(() => {
      addLog(message, type);
      if (index === messages.length - 1) {
        button.disabled = false; button.innerHTML = '<span>▶</span> RUN DEMO CHECK <b>→</b>';
        $("resultTitle").textContent = "Demo check completed";
        $("resultSub").textContent = "No device was unlocked or changed.";
        $("resultImei").textContent = imei;
        $("resultCard").classList.remove("hidden");
        addHistory(brand, imei, "Completed");
        toast("Demo completed", `IMEI ${maskImei(imei)} — preview only.`, "ok");
      }
    }, (index + 1) * 750));
  });

  $("copyResult").addEventListener("click", async () => {
    const value = `SMART UNLOCK — DEMO RESULT\nIMEI: ${$("resultImei").textContent}\nStatus: Demo check completed\nNo device was unlocked or modified.`;
    try { await navigator.clipboard.writeText(value); toast("Result copied", "Demo report copied to clipboard.", "ok"); }
    catch { toast("Copy unavailable", "Select and copy the report manually.", "error"); }
  });
  $("copyLogs").addEventListener("click", async () => {
    const value = [...logLines.querySelectorAll("p")].map(p => p.innerText).join("\n");
    try { await navigator.clipboard.writeText(value); toast("Logs copied", "Console output copied to clipboard.", "ok"); }
    catch { toast("Copy unavailable", "Clipboard access is not available.", "error"); }
  });
  $("clearLogs").addEventListener("click", () => { logLines.replaceChildren(); addLog("Console cleared. Waiting for input...", "info"); toast("Logs cleared", "The local console has been cleared."); });
  $("notifyBtn").addEventListener("click", () => $("notificationPop").classList.toggle("hidden"));
  $("menuBtn").addEventListener("click", () => document.querySelector(".sidebar").classList.toggle("open"));
  document.addEventListener("click", (e) => { if (e.target.closest(".nav-item") && window.innerWidth <= 700) document.querySelector(".sidebar").classList.remove("open"); });
})();