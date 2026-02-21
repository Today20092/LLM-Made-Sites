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
    heading: "'Playfair Display', Georgia, serif",
    body:    "'Lato', Arial, sans-serif"
  },
  editorial: {
    url:     'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;0,700;1,600&family=Source+Sans+3:wght@300;400;700&family=Amiri:ital,wght@0,400;0,700;1,400;1,700&display=swap',
    heading: "'Cormorant Garamond', Georgia, serif",
    body:    "'Source Sans 3', Arial, sans-serif"
  },
  minimal: {
    url:     'https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,300;0,500;0,700;1,500&family=Amiri:ital,wght@0,400;0,700;1,400;1,700&display=swap',
    heading: "'DM Sans', Helvetica, sans-serif",
    body:    "'DM Sans', Helvetica, sans-serif"
  },
  spiritual: {
    url:     'https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400;1,700&family=Lato:wght@300;400&display=swap',
    heading: "'Amiri', 'Traditional Arabic', serif",
    body:    "'Amiri', 'Lato', serif"
  },
  luxury: {
    url:     'https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Raleway:wght@300;400;700&family=Amiri:ital,wght@0,400;0,700;1,400;1,700&display=swap',
    heading: "'Libre Baskerville', Georgia, serif",
    body:    "'Raleway', Arial, sans-serif"
  },
  humanist: {
    url:     'https://fonts.googleapis.com/css2?family=Merriweather:ital,wght@0,700;0,900;1,700&family=Open+Sans:wght@300;400;700&family=Amiri:ital,wght@0,400;0,700;1,400;1,700&display=swap',
    heading: "'Merriweather', Georgia, serif",
    body:    "'Open Sans', Arial, sans-serif"
  },
  atkinson: {
    url:     'https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible+Next:ital,wght@0,400;0,700;1,400;1,700&display=swap',
    heading: "'Atkinson Hyperlegible Next', Arial, sans-serif",
    body:    "'Atkinson Hyperlegible Next', Arial, sans-serif"
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
  return pairing;
}

/* ── Light themes (dark texture at low opacity) ── */
const LIGHT_THEMES = new Set(['cream', 'forest', 'rose', 'parchment', 'sand', 'contrast']);

/* ── File reader ── */
document.getElementById('file-input').addEventListener('change', function () {
  const file = this.files[0];
  if (!file) return;
  document.getElementById('file-name').textContent = file.name;
  const reader = new FileReader();
  reader.onload = e => {
    document.getElementById('md-input').value = e.target.result;
  };
  reader.readAsText(file, 'UTF-8');
});

/* ── Format selector: show/hide quality slider ── */
document.getElementById('format-select').addEventListener('change', function () {
  const isPng = this.value === 'png';
  document.getElementById('quality-group').classList.toggle('hidden', isPng);
});

