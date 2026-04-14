import { botIcons } from '../data/bot-icons';

const STORAGE_KEY = 'prompt-launcher:v1';
const THEME_KEY = 'prompt-launcher:theme';

const DEFAULT_STATE = {
  title: '',
  tags: '',
  prompt: '',
  notes: '',
  showNotes: false,
  variables: {},
  customBots: [],
  templates: [],
};

const BOT_TEMPLATES = [
  { name: 'T3 Chat', icon: 'T3', iconMarkup: botIcons['T3 Chat'].iconMarkup, url: 'https://t3.chat/', promptParam: 'q', supportsQuery: true, openMode: 'prefill' },
  { name: 'Claude', icon: 'Claude', iconMarkup: botIcons.Claude.iconMarkup, url: 'https://claude.ai/new', promptParam: 'q', supportsQuery: true, openMode: 'prefill' },
  { name: 'OpenAI', icon: 'OpenAI', iconMarkup: botIcons.OpenAI.iconMarkup, url: 'https://chatgpt.com/', promptParam: 'q', supportsQuery: true, openMode: 'prefill' },
  { name: 'Gemini', icon: 'Gemini', iconMarkup: botIcons.Gemini.iconMarkup, url: 'https://gemini.google.com/app', promptParam: 'q', supportsQuery: true, openMode: 'prefill' },
  { name: 'Perplexity', icon: 'Perplexity', iconMarkup: botIcons.Perplexity.iconMarkup, url: 'https://www.perplexity.ai/', promptParam: 'q', supportsQuery: true, openMode: 'prefill' },
  { name: 'Grok', icon: 'Grok', iconMarkup: botIcons.Grok.iconMarkup, url: 'https://grok.com/', promptParam: 'q', supportsQuery: true, openMode: 'prefill' },
  { name: 'Le Chat', icon: 'Mistral', iconMarkup: botIcons['Le Chat'].iconMarkup, url: 'https://chat.mistral.ai/', promptParam: 'q', supportsQuery: true, openMode: 'prefill' },
  { name: 'Poe', icon: 'Poe', iconMarkup: botIcons.Poe.iconMarkup, url: 'https://poe.com/', promptParam: 'q', supportsQuery: true, openMode: 'prefill' },
  { name: 'DeepSeek', icon: 'DeepSeek', iconMarkup: botIcons.DeepSeek.iconMarkup, url: 'https://chat.deepseek.com/', promptParam: 'q', supportsQuery: true, openMode: 'prefill' },
  { name: 'Copilot', icon: 'Copilot', iconMarkup: botIcons.Copilot.iconMarkup, url: 'https://copilot.microsoft.com/', promptParam: 'q', supportsQuery: true, openMode: 'prefill' },
];

const state = loadState();

