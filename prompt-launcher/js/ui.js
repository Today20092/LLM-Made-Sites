/**
 * UI MANAGEMENT & DOM ELEMENTS
 */

// --- Elements ---
let themeToggle, sunIcon, moonIcon;
let titleInput, tagsInput, toggleNotes, notesWrap, notesInput;
let promptInput, charCount;
let varsSection, varsList, resetVarsBtn, filledPreview, missingVarsHint, toggleFilledPreview, filledPreviewWrapper, previewChevron;
let copyFilledBtn, shareBtn, clearBtn, fabButton;
let chatbotButtons;
let toast, toastText;

// Share modal elements
let shareModal, closeShareModal, shareTabs, sharePanels;
let includeVarsInLink, includeMetaInLink, canonicalizeInLink, shareLinkInput, copyLinkBtn;
let nativeShareWrapper, nativeShareBtn;
let shareFilledPreview, shareTemplatePreview, shareMessagePreview;
let copyFilledFromModalBtn, copyTemplateBtn, copyMessageBtn;

// Custom chatbot modal elements
let customChatbotModal, closeCustomChatbotModal, customBotName, customBotIcon, customBotUrl, customBotSupportsQuery, saveCustomChatbotBtn;

// Template library modal elements
let templateLibraryModal, closeTemplateLibrary, templateLibraryBtn, saveToLibraryBtn, templateList, exportTemplatesBtn, importTemplatesBtn, importTemplatesInput;

/**
 * Initialize DOM element references
 */
function initElements() {
  themeToggle = document.getElementById("themeToggle");
  sunIcon = document.getElementById("sunIcon");
  moonIcon = document.getElementById("moonIcon");

  titleInput = document.getElementById("titleInput");
  tagsInput = document.getElementById("tagsInput");
  toggleNotes = document.getElementById("toggleNotes");
  notesWrap = document.getElementById("notesWrap");
  notesInput = document.getElementById("notesInput");

  promptInput = document.getElementById("promptInput");
  charCount = document.getElementById("charCount");

  varsSection = document.getElementById("varsSection");
  varsList = document.getElementById("varsList");
  resetVarsBtn = document.getElementById("resetVarsBtn");
  filledPreview = document.getElementById("filledPreview");
  missingVarsHint = document.getElementById("missingVarsHint");
  toggleFilledPreview = document.getElementById("toggleFilledPreview");
  filledPreviewWrapper = document.getElementById("filledPreviewWrapper");
  previewChevron = document.getElementById("previewChevron");

  copyFilledBtn = document.getElementById("copyFilledBtn");
  shareBtn = document.getElementById("shareBtn");
  clearBtn = document.getElementById("clearBtn");
  fabButton = document.getElementById("fabButton");

  chatbotButtons = document.getElementById("chatbotButtons");

  toast = document.getElementById("toast");
  toastText = document.getElementById("toastText");

  // Share modal
  shareModal = document.getElementById("shareModal");
  closeShareModal = document.getElementById("closeShareModal");
  shareTabs = Array.from(document.querySelectorAll(".shareTab"));
  sharePanels = Array.from(document.querySelectorAll(".sharePanel"));
  includeVarsInLink = document.getElementById("includeVarsInLink");
  includeMetaInLink = document.getElementById("includeMetaInLink");
  canonicalizeInLink = document.getElementById("canonicalizeInLink");
  shareLinkInput = document.getElementById("shareLinkInput");
  copyLinkBtn = document.getElementById("copyLinkBtn");
  nativeShareWrapper = document.getElementById("nativeShareWrapper");
  nativeShareBtn = document.getElementById("nativeShareBtn");
  shareFilledPreview = document.getElementById("shareFilledPreview");
  shareTemplatePreview = document.getElementById("shareTemplatePreview");
  shareMessagePreview = document.getElementById("shareMessagePreview");
  copyFilledFromModalBtn = document.getElementById("copyFilledFromModalBtn");
  copyTemplateBtn = document.getElementById("copyTemplateBtn");
  copyMessageBtn = document.getElementById("copyMessageBtn");

  // Custom chatbot modal
  customChatbotModal = document.getElementById("customChatbotModal");
  closeCustomChatbotModal = document.getElementById("closeCustomChatbotModal");
  customBotName = document.getElementById("customBotName");
  customBotIcon = document.getElementById("customBotIcon");
  customBotUrl = document.getElementById("customBotUrl");
  customBotSupportsQuery = document.getElementById("customBotSupportsQuery");
  saveCustomChatbotBtn = document.getElementById("saveCustomChatbotBtn");

  // Template library modal
  templateLibraryModal = document.getElementById("templateLibraryModal");
  closeTemplateLibrary = document.getElementById("closeTemplateLibrary");
  templateLibraryBtn = document.getElementById("templateLibraryBtn");
  saveToLibraryBtn = document.getElementById("saveToLibraryBtn");
  templateList = document.getElementById("templateList");
  exportTemplatesBtn = document.getElementById("exportTemplatesBtn");
  importTemplatesBtn = document.getElementById("importTemplatesBtn");
  importTemplatesInput = document.getElementById("importTemplatesInput");

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
}

