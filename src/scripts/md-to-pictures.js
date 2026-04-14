import { marked } from 'marked';
import html2canvas from 'html2canvas';

const el = (id) => document.getElementById(id);
const nodes = {
  fileInput: el('file-input'),
  fileName: el('file-name'),
  mdInput: el('md-input'),
  themeSelect: el('theme-select'),
  densitySelect: el('density-select'),
  fontSelect: el('font-select'),
  textureSelect: el('texture-select'),
  watermarkInput: el('watermark-input'),
  coverTitleInput: el('cover-title-input'),
  coverSubtitleInput: el('cover-subtitle-input'),
  formatSelect: el('format-select'),
  qualityRange: el('quality-range'),
  genBtn: el('gen-btn'),
  cancelBtn: el('cancel-btn'),
  status: el('status'),
  output: el('output'),
  renderStage: el('render-stage'),
};

const THEME_STYLES = {
  Cream: { bg: '#f5eddc', fg: '#1e1a15', accent: '#8c5e4f', muted: '#6c6257' },
  Dark: { bg: '#15161d', fg: '#f8f3ea', accent: '#f0c36a', muted: '#b8b2a6' },
  Ink: { bg: '#0f1323', fg: '#f3f7ff', accent: '#8bc7ff', muted: '#9db0d0' },
  Slate: { bg: '#1f2430', fg: '#f5f7fb', accent: '#9dd1c3', muted: '#b1b9c8' },
  Forest: { bg: '#10261e', fg: '#eef6ee', accent: '#9ed27e', muted: '#bfd2bc' },
  Rose: { bg: '#25111a', fg: '#fff4f5', accent: '#f5a1b9', muted: '#d7c0c8' },
};

let abortGeneration = false;
let generatedCards = [];

initialize();

function initialize() {
  nodes.fileInput?.addEventListener('change', loadFile);
  nodes.genBtn?.addEventListener('click', generateCards);
  nodes.cancelBtn?.addEventListener('click', () => {
    abortGeneration = true;
    setStatus('Cancellation requested.');
  });
  [nodes.mdInput, nodes.themeSelect, nodes.densitySelect, nodes.fontSelect, nodes.textureSelect, nodes.watermarkInput, nodes.coverTitleInput, nodes.coverSubtitleInput, nodes.formatSelect].forEach((node) => {
    node?.addEventListener('input', () => setStatus('Ready to render.'));
  });
}

async function loadFile() {
  const file = nodes.fileInput.files?.[0];
  if (!file) return;
  nodes.fileName.value = file.name;
  nodes.mdInput.value = await file.text();
  setStatus(`Loaded ${file.name}`);
}

async function generateCards() {
  abortGeneration = false;
  const source = nodes.mdInput.value.trim();
  if (!source) {
    setStatus('Add some markdown first.');
    return;
  }

  setStatus('Parsing markdown...');
  const cards = buildCardData(source);
  generatedCards = cards;
  await renderPreview(cards);
  if (abortGeneration) return;
  setStatus(`Rendered ${cards.length} card${cards.length === 1 ? '' : 's'}. Exporting JPEGs...`);
  await exportCards();
  if (!abortGeneration) {
    setStatus(`Done. ${cards.length} card${cards.length === 1 ? '' : 's'} ready.`);
  }
}

function buildCardData(markdown) {
  marked.setOptions({ gfm: true, breaks: true });
  const blocks = splitMarkdown(markdown);
  const densityLimit = { Spacious: 2, Balanced: 3, Dense: 4 }[nodes.densitySelect.value] || 3;
  const cards = [];
  let current = [];
  let stickyHeading = nodes.coverTitleInput.value.trim();

  for (const block of blocks) {
    if (block.type === 'heading') {
      stickyHeading = block.text;
    }
    const size = current.reduce((sum, item) => sum + item.weight, 0) + block.weight;
    const limit = densityLimit * 900;
    if (current.length && size > limit && block.type !== 'heading') {
      cards.push({ heading: stickyHeading, blocks: current });
      current = [];
    }
    current.push(block);
  }
  if (current.length) cards.push({ heading: stickyHeading, blocks: current });
  if (cards.length === 0) cards.push({ heading: stickyHeading, blocks: blocks });
  if (nodes.coverTitleInput.value.trim() || nodes.coverSubtitleInput.value.trim()) {
    cards.unshift({
      heading: nodes.coverTitleInput.value.trim() || 'Cover',
      cover: true,
      subtitle: nodes.coverSubtitleInput.value.trim(),
      blocks: [],
    });
  }
  return cards;
}