const el = (id) => document.getElementById(id);
const nodes = {
  themeToggle: el('themeToggle'),
  sunIcon: el('sunIcon'),
  moonIcon: el('moonIcon'),
  titleInput: el('titleInput'),
  tagsInput: el('tagsInput'),
  toggleNotes: el('toggleNotes'),
  notesWrap: el('notesWrap'),
  notesInput: el('notesInput'),
  charCount: el('charCount'),
  promptInput: el('promptInput'),
  varsSection: el('varsSection'),
  resetVarsBtn: el('resetVarsBtn'),
  varsList: el('varsList'),
  toggleFilledPreview: el('toggleFilledPreview'),
  missingVarsHint: el('missingVarsHint'),
  previewChevron: el('previewChevron'),
  filledPreviewWrapper: el('filledPreviewWrapper'),
  filledPreview: el('filledPreview'),
  copyFilledBtn: el('copyFilledBtn'),
  shareBtn: el('shareBtn'),
  templateLibraryBtn: el('templateLibraryBtn'),
  clearBtn: el('clearBtn'),
  chatbotButtons: el('chatbotButtons'),
  toast: el('toast'),
  toastText: el('toastText'),
  toastAction: el('toastAction'),
  shareModal: el('shareModal'),
  shareTitle: el('shareTitle'),
  closeShareModal: el('closeShareModal'),
  shareLinkInput: el('shareLinkInput'),
  includeVarsInLink: el('includeVarsInLink'),
  includeMetaInLink: el('includeMetaInLink'),
  canonicalizeInLink: el('canonicalizeInLink'),
  copyLinkBtn: el('copyLinkBtn'),
  nativeShareWrapper: el('nativeShareWrapper'),
  nativeShareBtn: el('nativeShareBtn'),
  shareFilledPreview: el('shareFilledPreview'),
  copyFilledFromModalBtn: el('copyFilledFromModalBtn'),
  shareTemplatePreview: el('shareTemplatePreview'),
  copyTemplateBtn: el('copyTemplateBtn'),
  shareMessagePreview: el('shareMessagePreview'),
  copyMessageBtn: el('copyMessageBtn'),
  clearConfirmModal: el('clearConfirmModal'),
  closeClearConfirmModal: el('closeClearConfirmModal'),
  cancelClearBtn: el('cancelClearBtn'),
  confirmClearBtn: el('confirmClearBtn'),
  fabButton: el('fabButton'),
  customChatbotModal: el('customChatbotModal'),
  closeCustomChatbotModal: el('closeCustomChatbotModal'),
  customBotName: el('customBotName'),
  customBotIcon: el('customBotIcon'),
  customBotUrl: el('customBotUrl'),
  customBotSupportsQuery: el('customBotSupportsQuery'),
  saveCustomChatbotBtn: el('saveCustomChatbotBtn'),
  templateLibraryModal: el('templateLibraryModal'),
  closeTemplateLibrary: el('closeTemplateLibrary'),
  saveToLibraryBtn: el('saveToLibraryBtn'),
  exportTemplatesBtn: el('exportTemplatesBtn'),
  importTemplatesBtn: el('importTemplatesBtn'),
  importTemplatesInput: el('importTemplatesInput'),
  templateList: el('templateList'),
};

let activeShareTab = 'link';
let toastTimer = null;

initialize();

function initialize() {
  bindInputs();
  bindActions();
  hydrateFromUrl();
  applyTheme(loadTheme());
  renderAll();
}

function bindInputs() {
  nodes.titleInput.value = state.title;
  nodes.tagsInput.value = state.tags;
  nodes.promptInput.value = state.prompt;
  nodes.notesInput.value = state.notes;
  nodes.toggleNotes.checked = Boolean(state.showNotes);
  nodes.notesWrap.classList.toggle('hidden', !state.showNotes);

  [
    ['input', nodes.titleInput, (value) => (state.title = value)],
    ['input', nodes.tagsInput, (value) => (state.tags = value)],
    ['input', nodes.promptInput, (value) => (state.prompt = value)],
    ['input', nodes.notesInput, (value) => (state.notes = value)],
  ].forEach(([event, node, setter]) => {
    node.addEventListener(event, () => {
      setter(node.value);
      persistAndRender();
    });
  });

  nodes.toggleNotes.addEventListener('change', () => {
    state.showNotes = nodes.toggleNotes.checked;
    nodes.notesWrap.classList.toggle('hidden', !state.showNotes);
    persistAndRender();
  });
}

