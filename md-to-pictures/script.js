marked.setOptions({ breaks: true, gfm: true });

marked.use({
  extensions: [{
    name: 'highlight',
    level: 'inline',
    start(src) { return src.indexOf('=='); },
    tokenizer(src) {
      const match = src.match(/^==([^=\n]+?)==/);
      if (match) {
        return { type: 'highlight', raw: match[0], text: match[1] };
      }
    },
    renderer(token) {
      return `<mark>${marked.parseInline(token.text)}</mark>`;
    },
  }],
});

/* ═══════════════════════════════════════
   FONT PAIRINGS
   All fonts are on Google Fonts CDN.
   loadFontPairing() swaps the <link> href
   so only fonts in use are downloaded.
═══════════════════════════════════════ */
const FONT_PAIRINGS = {
  scholar: {
    url:     'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;1,600&family=Lato:wght@300;400;700&family=Amiri:ital,wght@0,400;0,700;1,400;1,700&display=swap',
    heading: "'Playfair Display', Georgia, 'Times New Roman', serif",
    body:    "'Lato', system-ui, -apple-system, sans-serif"
  },
  editorial: {
    url:     'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;0,700;1,600&family=Source+Sans+3:wght@300;400;700&family=Amiri:ital,wght@0,400;0,700;1,400;1,700&display=swap',
    heading: "'Cormorant Garamond', Georgia, 'Times New Roman', serif",
    body:    "'Source Sans 3', system-ui, -apple-system, sans-serif"
  },
  minimal: {
    url:     'https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,300;0,500;0,700;1,500&family=Amiri:ital,wght@0,400;0,700;1,400;1,700&display=swap',
    heading: "'DM Sans', system-ui, -apple-system, sans-serif",
    body:    "'DM Sans', system-ui, -apple-system, sans-serif"
  },
  spiritual: {
    url:     'https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400;1,700&family=Lato:wght@300;400&display=swap',
    heading: "'Amiri', 'Traditional Arabic', Georgia, serif",
    body:    "'Amiri', Georgia, serif"
  },
  luxury: {
    url:     'https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Source+Sans+3:wght@300;400;700&family=Amiri:ital,wght@0,400;0,700;1,400;1,700&display=swap',
    heading: "'Libre Baskerville', Georgia, 'Times New Roman', serif",
    body:    "'Source Sans 3', system-ui, -apple-system, sans-serif"
  },
  humanist: {
    url:     'https://fonts.googleapis.com/css2?family=Merriweather:ital,wght@0,700;0,900;1,700&family=Open+Sans:wght@300;400;700&family=Amiri:ital,wght@0,400;0,700;1,400;1,700&display=swap',
    heading: "'Merriweather', Georgia, 'Times New Roman', serif",
    body:    "'Open Sans', system-ui, -apple-system, sans-serif"
  },
  atkinson: {
    url:     'https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible+Next:ital,wght@0,400;0,700;1,400;1,700&display=swap',
    heading: "'Atkinson Hyperlegible Next', system-ui, -apple-system, sans-serif",
    body:    "'Atkinson Hyperlegible Next', system-ui, -apple-system, sans-serif"
  }
};

/* ── WebP export support detection (Safari returns PNG silently) ── */
const SUPPORTS_WEBP_EXPORT = (() => {
  try {
    const c = document.createElement('canvas');
    c.width = c.height = 1;
    return c.toDataURL('image/webp').startsWith('data:image/webp');
  } catch (e) { return false; }
})();