function splitMarkdown(markdown) {
  const lines = markdown.split(/\r?\n/);
  const blocks = [];
  let buffer = [];
  let codeFence = null;

  const flushParagraph = () => {
    if (!buffer.length) return;
    const text = buffer.join('\n').trim();
    if (text) blocks.push({ type: 'paragraph', text, html: marked.parse(text), weight: Math.max(text.length, 180) });
    buffer = [];
  };

  for (const line of lines) {
    const fence = line.match(/^```(\w*)\s*$/);
    if (fence) {
      if (codeFence) {
        const text = codeFence.lines.join('\n');
        blocks.push({ type: 'code', text, html: `<pre><code>${escapeHtml(text)}</code></pre>`, weight: Math.max(text.length, 240) });
        codeFence = null;
      } else {
        flushParagraph();
        codeFence = { lang: fence[1], lines: [] };
      }
      continue;
    }

    if (codeFence) {
      codeFence.lines.push(line);
      continue;
    }

    if (/^\s*$/.test(line)) {
      flushParagraph();
      continue;
    }

    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      flushParagraph();
      blocks.push({ type: 'heading', text: heading[2].trim(), html: `<h2>${escapeHtml(heading[2].trim())}</h2>`, weight: 120 });
      continue;
    }

    buffer.push(line);
  }

  flushParagraph();
  return mergeOrphanHeadings(blocks);
}

function mergeOrphanHeadings(blocks) {
  const merged = [];
  for (let i = 0; i < blocks.length; i += 1) {
    const current = blocks[i];
    const next = blocks[i + 1];
    if (current?.type === 'heading' && (!next || next.type === 'heading')) {
      merged.push({ ...current, weight: 60 });
      continue;
    }
    merged.push(current);
  }
  return merged;
}

async function renderPreview(cards) {
  nodes.output.innerHTML = '';
  nodes.renderStage.innerHTML = '';
  const fragment = document.createDocumentFragment();
  const format = getFormatSize();
  const theme = THEME_STYLES[nodes.themeSelect.value] || THEME_STYLES.Cream;

  cards.forEach((card, index) => {
    const preview = createPreviewCard(card, index, cards.length, format, theme);
    fragment.appendChild(preview);
    nodes.renderStage.appendChild(createExportCard(card, index, cards.length, format, theme));
  });

  nodes.output.appendChild(fragment);
  nodes.output.querySelectorAll('[data-download-card]').forEach((button) => {
    button.addEventListener('click', () => downloadCard(Number(button.dataset.downloadCard)));
  });
}

function createPreviewCard(card, index, total, format, theme) {
  const article = document.createElement('article');
  article.className = 'overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] p-4';
  article.innerHTML = `
    <div class="mb-3 flex items-center justify-between gap-3 text-xs uppercase tracking-[0.2em] text-white/[0.45]">
      <span>${card.cover ? 'Cover' : `Card ${index + 1}`}</span>
      <span>${index + 1}/${total}</span>
    </div>
    <div class="mx-auto overflow-hidden rounded-[2rem] border border-black/10 shadow-2xl" style="aspect-ratio:${format.ratio}; width:100%; background:${theme.bg}; color:${theme.fg}">
      ${renderCardInner(card, theme, format, index, total)}
    </div>
    <div class="mt-4 flex flex-wrap gap-3">
      <button data-download-card="${index}" class="action-btn" type="button">Download JPEG</button>
    </div>
  `;
  return article;
}

function createExportCard(card, index, total, format, theme) {
  const article = document.createElement('article');
  article.className = 'export-card';
  article.style.width = `${format.width}px`;
  article.style.height = `${format.height}px`;
  article.style.position = 'relative';
  article.style.overflow = 'hidden';
  article.style.background = theme.bg;
  article.style.color = theme.fg;
  article.style.fontFamily = getFontFamily();
  article.innerHTML = `
    ${getTextureMarkup(theme)}
    <div style="position:absolute; inset:0; padding:72px 72px 96px; display:flex; flex-direction:column; justify-content:space-between;">
      ${renderCardInner(card, theme, format, index, total)}
    </div>
  `;
  return article;
}

function renderCardInner(card, theme, format, index, total) {
  const isArabic = card.blocks.some((block) => hasArabic(block.text || block.html || ''));
  const body = card.cover
    ? `
      <div style="display:flex; height:100%; flex-direction:column; justify-content:center; gap:28px;">
        <div style="font-size:20px; letter-spacing:0.28em; text-transform:uppercase; color:${theme.accent};">LLM Made Sites</div>
        <h1 style="font-size:${format.headingSize}px; line-height:0.96; margin:0; max-width:11ch;">${escapeHtml(card.heading || 'Cover')}</h1>
        ${card.subtitle ? `<p style="font-size:${format.bodySize}px; line-height:1.6; color:${theme.muted}; max-width:24ch;">${escapeHtml(card.subtitle)}</p>` : ''}
      </div>
    `
    : `
      <div style="display:flex; flex-direction:column; gap:24px; height:100%; justify-content:space-between;">
        <div>
          ${card.heading ? `<div style="font-size:18px; letter-spacing:0.22em; text-transform:uppercase; color:${theme.accent}; margin-bottom:22px;">${escapeHtml(card.heading)}</div>` : ''}
          <div style="display:grid; gap:18px; font-size:${format.bodySize}px; line-height:1.7; text-wrap:pretty; ${isArabic ? 'direction:rtl; text-align:right;' : ''}">
            ${card.blocks.map((block) => renderBlock(block, theme)).join('')}
          </div>
        </div>
        ${renderFooter(theme, index, total)}
      </div>
    `;

  return `
    <div class="card-canvas" style="position:relative; width:100%; height:100%; padding:72px; box-sizing:border-box;">
      ${getTextureMarkup(theme)}
      ${body}
      ${card.cover ? renderFooter(theme, index, total) : ''}
      ${renderWatermark()}
    </div>
  `;
}

function renderBlock(block, theme) {
  if (block.type === 'code' && hasArabic(block.text)) {
    return `
      <blockquote style="margin:0; border-right:6px solid ${theme.accent}; padding:22px 28px; border-radius:28px; background:rgba(255,255,255,0.06); font-size:1.05em; line-height:1.9; direction:rtl; text-align:right;">
        ${escapeHtml(block.text).replaceAll('\n', '<br/>')}
      </blockquote>
    `;
  }
  if (block.type === 'code') return block.html;
  return `<div>${block.html}</div>`;
}

function renderFooter(theme, index, total) {
  const watermark = nodes.watermarkInput.value.trim();
  return `
    <div style="display:flex; align-items:center; justify-content:space-between; margin-top:40px; font-size:20px; color:${theme.muted};">
      <span>${watermark ? escapeHtml(watermark) : 'Markdown to Pictures'}</span>
      <span>${index + 1}/${total}</span>
    </div>
  `;
}

function renderWatermark() {
  const watermark = nodes.watermarkInput.value.trim();
  if (!watermark) return '';
  return `<div style="position:absolute; right:72px; bottom:48px; font-size:18px; color:rgba(255,255,255,0.4);">${escapeHtml(watermark)}</div>`;
}

function getTextureMarkup(theme) {
  const texture = nodes.textureSelect.value;
  if (texture === 'None') return '';
  if (texture === 'Grid') {
    return '<div style="position:absolute; inset:0; background-image:linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px); background-size:48px 48px; opacity:0.25;"></div>';
  }
  if (texture === 'Noise') {
    return '<div style="position:absolute; inset:0; background-image:radial-gradient(circle, rgba(255,255,255,0.16) 1px, transparent 1px); background-size:4px 4px; opacity:0.12; mix-blend-mode:soft-light;"></div>';
  }
  return '<div style="position:absolute; inset:0; background:linear-gradient(135deg, rgba(255,255,255,0.12), transparent 35%, rgba(255,255,255,0.04)); opacity:0.35;"></div>';
}

async function exportCards() {
  const cards = nodes.renderStage.querySelectorAll('.export-card');
  for (let i = 0; i < cards.length; i += 1) {
    if (abortGeneration) {
      setStatus('Generation cancelled.');
      return;
    }
    setStatus(`Exporting ${i + 1}/${cards.length}...`);
    const canvas = await html2canvas(cards[i], {
      scale: Number(nodes.qualityRange.value || 0.92) * 2,
      backgroundColor: null,
      useCORS: true,
    });
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', Number(nodes.qualityRange.value || 0.92)));
    if (!blob) continue;
    const name = `${sanitize(nodes.fileName.value || 'card')}-${String(i + 1).padStart(2, '0')}.jpg`;
    downloadBlob(blob, name);
  }
}

async function downloadCard(index) {
  const card = nodes.renderStage.querySelectorAll('.export-card')[index];
  if (!card) return;
  setStatus(`Exporting card ${index + 1}...`);
  const canvas = await html2canvas(card, {
    scale: Number(nodes.qualityRange.value || 0.92) * 2,
    backgroundColor: null,
    useCORS: true,
  });
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', Number(nodes.qualityRange.value || 0.92)));
  if (!blob) return;
  const name = `${sanitize(nodes.fileName.value || 'card')}-${String(index + 1).padStart(2, '0')}.jpg`;
  downloadBlob(blob, name);
  setStatus(`Downloaded card ${index + 1}.`);
}

function getFormatSize() {
  const map = {
    story: { width: 1080, height: 1920, ratio: '9 / 16', headingSize: 116, bodySize: 46 },
    portrait: { width: 1080, height: 1350, ratio: '4 / 5', headingSize: 100, bodySize: 42 },
    square: { width: 1080, height: 1080, ratio: '1 / 1', headingSize: 92, bodySize: 40 },
  };
  return map[nodes.formatSelect.value] || map.story;
}

function getFontFamily() {
  switch (nodes.fontSelect.value) {
    case 'Editorial':
      return 'Georgia, serif';
    case 'Mono':
      return 'ui-monospace, SFMono-Regular, monospace';
    case 'Hyperlegible':
      return '"Atkinson Hyperlegible", Manrope, sans-serif';
    default:
      return 'Sora, Manrope, sans-serif';
  }
}

function hasArabic(text) {
  return /[\u0600-\u06FF]/.test(String(text || ''));
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function setStatus(message) {
  nodes.status.textContent = message;
}

function sanitize(value) {
  return String(value || 'card').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'card';
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