function bindActions() {
  nodes.themeToggle?.addEventListener('click', () => {
    const next = loadTheme() === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    saveTheme(next);
    toast(`Theme set to ${next}`);
  });

  nodes.resetVarsBtn?.addEventListener('click', () => {
    state.variables = {};
    renderAll();
    persist();
  });

  nodes.toggleFilledPreview?.addEventListener('click', () => {
    nodes.filledPreviewWrapper.classList.toggle('hidden');
    nodes.previewChevron.textContent = nodes.filledPreviewWrapper.classList.contains('hidden') ? '▾' : '▴';
  });

  nodes.copyFilledBtn?.addEventListener('click', () => copyText(getFilledPrompt()));
  nodes.shareBtn?.addEventListener('click', () => openShareModal('link'));
  nodes.templateLibraryBtn?.addEventListener('click', () => openModal(nodes.templateLibraryModal));
  nodes.clearBtn?.addEventListener('click', () => openModal(nodes.clearConfirmModal));
  nodes.closeShareModal?.addEventListener('click', closeShareModal);
  nodes.shareModal?.addEventListener('click', (event) => {
    if (event.target === nodes.shareModal) closeShareModal();
  });
  nodes.copyLinkBtn?.addEventListener('click', () => copyText(nodes.shareLinkInput.value));
  nodes.nativeShareBtn?.addEventListener('click', shareNatively);
  nodes.copyFilledFromModalBtn?.addEventListener('click', () => copyText(getFilledPrompt()));
  nodes.copyTemplateBtn?.addEventListener('click', () => copyText(getTemplateText()));
  nodes.copyMessageBtn?.addEventListener('click', () => copyText(getMessageText()));
  ['link', 'filled', 'template', 'message'].forEach((tab) => {
    const button = el(`tab-${tab}`);
    button?.addEventListener('click', () => {
      activeShareTab = tab;
      updateSharePreview();
    });
  });
  nodes.closeClearConfirmModal?.addEventListener('click', closeClearConfirmModal);
  nodes.cancelClearBtn?.addEventListener('click', closeClearConfirmModal);
  nodes.confirmClearBtn?.addEventListener('click', () => {
    state.title = '';
    state.tags = '';
    state.prompt = '';
    state.notes = '';
    state.variables = {};
    state.showNotes = false;
    nodes.toggleNotes.checked = false;
    nodes.notesWrap.classList.add('hidden');
    closeClearConfirmModal();
    renderAll();
    persist();
    toast('Draft cleared');
  });
  nodes.fabButton?.addEventListener('click', () => openModal(nodes.customChatbotModal));
  nodes.closeCustomChatbotModal?.addEventListener('click', closeCustomChatbotModal);
  nodes.saveCustomChatbotBtn?.addEventListener('click', saveCustomBot);
  nodes.closeTemplateLibrary?.addEventListener('click', closeTemplateLibrary);
  nodes.saveToLibraryBtn?.addEventListener('click', saveTemplate);
  nodes.exportTemplatesBtn?.addEventListener('click', exportTemplates);
  nodes.importTemplatesBtn?.addEventListener('click', () => nodes.importTemplatesInput.click());
  nodes.importTemplatesInput?.addEventListener('change', importTemplates);
  nodes.includeVarsInLink?.addEventListener('change', updateSharePreview);
  nodes.includeMetaInLink?.addEventListener('change', updateSharePreview);
  nodes.canonicalizeInLink?.addEventListener('change', updateSharePreview);

  [
    nodes.shareModal,
    nodes.clearConfirmModal,
    nodes.customChatbotModal,
    nodes.templateLibraryModal,
  ].forEach((modal) => {
    modal?.addEventListener('click', (event) => {
      if (event.target === modal) modal.classList.add('hidden');
    });
  });
}

function hydrateFromUrl() {
  const params = new URLSearchParams(location.search);
  const data = params.get('data');
  if (!data) return;

  try {
    const parsed = JSON.parse(decodeURIComponent(atob(decodeURIComponent(data))));
    Object.assign(state, mergeState(parsed));
  } catch {
    toast('Could not read share data');
  }
}

function mergeState(partial) {
  const next = { ...DEFAULT_STATE };
  if (partial && typeof partial === 'object') {
    next.title = String(partial.title || '');
    next.tags = String(partial.tags || '');
    next.prompt = String(partial.prompt || '');
    next.notes = String(partial.notes || '');
    next.showNotes = Boolean(partial.showNotes);
    next.variables = isPlainObject(partial.variables) ? partial.variables : {};
    next.customBots = Array.isArray(partial.customBots) ? partial.customBots : [];
    next.templates = Array.isArray(partial.templates) ? partial.templates : [];
  }
  return next;
}

