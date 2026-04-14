const STORAGE_KEY = 'video-bitrate-calculator:v1';
const THEME_KEY = 'video-bitrate-calculator:theme';

const PRESETS = [
  { name: 'YouTube 1080p', resolution: '1080p', fps: 30, complexity: 'balanced', bitrate: 12 },
  { name: 'YouTube 4K', resolution: '4k', fps: 60, complexity: 'balanced', bitrate: 48 },
  { name: 'Podcast clip', resolution: '720p', fps: 30, complexity: 'low', bitrate: 4.5 },
  { name: 'Mobile reel', resolution: '1080p', fps: 30, complexity: 'high', bitrate: 16 },
];

const DEFAULT_STATE = {
  hours: 0,
  minutes: 0,
  seconds: 0,
  reverseMode: false,
  baselineBitrate: 12,
  targetSize: 4,
  targetSizeUnit: 'GB',
  audioBitrate: 160,
  availableStorage: 256,
  costPerTB: 8,
  resolution: '1080p',
  fps: 30,
  complexity: 'balanced',
  customSpeed: 1,
  profiles: [],
};

const el = (id) => document.getElementById(id);
const nodes = {
  themeToggle: el('themeToggle'),
  iconSun: el('iconSun'),
  iconMoon: el('iconMoon'),
  shareConfig: el('shareConfig'),
  hours: el('hours'),
  minutes: el('minutes'),
  seconds: el('seconds'),
  reverseMode: el('reverseMode'),
  baselineBitrate: el('baselineBitrate'),
  suggestionText: el('suggestionText'),
  applySuggestionBtn: el('applySuggestionBtn'),
  targetSize: el('targetSize'),
  targetSizeUnit: el('targetSizeUnit'),
  calculatedReverseBitrate: el('calculatedReverseBitrate'),
  audioBitrate: el('audioBitrate'),
  availableStorage: el('availableStorage'),
  costPerTB: el('costPerTB'),
  resolution: el('resolution'),
  fps: el('fps'),
  complexity: el('complexity'),
  totalDuration: el('totalDuration'),
  addProfile: el('addProfile'),
  profileCount: el('profileCount'),
  profilesContainer: el('profilesContainer'),
  exportBtn: el('exportBtn'),
  barChart: el('barChart'),
  customSpeedHeader: el('customSpeedHeader'),
  uploadTable: el('uploadTable'),
  customSpeed: el('customSpeed'),
  capacityResults: el('capacityResults'),
  toast: el('toast'),
  promptTitle: el('promptTitle'),
};

const state = loadState();
let toastTimer = null;

initialize();

function initialize() {
  hydrateInputs();
  bindEvents();
  applyTheme(loadTheme());
  render();
}

function hydrateInputs() {
  nodes.hours.value = state.hours;
  nodes.minutes.value = state.minutes;
  nodes.seconds.value = state.seconds;
  nodes.reverseMode.checked = state.reverseMode;
  nodes.baselineBitrate.value = state.baselineBitrate;
  nodes.targetSize.value = state.targetSize;
  nodes.targetSizeUnit.value = state.targetSizeUnit;
  nodes.audioBitrate.value = state.audioBitrate;
  nodes.availableStorage.value = state.availableStorage;
  nodes.costPerTB.value = state.costPerTB;
  nodes.resolution.value = state.resolution;
  nodes.fps.value = String(state.fps);
  nodes.complexity.value = state.complexity;
  nodes.customSpeed.value = state.customSpeed;
}

function bindEvents() {
  [
    nodes.hours,
    nodes.minutes,
    nodes.seconds,
    nodes.reverseMode,
    nodes.baselineBitrate,
    nodes.targetSize,
    nodes.targetSizeUnit,
    nodes.audioBitrate,
    nodes.availableStorage,
    nodes.costPerTB,
    nodes.resolution,
    nodes.fps,
    nodes.complexity,
    nodes.customSpeed,
  ].forEach((node) => {
    node.addEventListener('input', () => {
      syncState();
      render();
      saveState();
    });
  });

  nodes.applySuggestionBtn?.addEventListener('click', () => {
    nodes.baselineBitrate.value = String(getRecommendedBitrate());
    syncState();
    render();
    saveState();
    toast('Applied suggestion');
  });

  nodes.addProfile?.addEventListener('click', () => {
    state.profiles.unshift(createProfileSnapshot());
    state.profiles = state.profiles.slice(0, 8);
    render();
    saveState();
    toast('Profile added');
  });

  nodes.exportBtn?.addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    downloadBlob(blob, 'video-bitrate-config.json');
  });

  nodes.shareConfig?.addEventListener('click', async () => {
    const url = `${location.origin}${location.pathname}?data=${encodeURIComponent(btoa(JSON.stringify(state)))}`;
    await navigator.clipboard?.writeText(url);
    toast('Config link copied');
  });

  nodes.themeToggle?.addEventListener('click', () => {
    const next = loadTheme() === 'dark' ? 'light' : 'dark';
    saveTheme(next);
    applyTheme(next);
    toast(`Theme set to ${next}`);
  });
}

