marked.setOptions({ breaks: true, gfm: true });

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

function loadFontPairing(key) {
  const pairing = FONT_PAIRINGS[key] || FONT_PAIRINGS.scholar;
  const link = document.getElementById('gfonts-link');
  if (link && link.href !== pairing.url) {
    link.href = pairing.url;
  }
  return pairing;
}

/* ── Light themes (dark texture at low opacity) ── */
const LIGHT_THEMES = new Set(['cream', 'forest', 'rose']);

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

/* ── Status helper ── */
function setStatus(msg) {
  document.getElementById('status').textContent = msg;
}

/* ── Arabic detection ── */
function isArabic(text) {
  return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/
    .test(text);
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

  // Arabic paragraphs → RTL class
  container.querySelectorAll('p, li').forEach(el => {
    if (isArabic(el.textContent)) el.classList.add('ar-para');
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

  const naturalHeight = scaler.scrollHeight;
  if (naturalHeight <= maxHeight) return;

  const scale = Math.max(maxHeight / naturalHeight, 0.5);
  scaler.style.transform      = `scale(${scale})`;
  scaler.style.transformOrigin = 'top left';

  const shrinkage = naturalHeight * (1 - scale);
  scaler.style.marginBottom = `-${shrinkage}px`;
}

/* ══════════════════════════════════════════
   SPLITTER
   Heading always sticks to its next block.
   A card never ends on a lone heading.
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
async function generate() {
  const md = document.getElementById('md-input').value.trim();
  if (!md) {
    setStatus('No content — load a file or paste markdown.');
    return;
  }

  const theme      = document.getElementById('theme-select').value;
  const density    = parseInt(document.getElementById('density-select').value);
  const fontKey    = document.getElementById('font-select').value;
  const textureKey = document.getElementById('texture-select').value;
  const formatVal  = document.getElementById('format-select').value;
  const qualityVal = parseInt(document.getElementById('quality-range').value) / 100;

  const output  = document.getElementById('output');
  const stage   = document.getElementById('render-stage');
  const genBtn  = document.getElementById('gen-btn');

  output.innerHTML = '';
  stage.innerHTML  = '';
  genBtn.disabled  = true;

  /* Load font pairing (swaps Google Fonts link href) */
  const pairing = loadFontPairing(fontKey);

  /* Determine texture light/dark mode */
  const textureMode = LIGHT_THEMES.has(theme) ? 'light' : 'dark';

  /* Export format config */
  const FORMAT_MAP = {
    jpeg: { mime: 'image/jpeg', ext: 'jpg',  lossy: true  },
    png:  { mime: 'image/png',  ext: 'png',  lossy: false },
    webp: { mime: 'image/webp', ext: 'webp', lossy: true  }
  };
  const fmt = FORMAT_MAP[formatVal] || FORMAT_MAP.jpeg;

  const chunks = splitMarkdown(md, density);
  const total  = chunks.length;
  const blobs  = [];

  setStatus(`Rendering ${total} card${total !== 1 ? 's' : ''}…`);

  /*
    Available body height:
    1920 - 148 (header) - 380 (footer) - 40 (top pad) = 1352px
  */
  const BODY_H = 1352;

  for (let i = 0; i < chunks.length; i++) {
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
      <div class="tt-page-num">
        ${i + 1}<em> / ${total}</em>
      </div>`;
    card.appendChild(ftr);

    stage.appendChild(card);

    /* Wait for fonts and layout — extra time for new pairings to load */
    await new Promise(r => setTimeout(r, 350));
    fitContent(scaler, BODY_H);
    await new Promise(r => setTimeout(r, 80));

    const canvas = await html2canvas(card, {
      width: 1080,
      height: 1920,
      scale: 1,
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
    wrap.appendChild(meta);

    const img = document.createElement('img');
    img.className = 'card-img';
    img.src = dataUrl;
    wrap.appendChild(img);

    const dlA = document.createElement('a');
    dlA.className = 'btn-dl';
    dlA.href      = dataUrl;
    dlA.download  = `card-${String(i + 1).padStart(2, '0')}.${fmt.ext}`;
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

  if (blobs.length > 1) {
    const allBtn = document.createElement('button');
    allBtn.className = 'btn-dl-all';
    allBtn.innerHTML = `⬇ Download All ${total} Cards (.${fmt.ext.toUpperCase()})`;
    allBtn.onclick = () => {
      blobs.forEach((b, idx) => {
        const a = document.createElement('a');
        a.href     = b;
        a.download = `card-${String(idx + 1).padStart(2, '0')}.${fmt.ext}`;
        a.click();
      });
    };
    output.appendChild(allBtn);
  }

  setStatus(`✦ Done — ${total} card${total !== 1 ? 's' : ''} ready.`);
  genBtn.disabled = false;
}