function renderAll() {
  nodes.titleInput.value = state.title;
  nodes.tagsInput.value = state.tags;
  nodes.promptInput.value = state.prompt;
  nodes.notesInput.value = state.notes;
  nodes.toggleNotes.checked = Boolean(state.showNotes);
  nodes.notesWrap.classList.toggle('hidden', !state.showNotes);

  nodes.charCount.textContent = `${state.prompt.length} chars`;
  renderVariables();
  renderFilledPreview();
  renderLaunchers();
  renderTemplates();
  updateSharePreview();
  persist();
}

function renderVariables() {
  const variables = Array.from(new Set(extractVariables(getSourceText())));
  if (variables.length === 0) {
    nodes.varsList.innerHTML = '<p class="text-sm text-white/[0.55]">No variables detected. Use double braces like <code>{{name}}</code>.</p>';
    return;
  }

  nodes.varsList.innerHTML = variables
    .map((name) => {
      const value = state.variables[name] || '';
      return `
        <label class="grid gap-2">
          <span class="field-label">${escapeHtml(name)}</span>
          <input data-var="${escapeHtml(name)}" class="input-shell" type="text" value="${escapeHtml(value)}" />
        </label>
      `;
    })
    .join('');

  nodes.varsList.querySelectorAll('[data-var]').forEach((input) => {
    input.addEventListener('input', () => {
      state.variables[input.dataset.var] = input.value;
      renderFilledPreview();
      updateSharePreview();
      persist();
    });
  });
}

function renderFilledPreview() {
  const filled = getFilledPrompt();
  const missing = extractVariables(getSourceText()).filter((name) => !String(state.variables[name] || '').trim());
  nodes.filledPreview.textContent = filled || 'Nothing to preview yet.';
  nodes.missingVarsHint.textContent = missing.length ? `Missing values: ${missing.join(', ')}` : 'All placeholders are filled.';
}

function renderLaunchers() {
  const bots = [...BOT_TEMPLATES, ...state.customBots];
  nodes.chatbotButtons.innerHTML = bots
    .map((bot) => `
      <button data-bot="${escapeHtml(bot.name)}" class="group flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4 text-left transition hover:border-white/20 hover:bg-white/[0.08]" type="button">
        <span class="flex items-center gap-3">
          <span class="flex h-10 w-10 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-slate-950/60 text-lg text-white">
            ${bot.iconMarkup || escapeHtml(bot.icon || bot.name.slice(0, 1))}
          </span>
          <span>
            <span class="block text-sm font-bold text-white">${escapeHtml(bot.name)}</span>
            <span class="block text-xs text-white/[0.5]">${bot.supportsQuery ? 'prefilled' : 'copy/open'}</span>
          </span>
        </span>
        <span class="text-white/[0.35] transition group-hover:text-white">↗</span>
      </button>
    `)
    .join('');

  nodes.chatbotButtons.querySelectorAll('[data-bot]').forEach((button) => {
    button.addEventListener('click', () => {
      const bot = bots.find((item) => item.name === button.dataset.bot);
      if (!bot) return;
      launchBot(bot);
    });
  });
}

function renderTemplates() {
  if (state.templates.length === 0) {
    nodes.templateList.innerHTML = '<p class="text-sm text-white/[0.55]">No saved templates yet.</p>';
    return;
  }

  nodes.templateList.innerHTML = state.templates
    .map(
      (template, index) => `
        <article class="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <div class="flex items-start justify-between gap-3">
            <div>
              <h3 class="text-base font-bold text-white">${escapeHtml(template.title || 'Untitled')}</h3>
      <p class="mt-1 text-sm text-white/[0.55]">${escapeHtml(template.tags || '')}</p>
            </div>
            <button data-template-remove="${index}" class="action-btn" type="button">Remove</button>
          </div>
          <p class="mt-3 line-clamp-3 text-sm leading-6 text-white/70">${escapeHtml(template.prompt || '')}</p>
          <div class="mt-4 flex flex-wrap gap-3">
            <button data-template-load="${index}" class="action-btn" type="button">Load</button>
          </div>
        </article>
      `
    )
    .join('');

  nodes.templateList.querySelectorAll('[data-template-load]').forEach((button) => {
    button.addEventListener('click', () => {
      const template = state.templates[Number(button.dataset.templateLoad)];
      if (!template) return;
      state.title = template.title || '';
      state.tags = template.tags || '';
      state.prompt = template.prompt || '';
      state.notes = template.notes || '';
      state.showNotes = Boolean(template.notes);
      state.variables = template.variables || {};
      renderAll();
      toast('Template loaded');
    });
  });

  nodes.templateList.querySelectorAll('[data-template-remove]').forEach((button) => {
    button.addEventListener('click', () => {
      state.templates.splice(Number(button.dataset.templateRemove), 1);
      renderTemplates();
      persist();
    });
  });
}

