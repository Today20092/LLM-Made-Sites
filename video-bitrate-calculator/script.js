(function () {
  const profiles = new Map(); // id -> { bitrate, name }

  const $ = (sel) => document.querySelector(sel);
  const hoursEl = $("#hours");
  const minutesEl = $("#minutes");
  const secondsEl = $("#seconds");
  const baselineBitrateEl = $("#baselineBitrate");
  const costPerTBEl = $("#costPerTB");
  const container = $("#profilesContainer");
  const barChart = $("#barChart");
  const uploadTable = $("#uploadTable");
  const profileCountEl = $("#profileCount");
  const totalDurationEl = $("#totalDuration");
  const availableStorageEl = $("#availableStorage");
  const capacityResults = $("#capacityResults");
  const customSpeedEl = $("#customSpeed");
  const customSpeedHeader = $("#customSpeedHeader");

  // ===== Theme =====
  const themeToggle = $("#themeToggle");
  const iconSun = $("#iconSun");
  const iconMoon = $("#iconMoon");

  function applyTheme(theme) {
    if (theme === "light") {
      document.body.classList.add("light-theme");
      iconSun.style.display = "none";
      iconMoon.style.display = "block";
    } else {
      document.body.classList.remove("light-theme");
      iconSun.style.display = "block";
      iconMoon.style.display = "none";
    }
    localStorage.setItem("vbc-theme", theme);
  }

  themeToggle.addEventListener("click", () => {
    const current = document.body.classList.contains("light-theme") ? "light" : "dark";
    applyTheme(current === "light" ? "dark" : "light");
  });

  applyTheme(localStorage.getItem("vbc-theme") || "dark");

  // ===== Presets =====
  const presetBtn = $("#presetBtn");
  const presetMenu = $("#presetMenu");

  presetBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    const isHidden = presetMenu.style.display === "none" || presetMenu.style.display === "";
    presetMenu.style.display = isHidden ? "block" : "none";
  });

  document.addEventListener("click", (e) => {
    if (!presetMenu.contains(e.target) && e.target !== presetBtn) {
      presetMenu.style.display = "none";
    }
  });

  presetMenu.querySelectorAll(".preset-item").forEach((item) => {
    item.addEventListener("click", () => {
      const bitrate = parseFloat(item.dataset.bitrate);
      const name = item.dataset.name;
      addProfile(bitrate, name);
      presetMenu.style.display = "none";
    });
  });

  // Hide preset menu initially (don't rely on Tailwind hidden class)
  presetMenu.style.display = "none";

  // ===== Helpers =====
  function getNextProfileNumber() {
    // Find the lowest available number starting from 1
    const usedNumbers = new Set();
    profiles.forEach((p) => {
      const match = p.name.match(/^Profile #(\d+)$/);
      if (match) usedNumbers.add(parseInt(match[1]));
    });
    let n = 1;
    while (usedNumbers.has(n)) n++;
    return n;
  }

  function getNextId() {
    // Find lowest unused integer id starting from 1
    let id = 1;
    while (profiles.has(id)) id++;
    return id;
  }

  function getTotalSeconds() {
    const h = Math.max(0, parseInt(hoursEl.value) || 0);
    const m = Math.max(0, parseInt(minutesEl.value) || 0);
    const s = Math.max(0, parseInt(secondsEl.value) || 0);
    return h * 3600 + m * 60 + s;
  }

  function fileSizeGB(bitrateMbps, seconds) {
    return (bitrateMbps * 1e6 * seconds) / (8 * 1e9);
  }

  function formatSize(gb) {
    if (gb >= 1000) return (gb / 1000).toFixed(2) + " TB";
    if (gb >= 1) return gb.toFixed(2) + " GB";
    return (gb * 1000).toFixed(1) + " MB";
  }

  function formatDuration(totalSec) {
    if (totalSec < 1) return "<1s";
    const d = Math.floor(totalSec / 86400);
    const h = Math.floor((totalSec % 86400) / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = Math.floor(totalSec % 60);
    let parts = [];
    if (d > 0) parts.push(d + "d");
    if (h > 0) parts.push(h + "h");
    if (m > 0) parts.push(m + "m");
    if (s > 0 || parts.length === 0) parts.push(s + "s");
    return parts.join(" ");
  }

  function formatDurationShort(totalSec) {
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = Math.floor(totalSec % 60);
    let parts = [];
    if (h > 0) parts.push(h + "h");
    if (m > 0) parts.push(m + "m");
    if (s > 0 && h === 0) parts.push(s + "s");
    return parts.join(" ") || "0s";
  }

  function uploadSeconds(sizeGB, speedMbps) {
    return (sizeGB * 8 * 1e9) / (speedMbps * 1e6);
  }

  // ===== Profiles =====
  function createProfileCard(id, bitrate, name) {
    profiles.set(id, { bitrate, name });

    const card = document.createElement("div");
    card.className = "card profile-card";
    card.dataset.id = id;
    card.innerHTML = `
      <button class="remove-btn" aria-label="Remove profile" title="Remove">&times;</button>
      <input type="text" class="profile-name-input mb-3" value="${name}" aria-label="Profile name">
      <div class="mb-4">
        <label class="label">Bitrate (Mbps)</label>
        <input type="number" class="input-field profile-bitrate" value="${bitrate}" min="1" step="1">
      </div>
      <div class="space-y-1">
        <div class="result-value profile-size">--</div>
        <div class="text-xs muted-text mt-1">Estimated file size</div>
        <div class="result-row mt-3">
          <span class="text-xs muted-text">vs Baseline</span>
          <span class="text-xs font-medium profile-diff">--</span>
        </div>
        <div class="result-row">
          <span class="text-xs muted-text">Storage Cost</span>
          <span class="text-xs font-medium profile-cost">--</span>
        </div>
      </div>
    `;

    card.querySelector(".remove-btn").addEventListener("click", () => {
      profiles.delete(id);
      card.remove();
      recalc();
      saveState();
    });

    card.querySelector(".profile-bitrate").addEventListener("input", (e) => {
      profiles.get(id).bitrate = Math.max(1, parseFloat(e.target.value) || 1);
      recalc();
      saveState();
    });

    card.querySelector(".profile-name-input").addEventListener("input", (e) => {
      profiles.get(id).name = e.target.value || "Profile #" + id;
      recalc();
      saveState();
    });

    container.appendChild(card);
  }

  function addProfile(defaultBitrate, defaultName) {
    const id = getNextId();
    const bitrate = defaultBitrate || 50;
    const name = defaultName || "Profile #" + getNextProfileNumber();
    createProfileCard(id, bitrate, name);
    recalc();
    saveState();
  }

  // ===== Recalc =====
  function recalc() {
    const seconds = getTotalSeconds();
    const baselineBitrate = Math.max(1, parseFloat(baselineBitrateEl.value) || 100);
    const costPerTB = Math.max(0, parseFloat(costPerTBEl.value) || 0);
    const baselineSize = fileSizeGB(baselineBitrate, seconds);
    const storageGB = Math.max(0, parseFloat(availableStorageEl.value) || 0);
    const customSpeed = Math.max(1, parseFloat(customSpeedEl.value) || 50);

    totalDurationEl.textContent = formatDurationShort(seconds);
    customSpeedHeader.textContent = "@ " + customSpeed + " Mbps";
    profileCountEl.textContent = profiles.size + " profile" + (profiles.size !== 1 ? "s" : "");

    const entries = [{ label: "Baseline (" + baselineBitrate + " Mbps)", size: baselineSize, isBaseline: true, bitrate: baselineBitrate }];

    container.querySelectorAll(".profile-card").forEach((card) => {
      const id = parseInt(card.dataset.id);
      const p = profiles.get(id);
      if (!p) return;
      const size = fileSizeGB(p.bitrate, seconds);
      const cost = (size / 1000) * costPerTB;
      const diffPercent = baselineSize > 0 ? ((size - baselineSize) / baselineSize) * 100 : 0;
      const diffSign = diffPercent >= 0 ? "+" : "";

      card.querySelector(".profile-size").textContent = formatSize(size);
      card.querySelector(".profile-diff").textContent = diffSign + diffPercent.toFixed(1) + "%";
      card.querySelector(".profile-diff").style.color = diffPercent <= 0 ? "#34d399" : "#f87171";
      card.querySelector(".profile-cost").textContent = "$" + cost.toFixed(2);

      entries.push({ label: p.name + " (" + p.bitrate + " Mbps)", size, isBaseline: false, bitrate: p.bitrate });
    });

    // Bar chart
    const maxSize = Math.max(...entries.map((e) => e.size), 0.001);
    barChart.innerHTML = entries
      .map((e) => {
        const pct = Math.max(1, (e.size / maxSize) * 100);
        const cls = e.isBaseline ? "baseline" : "profile";
        return '<div class="bar-row"><div class="bar-label">' + e.label + '</div><div class="bar-track"><div class="bar-fill ' + cls + '" style="width: ' + pct + '%">' + formatSize(e.size) + "</div></div></div>";
      })
      .join("");

    // Upload table
    const speeds = [20, 100, 1000, 10000, customSpeed];
    uploadTable.innerHTML = entries
      .map((e) => {
        const cells = speeds.map((sp) => "<td>" + formatDuration(uploadSeconds(e.size, sp)) + "</td>").join("");
        return "<tr><td>" + e.label + "</td><td>" + formatSize(e.size) + "</td>" + cells + "</tr>";
      })
      .join("");

    // Capacity
    capacityResults.innerHTML = entries
      .map((e) => {
        const recSec = e.bitrate > 0 ? (storageGB * 8 * 1e9) / (e.bitrate * 1e6) : 0;
        return '<div class="capacity-row"><span class="cap-label">' + e.label + '</span><span class="cap-value">' + formatDuration(recSec) + "</span></div>";
      })
      .join("");
  }

  // ===== Persistence =====
  function saveState() {
    const state = {
      hours: hoursEl.value,
      minutes: minutesEl.value,
      seconds: secondsEl.value,
      baselineBitrate: baselineBitrateEl.value,
      costPerTB: costPerTBEl.value,
      availableStorage: availableStorageEl.value,
      customSpeed: customSpeedEl.value,
      profiles: Array.from(profiles.entries()).map(([id, p]) => ({ id, bitrate: p.bitrate, name: p.name })),
    };
    localStorage.setItem("vbc-state", JSON.stringify(state));
  }

  function loadState() {
    const raw = localStorage.getItem("vbc-state");
    if (!raw) return false;
    try {
      const state = JSON.parse(raw);
      hoursEl.value = state.hours ?? 0;
      minutesEl.value = state.minutes ?? 10;
      secondsEl.value = state.seconds ?? 0;
      baselineBitrateEl.value = state.baselineBitrate ?? 100;
      costPerTBEl.value = state.costPerTB ?? 20;
      availableStorageEl.value = state.availableStorage ?? 500;
      customSpeedEl.value = state.customSpeed ?? 50;
      if (state.profiles && state.profiles.length > 0) {
        state.profiles.forEach((p) => {
          createProfileCard(p.id, p.bitrate, p.name);
        });
        return true;
      }
    } catch (e) {
      // ignore
    }
    return false;
  }

  // ===== Events =====
  [hoursEl, minutesEl, secondsEl, baselineBitrateEl, costPerTBEl, availableStorageEl, customSpeedEl].forEach((el) => {
    el.addEventListener("input", () => {
      recalc();
      saveState();
    });
  });

  $("#addProfile").addEventListener("click", () => addProfile());

  // ===== Init =====
  const restored = loadState();
  if (!restored) {
    addProfile(50);
  }
  recalc();
})();
