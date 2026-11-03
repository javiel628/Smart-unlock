
(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);

  const form = $("checkForm");
  const imeiInput = $("imei");
  const logLines = $("logLines");
  const toastStack = $("toastStack");

  let requestCount = 128;
  let requestId = 82;

  // -------------------------------
  // TIME
  // -------------------------------

  const timeNow = () =>
    new Date().toLocaleTimeString([], {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });

  // -------------------------------
  // ACTIVITY LOGS
  // -------------------------------

  const addLog = (message, type = "info") => {
    const p = document.createElement("p");

    const time = document.createElement("time");
    time.textContent = timeNow();

    const tag = document.createElement("span");

    const labels = {
      info: "[INFO]",
      ok: "[READY]",
      warn: "[WAIT]",
      error: "[ERROR]"
    };

    tag.className = `log-${type}`;
    tag.textContent = labels[type] || "[INFO]";

    p.append(
      time,
      tag,
      document.createTextNode(message)
    );

    logLines.appendChild(p);

    logLines.scrollTop = logLines.scrollHeight;
  };

  // -------------------------------
  // STYLISH NOTIFICATIONS
  // -------------------------------

  const toast = (
    title,
    message,
    type = "info"
  ) => {
    const node = document.createElement("div");

    node.className =
      `toast ${
        type === "ok"
          ? "success-toast"
          : type === "error"
          ? "error-toast"
          : ""
      }`;

    const icon = document.createElement("span");

    icon.className = "toast-icon";

    icon.textContent =
      type === "ok"
        ? "✓"
        : type === "error"
        ? "!"
        : "✦";

    const body = document.createElement("div");

    const strong = document.createElement("b");
    strong.textContent = title;

    const small = document.createElement("small");
    small.textContent = message;

    body.append(strong, small);

    node.append(icon, body);

    toastStack.appendChild(node);

    window.setTimeout(() => {
      node.remove();
    }, 4300);
  };

  // -------------------------------
  // IMEI VALIDATION
  // -------------------------------

  const validImei = (value) => {
    return /^\d{15}$/.test(value) && luhn(value);
  };

  function luhn(value) {
    let sum = 0;

    for (let i = 0; i < value.length; i++) {
      let n = Number(
        value[value.length - 1 - i]
      );

      if (i % 2 === 1) {
        n *= 2;

        if (n > 9) {
          n -= 9;
        }
      }

      sum += n;
    }

    return sum % 10 === 0;
  }

  // -------------------------------
  // MASK IMEI
  // -------------------------------

  const maskImei = (value) => {
    return "•••••••••••" + value.slice(-4);
  };

  // -------------------------------
  // AUTOMATIC SESSION HISTORY
  // COMPLETED DEMO CHECKS ONLY
  // -------------------------------

  function addHistory(brand, imei) {
    const tbody = $("historyBody");

    const row = document.createElement("tr");

    const currentId =
      `#SU-${String(requestId++).padStart(4, "0")}`;

    const maskedImei = maskImei(imei);

    const values = [
      currentId,
      `${brand || "Unknown"} · Demo`,
      maskedImei,
      "Completed",
      timeNow()
    ];

    values.forEach((value, index) => {
      const td = document.createElement("td");

      if (index === 0) {
        const bold = document.createElement("b");

        bold.textContent = value;

        td.appendChild(bold);
      } else if (index === 3) {
        const status = document.createElement("span");

        status.className = "status-chip success";

        status.textContent = "Completed";

        td.appendChild(status);
      } else {
        td.textContent = value;
      }

      row.appendChild(td);
    });

    // Add newest completed entry at the top.
    tbody.prepend(row);

    // Keep the latest 10 entries visible.
    while (tbody.children.length > 10) {
      tbody.lastElementChild.remove();
    }
  }

  // -------------------------------
  // IMEI INPUT
  // -------------------------------

  imeiInput.addEventListener("input", () => {
    imeiInput.value = imeiInput.value
      .replace(/\D/g, "")
      .slice(0, 15);
  });

  // -------------------------------
  // PASTE IMEI
  // -------------------------------

  $("pasteBtn").addEventListener(
    "click",
    async () => {
      try {
        const text =
          await navigator.clipboard.readText();

        imeiInput.value = text
          .replace(/\D/g, "")
          .slice(0, 15);

        toast(
          "IMEI pasted",
          "Clipboard content inserted."
        );
      } catch {
        toast(
          "Clipboard unavailable",
          "Paste the IMEI manually.",
          "error"
        );
      }
    }
  );

  // -------------------------------
  // DEMO CHECK FORM
  // -------------------------------

  form.addEventListener(
    "submit",
    (event) => {
      event.preventDefault();

      const imei = imeiInput.value.trim();

      const brand = $("brand").value;

      const service = $("service").value;

      // Validate IMEI.
      if (!validImei(imei)) {
        addLog(
          "IMEI validation failed. Enter a valid 15-digit IMEI.",
          "error"
        );

        toast(
          "Invalid IMEI",
          "Check the 15 digits and try again.",
          "error"
        );

        imeiInput.focus();

        return;
      }

      // Validate brand.
      if (!brand) {
        toast(
          "Choose a brand",
          "Select the phone brand before continuing.",
          "error"
        );

        $("brand").focus();

        return;
      }

      const button =
        form.querySelector(".primary-btn");

      button.disabled = true;

      button.innerHTML =
        '<span>◌</span> RUNNING DEMO CHECK <b>…</b>';

      $("resultCard").classList.add("hidden");

      requestCount++;

      $("requestCount").textContent =
        requestCount.toLocaleString();

      addLog(
        `Starting ${service.toLowerCase()} for ${brand} device.`,
        "info"
      );

      toast(
        "Request started",
        "SMART UNLOCK is running a local demo."
      );

      // Demo workflow.
      const messages = [
        [
          "Connecting to demo service...",
          "info"
        ],
        [
          "Checking IMEI format and checksum...",
          "info"
        ],
        [
          "Device information request simulated.",
          "warn"
        ],
        [
          "Demo workflow finished. No phone was unlocked or modified.",
          "ok"
        ]
      ];

      messages.forEach(
        ([message, type], index) => {
          window.setTimeout(() => {
            addLog(message, type);

            // Finish demo.
            if (
              index === messages.length - 1
            ) {
              button.disabled = false;

              button.innerHTML =
                '<span>▶</span> RUN DEMO CHECK <b>→</b>';

              $("resultTitle").textContent =
                "Demo check completed";

              $("resultSub").textContent =
                "No device was unlocked or changed.";

              $("resultImei").textContent = imei;

              $("resultCard")
                .classList.remove("hidden");

              // Automatically add completed history.
              addHistory(brand, imei);

              toast(
                "Demo completed",
                `IMEI ${maskImei(imei)} — preview only.`,
                "ok"
              );
            }
          }, (index + 1) * 750);
        }
      );
    }
  );

  // -------------------------------
  // COPY RESULT
  // -------------------------------

  $("copyResult").addEventListener(
    "click",
    async () => {
      const value =
        `SMART UNLOCK — DEMO RESULT\n` +
        `IMEI: ${$("resultImei").textContent}\n` +
        `Status: Demo check completed\n` +
        `No device was unlocked or modified.`;

      try {
        await navigator.clipboard.writeText(value);

        toast(
          "Result copied",
          "Demo report copied to clipboard.",
          "ok"
        );
      } catch {
        toast(
          "Copy unavailable",
          "Copy the report manually.",
          "error"
        );
      }
    }
  );

  // -------------------------------
  // COPY LOGS
  // -------------------------------

  $("copyLogs").addEventListener(
    "click",
    async () => {
      const value = [
        ...logLines.querySelectorAll("p")
      ]
        .map((p) => p.innerText)
        .join("\n");

      try {
        await navigator.clipboard.writeText(value);

        toast(
          "Logs copied",
          "Console output copied.",
          "ok"
        );
      } catch {
        toast(
          "Copy unavailable",
          "Clipboard access is unavailable.",
          "error"
        );
      }
    }
  );

  // -------------------------------
  // CLEAR LOGS
  // -------------------------------

  $("clearLogs").addEventListener(
    "click",
    () => {
      logLines.replaceChildren();

      addLog(
        "Console cleared. Waiting for input...",
        "info"
      );

      toast(
        "Logs cleared",
        "The local console has been cleared."
      );
    }
  );

  // -------------------------------
  // NOTIFICATION PANEL
  // -------------------------------

  $("notifyBtn").addEventListener(
    "click",
    () => {
      $("notificationPop")
        .classList.toggle("hidden");
    }
  );

  // -------------------------------
  // MOBILE NAVIGATION
  // -------------------------------

  $("menuBtn").addEventListener(
    "click",
    () => {
      document
        .querySelector(".sidebar")
        .classList.toggle("open");
    }
  );

  document.addEventListener(
    "click",
    (event) => {
      if (
        event.target.closest(".nav-item") &&
        window.innerWidth <= 700
      ) {
        document
          .querySelector(".sidebar")
          .classList.remove("open");
      }
    }
  );

  // -------------------------------
  // INITIALIZATION
  // -------------------------------

  addLog(
    "SMART UNLOCK initialized.",
    "ok"
  );

  addLog(
    "Demo mode active. No external service connected.",
    "info"
  );

})();