function launchBot(bot) {
  const prompt = getFilledPrompt();
  const encoded = encodeURIComponent(prompt);
  const url = bot.url.includes('{{prompt}}')
    ? bot.url.replaceAll('{{prompt}}', encoded)
    : bot.supportsQuery
      ? `${bot.url}${bot.url.includes('?') ? '&' : '?'}${bot.promptParam || 'q'}=${encoded}`
      : bot.url;

  if (bot.supportsQuery || bot.openMode === 'prefill') {
    window.open(url, '_blank', 'noopener,noreferrer');
    toast(`Opened ${bot.name}`);
    return;
  }

  copyText(prompt);
  window.open(url, '_blank', 'noopener,noreferrer');
  toast(`${bot.name} opened, prompt copied`);
}

function openShareModal(tab) {
  activeShareTab = tab;
  nodes.shareModal.classList.remove('hidden');
  nodes.shareModal.classList.add('flex');
  updateSharePreview();
}

function closeShareModal() {
  nodes.shareModal.classList.add('hidden');
  nodes.shareModal.classList.remove('flex');
}

function getSourceText() {
  return [state.title, state.tags, state.notes, state.prompt].filter(Boolean).join('\n');
}

function getFilledPrompt() {
  const base = stripVariables(state.prompt);
  return replaceVariables(base, state.variables);
}

function getTemplateText() {
  return [state.title && `Title: ${state.title}`, state.tags && `Tags: ${state.tags}`, state.prompt]
    .filter(Boolean)
    .join('\n\n');
}

function getMessageText() {
  return [state.title, state.tags, getFilledPrompt()].filter(Boolean).join('\n\n');
}

function saveTemplate() {
  state.templates.unshift({
    title: state.title,
    tags: state.tags,
    prompt: state.prompt,
    notes: state.notes,
    variables: state.variables,
  });
  state.templates = state.templates.slice(0, 20);
  renderTemplates();
  persist();
  toast('Template saved');
}

function exportTemplates() {
  const blob = new Blob([JSON.stringify(state.templates, null, 2)], { type: 'application/json' });
  downloadBlob(blob, 'prompt-launcher-templates.json');
}

async function importTemplates(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const text = await file.text();
  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) {
      state.templates = parsed;
      renderTemplates();
      persist();
      toast('Templates imported');
    }
  } catch {
    toast('Invalid template file');
  } finally {
    event.target.value = '';
  }
}

function saveCustomBot() {
  const bot = {
    name: nodes.customBotName.value.trim(),
    icon: nodes.customBotIcon.value.trim(),
    url: nodes.customBotUrl.value.trim(),
    supportsQuery: nodes.customBotSupportsQuery.checked,
    promptParam: 'q',
    openMode: 'prefill',
  };
  if (!bot.name || !bot.url) {
    toast('Add a name and URL');
    return;
  }
  state.customBots.unshift(bot);
  state.customBots = state.customBots.slice(0, 20);
  closeCustomChatbotModal();
  renderLaunchers();
  persist();
  toast('Custom bot saved');
}

function closeCustomChatbotModal() {
  nodes.customChatbotModal.classList.add('hidden');
  nodes.customChatbotModal.classList.remove('flex');
}

