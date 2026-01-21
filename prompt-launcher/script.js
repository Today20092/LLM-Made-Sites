/**
 * THEME (manual toggle only)
 */
(function initTheme() {
  const saved = localStorage.getItem("theme"); // "dark" | "light" | null
  if (saved === "dark") document.documentElement.classList.add("dark");
})();

document.addEventListener("DOMContentLoaded", () => {
  // --- Constants
  const STORAGE_KEY = "promptLauncher_state";
  const SAVE_DEBOUNCE_MS = 500;

  // --- Elements
  const themeToggle = document.getElementById("themeToggle");
  const sunIcon = document.getElementById("sunIcon");
  const moonIcon = document.getElementById("moonIcon");

  const titleInput = document.getElementById("titleInput");
  const tagsInput = document.getElementById("tagsInput");
  const toggleNotes = document.getElementById("toggleNotes");
  const notesWrap = document.getElementById("notesWrap");
  const notesInput = document.getElementById("notesInput");

  const promptInput = document.getElementById("promptInput");
  const charCount = document.getElementById("charCount");

  const varsSection = document.getElementById("varsSection");
  const varsList = document.getElementById("varsList");
  const resetVarsBtn = document.getElementById("resetVarsBtn");
  const filledPreview = document.getElementById("filledPreview");
  const missingVarsHint = document.getElementById("missingVarsHint");
  const toggleFilledPreview =
    document.getElementById("toggleFilledPreview");
  const filledPreviewWrapper = document.getElementById(
    "filledPreviewWrapper"
  );
  const previewChevron = document.getElementById("previewChevron");

  const copyFilledBtn = document.getElementById("copyFilledBtn");
  const shareBtn = document.getElementById("shareBtn");
  const clearBtn = document.getElementById("clearBtn");

  const chatbotButtons = document.getElementById("chatbotButtons");

  const toast = document.getElementById("toast");
  const toastText = document.getElementById("toastText");

  // Share modal
  const shareModal = document.getElementById("shareModal");
  const closeShareModal = document.getElementById("closeShareModal");
  const shareTabs = Array.from(document.querySelectorAll(".shareTab"));
  const sharePanels = Array.from(
    document.querySelectorAll(".sharePanel")
  );
  const includeVarsInLink = document.getElementById("includeVarsInLink");
  const includeMetaInLink = document.getElementById("includeMetaInLink");
  const canonicalizeInLink =
    document.getElementById("canonicalizeInLink");
  const shareLinkInput = document.getElementById("shareLinkInput");
  const copyLinkBtn = document.getElementById("copyLinkBtn");
  const nativeShareWrapper = document.getElementById(
    "nativeShareWrapper"
  );
  const nativeShareBtn = document.getElementById("nativeShareBtn");
  const shareFilledPreview =
    document.getElementById("shareFilledPreview");
  const shareTemplatePreview = document.getElementById(
    "shareTemplatePreview"
  );
  const shareMessagePreview = document.getElementById(
    "shareMessagePreview"
  );
  const copyFilledFromModalBtn = document.getElementById(
    "copyFilledFromModalBtn"
  );
  const copyTemplateBtn = document.getElementById("copyTemplateBtn");
  const copyMessageBtn = document.getElementById("copyMessageBtn");

  // Custom chatbot modal
  const customChatbotModal = document.getElementById("customChatbotModal");
  const closeCustomChatbotModal = document.getElementById(
    "closeCustomChatbotModal"
  );
  const customBotNameInput = document.getElementById("customBotNameInput");
  const customBotIconInput = document.getElementById("customBotIconInput");
  const customBotUrlInput = document.getElementById("customBotUrlInput");
  const customBotQueryParamCheck = document.getElementById(
    "customBotQueryParamCheck"
  );
  const addCustomBotBtn = document.getElementById("addCustomBotBtn");

  // Template library elements
  const templateLibraryBtn = document.getElementById("templateLibraryBtn");
  const templateLibraryModal = document.getElementById("templateLibraryModal");
  const closeTemplateLibrary = document.getElementById("closeTemplateLibrary");
  const templateList = document.getElementById("templateList");
  const saveCurrentTemplateBtn = document.getElementById(
    "saveCurrentTemplateBtn"
  );
  const exportTemplatesBtn = document.getElementById("exportTemplatesBtn");
  const importTemplatesBtn = document.getElementById("importTemplatesBtn");
  const importTemplatesInput = document.getElementById("importTemplatesInput");

  // Wire auto-resize for primary textareas
  const _autoResizeTargets = [
    promptInput,
    notesInput,
    filledPreview,
    shareFilledPreview,
    shareTemplatePreview,
    shareMessagePreview,
  ];
  _autoResizeTargets.forEach((el) => {
    if (el) wireAutoResize(el);
  });

  // --- Chatbots config (built-in)
  const builtInChatbots = [
    {
      name: "ChatGPT",
      icon: "💬",
      supportsQueryParam: true,
      urlTemplate:
        "https://chatgpt.com/?q={{{s}}}&hints=search&temporary-chat=true",
      className:
        "bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 dark:from-green-700 dark:to-green-800 dark:hover:from-green-800 dark:hover:to-green-900",
    },
    {
      name: "Claude",
      icon: "🧠",
      supportsQueryParam: false,
      urlTemplate: "https://claude.ai/new",
      className:
        "bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 dark:from-amber-700 dark:to-amber-800 dark:hover:from-amber-800 dark:hover:to-amber-900",
    },
    {
      name: "Perplexity",
      icon: "🔍",
      supportsQueryParam: true,
      urlTemplate: "https://perplexity.ai/?q={{{s}}}",
      className:
        "bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 dark:from-purple-700 dark:to-purple-800 dark:hover:from-purple-800 dark:hover:to-purple-900",
    },
    {
      name: "T3 Chat",
      icon: "🤖",
      supportsQueryParam: true,
      urlTemplate: "https://t3.chat/new?q={{{s}}}",
      className:
        "bg-gradient-to-r from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 dark:from-blue-800 dark:to-blue-900 dark:hover:from-blue-900 dark:hover:to-blue-950",
    },
    {
      name: "Google Gemini",
      icon: "✨",
      supportsQueryParam: false,
      urlTemplate: "https://gemini.google.com/app",
      className:
        "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 dark:from-blue-600 dark:to-blue-700 dark:hover:from-blue-700 dark:hover:to-blue-800",
    },
    {
      name: "Grok",
      icon: "🚀",
      supportsQueryParam: true,
      urlTemplate: "https://grok.com/?q={{{s}}}",
      className:
        "bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-800 hover:to-gray-900 dark:from-gray-600 dark:to-gray-700 dark:hover:from-gray-700 dark:hover:to-gray-800",
    },
    {
      name: "Mistral Le Chat",
      icon: "🌀",
      supportsQueryParam: true,
      urlTemplate: "https://chat.mistral.ai/chat?q={{{s}}}",
      className:
        "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 dark:from-orange-600 dark:to-orange-700 dark:hover:from-orange-700 dark:hover:to-orange-800",
    },
    {
      name: "Poe",
      icon: "💡",
      supportsQueryParam: false,
      urlTemplate: "https://poe.com",
      className:
        "bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 dark:from-indigo-600 dark:to-indigo-700 dark:hover:from-indigo-700 dark:hover:to-indigo-800",
    },
    {
      name: "DeepSeek",
      icon: "🔮",
      supportsQueryParam: false,
      urlTemplate: "https://chat.deepseek.com",
      className:
        "bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-700 hover:to-cyan-800 dark:from-cyan-700 dark:to-cyan-800 dark:hover:from-cyan-800 dark:hover:to-cyan-900",
    },
    {
      name: "Copilot",
      icon: "✈️",
      supportsQueryParam: true,
      urlTemplate: "https://copilot.microsoft.com/?q={{{s}}}",
      className:
        "bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 dark:from-sky-600 dark:to-sky-700 dark:hover:from-sky-700 dark:hover:to-sky-800",
    },
  ];

  // --- Custom chatbots storage
  const CUSTOM_CHATBOTS_KEY = "promptLauncher_customChatbots";

  function loadCustomChatbots() {
    try {
      const raw = localStorage.getItem(CUSTOM_CHATBOTS_KEY);
      if (!raw) return [];
      const data = JSON.parse(raw);
      if (!Array.isArray(data)) return [];
      return data.filter(
        (b) => b && typeof b.name === "string" && typeof b.urlTemplate === "string"
      );
    } catch {
      return [];
    }
  }

  function saveCustomChatbots(chatbots) {
    try {
      localStorage.setItem(CUSTOM_CHATBOTS_KEY, JSON.stringify(chatbots));
    } catch {
      // Storage full or unavailable
    }
  }

  let customChatbots = loadCustomChatbots();

  function getChatbotsConfig() {
    const custom = customChatbots.map((c) => ({
      ...c,
      isCustom: true,
      className:
        c.className ||
        "bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 dark:from-rose-600 dark:to-rose-700 dark:hover:from-rose-700 dark:hover:to-rose-800",
    }));
    return [...builtInChatbots, ...custom];
  }

  // --- Template Library storage
  const TEMPLATES_KEY = "promptLauncher_templates";

  function loadTemplates() {
    try {
      const raw = localStorage.getItem(TEMPLATES_KEY);
      if (!raw) return [];
      const data = JSON.parse(raw);
      if (!Array.isArray(data)) return [];
      return data.filter(
        (t) => t && typeof t.id === "string" && typeof t.template === "string"
      );
    } catch {
      return [];
    }
  }

  function saveTemplates(templates) {
    try {
      localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
    } catch {
      // Storage full or unavailable
    }
  }

  let savedTemplates = loadTemplates();

  // --- App state
  const state = {
    title: "",
    tags: "",
    notes: "",
    template: "",
    vars: {},
  };

  // --- Debounce timer for localStorage saves
  let saveTimeout = null;

  /**
   * LocalStorage persistence
   */
  function saveStateToStorage() {
    try {
      const data = {
        title: state.title,
        tags: state.tags,
        notes: state.notes,
        template: state.template,
        vars: state.vars,
        _savedAt: Date.now(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      // Storage full or unavailable - ignore
    }
  }

  function debouncedSave() {
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(saveStateToStorage, SAVE_DEBOUNCE_MS);
  }

  function loadStateFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;

      const data = JSON.parse(raw);
      if (!data || typeof data !== "object") return false;

      state.title = String(data.title || "");
      state.tags = String(data.tags || "");
      state.notes = String(data.notes || "");
      state.template = String(data.template || "");
      state.vars =
        data.vars && typeof data.vars === "object" ? data.vars : {};

      return true;
    } catch {
      return false;
    }
  }

  function clearStorage() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
  }

  /**
   * Native Share API support detection
   */
  function supportsNativeShare() {
    return (
      typeof navigator !== "undefined" &&
      typeof navigator.share === "function" &&
      typeof navigator.canShare === "function"
    );
  }

  async function triggerNativeShare(url, title, text) {
    const shareData = { url };
    if (title) shareData.title = title;
    if (text) shareData.text = text;

    try {
      if (navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
        return true;
      } else {
        // Fallback: try sharing anyway
        await navigator.share(shareData);
        return true;
      }
    } catch (err) {
      // User cancelled or share failed
      if (err.name !== "AbortError") {
        console.warn("Native share failed:", err);
      }
      return false;
    }
  }

  /**
   * UI helpers
   */
  function updateThemeIcons() {
    const isDark = document.documentElement.classList.contains("dark");
    if (isDark) {
      sunIcon.classList.remove("hidden");
      moonIcon.classList.add("hidden");
    } else {
      sunIcon.classList.add("hidden");
      moonIcon.classList.remove("hidden");
    }
  }

  function showToast(message) {
    toastText.textContent = message;
    toast.classList.remove("opacity-0", "translate-y-2");
    toast.classList.add("opacity-100", "translate-y-0");
    window.setTimeout(() => {
      toast.classList.add("opacity-0", "translate-y-2");
      toast.classList.remove("opacity-100", "translate-y-0");
    }, 1600);
  }

  async function copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      try {
        const temp = document.createElement("textarea");
        temp.value = text;
        temp.setAttribute("readonly", "");
        temp.style.position = "absolute";
        temp.style.left = "-9999px";
        document.body.appendChild(temp);
        temp.select();
        document.execCommand("copy");
        document.body.removeChild(temp);
        return true;
      } catch {
        return false;
      }
    }
  }

  function escapeRegex(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  /**
   * Auto-resize helpers for textareas
   */
  function autoResizeTextarea(el) {
    if (!el) return;
    try {
      el.style.height = "auto";
      el.style.height = el.scrollHeight + "px";
    } catch (e) {
      // ignore
    }
  }

  function wireAutoResize(el) {
    if (!el) return;
    el.style.overflow = "hidden";
    el.addEventListener("input", () => autoResizeTextarea(el));
    autoResizeTextarea(el);
  }

  /**
   * Canonicalize/minify template & vars
   */
  function canonicalizeText(s) {
    if (!s) return "";
    let out = String(s);
    out = out.replace(/\r\n/g, "\n");
    out = out.replace(/[ \t]+\n/g, "\n");
    out = out.replace(/\n{3,}/g, "\n\n");
    out = out.trim();
    return out;
  }

  function canonicalizeVarsObject(varsObj) {
    const entries = Object.entries(varsObj || {})
      .map(([k, v]) => [String(k), canonicalizeText(String(v || ""))])
      .sort((a, b) => a[0].localeCompare(b[0]));
    return entries;
  }

  /**
   * Variables: detect {{var}} tokens
   */
  function extractVariables(template) {
    const re = /\{\{\s*([^{}]+?)\s*\}\}/g;
    const found = [];
    const seen = new Set();

    let match;
    while ((match = re.exec(template)) !== null) {
      const raw = match[1].trim();
      if (!raw) continue;
      if (seen.has(raw)) continue;
      seen.add(raw);
      found.push(raw);
    }

    return found;
  }

  function resolveTemplate(template, vars) {
    const keys = Object.keys(vars);

    let result = template;
    keys.forEach((key) => {
      const value = (vars[key] || "").trim();
      if (!value) return;

      const re = new RegExp(
        "\\{\\{\\s*" + escapeRegex(key) + "\\s*\\}\\}",
        "g"
      );
      result = result.replace(re, value);
    });

    return result;
  }

  function countMissingVars(varKeys) {
    return varKeys.filter((k) => !(state.vars[k] || "").trim()).length;
  }

  function renderVariables(varKeys) {
    Object.keys(state.vars).forEach((k) => {
      if (!varKeys.includes(k)) delete state.vars[k];
    });

    if (varKeys.length === 0) {
      varsSection.classList.add("hidden");
      varsList.innerHTML = "";
      filledPreview.value = resolveTemplate(state.template, state.vars);
      autoResizeTextarea(filledPreview);
      missingVarsHint.classList.add("hidden");
      return;
    }

    varsSection.classList.remove("hidden");
    varsList.innerHTML = "";

    varKeys.forEach((key) => {
      if (state.vars[key] === undefined) state.vars[key] = "";

      const wrap = document.createElement("div");
      wrap.className =
        "bg-gray-50 dark:bg-gray-700/60 border border-gray-200 dark:border-gray-600 rounded-lg p-3";

      wrap.innerHTML = `
        <label class="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">
          ${key}
        </label>
       <textarea
        data-var-key="${key}"
        rows="2"
        class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 resize-none overflow-hidden"
        placeholder="Enter value for {{${key}}}"
        ></textarea>
      `;

      varsList.appendChild(wrap);

      const input = wrap.querySelector(`[data-var-key="${key}"]`);
      input.value = state.vars[key];

      input.addEventListener("input", () => {
        state.vars[key] = input.value;
        updateDerivedViews();
        debouncedSave();
      });

      wireAutoResize(input);
    });

    updateDerivedViews();
  }

  /**
   * Serialize state to compressed string
   * - Uses LZ-String for simplicity and reliability.
   */
  function serializeShareState(options) {
    const includeVars = options.includeVars;
    const includeMeta = options.includeMeta;
    const canonicalize = options.canonicalize;

    const payload = { v: 2 };

    const title = includeMeta ? state.title : "";
    const tags = includeMeta ? state.tags : "";
    const notes = includeMeta ? state.notes : "";
    const template = state.template;

    const tpl = canonicalize ? canonicalizeText(template) : template;

    if (tpl && tpl.trim()) payload.p = tpl;
    if (title && title.trim()) payload.t = title.trim();
    if (tags && tags.trim()) payload.g = tags.trim();
    if (notes && notes.trim()) payload.n = notes.trim();
    if (canonicalize) payload.c = 1;

    if (includeVars) {
      const pairs = canonicalize
        ? canonicalizeVarsObject(state.vars)
        : Object.entries(state.vars || {})
            .map(([k, v]) => [String(k), String(v || "")])
            .sort((a, b) => a[0].localeCompare(b[0]));

      const nonEmpty = pairs.filter(
        ([, v]) => String(v).trim().length > 0
      );
      if (nonEmpty.length > 0) payload.r = nonEmpty;
    }

    return payload;
  }

  function buildBaseUrl() {
    return `${window.location.origin}${window.location.pathname}`;
  }

  function buildShareLink(options) {
    const payload = serializeShareState(options);
    const json = JSON.stringify(payload);

    // Use LZ-String compression (URL-safe)
    const compressed = LZString.compressToEncodedURIComponent(json);
    return `${buildBaseUrl()}#p=${compressed}`;
  }

  function tryLoadFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const hash = window.location.hash.startsWith("#")
      ? window.location.hash.slice(1)
      : "";
    const hashParams = new URLSearchParams(hash);

    // 1) LZ-string format: #p=... or ?p=...
    const compressed = hashParams.get("p") || params.get("p");
    if (compressed) {
      try {
        const json =
          LZString.decompressFromEncodedURIComponent(compressed);
        if (!json) return false;

        const data = JSON.parse(json);
        if (!data || typeof data !== "object") return false;

        if (data.v === 2) {
          state.title = String(data.t || "");
          state.tags = String(data.g || "");
          state.notes = String(data.n || "");
          state.template = String(data.p || "");
          state.vars = {};
          if (Array.isArray(data.r)) {
            data.r.forEach((pair) => {
              if (!Array.isArray(pair) || pair.length < 2) return;
              const k = String(pair[0] || "");
              const v = String(pair[1] || "");
              if (!k) return;
              state.vars[k] = v;
            });
          }
          return true;
        }

        // v1 legacy object keys
        state.title = String(data.title || "");
        state.tags = String(data.tags || "");
        state.notes = String(data.notes || "");
        state.template = String(data.template || "");
        state.vars =
          data.vars && typeof data.vars === "object" ? data.vars : {};
        return true;
      } catch {
        return false;
      }
    }

    // 2) Backward compatible format: ?prompt=...
    const legacyPrompt = params.get("prompt");
    if (legacyPrompt) {
      const decoded = decodeURIComponent(
        legacyPrompt.replace(/\+/g, " ")
      );
      state.template = decoded;

      const legacyTitle = params.get("title");
      const legacyNotes = params.get("notes");
      const legacyTags = params.get("tags");

      if (legacyTitle)
        state.title = decodeURIComponent(legacyTitle.replace(/\+/g, " "));
      if (legacyNotes)
        state.notes = decodeURIComponent(legacyNotes.replace(/\+/g, " "));
      if (legacyTags)
        state.tags = decodeURIComponent(legacyTags.replace(/\+/g, " "));

      return true;
    }

    return false;
  }

  /**
   * Derived views:
   */
  function getFilledPrompt() {
    return resolveTemplate(state.template, state.vars);
  }

  function updateChatbotButtons() {
    const filled = getFilledPrompt();
    const encoded = encodeURIComponent(filled);
    const chatbotsConfig = getChatbotsConfig();

    const buttons = chatbotButtons.querySelectorAll("[data-bot-name]");
    buttons.forEach((btn) => {
      const botName = btn.getAttribute("data-bot-name");
      const bot = chatbotsConfig.find((b) => b.name === botName);
      if (!bot) return;

      if (bot.supportsQueryParam) {
        btn.href = bot.urlTemplate.replace("{{{s}}}", encoded);
      } else {
        btn.href = bot.urlTemplate;
      }
    });
  }

  function updateDerivedViews() {
    charCount.textContent = `${state.template.length} character${
      state.template.length === 1 ? "" : "s"
    }`;

    const varKeys = extractVariables(state.template);
    const filled = getFilledPrompt();
    filledPreview.value = filled;
    autoResizeTextarea(filledPreview);

    if (varKeys.length > 0) {
      const missing = countMissingVars(varKeys);
      if (missing > 0) {
        missingVarsHint.textContent = `${missing} variable${
          missing === 1 ? "" : "s"
        } not filled`;
        missingVarsHint.classList.remove("hidden");
      } else {
        missingVarsHint.classList.add("hidden");
      }
    } else {
      missingVarsHint.classList.add("hidden");
    }

    const hasPrompt = !!state.template.trim();
    copyFilledBtn.disabled = !hasPrompt;
    shareBtn.disabled = !hasPrompt;

    updateChatbotButtons();
  }

  /**
   * Share modal rendering
   */
  function setShareTab(tabName) {
    shareTabs.forEach((t) => {
      const isActive = t.dataset.tab === tabName;
      t.className = isActive
        ? "shareTab px-3 py-2 rounded-lg text-sm font-semibold bg-indigo-600 text-white"
        : "shareTab px-3 py-2 rounded-lg text-sm font-semibold bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100";
    });

    sharePanels.forEach((p) => p.classList.add("hidden"));
    const active = document.getElementById(`tab-${tabName}`);
    if (active) active.classList.remove("hidden");
  }

  function refreshShareModalPreviews() {
    const link = buildShareLink({
      includeVars: includeVarsInLink.checked,
      includeMeta: includeMetaInLink.checked,
      canonicalize: canonicalizeInLink.checked,
    });
    shareLinkInput.value = link;

    shareFilledPreview.value = getFilledPrompt();
    shareTemplatePreview.value = state.template;

    const lines = [];
    if (state.title.trim()) lines.push(`Title: ${state.title.trim()}`);
    if (state.tags.trim()) lines.push(`Tags: ${state.tags.trim()}`);
    if (state.notes.trim()) {
      lines.push("");
      lines.push("Notes:");
      lines.push(state.notes.trim());
    }
    lines.push("");
    lines.push("Prompt:");
    lines.push(getFilledPrompt());
    lines.push("");
    lines.push("Open in Prompt Launcher:");
    lines.push(link);

    shareMessagePreview.value = lines.join("\n");
  }

  /**
   * Create chatbot buttons
   */
  function createChatbotButtons() {
    chatbotButtons.innerHTML = "";
    const chatbotsConfig = getChatbotsConfig();

    chatbotsConfig.forEach((bot) => {
      const wrapper = document.createElement("div");
      wrapper.className = "relative group";

      const a = document.createElement("a");
      a.setAttribute("data-bot-name", bot.name);
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.className = `flex items-center justify-center p-4 rounded-lg shadow-lg font-bold text-white text-base ${bot.className} transition-all duration-200 ease-in-out transform hover:-translate-y-1 text-center w-full`;
      a.innerHTML = `<span class="text-2xl mr-2">${bot.icon}</span>${bot.name}`;

      a.addEventListener("click", async (e) => {
        if (bot.supportsQueryParam) return;

        e.preventDefault();
        const ok = await copyToClipboard(getFilledPrompt());
        if (ok) showToast("Copied — paste into the chatbot");

        window.open(bot.urlTemplate, "_blank", "noopener,noreferrer");
      });

      wrapper.appendChild(a);

      // Add delete button for custom chatbots
      if (bot.isCustom) {
        const deleteBtn = document.createElement("button");
        deleteBtn.type = "button";
        deleteBtn.className =
          "absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity shadow-md";
        deleteBtn.innerHTML = "×";
        deleteBtn.title = "Remove custom chatbot";
        deleteBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          removeCustomChatbot(bot.name);
        });
        wrapper.appendChild(deleteBtn);
      }

      chatbotButtons.appendChild(wrapper);
    });

    // Add "Add Custom" button
    const addBtn = document.createElement("button");
    addBtn.type = "button";
    addBtn.className =
      "flex items-center justify-center p-4 rounded-lg shadow-lg font-bold text-gray-600 dark:text-gray-300 text-base bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 border-2 border-dashed border-gray-400 dark:border-gray-500 transition-all duration-200 ease-in-out transform hover:-translate-y-1 text-center";
    addBtn.innerHTML = `<span class="text-2xl mr-2">+</span>Add Custom`;
    addBtn.addEventListener("click", openCustomChatbotModal);
    chatbotButtons.appendChild(addBtn);
  }

  function removeCustomChatbot(name) {
    customChatbots = customChatbots.filter((c) => c.name !== name);
    saveCustomChatbots(customChatbots);
    createChatbotButtons();
    updateChatbotButtons();
    showToast(`Removed "${name}"`);
  }

  function addCustomChatbot(bot) {
    // Remove existing with same name
    customChatbots = customChatbots.filter((c) => c.name !== bot.name);
    customChatbots.push(bot);
    saveCustomChatbots(customChatbots);
    createChatbotButtons();
    updateChatbotButtons();
    showToast(`Added "${bot.name}"`);
  }

  /**
   * Custom chatbot modal
   */
  function openCustomChatbotModal() {
    customChatbotModal.classList.remove("hidden");
    customChatbotModal.classList.add("flex");
    customBotNameInput.value = "";
    customBotIconInput.value = "";
    customBotUrlInput.value = "";
    customBotQueryParamCheck.checked = true;
    customBotNameInput.focus();
  }

  function closeCustomChatbotModalFn() {
    customChatbotModal.classList.add("hidden");
    customChatbotModal.classList.remove("flex");
  }

  function handleAddCustomChatbot() {
    const name = customBotNameInput.value.trim();
    const icon = customBotIconInput.value.trim() || "🔗";
    let urlTemplate = customBotUrlInput.value.trim();
    const supportsQueryParam = customBotQueryParamCheck.checked;

    if (!name) {
      showToast("Please enter a name");
      return;
    }
    if (!urlTemplate) {
      showToast("Please enter a URL");
      return;
    }

    // Ensure URL starts with http
    if (!/^https?:\/\//i.test(urlTemplate)) {
      urlTemplate = "https://" + urlTemplate;
    }

    // If supports query param but no placeholder, add one
    if (supportsQueryParam && !urlTemplate.includes("{{{s}}}")) {
      const hasQuery = urlTemplate.includes("?");
      urlTemplate += (hasQuery ? "&" : "?") + "q={{{s}}}";
    }

    addCustomChatbot({
      name,
      icon,
      urlTemplate,
      supportsQueryParam,
    });

    closeCustomChatbotModalFn();
  }

  /**
   * Template Library
   */
  function generateTemplateId() {
    return "tpl_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function openTemplateLibrary() {
    templateLibraryModal.classList.remove("hidden");
    templateLibraryModal.classList.add("flex");
    renderTemplateList();
  }

  function closeTemplateLibraryFn() {
    templateLibraryModal.classList.add("hidden");
    templateLibraryModal.classList.remove("flex");
  }

  function renderTemplateList() {
    templateList.innerHTML = "";

    if (savedTemplates.length === 0) {
      templateList.innerHTML = `
        <div class="text-center text-gray-500 dark:text-gray-400 py-8">
          <p class="text-lg mb-2">No saved templates yet</p>
          <p class="text-sm">Save your current prompt as a template to get started.</p>
        </div>
      `;
      return;
    }

    savedTemplates.forEach((tpl) => {
      const item = document.createElement("div");
      item.className =
        "p-4 bg-gray-50 dark:bg-gray-700/60 border border-gray-200 dark:border-gray-600 rounded-lg hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors group";

      const varCount = extractVariables(tpl.template).length;
      const preview = tpl.template.length > 100
        ? tpl.template.slice(0, 100) + "..."
        : tpl.template;

      item.innerHTML = `
        <div class="flex items-start justify-between gap-3">
          <div class="flex-1 min-w-0 cursor-pointer" data-load-template="${tpl.id}">
            <h4 class="font-semibold text-gray-800 dark:text-white truncate">
              ${tpl.title || "Untitled Template"}
            </h4>
            ${tpl.tags ? `<p class="text-xs text-indigo-600 dark:text-indigo-400 mt-1">${tpl.tags}</p>` : ""}
            <p class="text-sm text-gray-600 dark:text-gray-300 mt-2 line-clamp-2">${preview}</p>
            <div class="flex items-center gap-3 mt-2 text-xs text-gray-500 dark:text-gray-400">
              <span>${tpl.template.length} chars</span>
              ${varCount > 0 ? `<span>${varCount} variable${varCount === 1 ? "" : "s"}</span>` : ""}
              <span>${new Date(tpl.savedAt).toLocaleDateString()}</span>
            </div>
          </div>
          <button
            type="button"
            class="p-2 text-red-500 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
            data-delete-template="${tpl.id}"
            title="Delete template"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      `;

      // Load template on click
      const loadArea = item.querySelector("[data-load-template]");
      loadArea.addEventListener("click", () => {
        loadTemplate(tpl.id);
      });

      // Delete button
      const deleteBtn = item.querySelector("[data-delete-template]");
      deleteBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        deleteTemplate(tpl.id);
      });

      templateList.appendChild(item);
    });
  }

  function saveCurrentTemplate() {
    if (!state.template.trim()) {
      showToast("No prompt to save");
      return;
    }

    const id = generateTemplateId();
    const newTemplate = {
      id,
      title: state.title || "",
      tags: state.tags || "",
      notes: state.notes || "",
      template: state.template,
      vars: { ...state.vars },
      savedAt: Date.now(),
    };

    savedTemplates.unshift(newTemplate);
    saveTemplates(savedTemplates);
    renderTemplateList();
    showToast("Template saved");
  }

  function loadTemplate(id) {
    const tpl = savedTemplates.find((t) => t.id === id);
    if (!tpl) {
      showToast("Template not found");
      return;
    }

    state.title = tpl.title || "";
    state.tags = tpl.tags || "";
    state.notes = tpl.notes || "";
    state.template = tpl.template || "";
    state.vars = tpl.vars && typeof tpl.vars === "object" ? { ...tpl.vars } : {};

    // Update UI
    titleInput.value = state.title;
    tagsInput.value = state.tags;
    notesInput.value = state.notes;
    promptInput.value = state.template;

    if (state.notes.trim()) {
      notesWrap.classList.remove("hidden");
      toggleNotes.textContent = "− Hide notes";
    } else {
      notesWrap.classList.add("hidden");
      toggleNotes.textContent = "+ Add notes";
    }

    const varKeys = extractVariables(state.template);
    renderVariables(varKeys);
    updateDerivedViews();
    debouncedSave();

    closeTemplateLibraryFn();
    showToast("Template loaded");
  }

  function deleteTemplate(id) {
    savedTemplates = savedTemplates.filter((t) => t.id !== id);
    saveTemplates(savedTemplates);
    renderTemplateList();
    showToast("Template deleted");
  }

  function exportTemplates() {
    if (savedTemplates.length === 0) {
      showToast("No templates to export");
      return;
    }

    const exportData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      templates: savedTemplates,
      customChatbots: customChatbots,
    };

    const json = JSON.stringify(exportData, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `prompt-launcher-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast("Templates exported");
  }

  function importTemplates(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);

        if (!data || typeof data !== "object") {
          showToast("Invalid file format");
          return;
        }

        let imported = 0;

        // Import templates
        if (Array.isArray(data.templates)) {
          data.templates.forEach((tpl) => {
            if (tpl && typeof tpl.template === "string") {
              // Generate new ID to avoid conflicts
              const newTpl = {
                ...tpl,
                id: generateTemplateId(),
                savedAt: tpl.savedAt || Date.now(),
              };
              savedTemplates.push(newTpl);
              imported++;
            }
          });
          saveTemplates(savedTemplates);
        }

        // Import custom chatbots
        if (Array.isArray(data.customChatbots)) {
          data.customChatbots.forEach((bot) => {
            if (bot && typeof bot.name === "string" && typeof bot.urlTemplate === "string") {
              // Check if not already exists
              if (!customChatbots.some((c) => c.name === bot.name)) {
                customChatbots.push(bot);
              }
            }
          });
          saveCustomChatbots(customChatbots);
          createChatbotButtons();
          updateChatbotButtons();
        }

        renderTemplateList();
        showToast(`Imported ${imported} template${imported === 1 ? "" : "s"}`);
      } catch (err) {
        showToast("Failed to import: Invalid JSON");
      }
    };
    reader.readAsText(file);
  }

  /**
   * Event wiring
   */
  themeToggle.addEventListener("click", () => {
    const isDark = document.documentElement.classList.toggle("dark");
    localStorage.setItem("theme", isDark ? "dark" : "light");
    updateThemeIcons();
  });

  toggleNotes.addEventListener("click", () => {
    const isHidden = notesWrap.classList.toggle("hidden");
    toggleNotes.textContent = isHidden ? "+ Add notes" : "− Hide notes";
  });

  promptInput.addEventListener("input", () => {
    state.template = promptInput.value;

    const varKeys = extractVariables(state.template);
    renderVariables(varKeys);
    updateDerivedViews();
    debouncedSave();
  });

  titleInput.addEventListener("input", () => {
    state.title = titleInput.value;
    debouncedSave();
  });

  tagsInput.addEventListener("input", () => {
    state.tags = tagsInput.value;
    debouncedSave();
  });

  notesInput.addEventListener("input", () => {
    state.notes = notesInput.value;
    debouncedSave();
  });

  resetVarsBtn.addEventListener("click", () => {
    Object.keys(state.vars).forEach((k) => (state.vars[k] = ""));
    const varKeys = extractVariables(state.template);
    renderVariables(varKeys);
    updateDerivedViews();
    debouncedSave();
    showToast("Variables reset");
  });

  toggleFilledPreview.addEventListener("click", () => {
    const isHidden = filledPreviewWrapper.classList.toggle("hidden");
    if (!isHidden) {
      // Rotates chevron to point up
      previewChevron.style.transform = "rotate(180deg)";
      // Ensure textarea resizes correctly since it was hidden
      autoResizeTextarea(filledPreview);
    } else {
      // Rotates chevron to point down
      previewChevron.style.transform = "rotate(0deg)";
    }
  });

  copyFilledBtn.addEventListener("click", async () => {
    const ok = await copyToClipboard(getFilledPrompt());
    if (ok) showToast("Filled prompt copied");
  });

  clearBtn.addEventListener("click", () => {
    state.title = "";
    state.tags = "";
    state.notes = "";
    state.template = "";
    state.vars = {};

    titleInput.value = "";
    tagsInput.value = "";
    notesInput.value = "";
    promptInput.value = "";

    varsSection.classList.add("hidden");
    varsList.innerHTML = "";
    filledPreview.value = "";
    updateDerivedViews();

    // Clear localStorage as well
    clearStorage();

    showToast("Cleared");
    promptInput.focus();
  });

  // Share modal open/close
  shareBtn.addEventListener("click", () => {
    refreshShareModalPreviews();
    setShareTab("link");

    // Show/hide native share button based on support
    if (supportsNativeShare()) {
      nativeShareWrapper.classList.remove("hidden");
    } else {
      nativeShareWrapper.classList.add("hidden");
    }

    shareModal.classList.remove("hidden");
    shareModal.classList.add("flex");
  });

  closeShareModal.addEventListener("click", () => {
    shareModal.classList.add("hidden");
    shareModal.classList.remove("flex");
  });

  shareModal.addEventListener("click", (e) => {
    if (e.target === shareModal) {
      shareModal.classList.add("hidden");
      shareModal.classList.remove("flex");
    }
  });

  shareTabs.forEach((t) => {
    t.addEventListener("click", () => {
      setShareTab(t.dataset.tab);
    });
  });

  includeVarsInLink.addEventListener("change", refreshShareModalPreviews);
  includeMetaInLink.addEventListener("change", refreshShareModalPreviews);
  canonicalizeInLink.addEventListener(
    "change",
    refreshShareModalPreviews
  );

  copyLinkBtn.addEventListener("click", async () => {
    refreshShareModalPreviews();
    const ok = await copyToClipboard(shareLinkInput.value);
    if (ok) showToast("Share link copied");
  });

  // Native Share API button
  nativeShareBtn.addEventListener("click", async () => {
    refreshShareModalPreviews();
    const url = shareLinkInput.value;
    const title = state.title.trim() || "AI Prompt";
    const text = state.notes.trim()
      ? `${title}\n\n${state.notes.trim()}`
      : title;

    const shared = await triggerNativeShare(url, title, text);
    if (shared) {
      showToast("Shared successfully");
    }
    // If user cancelled, do nothing (no error toast)
  });

  copyFilledFromModalBtn.addEventListener("click", async () => {
    const ok = await copyToClipboard(getFilledPrompt());
    if (ok) showToast("Filled prompt copied");
  });

  copyTemplateBtn.addEventListener("click", async () => {
    const ok = await copyToClipboard(state.template);
    if (ok) showToast("Template copied");
  });

  copyMessageBtn.addEventListener("click", async () => {
    refreshShareModalPreviews();
    const ok = await copyToClipboard(shareMessagePreview.value);
    if (ok) showToast("Message copied");
  });

  // Custom chatbot modal events
  closeCustomChatbotModal.addEventListener("click", closeCustomChatbotModalFn);
  customChatbotModal.addEventListener("click", (e) => {
    if (e.target === customChatbotModal) {
      closeCustomChatbotModalFn();
    }
  });
  addCustomBotBtn.addEventListener("click", handleAddCustomChatbot);

  // Template library events
  templateLibraryBtn.addEventListener("click", openTemplateLibrary);
  closeTemplateLibrary.addEventListener("click", closeTemplateLibraryFn);
  templateLibraryModal.addEventListener("click", (e) => {
    if (e.target === templateLibraryModal) {
      closeTemplateLibraryFn();
    }
  });
  saveCurrentTemplateBtn.addEventListener("click", saveCurrentTemplate);
  exportTemplatesBtn.addEventListener("click", exportTemplates);
  importTemplatesBtn.addEventListener("click", () => {
    importTemplatesInput.click();
  });
  importTemplatesInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
      importTemplates(file);
      e.target.value = ""; // Reset for future imports
    }
  });

  // Keyboard shortcuts
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (!shareModal.classList.contains("hidden")) {
        shareModal.classList.add("hidden");
        shareModal.classList.remove("flex");
      }
      if (!customChatbotModal.classList.contains("hidden")) {
        closeCustomChatbotModalFn();
      }
      if (!templateLibraryModal.classList.contains("hidden")) {
        closeTemplateLibraryFn();
      }
    }

    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      if (!copyFilledBtn.disabled) copyFilledBtn.click();
    }

    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      clearBtn.click();
    }

    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "l") {
      e.preventDefault();
      openTemplateLibrary();
    }
  });

  /**
   * Initial load
   */
  function init() {
    updateThemeIcons();
    createChatbotButtons();

    // Priority: URL payload > localStorage
    const loadedFromUrl = tryLoadFromUrl();

    if (loadedFromUrl) {
      // Loaded from URL - populate UI
      titleInput.value = state.title;
      tagsInput.value = state.tags;

      if (state.notes.trim()) {
        notesWrap.classList.remove("hidden");
        toggleNotes.textContent = "− Hide notes";
      }
      notesInput.value = state.notes;

      promptInput.value = state.template;

      const varKeys = extractVariables(state.template);
      renderVariables(varKeys);
      updateDerivedViews();

      // Save URL state to localStorage for persistence
      debouncedSave();

      showToast("Loaded from link");
    } else {
      // Try loading from localStorage
      const loadedFromStorage = loadStateFromStorage();

      if (loadedFromStorage && state.template.trim()) {
        // Loaded from localStorage - populate UI
        titleInput.value = state.title;
        tagsInput.value = state.tags;

        if (state.notes.trim()) {
          notesWrap.classList.remove("hidden");
          toggleNotes.textContent = "− Hide notes";
        }
        notesInput.value = state.notes;

        promptInput.value = state.template;

        const varKeys = extractVariables(state.template);
        renderVariables(varKeys);
        updateDerivedViews();

        showToast("Restored from last session");
      } else {
        // Fresh start
        updateDerivedViews();
        promptInput.focus();
      }
    }
  }

  init();
});