function syncState() {
  state.hours = toNumber(nodes.hours.value);
  state.minutes = toNumber(nodes.minutes.value);
  state.seconds = toNumber(nodes.seconds.value);
  state.reverseMode = nodes.reverseMode.checked;
  state.baselineBitrate = toNumber(nodes.baselineBitrate.value);
  state.targetSize = toNumber(nodes.targetSize.value);
  state.targetSizeUnit = nodes.targetSizeUnit.value;
  state.audioBitrate = toNumber(nodes.audioBitrate.value);
  state.availableStorage = toNumber(nodes.availableStorage.value);
  state.costPerTB = toNumber(nodes.costPerTB.value);
  state.resolution = nodes.resolution.value;
  state.fps = toNumber(nodes.fps.value);
  state.complexity = nodes.complexity.value;
  state.customSpeed = toNumber(nodes.customSpeed.value);
}

function render() {
  syncState();

  const duration = getTotalSeconds();
  const recommended = getRecommendedBitrate();
  const reverseBitrate = getReverseBitrate();
  const selectedBitrate = state.reverseMode ? reverseBitrate : state.baselineBitrate;
  const totalBitrate = selectedBitrate + state.audioBitrate / 1000;
  const estimatedSize = duration > 0 ? (totalBitrate * duration) / 8 : 0;

  nodes.customSpeedHeader.textContent = `Custom speed factor (${state.customSpeed.toFixed(2)}x)`;
  nodes.suggestionText.textContent = `Recommended bitrate for ${state.resolution} at ${state.fps} fps: ${recommended.toFixed(1)} Mbps.`;
  nodes.calculatedReverseBitrate.textContent = state.reverseMode
    ? `${reverseBitrate.toFixed(1)} Mbps`
    : `${selectedBitrate.toFixed(1)} Mbps selected`;

  nodes.profileCount.textContent = String(state.profiles.length);
  nodes.profilesContainer.innerHTML = renderProfiles(recommended, estimatedSize);
  nodes.capacityResults.innerHTML = renderCapacityCards(estimatedSize);
  nodes.uploadTable.innerHTML = renderUploadTable(duration, recommended);
  nodes.barChart.innerHTML = renderChart(recommended, reverseBitrate, selectedBitrate);
}

function renderProfiles(recommended, estimatedSize) {
  const rows = [...PRESETS, ...state.profiles];
  if (rows.length === 0) return '<p class="text-sm text-white/[0.55]">No profiles yet.</p>';
  return rows
    .map((profile) => {
      const bitrate = profile.bitrate || getRecommendedBitrate(profile);
      const durationHours = getTotalSeconds() / 3600;
      const sizeGb = durationHours > 0 ? ((bitrate + state.audioBitrate / 1000) * durationHours * 3600) / 8 / 1024 ** 3 * 1024 ** 3 : 0;
      return `
        <article class="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <div class="flex items-start justify-between gap-3">
            <div>
              <h3 class="text-base font-bold text-white">${escapeHtml(profile.name)}</h3>
              <p class="mt-1 text-sm text-white/[0.55]">${escapeHtml(profile.resolution || state.resolution)} @ ${profile.fps || state.fps} fps</p>
            </div>
            <span class="rounded-full border border-white/10 bg-slate-950/60 px-3 py-1 text-xs font-semibold text-amber-200">${bitrate.toFixed(1)} Mbps</span>
          </div>
          <p class="mt-3 text-sm text-white/70">Estimated size: ${formatSize(sizeGb)}</p>
        </article>
      `;
    })
    .join('');
}

function renderCapacityCards(estimatedSize) {
  const storageBytes = state.availableStorage * 1_000_000_000;
  const count = estimatedSize > 0 ? storageBytes / estimatedSize : 0;
  const cost = (state.availableStorage / 1024) * state.costPerTB;
  return `
    <div class="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <div class="field-label">Fits in storage</div>
      <div class="mt-2 text-3xl font-black text-white">${Number.isFinite(count) ? count.toFixed(1) : '0'}</div>
    </div>
    <div class="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <div class="field-label">Storage cost</div>
      <div class="mt-2 text-3xl font-black text-white">$${cost.toFixed(2)}</div>
    </div>
  `;
}