function openModal(modal) {
  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

function closeTemplateLibrary() {
  nodes.templateLibraryModal.classList.add('hidden');
  nodes.templateLibraryModal.classList.remove('flex');
}

function closeClearConfirmModal() {
  nodes.clearConfirmModal.classList.add('hidden');
  nodes.clearConfirmModal.classList.remove('flex');
}

function shareNatively() {
  const shareData = {
    title: state.title || 'Prompt Launcher',
    text: getMessageText(),
    url: nodes.shareLinkInput.value,
  };
  if (navigator.share) {
    navigator.share(shareData).catch(() => {});
  } else {
    copyText(shareData.url);
  }
}

function copyText(text) {
  navigator.clipboard?.writeText(text);
  toast('Copied to clipboard');
}

function persistAndRender() {
  renderAll();
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    return mergeState(parsed);
  } catch {
    return { ...DEFAULT_STATE };
  }
}

function loadTheme() {
  return localStorage.getItem(THEME_KEY) || 'dark';
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  const dark = theme === 'dark';
  nodes.sunIcon?.classList.toggle('hidden', !dark);
  nodes.moonIcon?.classList.toggle('hidden', dark);
  document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
}

function saveTheme(theme) {
  localStorage.setItem(THEME_KEY, theme);
}

function toast(message) {
  if (!nodes.toast) return;
  clearTimeout(toastTimer);
  nodes.toastText.textContent = message;
  nodes.toast.classList.remove('hidden');
  toastTimer = window.setTimeout(() => nodes.toast.classList.add('hidden'), 2200);
}

function updateSharePreview() {
  const payload = {
    title: nodes.includeMetaInLink.checked ? state.title : '',
    tags: nodes.includeMetaInLink.checked ? state.tags : '',
    prompt: nodes.includeVarsInLink.checked ? state.prompt : stripVariables(state.prompt),
    notes: nodes.includeMetaInLink.checked ? state.notes : '',
    showNotes: state.showNotes && nodes.includeMetaInLink.checked,
    variables: nodes.includeVarsInLink.checked ? state.variables : {},
    customBots: state.customBots,
    templates: state.templates,
  };

  const base = location.origin + location.pathname;
  const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
  const query = nodes.canonicalizeInLink.checked ? canonicalizeQuery(payload) : `data=${encodeURIComponent(encoded)}`;
  nodes.shareLinkInput.value = `${base}?${query}`;

  nodes.shareFilledPreview.classList.toggle('hidden', activeShareTab !== 'filled');
  nodes.shareTemplatePreview.classList.toggle('hidden', activeShareTab !== 'template');
  nodes.shareMessagePreview.classList.toggle('hidden', activeShareTab !== 'message');

  if (activeShareTab === 'filled') {
    nodes.shareFilledPreview.textContent = getFilledPrompt();
  }
  if (activeShareTab === 'template') {
    nodes.shareTemplatePreview.textContent = getTemplateText();
  }
  if (activeShareTab === 'message') {
    nodes.shareMessagePreview.textContent = getMessageText();
  }

  nodes.nativeShareWrapper.textContent = navigator.share ? '' : 'Native share not available in this browser.';
}

function canonicalizeQuery(payload) {
  const compact = {
    title: payload.title.trim(),
    tags: payload.tags.trim().replace(/\s*,\s*/g, ', '),
    prompt: payload.prompt.replace(/\r\n/g, '\n').trim(),
    notes: payload.notes.trim(),
    showNotes: payload.showNotes,
    variables: payload.variables,
    customBots: payload.customBots,
    templates: payload.templates,
  };
  return `data=${encodeURIComponent(btoa(unescape(encodeURIComponent(JSON.stringify(compact)))))}`;
}

function stripVariables(text) {
  return String(text || '').replace(/\{\{[^}]+\}\}/g, '').replace(/\n{3,}/g, '\n\n').trim();
}

function replaceVariables(text, values) {
  return String(text || '').replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_, name) => {
    const value = values?.[name.trim()];
    return value == null || value === '' ? `{{${name}}}` : String(value);
  });
}

function extractVariables(text) {
  return [...new Set((String(text || '').match(/\{\{\s*([^}]+?)\s*\}\}/g) || []).map((item) => item.replace(/\{\{|\}\}/g, '').trim()).filter(Boolean))];
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