/**
 * UI Helpers
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

function autoResizeTextarea(el) {
  if (!el) return;
  try {
    const scrollLeft = window.scrollX || document.documentElement.scrollLeft;
    const scrollTop = window.scrollY || document.documentElement.scrollTop;

    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";

    window.scrollTo(scrollLeft, scrollTop);
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
 * Native Share API support
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
      await navigator.share(shareData);
      return true;
    }
  } catch (err) {
    if (err.name !== "AbortError") {
      console.warn("Native share failed:", err);
    }
    return false;
  }
}

/**
 * Derived & Complex UI Updates
 */
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
    wrap.className = "bg-md-surface-container-high dark:bg-gray-700/60 border border-md-outline-variant dark:border-gray-600 rounded-sm-md p-3";

    wrap.innerHTML = `
      <label class="block text-label-lg font-medium text-md-surface-on dark:text-gray-200 mb-1">
        ${key}
      </label>
      <textarea
        data-var-key="${key}"
        rows="2"
        class="w-full px-3 py-2 rounded-sm-md border-b-2 border-md-outline dark:border-gray-600 bg-md-surface-container-highest dark:bg-gray-700 text-md-surface-on dark:text-gray-100 focus:outline-none focus:border-md-primary dark:focus:border-indigo-400 resize-none overflow-hidden transition-colors duration-short-4"
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

function updateChatbotButtons() {
  const filled = getFilledPrompt();
  const encoded = encodeURIComponent(filled);
  const allBots = getAllChatbots();

  const buttons = chatbotButtons.querySelectorAll("[data-bot-name]");
  buttons.forEach((btn) => {
    const botName = btn.getAttribute("data-bot-name");
    const bot = allBots.find((b) => b.name === botName);
    if (!bot) return;

    if (bot.supportsQueryParam) {
      btn.href = bot.urlTemplate.replace("{{{s}}}", encoded);
    } else {
      btn.href = bot.urlTemplate;
    }
  });
}

function updateDerivedViews() {
  charCount.textContent = `${state.template.length} character${state.template.length === 1 ? "" : "s"}`;

  const varKeys = extractVariables(state.template);
  const filled = getFilledPrompt();
  filledPreview.value = filled;
  autoResizeTextarea(filledPreview);

  if (varKeys.length > 0) {
    const missing = countMissingVars(varKeys);
    if (missing > 0) {
      missingVarsHint.textContent = `${missing} variable${missing === 1 ? "" : "s"} not filled`;
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

  if (hasPrompt) {
    fabButton.classList.remove("hidden");
  } else {
    fabButton.classList.add("hidden");
  }

  updateChatbotButtons();
}

function setShareTab(tabName) {
  shareTabs.forEach((t) => {
    const isActive = t.dataset.tab === tabName;
    t.className = isActive
      ? "shareTab px-3 py-2 rounded-sm-md text-label-lg font-medium bg-md-secondary-container text-md-secondary-on-container"
      : "shareTab px-3 py-2 rounded-sm-md text-label-lg font-medium bg-md-surface-container-highest dark:bg-gray-700 text-md-surface-on dark:text-gray-100";
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

function createChatbotButtons() {
  chatbotButtons.innerHTML = "";
  const allBots = getAllChatbots();

  allBots.forEach((bot, index) => {
    const isCustom = index >= builtInChatbots.length;

    const wrapper = document.createElement("div");
    wrapper.className = "relative group";

    const a = document.createElement("a");
    a.setAttribute("data-bot-name", bot.name);
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.className = `flex items-center justify-center p-4 rounded-md-md shadow-elevation-1 hover:shadow-elevation-2 font-medium text-md-primary-on text-base bg-md-primary hover:bg-md-primary/90 transition-all duration-short-4 ease-standard text-center w-full`;
    a.innerHTML = `<span class="text-2xl mr-2">${bot.icon}</span>${bot.name}`;

    a.addEventListener("click", async (e) => {
      if (bot.supportsQueryParam) return;

      e.preventDefault();
      const ok = await copyToClipboard(getFilledPrompt());
      if (ok) showToast("Copied — paste into the chatbot");

      window.open(bot.urlTemplate, "_blank", "noopener,noreferrer");
    });

    wrapper.appendChild(a);

    if (isCustom) {
      const deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.className = "absolute -top-2 -right-2 w-6 h-6 bg-md-error text-md-error-on rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-short-4 flex items-center justify-center text-xs font-bold shadow-elevation-2";
      deleteBtn.innerHTML = "×";
      deleteBtn.title = "Remove custom chatbot";
      deleteBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const customIndex = index - builtInChatbots.length;
        customChatbots.splice(customIndex, 1);
        saveCustomChatbots();
        createChatbotButtons();
        updateChatbotButtons();
        showToast(`Removed ${bot.name}`);
      });
      wrapper.appendChild(deleteBtn);
    }

    chatbotButtons.appendChild(wrapper);
  });

  const addBtn = document.createElement("button");
  addBtn.type = "button";
  addBtn.className = "flex items-center justify-center p-4 rounded-md-md border-2 border-dashed border-md-outline dark:border-gray-600 text-md-surface-on-variant dark:text-gray-400 hover:border-md-primary hover:text-md-primary dark:hover:border-indigo-400 dark:hover:text-indigo-400 transition-all duration-short-4 ease-standard text-center font-medium";
  addBtn.innerHTML = `<span class="text-2xl mr-2">+</span>Add Custom`;
  addBtn.addEventListener("click", openCustomChatbotModal);
  chatbotButtons.appendChild(addBtn);
}

function openCustomChatbotModal() {
  customBotName.value = "";
  customBotIcon.value = "🤖";
  customBotUrl.value = "";
  customBotSupportsQuery.checked = false;
  customChatbotModal.classList.remove("hidden");
  customChatbotModal.classList.add("flex");
  customBotName.focus();
}

function closeCustomChatbotModalFn() {
  customChatbotModal.classList.add("hidden");
  customChatbotModal.classList.remove("flex");
}

function openTemplateLibraryModal() {
  renderTemplateList();
  templateLibraryModal.classList.remove("hidden");
  templateLibraryModal.classList.add("flex");
}

function closeTemplateLibraryModalFn() {
  templateLibraryModal.classList.add("hidden");
  templateLibraryModal.classList.remove("flex");
}

function renderTemplateList() {
  if (!templateList) return;
  templateList.innerHTML = "";

  if (savedTemplates.length === 0) {
    templateList.innerHTML = `
      <div class="text-center py-8 text-md-surface-on-variant dark:text-gray-400">
        <p class="text-body-lg">No saved templates yet</p>
        <p class="text-body-sm mt-1">Save your current prompt to the library using the button above</p>
      </div>
    `;
    return;
  }

  savedTemplates.forEach((template, index) => {
    const varKeys = extractVariables(template.template);
    const varCount = varKeys.length;
    const previewText = template.template.length > 100 ? template.template.substring(0, 100) + "..." : template.template;

    const item = document.createElement("div");
    item.className = "group p-4 bg-md-surface-container dark:bg-gray-700/50 rounded-md-md border border-md-outline-variant dark:border-gray-600 hover:border-md-primary dark:hover:border-indigo-400 transition-colors duration-short-4 cursor-pointer";
    item.innerHTML = `
      <div class="flex items-start justify-between gap-3">
        <div class="flex-1 min-w-0">
          <h4 class="text-title-md font-medium text-md-surface-on dark:text-white truncate">
            ${template.title || "Untitled Template"}
          </h4>
          ${template.tags ? `<p class="text-label-sm text-md-primary dark:text-indigo-400 mt-0.5">${template.tags}</p>` : ""}
          <p class="text-body-sm text-md-surface-on-variant dark:text-gray-400 mt-1 line-clamp-2">${previewText}</p>
          <div class="flex items-center gap-3 mt-2 text-label-sm text-md-surface-on-variant dark:text-gray-500">
            <span>${varCount} variable${varCount !== 1 ? "s" : ""}</span>
            <span>•</span>
            <span>${new Date(template.savedAt).toLocaleDateString()}</span>
          </div>
        </div>
        <button
          class="delete-template-btn opacity-0 group-hover:opacity-100 p-2 text-md-error hover:bg-md-error-container rounded-full transition-all duration-short-4"
          data-index="${index}"
          title="Delete template"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    `;

    item.addEventListener("click", (e) => {
      if (e.target.closest(".delete-template-btn")) return;
      loadTemplate(index);
    });

    const deleteBtn = item.querySelector(".delete-template-btn");
    deleteBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      deleteTemplate(index);
    });

    templateList.appendChild(item);
  });
}

function saveCurrentTemplate() {
  if (!state.template.trim()) {
    showToast("No template to save");
    return;
  }

  const template = {
    id: Date.now().toString(),
    title: state.title || "Untitled",
    tags: state.tags,
    notes: state.notes,
    template: state.template,
    vars: { ...state.vars },
    savedAt: Date.now(),
  };

  savedTemplates.unshift(template);
  saveTemplates();
  renderTemplateList();
  showToast("Template saved to library");
}

function loadTemplate(index) {
  const template = savedTemplates[index];
  if (!template) return;

  state.title = template.title || "";
  state.tags = template.tags || "";
  state.notes = template.notes || "";
  state.template = template.template || "";
  state.vars = template.vars || {};

  titleInput.value = state.title;
  tagsInput.value = state.tags;
  notesInput.value = state.notes;
  promptInput.value = state.template;

  if (state.notes.trim()) {
    notesWrap.classList.remove("hidden");
    toggleNotes.textContent = "− Hide notes";
  }

  const varKeys = extractVariables(state.template);
  renderVariables(varKeys);
  updateDerivedViews();
  debouncedSave();

  closeTemplateLibraryModalFn();
  showToast("Template loaded");
}

function deleteTemplate(index) {
  const template = savedTemplates[index];
  savedTemplates.splice(index, 1);
  saveTemplates();
  renderTemplateList();
  showToast(`Deleted "${template.title || "Untitled"}"`);
}

function exportTemplates() {
  const data = {
    version: 1,
    exportedAt: Date.now(),
    templates: savedTemplates,
    customChatbots: customChatbots,
  };

  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `prompt-launcher-backup-${new Date().toISOString().split("T")[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showToast("Backup exported");
}

function importTemplates(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);

      if (data.templates && Array.isArray(data.templates)) {
        const existingIds = new Set(savedTemplates.map((t) => t.id));
        const newTemplates = data.templates.filter((t) => !existingIds.has(t.id));
        savedTemplates = [...newTemplates, ...savedTemplates];
        saveTemplates();
      }

      if (data.customChatbots && Array.isArray(data.customChatbots)) {
        const existingNames = new Set(customChatbots.map((c) => c.name));
        const newChatbots = data.customChatbots.filter((c) => !existingNames.has(c.name));
        customChatbots = [...customChatbots, ...newChatbots];
        saveCustomChatbots();
        createChatbotButtons();
        updateChatbotButtons();
      }

      renderTemplateList();
      showToast("Import successful");
    } catch (err) {
      showToast("Invalid backup file");
    }
  };
  reader.readAsText(file);
}