async function loadFontPairing(key) {
  const pairing = FONT_PAIRINGS[key] || FONT_PAIRINGS.scholar;
  const link = document.getElementById('gfonts-link');
  if (link && link.href !== pairing.url) {
    link.href = pairing.url;
    // Give the browser a tick to start parsing the new stylesheet
    await new Promise(r => setTimeout(r, 50));
  }
  // Await actual font readiness — resolves only when glyphs are available
  const headingFamily = pairing.heading.split(',')[0].replace(/'/g, '').trim();
  const bodyFamily    = pairing.body.split(',')[0].replace(/'/g, '').trim();
  try {
    await Promise.all([
      document.fonts.load(`700 80px "${headingFamily}"`),
      document.fonts.load(`300 40px "${bodyFamily}"`),
      document.fonts.load(`400 52px "Amiri"`), // always needed for Arabic
    ]);
  } catch (e) {
    // Fallback for very old browsers that lack the Font Loading API
    await new Promise(r => setTimeout(r, 900));
  }
  return { ...pairing, measure: buildMeasureFonts(pairing) };
}

/* ── Light themes (dark texture at low opacity) ── */
const LIGHT_THEMES = new Set(['cream', 'forest', 'rose', 'parchment', 'sand', 'contrast']);
const SETTINGS_STORAGE_KEY = 'md-to-pictures.settings.v1';

const controls = {
  theme: document.getElementById('theme-select'),
  density: document.getElementById('density-select'),
  font: document.getElementById('font-select'),
  texture: document.getElementById('texture-select'),
  safeZone: document.getElementById('safezone-toggle'),
  watermark: document.getElementById('watermark-input'),
  coverTitle: document.getElementById('cover-title-input'),
  coverSubtitle: document.getElementById('cover-subtitle-input'),
  format: document.getElementById('format-select'),
  quality: document.getElementById('quality-range'),
  qualityGroup: document.getElementById('quality-group'),
  qualityLabel: document.getElementById('quality-label'),
  preflight: document.getElementById('preflight'),
};

function getSettingsStore() {
  try {
    return window.localStorage;
  } catch (e) {
    return null;
  }
}

function syncFormatUi() {
  const isPng = controls.format.value === 'png';
  controls.qualityGroup.classList.toggle('hidden', isPng);
}

function syncQualityUi() {
  controls.qualityLabel.textContent = `${controls.quality.value}%`;
  controls.quality.setAttribute('aria-valuetext', `${controls.quality.value} percent`);
}

function readUiSettings() {
  return {
    theme: controls.theme.value,
    density: controls.density.value,
    font: controls.font.value,
    texture: controls.texture.value,
    safeZone: controls.safeZone?.checked ?? false,
    watermark: controls.watermark.value,
    coverTitle: controls.coverTitle.value,
    coverSubtitle: controls.coverSubtitle.value,
    format: controls.format.value,
    quality: controls.quality.value,
  };
}

function applyUiSettings(settings) {
  if (!settings || typeof settings !== 'object') return;
  if (settings.theme) controls.theme.value = settings.theme;
  if (settings.density) controls.density.value = settings.density;
  if (settings.font) controls.font.value = settings.font;
  if (settings.texture) controls.texture.value = settings.texture;
  if (settings.safeZone !== undefined && controls.safeZone) controls.safeZone.checked = settings.safeZone === true || settings.safeZone === 'true';
  if (settings.watermark !== undefined) controls.watermark.value = settings.watermark;
  if (settings.coverTitle !== undefined) controls.coverTitle.value = settings.coverTitle;
  if (settings.coverSubtitle !== undefined) controls.coverSubtitle.value = settings.coverSubtitle;
  if (settings.format) controls.format.value = settings.format;
  if (settings.quality) controls.quality.value = settings.quality;
  syncFormatUi();
  syncQualityUi();
}

function saveUiSettings() {
  const store = getSettingsStore();
  if (!store) return;
  try {
    store.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(readUiSettings()));
  } catch (e) {
    // Ignore storage quota and privacy-mode failures.
  }
}

function readUrlSettings() {
  const params = new URLSearchParams(window.location.search);
  const settings = {};
  for (const key of ['theme', 'density', 'font', 'texture', 'safeZone', 'watermark', 'coverTitle', 'coverSubtitle', 'format', 'quality']) {
    if (params.has(key)) settings[key] = params.get(key);
  }
  return settings;
}

function syncShareableUrl() {
  try {
    const url = new URL(window.location.href);
    const settings = readUiSettings();
    for (const [key, value] of Object.entries(settings)) {
      if (value) {
        url.searchParams.set(key, value);
      } else {
        url.searchParams.delete(key);
      }
    }
    history.replaceState(null, '', url);
  } catch (e) {
    // Ignore environments that do not allow history updates.
  }
}

function restoreUiSettings() {
  const store = getSettingsStore();
  const urlSettings = readUrlSettings();
  const hasUrlSettings = Object.keys(urlSettings).length > 0;

  try {
    if (store) {
      const raw = store.getItem(SETTINGS_STORAGE_KEY);
      if (raw) {
        applyUiSettings(JSON.parse(raw));
      }
    }
  } catch (e) {
    // Ignore malformed saved state and fall back to defaults.
  }

  applyUiSettings(urlSettings);
  syncFormatUi();
  syncQualityUi();
  try {
    const url = new URL(window.location.href);
    if (url.searchParams.has('preset')) {
      url.searchParams.delete('preset');
      history.replaceState(null, '', url);
    }
  } catch (e) {
    // Ignore environments that do not allow history updates.
  }
  if (hasUrlSettings) syncShareableUrl();
}

restoreUiSettings();
setPreflightIdle('Paste markdown to estimate card count and surface validation notes.');

function onManualSettingChange() {
  saveUiSettings();
  syncShareableUrl();
  schedulePreflight();
}

const CARD_CONTENT_WIDTH = 784;
const CARD_BODY_H = 1352;

function firstFontFamily(stack) {
  return stack.split(',')[0].replace(/['"]/g, '').trim();
}

function buildMeasureFonts(pairing) {
  const headingFamily = firstFontFamily(pairing.heading);
  const bodyFamily = firstFontFamily(pairing.body);

  return {
    heading1: `700 80px "${headingFamily}"`,
    heading2: `600 60px "${headingFamily}"`,
    heading3: `italic 500 46px "${headingFamily}"`,
    body:     `300 40px "${bodyFamily}"`,
    quote:    `italic 600 41px "${headingFamily}"`,
    code:     '400 30px "Courier New"',
    table:    `300 34px "${bodyFamily}"`,
    arabic:   '400 52px "Amiri"',
  };
}

let pretextModulePromise = null;
const pretextHeightCache = new Map();

async function getPretextModule() {
  pretextModulePromise ??= import('./vendor/pretext/layout.js')
    .catch(() => import('https://cdn.jsdelivr.net/npm/@chenglou/pretext/+esm'));
  return pretextModulePromise;
}

async function measureTextHeight(text, font, width, lineHeight, whiteSpace = 'normal') {
  const key = `${font}::${width}::${lineHeight}::${whiteSpace}::${text}`;
  if (pretextHeightCache.has(key)) return pretextHeightCache.get(key);

  const { prepare, layout } = await getPretextModule();
  const prepared = prepare(text, font, { whiteSpace });
  const height = layout(prepared, width, lineHeight).height;
  pretextHeightCache.set(key, height);
  return height;
}

function stripListMarker(line) {
  return line.replace(/^(\s*)(?:[-*+]|(?:\d+\.))\s+/, '$1').trim();
}

function stripQuoteMarker(line) {
  return line.replace(/^>\s?/, '').trim();
}

function stripFenceContent(block) {
  const lines = block.trim().split('\n');
  if (lines.length <= 2) return '';
  return lines.slice(1, -1).join('\n').trim();
}

async function estimateBlockHeight(block, pairing) {
  const trimmed = block.trim();
  if (!trimmed) return 0;

  const first = trimmed.split('\n')[0].trim();
  const measure = pairing.measure || buildMeasureFonts(pairing);

  try {
    if (/^#{1,3}\s/.test(first)) {
      const level = first.match(/^#{1,3}/)[0].length;
      const text = trimmed.replace(/^#{1,3}\s+/, '').trim();
      const font = level === 1 ? measure.heading1 : level === 2 ? measure.heading2 : measure.heading3;
      const lineHeight = level === 1 ? 88 : level === 2 ? 70 : 57.5;
      const marginBottom = level === 1 ? 40 : level === 2 ? 32 : 28;
      return (await measureTextHeight(text, font, CARD_CONTENT_WIDTH, lineHeight, 'pre-wrap')) + marginBottom;
    }

    if (/^```/.test(first)) {
      const code = stripFenceContent(trimmed);
      const font = isArabic(code) ? measure.arabic : measure.code;
      const lineHeight = isArabic(code) ? 117 : 49.5;
      const paddingY = 56;
      const marginY = isArabic(code) ? 68 : 64;
      return (await measureTextHeight(code, font, CARD_CONTENT_WIDTH - 64, lineHeight, 'pre-wrap')) + paddingY + marginY;
    }

    if (/^>/.test(first)) {
      const quoteBlocks = trimmed
        .split(/\n{2,}/)
        .map(part => part.split('\n').map(stripQuoteMarker).join('\n').trim())
        .filter(Boolean);
      let total = 0;
      for (const quote of quoteBlocks) {
        total += await measureTextHeight(quote, measure.quote, CARD_CONTENT_WIDTH - 104, 69.7, 'pre-wrap');
        total += 16;
      }
      return total + 60;
    }

    if (/^[-*+] |^\d+\. /.test(first)) {
      const items = trimmed.split('\n').filter(Boolean);
      let total = 34;
      for (const rawItem of items) {
        const indent = (rawItem.match(/^\s*/) || [''])[0].length;
        const nestedLevel = Math.min(Math.floor(indent / 2), 4);
        const item = stripListMarker(rawItem);
        const width = Math.max(CARD_CONTENT_WIDTH - 52 - (nestedLevel * 36), 360);
        total += await measureTextHeight(item, measure.body, width, 74, 'pre-wrap');
        total += nestedLevel > 0 ? 18 : 16;
      }
      return total;
    }

    if (/^\|/.test(first) || /\|/.test(trimmed)) {
      const rows = trimmed.split('\n').filter(line => line.trim());
      const textRows = rows
        .filter(line => !/^\s*\|?\s*:?[-=]+:?\s*(?:\|\s*:?[-=]+:?\s*)*\|?\s*$/.test(line))
        .map(line => line.replace(/^\s*\|?/, '').replace(/\|?\s*$/, '').replace(/\s*\|\s*/g, '  '))
        .filter(Boolean);
      let total = 0;
      for (const row of textRows) {
        total += await measureTextHeight(row, measure.table, CARD_CONTENT_WIDTH, 54.4, 'pre-wrap');
      }
      return total + 38;
    }

    const plain = trimmed.replace(/\s+/g, ' ').trim();
    if (!plain) return 0;
    return (await measureTextHeight(plain, measure.body, CARD_CONTENT_WIDTH, 74, 'pre-wrap')) + 34;
  } catch (err) {
    return null;
  }
}

function fallbackBlockWeight(block) {
  const first = block.trim().split('\n')[0];
  if (/^# /.test(first))   return 7;
  if (/^## /.test(first))  return 6;
  if (/^### /.test(first)) return 5;
  if (/^```/.test(first))  return isArabic(block) ? 8 : 5;
  if (/^>/.test(first))    return 5;
  if (/^[-*+] |^\d+\. /.test(first)) {
    return block.split('\n').filter(l => l.trim()).length * 2 + 1;
  }
  return Math.ceil(block.replace(/\s+/g, ' ').length / 52);
}

function collectMarkdownBlocks(md) {
  const blocks = [];
  let inFence = false;
  let fenceBuf = [];
  let textBuf = [];

  const flushText = () => {
    const joined = textBuf.join('\n').trim();
    if (joined) {
      joined.split(/\n{2,}/).forEach(b => {
        if (b.trim()) blocks.push(b.trim());
      });
    }
    textBuf = [];
  };

  for (const line of md.split('\n')) {
    if (!inFence && line.trim().startsWith('```')) {
      flushText();
      inFence = true;
      fenceBuf = [line];
    } else if (inFence) {
      fenceBuf.push(line);
      if (line.trim() === '```' || (line.trim().startsWith('```') && fenceBuf.length > 1)) {
        inFence = false;
        blocks.push(fenceBuf.join('\n'));
        fenceBuf = [];
      }
    } else if (line.trim() === '+++') {
      flushText();
      blocks.push(PAGE_BREAK_SENTINEL);
    } else {
      textBuf.push(line);
    }
  }
  flushText();
  if (fenceBuf.length) blocks.push(fenceBuf.join('\n'));
  return blocks;
}

function validateMarkdown(md) {
  const issues = [];
  const lines = md.split('\n');
  const fenceStarts = lines.reduce((count, line) => count + (line.trim().startsWith('```') ? 1 : 0), 0);
  if (fenceStarts % 2 === 1) {
    issues.push({ kind: 'warn', title: 'Unclosed fence', text: 'A code fence appears to be unclosed.' });
  }

  const blocks = md.split(/\n{2,}/).map(b => b.trim()).filter(Boolean);
  const longBlock = blocks.find(block => block.length > 1800 || block.split('\n').length > 28);
  if (longBlock) {
    issues.push({ kind: 'warn', title: 'Long section', text: 'One section is very long and may span multiple cards.' });
  }

  for (let i = 0; i < lines.length - 1; i++) {
    const line = lines[i].trim();
    if (!line.includes('|') || line.startsWith('```')) continue;
    const next = lines[i + 1].trim();
    const rowLike = /^\|.*\|$/.test(line) || line.includes('|');
    const separatorLike = /^\s*\|?\s*:?[-=]+:?\s*(?:\|\s*:?[-=]+:?\s*)*\|?\s*$/.test(next);
    if (rowLike && !separatorLike && !next.includes('|')) {
      issues.push({ kind: 'warn', title: 'Possible table issue', text: `Table-like content near line ${i + 1} may be malformed.` });
      break;
    }
  }

  return issues;
}

let preflightTimer = null;
let preflightSeq = 0;
let jszipModulePromise = null;

async function getZipModule() {
  if (window.JSZip) return { default: window.JSZip };
  jszipModulePromise ??= import('https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm');
  return jszipModulePromise;
}

function renderPreflightPanel(state) {
  if (!controls.preflight) return;

  const themeLabel = controls.theme.options[controls.theme.selectedIndex]?.textContent || controls.theme.value;

  const warnings = state.issues || [];
  const warningCount = warnings.length;
  const countLabel = `${state.cards} card${state.cards === 1 ? '' : 's'}`;

  controls.preflight.innerHTML = `
    <div class="preflight-meta">
      <span class="preflight-badge">${countLabel} estimated</span>
      <span>${themeLabel} theme</span>
    </div>
    <div class="preflight-title">Preflight</div>
    <div class="preflight-list">
      ${warningCount > 0
        ? warnings.map(issue => `<div class="preflight-item" data-kind="${issue.kind || 'info'}"><strong>${issue.title}:</strong> ${issue.text}</div>`).join('')
        : '<div class="preflight-item" data-kind="info">No validation issues detected.</div>'}
    </div>`;
}

function setPreflightIdle(message) {
  if (!controls.preflight) return;
  controls.preflight.innerHTML = `
    <div class="preflight-meta">
      <span class="preflight-badge">Preflight</span>
      <span>Live estimate</span>
    </div>
    <div class="preflight-title">Preview</div>
    <div class="preflight-list">
      <div class="preflight-item" data-kind="info">${message}</div>
    </div>`;
}

async function updatePreflight() {
  const md = document.getElementById('md-input').value.trim();
  const seq = ++preflightSeq;

  if (!md) {
    setPreflightIdle('Paste markdown to estimate card count and surface validation notes.');
    return;
  }

  try {
    const theme = controls.theme.value;
    const density = parseInt(controls.density.value, 10);
    const fontKey = controls.font.value;
    const pairing = await loadFontPairing(fontKey);
    if (seq !== preflightSeq) return;

    const chunks = await splitMarkdown(md, density, pairing, !(controls.coverTitle.value || '').trim());
    if (seq !== preflightSeq) return;

    const issues = validateMarkdown(md);
    if (seq !== preflightSeq) return;

    const hasCoverCard = Boolean((controls.coverTitle.value || '').trim() || chunks.autoCover);
    renderPreflightPanel({ cards: chunks.length + (hasCoverCard ? 1 : 0), issues, theme });
  } catch (err) {
    if (seq !== preflightSeq) return;
    setPreflightIdle('Preflight preview is unavailable right now. You can still render normally.');
  }
}

function schedulePreflight() {
  clearTimeout(preflightTimer);
  preflightTimer = setTimeout(updatePreflight, 250);
}

async function downloadZip(entries, zipBaseName) {
  const { default: JSZip } = await getZipModule();
  const zip = new JSZip();

  for (const entry of entries) {
    const base64 = entry.data.split(',')[1];
    zip.file(entry.name, base64, { base64: true });
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${zipBaseName}.zip`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

function appendZipButton(output, entries, zipBaseName) {
  if (entries.length < 2) return;

  const btn = document.createElement('button');
  btn.className = 'btn-dl-all';
  btn.style.marginTop = '8px';
  btn.textContent = 'Download ZIP Archive';
  btn.addEventListener('click', async () => {
    const label = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Preparing ZIP...';
    try {
      await downloadZip(entries, zipBaseName);
    } catch (err) {
      console.error('ZIP export failed:', err);
      setStatus('ZIP export failed. Individual downloads are still available.');
    } finally {
      btn.disabled = false;
      btn.textContent = label;
    }
  });
  output.appendChild(btn);
}

/* ── File reader ── */
document.getElementById('file-input').addEventListener('change', function () {
  const file = this.files[0];
  if (!file) return;
  document.getElementById('file-name').textContent = file.name;
  const reader = new FileReader();
  reader.onload = e => {
    document.getElementById('md-input').value = e.target.result;
    schedulePreflight();
  };
  reader.readAsText(file, 'UTF-8');
});


/* ── Format selector: show/hide quality slider ── */
document.getElementById('format-select').addEventListener('change', function () {
  syncFormatUi();
  onManualSettingChange();
});

/* ── Quality label live update ── */
document.getElementById('quality-range').addEventListener('input', function () {
  syncQualityUi();
  onManualSettingChange();
});

['theme-select', 'density-select', 'font-select', 'texture-select',
 'safezone-toggle', 'watermark-input', 'cover-title-input', 'cover-subtitle-input']
  .forEach(id => {
    const el = document.getElementById(id);
    const evt = el.tagName === 'INPUT' ? 'input' : 'change';
    el.addEventListener(evt, onManualSettingChange);
  });

document.getElementById('md-input').addEventListener('input', schedulePreflight);

/* ── Button event listeners ── */
document.getElementById('gen-btn').addEventListener('click', generate);
document.getElementById('cancel-btn').addEventListener('click', cancelGeneration);

/* ── Cancellation flag ── */
let cancelRequested = false;

/* ── Selection re-render state ── */
let lastChunks   = [];
let lastSettings = {};

function cancelGeneration() {
  cancelRequested = true;
}

/* ── Status helper ── */
function setStatus(msg) {
  document.getElementById('status').textContent = msg;
}

/* ── Arabic detection ── */
function isArabic(text) {
  return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/
    .test(text);
}

/* ── Arabic paragraph detection (ratio-based) ──
   English text containing ﷺ (U+FDFA) would trigger isArabic(),
   so we only classify a paragraph as Arabic if >50% of its
   non-whitespace characters are in Arabic Unicode ranges. */
function isArabicParagraph(text) {
  const arabicChars = (text.match(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g) || []).length;
  const totalChars = text.replace(/\s/g, '').length;
  return totalChars > 0 && (arabicChars / totalChars) > 0.5;
}

/* ── Slug generator for unique file names ── */
function makeSlug(md) {
  const text = md.replace(/[#*`_\[\]()>+=!~\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g, '')
    .trim().slice(0, 60);
  const slug = text.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '').toLowerCase().replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 24);
  const rand = Math.random().toString(16).slice(2, 6);
  return (slug || 'card') + '-' + rand;
}

/* ── Heading detection ── */
function isHeading(block) {
  return /^#{1,3}\s/.test(block.trim());
}

/* ── Post-process rendered HTML ── */
function postProcess(container) {
  // Arabic code fences → styled verse blocks
  container.querySelectorAll('pre').forEach(pre => {
    const code = pre.querySelector('code');
    if (!code) return;
    const text = code.textContent.trim();
    if (isArabic(text)) {
      const verse = document.createElement('div');
      verse.className = 'arabic-verse';
      verse.textContent = text;
      pre.replaceWith(verse);
    }
  });

  // Arabic paragraphs → RTL class (ratio-based to avoid misclassifying
  // English text that contains Arabic-script characters like ﷺ)
  container.querySelectorAll('p, li').forEach(el => {
    if (isArabicParagraph(el.textContent)) el.classList.add('ar-para');
  });
}

/* ══════════════════════════════════════════
   FIT CONTENT
   Only scale() transform — never changes width.
   Width is always 784px (set in CSS).
══════════════════════════════════════════ */
function fitContent(scaler, maxHeight) {
  scaler.style.transform    = '';
  scaler.style.marginBottom = '';
  scaler.style.width        = '';

  const naturalHeight = scaler.scrollHeight;
  if (naturalHeight <= maxHeight) return;

  const scale = Math.max(maxHeight / naturalHeight, 0.5);
  scaler.style.transform = `scale(${scale})`;
  // transform-origin is set to "top center" in CSS — do NOT override here
  // so scaling stays symmetrical (equal left/right whitespace)

  // Compensate width so visual width stays 784px despite uniform scale()
  scaler.style.width = `${Math.round(784 / scale)}px`;

  const shrinkage = naturalHeight * (1 - scale);
  scaler.style.marginBottom = `-${shrinkage}px`;
}

/* ── Utilities ── */
function escapeHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;')
          .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* Page-break sentinel — never passed to marked.parse() */
const PAGE_BREAK_SENTINEL = '\x00PAGE_BREAK\x00';

/* ══════════════════════════════════════════
   SPLITTER
   Heading always sticks to its next block.
   A card never ends on a lone heading.
   Use +++ on its own line to force a page break.
══════════════════════════════════════════ */
async function splitMarkdown(md, density, pairing, useAutoCover = true) {
  const blocks = collectMarkdownBlocks(md);
  const autoCover = useAutoCover ? extractTikTokCover(blocks) : null;
  const workingBlocks = autoCover ? blocks.slice(1) : blocks;

  const fallbackScale = CARD_BODY_H / 14;
  const targetHeight = CARD_BODY_H * (density / 14);
  const hookCap = targetHeight * 0.68;
  const slideCap = targetHeight * 0.86;

  const weightForBlock = async block => {
    let bw = await estimateBlockHeight(block, pairing);
    if (bw == null || Number.isNaN(bw)) {
      bw = fallbackBlockWeight(block) * fallbackScale;
    }
    return bw;
  };

  const chunks = [];
  let cur = [];
  let curWeight = 0;
  let currentHeadingLevel = 0;

  const flush = () => {
    if (cur.length > 0) {
      chunks.push(cur.join('\n\n'));
      cur = [];
    }
    curWeight = 0;
    currentHeadingLevel = 0;
  };

  for (let i = 0; i < workingBlocks.length; i++) {
    const block = workingBlocks[i];

    if (block === PAGE_BREAK_SENTINEL) {
      flush();
      continue;
    }

    const trimmed = block.trim();
    const next = workingBlocks[i + 1];
    const nextTrimmed = next && next !== PAGE_BREAK_SENTINEL ? next.trim() : '';
    const blockWeight = await weightForBlock(block);
    const isHeadingBlock = isHeading(block);
    const headingLevel = isHeadingBlock ? trimmed.match(/^#{1,3}/)[0].length : 0;

    if (isHeadingBlock) {
      flush();
      cur.push(block);
      curWeight = blockWeight;
      currentHeadingLevel = headingLevel;
      continue;
    }

    const limit = currentHeadingLevel === 1 ? hookCap : slideCap;
    const wouldOverflow = cur.length > 0 && curWeight + blockWeight > limit;
    const nextStartsHeading = /^#{1,3}\s/.test(nextTrimmed);

    if (wouldOverflow && cur.length > 1) {
      flush();
    } else if (wouldOverflow && cur.length === 1 && currentHeadingLevel === 1 && nextStartsHeading) {
      flush();
    }

    cur.push(block);
    curWeight += blockWeight;

    if (currentHeadingLevel === 1 && curWeight >= hookCap && next && !nextStartsHeading) {
      flush();
    }
  }

  if (cur.length > 0) chunks.push(cur.join('\n\n'));

  const merged = mergeOrphanHeadings(chunks);
  merged.autoCover = autoCover;
  return merged;
}

function mergeOrphanHeadings(chunks) {
  const out = [];
  for (let i = 0; i < chunks.length; i++) {
    const blocks = chunks[i].split('\n\n').filter(b => b.trim());
    const last = blocks[blocks.length - 1];
    if (isHeading(last) && i < chunks.length - 1) {
      chunks[i + 1] = last + '\n\n' + chunks[i + 1];
      const rest = blocks.slice(0, -1).join('\n\n').trim();
      if (rest) out.push(rest);
    } else {
      out.push(chunks[i]);
    }
  }
  return out.filter(c => c.trim());
}

/* ══════════════════════════════════════════
   MAIN GENERATOR
══════════════════════════════════════════ */
/* ── Cover Card Builder ── */
function buildCoverCard(coverTitle, coverSubtitle, theme, pairing, fontKey, textureKey, textureMode) {
  const card = document.createElement('div');
  card.className = `tt-card t-${theme}`;
  card.style.setProperty('--font-heading', pairing.heading);
  card.style.setProperty('--font-body',    pairing.body);
  card.dataset.fontPairing  = fontKey;
  card.dataset.texture      = textureKey;
  card.dataset.textureMode  = textureMode;

  const cover = document.createElement('div');
  cover.className = 'tt-cover';
  cover.innerHTML = `
    <div class="tt-cover-ornament">
      <div class="tt-cover-rule"></div>
      <span class="tt-cover-diamond"></span>
      <div class="tt-cover-rule"></div>
    </div>
    <h1 class="tt-cover-title">${escapeHtml(coverTitle)}</h1>
    ${coverSubtitle ? `<p class="tt-cover-subtitle">${escapeHtml(coverSubtitle)}</p>` : ''}
    <div class="tt-cover-ornament tt-cover-ornament--bottom">
      <div class="tt-cover-rule"></div>
      <span class="tt-cover-diamond"></span>
      <div class="tt-cover-rule"></div>
    </div>`;
  card.appendChild(cover);
  return card;
}

async function generate() {
  const md = document.getElementById('md-input').value.trim();
  if (!md) {
    setStatus('No content — load a file or paste markdown.');
    return;
  }

  cancelRequested = false;

  const theme         = document.getElementById('theme-select').value;
  const density       = parseInt(document.getElementById('density-select').value);
  const fontKey       = document.getElementById('font-select').value;
  const textureKey    = document.getElementById('texture-select').value;
  const formatVal     = document.getElementById('format-select').value;
  const qualityVal    = parseInt(document.getElementById('quality-range').value) / 100;
  const watermarkText = escapeHtml((document.getElementById('watermark-input').value || '').trim());
  const manualCoverTitle = (document.getElementById('cover-title-input').value || '').trim();
  const manualCoverSubtitle = (document.getElementById('cover-subtitle-input').value || '').trim();

  const output     = document.getElementById('output');
  const stage      = document.getElementById('render-stage');
  const genBtn     = document.getElementById('gen-btn');
  const cancelBtn  = document.getElementById('cancel-btn');

  output.innerHTML = '';
  stage.innerHTML  = '';
  genBtn.disabled  = true;
  cancelBtn.disabled = false;

  try {
    /* Load font pairing — awaits actual font readiness via CSS Font Loading API */
    const pairing = await loadFontPairing(fontKey);

    /* Determine texture light/dark mode */
    const textureMode = LIGHT_THEMES.has(theme) ? 'light' : 'dark';

    /* Export format config — WebP falls back to JPEG on Safari */
    const FORMAT_MAP = {
      jpeg: { mime: 'image/jpeg', ext: 'jpg',  lossy: true  },
      png:  { mime: 'image/png',  ext: 'png',  lossy: false },
      webp: SUPPORTS_WEBP_EXPORT
        ? { mime: 'image/webp', ext: 'webp', lossy: true  }
        : { mime: 'image/jpeg', ext: 'jpg',  lossy: true  }, // Safari fallback
    };
    const fmt = FORMAT_MAP[formatVal] || FORMAT_MAP.jpeg;

    const chunks = await splitMarkdown(md, density, pairing, !manualCoverTitle);
    lastChunks   = chunks;
    const autoCover = chunks.autoCover;
    const fileSlug = makeSlug(md);
    const coverTitle = manualCoverTitle || autoCover?.title || '';
    const coverSubtitle = manualCoverSubtitle || autoCover?.subtitle || '';
    const hasCoverCard = Boolean(coverTitle);
    lastSettings = { theme, fontKey, textureKey, fmt, qualityVal, pairing, textureMode,
                     watermarkText, coverTitle, coverSubtitle, fileSlug, hasCoverCard };
    const total    = chunks.length + (hasCoverCard ? 1 : 0);
    const blobs  = [];
    const exportFiles = [];

    setStatus(`Rendering ${total} card${total !== 1 ? 's' : ''}…`);

    /* ── Cover card (rendered before chunk loop, excluded from page numbering) ── */
    if (coverTitle) {
      setStatus('Rendering cover…');
      const coverCard = buildCoverCard(coverTitle, coverSubtitle, theme, pairing, fontKey, textureKey, textureMode);
      stage.appendChild(coverCard);
      await new Promise(r => setTimeout(r, 130));
      const coverCanvas = await html2canvas(coverCard, {
        width: 1080, height: 1920, scale: 2,
        useCORS: true, allowTaint: true, logging: false,
      });
      stage.removeChild(coverCard);
      const coverUrl = fmt.lossy
        ? coverCanvas.toDataURL(fmt.mime, qualityVal)
        : coverCanvas.toDataURL(fmt.mime);
      blobs.push(coverUrl);
      exportFiles.push({ name: `cover-${fileSlug}.${fmt.ext}`, data: coverUrl });

      appendPreviewCard(output, {
        metaLabel: 'Cover Card',
        checkboxIndex: 'cover',
        checkboxAria: 'Select cover card for re-render',
        dataUrl: coverUrl,
        alt: 'Preview of cover card',
        downloadName: `cover-${fileSlug}.${fmt.ext}`,
        downloadLabel: `Download Cover (.${fmt.ext.toUpperCase()})`,
      });
    }

    for (let i = 0; i < chunks.length; i++) {
      if (cancelRequested) break;

      setStatus(`Card ${i + 1} of ${total}…`);

      const card = document.createElement('div');
      card.className = `tt-card t-${theme}`;

      /* Apply font pairing via CSS custom properties */
      card.style.setProperty('--font-heading', pairing.heading);
      card.style.setProperty('--font-body',    pairing.body);
      card.dataset.fontPairing  = fontKey;

      /* Apply texture */
      card.dataset.texture     = textureKey;
      card.dataset.textureMode = textureMode;

      /* Header */
      const hdr = document.createElement('div');
      hdr.className = 'tt-header';
      hdr.innerHTML = `
        <div class="tt-header-rule"></div>
        <div class="tt-header-ornament">
          <span class="sm"></span>
          <span class="lg"></span>
          <span class="sm"></span>
        </div>
        <div class="tt-header-rule" style="max-width:80px;opacity:0.12"></div>`;
      card.appendChild(hdr);

      /* Body */
      const body = document.createElement('div');
      body.className = 'tt-body';
      const scaler = document.createElement('div');
      scaler.className = 'tt-content-scaler';
      scaler.innerHTML = marked.parse(chunks[i]);
      postProcess(scaler);
      body.appendChild(scaler);
      card.appendChild(body);

      /* Footer */
      const ftr = document.createElement('div');
      ftr.className = 'tt-footer';
      ftr.innerHTML = `
        <div class="tt-footer-left">
          <div class="tt-footer-ornament">
            <span class="sm"></span>
            <span class="lg"></span>
          </div>
          <div class="tt-footer-rule"></div>
        </div>
        ${watermarkText ? `<div class="tt-watermark">${watermarkText}</div>` : ''}
        <div class="tt-page-num">
          ${i + 1}<em> / ${total}</em>
        </div>`;
      card.appendChild(ftr);

      stage.appendChild(card);

      /* Layout reflow wait (fonts already awaited above via Font Loading API) */
      await new Promise(r => setTimeout(r, 50));
      fitContent(scaler, CARD_BODY_H);

      /* Font normalization: shrink fonts on sparse cards so all slides look consistent.
         TARGET_SCALE is the maximum visual scale we allow — sparse cards get their
         base font size reduced so the apparent size matches denser cards. */
      const TARGET_SCALE = 0.82;
      const rawTransform = scaler.style.transform;
      const scaleMatch = rawTransform.match(/scale\(([^)]+)\)/);
      const appliedScale = scaleMatch ? parseFloat(scaleMatch[1]) : 1.0;
      if (appliedScale > TARGET_SCALE) {
        const fontScale = TARGET_SCALE / appliedScale;
        card.style.setProperty('--font-scale', fontScale.toFixed(4));
        scaler.style.transform = '';
        scaler.style.width = '';
        scaler.style.marginBottom = '';
        await new Promise(r => setTimeout(r, 30));
        fitContent(scaler, CARD_BODY_H);
      }

      await new Promise(r => setTimeout(r, 80));

      /* scale:2 → output is 2160×3840px (retina quality, ~2× sharper) */
      const canvas = await html2canvas(card, {
        width:  1080,
        height: 1920,
        scale:  2,
        useCORS: true,
        allowTaint: true,
        logging: false,
      });

      stage.removeChild(card);

      const dataUrl = fmt.lossy
        ? canvas.toDataURL(fmt.mime, qualityVal)
        : canvas.toDataURL(fmt.mime);

      blobs.push(dataUrl);
      exportFiles.push({ name: `card-${fileSlug}-${String(i + 1).padStart(2, '0')}.${fmt.ext}`, data: dataUrl });

      appendPreviewCard(output, {
        metaLabel: `Card ${i + 1} of ${total}`,
        checkboxIndex: i,
        checkboxAria: `Select card ${i + 1} of ${total} for re-render`,
        dataUrl,
        alt: `Preview of card ${i + 1} of ${total}`,
        downloadName: `card-${fileSlug}-${String(i + 1).padStart(2, '0')}.${fmt.ext}`,
        downloadLabel: `Download Card ${i + 1} (.${fmt.ext.toUpperCase()})`,
      });
    }

    if (cancelRequested) {
      setStatus(blobs.length > 0
        ? `Cancelled — ${blobs.length} card${blobs.length !== 1 ? 's' : ''} ready.`
        : 'Generation cancelled.');
    } else {
      if (blobs.length > 1) {
        const allBtn = document.createElement('button');
        allBtn.className = 'btn-dl-all';
        allBtn.innerHTML = `⬇ Download All ${total} Cards (.${fmt.ext.toUpperCase()})`;
        allBtn.addEventListener('click', () => {
          blobs.forEach((b, idx) => {
            setTimeout(() => {
              const a = document.createElement('a');
              a.href = b;
              if (coverTitle && idx === 0) {
                a.download = `cover-${fileSlug}.${fmt.ext}`;
              } else {
                const n = coverTitle ? idx : idx + 1;
                a.download = `card-${fileSlug}-${String(n).padStart(2, '0')}.${fmt.ext}`;
              }
              a.click();
            }, idx * 300);
          });
        });
        output.appendChild(allBtn);
        appendZipButton(output, exportFiles, fileSlug);
      }
      if (total > 1) {
        const selBtn = document.createElement('button');
        selBtn.id = 'render-selected-btn';
        selBtn.className = 'btn-dl-all';
        selBtn.style.marginTop = '8px';
        selBtn.innerHTML = '⟳ Render Selected Pages';
        selBtn.addEventListener('click', renderSelected);
        output.appendChild(selBtn);
      }
      setStatus(`✦ Done — ${total} card${total !== 1 ? 's' : ''} ready.`);
    }
  } catch (err) {
    setStatus(`Error: ${err.message || 'Generation failed. Please try again.'}`);
    console.error('Generation error:', err);
  } finally {
    genBtn.disabled   = false;
    cancelBtn.disabled = true;
    stage.innerHTML   = '';
  }
}

async function renderSelected() {
  const checked = [...document.querySelectorAll('.card-select-chk:checked')];
  if (checked.length === 0) {
    setStatus('No pages selected — check at least one card.');
    return;
  }

  // Sort by original index so render order matches document order
  const indices = checked
    .map(c => c.dataset.index)          // strings: 'cover' | '0' | '1' | ...
    .sort((a, b) => {
      if (a === 'cover') return -1;
      if (b === 'cover') return  1;
      return parseInt(a) - parseInt(b);
    });

  const { theme, fontKey, textureKey, fmt, qualityVal, pairing, textureMode,
          watermarkText, coverTitle, coverSubtitle, fileSlug } = lastSettings;

  const output    = document.getElementById('output');
  const stage     = document.getElementById('render-stage');
  const genBtn    = document.getElementById('gen-btn');
  const cancelBtn = document.getElementById('cancel-btn');

  output.innerHTML  = '';
  stage.innerHTML   = '';
  genBtn.disabled   = true;
  cancelBtn.disabled = false;
  cancelRequested   = false;

  const selectedTotal = indices.length;
  const blobs = [];
  const exportFiles = [];

  try {
    setStatus(`Rendering ${selectedTotal} selected card${selectedTotal !== 1 ? 's' : ''}…`);
    for (let pos = 0; pos < indices.length; pos++) {
      if (cancelRequested) break;

      const origIdx    = indices[pos];
      const displayNum = pos + 1;

      setStatus(`Card ${displayNum} of ${selectedTotal}…`);

      /* ── Cover card branch ── */
      if (origIdx === 'cover') {
        const coverCard = buildCoverCard(coverTitle, coverSubtitle, theme, pairing, fontKey, textureKey, textureMode);
        stage.appendChild(coverCard);
        await new Promise(r => setTimeout(r, 130));
        const cvCanvas = await html2canvas(coverCard, {
          width: 1080, height: 1920, scale: 2,
          useCORS: true, allowTaint: true, logging: false,
        });
        stage.removeChild(coverCard);
        const cvUrl = fmt.lossy
          ? cvCanvas.toDataURL(fmt.mime, qualityVal)
          : cvCanvas.toDataURL(fmt.mime);
        blobs.push(cvUrl);
        exportFiles.push({ name: `cover-${fileSlug}.${fmt.ext}`, data: cvUrl });
        appendPreviewCard(output, {
          metaLabel: 'Cover Card',
          dataUrl: cvUrl,
          alt: 'Preview of cover card',
          downloadName: `cover-${fileSlug}.${fmt.ext}`,
          downloadLabel: `Download Cover (.${fmt.ext.toUpperCase()})`,
        });
        continue;
      }

      const card = document.createElement('div');
      card.className = `tt-card t-${theme}`;
      card.style.setProperty('--font-heading', pairing.heading);
      card.style.setProperty('--font-body',    pairing.body);
      card.dataset.fontPairing  = fontKey;
      card.dataset.texture      = textureKey;
      card.dataset.textureMode  = textureMode;

      /* Header */
      const hdr = document.createElement('div');
      hdr.className = 'tt-header';
      hdr.innerHTML = `
        <div class="tt-header-rule"></div>
        <div class="tt-header-ornament">
          <span class="sm"></span>
          <span class="lg"></span>
          <span class="sm"></span>
        </div>
        <div class="tt-header-rule" style="max-width:80px;opacity:0.12"></div>`;
      card.appendChild(hdr);

      /* Body */
      const body = document.createElement('div');
      body.className = 'tt-body';
      const scaler = document.createElement('div');
      scaler.className = 'tt-content-scaler';
      scaler.innerHTML = marked.parse(lastChunks[parseInt(origIdx)]);
      postProcess(scaler);
      body.appendChild(scaler);
      card.appendChild(body);

      /* Footer — page number reflects subset position */
      const ftr = document.createElement('div');
      ftr.className = 'tt-footer';
      ftr.innerHTML = `
        <div class="tt-footer-left">
          <div class="tt-footer-ornament">
            <span class="sm"></span>
            <span class="lg"></span>
          </div>
          <div class="tt-footer-rule"></div>
        </div>
        ${watermarkText ? `<div class="tt-watermark">${watermarkText}</div>` : ''}
        <div class="tt-page-num">
          ${displayNum}<em> / ${selectedTotal}</em>
        </div>`;
      card.appendChild(ftr);

      stage.appendChild(card);
      await new Promise(r => setTimeout(r, 50));
      fitContent(scaler, CARD_BODY_H);

      /* Font normalization */
      const TARGET_SCALE = 0.82;
      const scaleMatch = scaler.style.transform.match(/scale\(([^)]+)\)/);
      const appliedScale = scaleMatch ? parseFloat(scaleMatch[1]) : 1.0;
      if (appliedScale > TARGET_SCALE) {
        const fontScale = TARGET_SCALE / appliedScale;
        card.style.setProperty('--font-scale', fontScale.toFixed(4));
        scaler.style.transform  = '';
        scaler.style.width      = '';
        scaler.style.marginBottom = '';
        await new Promise(r => setTimeout(r, 30));
        fitContent(scaler, CARD_BODY_H);
      }

      await new Promise(r => setTimeout(r, 80));

      const canvas = await html2canvas(card, {
        width:  1080,
        height: 1920,
        scale:  2,
        useCORS: true,
        allowTaint: true,
        logging: false,
      });
      stage.removeChild(card);

      const dataUrl = fmt.lossy
        ? canvas.toDataURL(fmt.mime, qualityVal)
        : canvas.toDataURL(fmt.mime);
      blobs.push(dataUrl);
      exportFiles.push({ name: `card-${fileSlug}-${String(displayNum).padStart(2, '0')}.${fmt.ext}`, data: dataUrl });

      appendPreviewCard(output, {
        metaLabel: `Card ${displayNum} of ${selectedTotal} <span class="card-meta-orig">(orig. ${parseInt(origIdx) + 1})</span>`,
        dataUrl,
        alt: `Preview of card ${displayNum} of ${selectedTotal} (original ${parseInt(origIdx) + 1})`,
        downloadName: `card-${fileSlug}-${String(displayNum).padStart(2, '0')}.${fmt.ext}`,
        downloadLabel: `Download Card ${displayNum} (.${fmt.ext.toUpperCase()})`,
      });
    }

    if (!cancelRequested) {
      if (blobs.length > 1) {
        const allBtn = document.createElement('button');
        allBtn.className = 'btn-dl-all';
        allBtn.innerHTML = `⬇ Download All ${blobs.length} Cards (.${fmt.ext.toUpperCase()})`;
        allBtn.addEventListener('click', () => {
          blobs.forEach((b, idx) => {
            setTimeout(() => {
              const a = document.createElement('a');
              a.href     = b;
              a.download = `card-${fileSlug}-${String(idx + 1).padStart(2, '0')}.${fmt.ext}`;
              a.click();
            }, idx * 300);
          });
        });
        output.appendChild(allBtn);
        appendZipButton(output, exportFiles, `${fileSlug}-selected`);
      }
      setStatus(`✦ Done — ${blobs.length} card${blobs.length !== 1 ? 's' : ''} ready.`);
    } else {
      setStatus(blobs.length > 0
        ? `Cancelled — ${blobs.length} card${blobs.length !== 1 ? 's' : ''} ready.`
        : 'Generation cancelled.');
    }
  } catch (err) {
    setStatus(`Error: ${err.message || 'Render failed. Please try again.'}`);
    console.error('renderSelected error:', err);
  } finally {
    genBtn.disabled    = false;
    cancelBtn.disabled = true;
    stage.innerHTML    = '';
  }
}

function plainTextFromMarkdown(text) {
  return text
    .replace(/!\[[^\]]*\]\([^)]+\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[`*_>#~]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractTikTokCover(blocks) {
  const first = blocks.find(block => block && block !== PAGE_BREAK_SENTINEL);
  if (!first || !/^#\s+/.test(first.trim())) return null;

  const title = plainTextFromMarkdown(first.replace(/^#\s+/, ''));
  if (!title) return null;

  let subtitle = '';
  for (let i = 1; i < blocks.length; i++) {
    const block = blocks[i];
    if (!block || block === PAGE_BREAK_SENTINEL) break;
    const trimmed = block.trim();
    if (!trimmed || isHeading(trimmed) || /^[-*+] |^\d+\. /.test(trimmed) || /^```/.test(trimmed) || /^>/.test(trimmed) || /^\|/.test(trimmed)) {
      break;
    }
    subtitle = plainTextFromMarkdown(trimmed);
    break;
  }

  return { title, subtitle };
}

function createSafeZoneOverlay() {
  const overlay = document.createElement('div');
  overlay.className = 'card-safe-zone';
  overlay.setAttribute('aria-hidden', 'true');
  overlay.innerHTML = `
    <div class="card-safe-zone__scrim card-safe-zone__scrim--top"></div>
    <div class="card-safe-zone__scrim card-safe-zone__scrim--bottom"></div>
    <div class="card-safe-zone__frame"></div>
    <div class="card-safe-zone__label">TikTok safe zone</div>`;
  return overlay;
}

function appendPreviewCard(output, options) {
  const wrap = document.createElement('div');
  wrap.className = 'card-wrapper';

  const meta = document.createElement('div');
  meta.className = 'card-meta';
  meta.innerHTML = `<span class="card-meta-label">${options.metaLabel}</span>`;

  if (options.checkboxIndex !== undefined && options.checkboxIndex !== null) {
    const chk = document.createElement('input');
    chk.type = 'checkbox';
    chk.className = 'card-select-chk';
    chk.dataset.index = options.checkboxIndex;
    chk.setAttribute('aria-label', options.checkboxAria);
    meta.appendChild(chk);
  }

  wrap.appendChild(meta);

  const frame = document.createElement('div');
  frame.className = 'card-preview-frame';
  const showSafeZone = options.showSafeZone ?? (controls.safeZone?.checked ?? false);
  frame.classList.toggle('has-safezone', showSafeZone);

  const img = document.createElement('img');
  img.className = 'card-img';
  img.src = options.dataUrl;
  img.alt = options.alt;
  frame.appendChild(img);
  if (showSafeZone) frame.appendChild(createSafeZoneOverlay());
  wrap.appendChild(frame);

  const dl = document.createElement('a');
  dl.className = 'btn-dl';
  dl.href = options.dataUrl;
  dl.download = options.downloadName;
  dl.innerHTML = `
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="2.2"
      stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/>
      <line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
    ${options.downloadLabel}`;
  wrap.appendChild(dl);
  output.appendChild(wrap);
}