/* ── Quality label live update ── */
document.getElementById('quality-range').addEventListener('input', function () {
  document.getElementById('quality-label').textContent = this.value + '%';
});

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
function splitMarkdown(md, density) {
  /* Step 1 — collect blocks, keeping fenced code atomic */
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
      /* Hard page break: flush current text, insert sentinel */
      flushText();
      blocks.push(PAGE_BREAK_SENTINEL);
    } else {
      textBuf.push(line);
    }
  }
  flushText();
  if (fenceBuf.length) blocks.push(fenceBuf.join('\n'));

  /* Step 2 — weight each block */
  function weight(block) {
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

  /* Step 3 — pack into chunks, heading sticks to next block */
  const chunks = [];
  let cur = [];
  let w = 0;

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];

    /* Hard page break sentinel — flush and skip */
    if (block === PAGE_BREAK_SENTINEL) {
      if (cur.length > 0) { chunks.push(cur.join('\n\n')); cur = []; w = 0; }
      continue;
    }

    const bw = weight(block);
    const next = blocks[i + 1];
    const nw = next ? weight(next) : 0;

    if (w + bw > density && cur.length > 0) {
      chunks.push(cur.join('\n\n'));
      cur = [block];
      w = bw;
    } else {
      cur.push(block);
      w += bw;
    }

    if (isHeading(block) && next && w + nw > density && cur.length > 1) {
      cur.pop();
      w -= bw;
      if (cur.length > 0) chunks.push(cur.join('\n\n'));
      cur = [block];
      w = bw;
    }
  }
  if (cur.length > 0) chunks.push(cur.join('\n\n'));

  return mergeOrphanHeadings(chunks);
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
  const coverTitle    = (document.getElementById('cover-title-input').value || '').trim();
  const coverSubtitle = (document.getElementById('cover-subtitle-input').value || '').trim();

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

    const chunks = splitMarkdown(md, density);
    lastChunks   = chunks;
    const fileSlug = makeSlug(md);
    lastSettings = { theme, fontKey, textureKey, fmt, qualityVal, pairing, textureMode,
                     watermarkText, coverTitle, coverSubtitle, fileSlug };
    const total    = chunks.length;
    const blobs  = [];

    setStatus(`Rendering ${total} card${total !== 1 ? 's' : ''}…`);

    /*
      Available body height:
      1920 - 148 (header) - 380 (footer) - 40 (top pad) = 1352px
    */
    const BODY_H = 1352;

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

      const coverWrap = document.createElement('div');
      coverWrap.className = 'card-wrapper';
      const coverMeta = document.createElement('div');
      coverMeta.className = 'card-meta';
      coverMeta.innerHTML = `<span class="card-meta-label">Cover Card</span>`;
      const coverChk = document.createElement('input');
      coverChk.type = 'checkbox';
      coverChk.className = 'card-select-chk';
      coverChk.dataset.index = 'cover';
      coverMeta.appendChild(coverChk);
      coverWrap.appendChild(coverMeta);
      const coverImg = document.createElement('img');
      coverImg.className = 'card-img';
      coverImg.src = coverUrl;
      coverWrap.appendChild(coverImg);
      const coverDl = document.createElement('a');
      coverDl.className = 'btn-dl';
      coverDl.href = coverUrl;
      coverDl.download = `cover-${fileSlug}.${fmt.ext}`;
      coverDl.innerHTML = `
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2.2"
          stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
        Download Cover (.${fmt.ext.toUpperCase()})`;
      coverWrap.appendChild(coverDl);
      output.appendChild(coverWrap);
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
      fitContent(scaler, BODY_H);

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
        fitContent(scaler, BODY_H);
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

      /* Preview */
      const wrap = document.createElement('div');
      wrap.className = 'card-wrapper';

      const meta = document.createElement('div');
      meta.className = 'card-meta';
      meta.innerHTML = `<span class="card-meta-label">Card ${i + 1} of ${total}</span>`;
      const chk = document.createElement('input');
      chk.type = 'checkbox';
      chk.className = 'card-select-chk';
      chk.dataset.index = i;
      meta.appendChild(chk);
      wrap.appendChild(meta);

      const img = document.createElement('img');
      img.className = 'card-img';
      img.src = dataUrl;
      wrap.appendChild(img);

      const dlA = document.createElement('a');
      dlA.className = 'btn-dl';
      dlA.href      = dataUrl;
      dlA.download  = `card-${fileSlug}-${String(i + 1).padStart(2, '0')}.${fmt.ext}`;
      dlA.innerHTML = `
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2.2"
          stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
        Download Card ${i + 1} (.${fmt.ext.toUpperCase()})`;
      wrap.appendChild(dlA);
      output.appendChild(wrap);
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
        allBtn.onclick = () => {
          blobs.forEach((b, idx) => {
            const a = document.createElement('a');
            a.href = b;
            if (coverTitle && idx === 0) {
              a.download = `cover-${fileSlug}.${fmt.ext}`;
            } else {
              const n = coverTitle ? idx : idx + 1;
              a.download = `card-${fileSlug}-${String(n).padStart(2, '0')}.${fmt.ext}`;
            }
            a.click();
          });
        };
        output.appendChild(allBtn);
      }
      if (total > 1) {
        const selBtn = document.createElement('button');
        selBtn.id = 'render-selected-btn';
        selBtn.className = 'btn-dl-all';
        selBtn.style.marginTop = '8px';
        selBtn.innerHTML = '⟳ Render Selected Pages';
        selBtn.onclick = renderSelected;
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

  try {
    setStatus(`Rendering ${selectedTotal} selected card${selectedTotal !== 1 ? 's' : ''}…`);
    const BODY_H = 1352;

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
        const cvWrap = document.createElement('div');
        cvWrap.className = 'card-wrapper';
        const cvMeta = document.createElement('div');
        cvMeta.className = 'card-meta';
        cvMeta.innerHTML = `<span class="card-meta-label">Cover Card</span>`;
        cvWrap.appendChild(cvMeta);
        const cvImg = document.createElement('img');
        cvImg.className = 'card-img'; cvImg.src = cvUrl;
        cvWrap.appendChild(cvImg);
        const cvDl = document.createElement('a');
        cvDl.className = 'btn-dl'; cvDl.href = cvUrl;
        cvDl.download = `cover-${fileSlug}.${fmt.ext}`;
        cvDl.innerHTML = `
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2.2"
            stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Download Cover (.${fmt.ext.toUpperCase()})`;
        cvWrap.appendChild(cvDl);
        output.appendChild(cvWrap);
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
      fitContent(scaler, BODY_H);

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
        fitContent(scaler, BODY_H);
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

      /* Preview */
      const wrap = document.createElement('div');
      wrap.className = 'card-wrapper';

      const meta = document.createElement('div');
      meta.className = 'card-meta';
      meta.innerHTML = `<span class="card-meta-label">Card ${displayNum} of ${selectedTotal} <span class="card-meta-orig">(orig. ${origIdx + 1})</span></span>`;
      wrap.appendChild(meta);

      const img = document.createElement('img');
      img.className = 'card-img';
      img.src = dataUrl;
      wrap.appendChild(img);

      const dlA = document.createElement('a');
      dlA.className = 'btn-dl';
      dlA.href      = dataUrl;
      dlA.download  = `card-${fileSlug}-${String(displayNum).padStart(2, '0')}.${fmt.ext}`;
      dlA.innerHTML = `
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2.2"
          stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
        Download Card ${displayNum} (.${fmt.ext.toUpperCase()})`;
      wrap.appendChild(dlA);
      output.appendChild(wrap);
    }

    if (!cancelRequested) {
      if (blobs.length > 1) {
        const allBtn = document.createElement('button');
        allBtn.className = 'btn-dl-all';
        allBtn.innerHTML = `⬇ Download All ${blobs.length} Cards (.${fmt.ext.toUpperCase()})`;
        allBtn.onclick = () => {
          blobs.forEach((b, idx) => {
            const a = document.createElement('a');
            a.href     = b;
            a.download = `card-${fileSlug}-${String(idx + 1).padStart(2, '0')}.${fmt.ext}`;
            a.click();
          });
        };
        output.appendChild(allBtn);
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