function renderUploadTable(duration, recommended) {
  const selected = state.reverseMode ? getReverseBitrate() : state.baselineBitrate;
  const rows = [
    ['Selected bitrate', `${selected.toFixed(1)} Mbps`],
    ['Recommended bitrate', `${recommended.toFixed(1)} Mbps`],
    ['Duration', formatDuration(duration)],
    ['Estimated size', formatSize(calculateSizeBytes(selected))],
  ];
  return `
    <table class="w-full text-left text-sm">
      <thead class="bg-white/[0.04] text-white/70">
        <tr><th class="px-4 py-3">Metric</th><th class="px-4 py-3">Value</th></tr>
      </thead>
      <tbody>
        ${rows
          .map(
            ([label, value]) => `
              <tr class="border-t border-white/10">
                <td class="px-4 py-3 text-white/70">${label}</td>
                <td class="px-4 py-3 font-semibold text-white">${value}</td>
              </tr>
            `
          )
          .join('')}
      </tbody>
    </table>
  `;
}

function renderChart(recommended, reverseBitrate, selectedBitrate) {
  const bars = [
    ['Baseline', selectedBitrate],
    ['Suggested', recommended],
    ['Reverse', reverseBitrate],
  ];
  const max = Math.max(...bars.map((item) => item[1]), 1);
  return bars
    .map(
      ([label, value]) => `
        <div>
          <div class="mb-2 flex items-center justify-between text-sm text-white/70">
            <span>${label}</span>
            <span class="font-semibold text-white">${value.toFixed(1)} Mbps</span>
          </div>
          <div class="h-4 rounded-full bg-white/6">
            <div class="h-4 rounded-full bg-gradient-to-r from-amber-300 via-rose-300 to-emerald-300" style="width:${Math.max((value / max) * 100, 8)}%"></div>
          </div>
        </div>
      `
    )
    .join('');
}

function createProfileSnapshot() {
  return {
    name: `${state.resolution} @ ${state.fps}fps`,
    resolution: state.resolution,
    fps: state.fps,
    complexity: state.complexity,
    bitrate: getRecommendedBitrate(),
  };
}

function getRecommendedBitrate(overrides = state) {
  const baseMap = { '720p': 4, '1080p': 8, '1440p': 16, '4k': 35 };
  const complexityMap = { low: 0.78, balanced: 1, high: 1.28, extreme: 1.55 };
  const fpsFactor = Math.max((overrides.fps || state.fps) / 30, 0.8);
  const resolutionFactor = baseMap[overrides.resolution || state.resolution] || 8;
  const complexityFactor = complexityMap[overrides.complexity || state.complexity] || 1;
  return resolutionFactor * fpsFactor * complexityFactor * state.customSpeed;
}

function getReverseBitrate() {
  const duration = getTotalSeconds();
  if (!duration) return 0;
  const bytes = convertTargetToBytes();
  const bitsPerSecond = (bytes * 8) / duration;
  return Math.max(bitsPerSecond / 1_000_000 - state.audioBitrate / 1000, 0);
}

function convertTargetToBytes() {
  const factor = { MB: 1_000_000, GB: 1_000_000_000, TB: 1_000_000_000_000 }[state.targetSizeUnit] || 1_000_000_000;
  return state.targetSize * factor;
}

function calculateSizeBytes(bitrateMbps) {
  const duration = getTotalSeconds();
  return ((bitrateMbps + state.audioBitrate / 1000) * 1_000_000 * duration) / 8;
}

function getTotalSeconds() {
  return state.hours * 3600 + state.minutes * 60 + state.seconds;
}

function formatDuration(seconds) {
  const total = Math.max(Math.round(seconds || 0), 0);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${h}h ${m}m ${s}s`;
}

function formatSize(bytes) {
  const abs = Math.abs(bytes || 0);
  if (abs >= 1_000_000_000_000) return `${(bytes / 1_000_000_000_000).toFixed(2)} TB`;
  if (abs >= 1_000_000_000) return `${(bytes / 1_000_000_000).toFixed(2)} GB`;
  if (abs >= 1_000_000) return `${(bytes / 1_000_000).toFixed(2)} MB`;
  return `${bytes.toFixed(0)} bytes`;
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadState() {
  try {
    return { ...DEFAULT_STATE, ...(JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') || {}) };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

function loadTheme() {
  return localStorage.getItem(THEME_KEY) || 'dark';
}

function saveTheme(theme) {
  localStorage.setItem(THEME_KEY, theme);
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  const dark = theme === 'dark';
  nodes.iconSun.classList.toggle('hidden', !dark);
  nodes.iconMoon.classList.toggle('hidden', dark);
  document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
}

function toast(message) {
  clearTimeout(toastTimer);
  nodes.toast.textContent = message;
  nodes.toast.classList.remove('hidden');
  toastTimer = window.setTimeout(() => nodes.toast.classList.add('hidden'), 2200);
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function toNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
