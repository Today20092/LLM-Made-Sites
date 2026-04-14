export type ToolStatus = 'live' | 'stable' | 'legacy';

export type ToolDefinition = {
  id: string;
  href: string;
  title: string;
  summary: string;
  badge: string;
  accent: string;
  icon: string;
  status: ToolStatus;
};

export const toolRegistry: ToolDefinition[] = [
  {
    id: 'prompt-launcher',
    href: '/prompt-launcher',
    title: 'Prompt Launcher',
    summary: 'Compose one prompt, fill variables, and launch it across common AI chat tools.',
    badge: 'Prompt utility',
    accent: 'from-cyan-400/15 via-sky-400/8 to-transparent',
    icon: '⌘',
    status: 'live',
  },
  {
    id: 'video-bitrate-calculator',
    href: '/video-bitrate-calculator',
    title: 'Video Bitrate Calculator',
    summary: 'Estimate bitrate, file size, and storage needs with reversible calculations.',
    badge: 'Video math',
    accent: 'from-rose-400/15 via-orange-400/8 to-transparent',
    icon: '◫',
    status: 'live',
  },
  {
    id: 'md-to-pictures',
    href: '/md-to-pictures',
    title: 'MD to Pictures',
    summary: 'Convert markdown into social-ready cards and export images directly in the browser.',
    badge: 'Canvas export',
    accent: 'from-emerald-400/15 via-teal-400/8 to-transparent',
    icon: '▧',
    status: 'live',
  },
];

export const toolById = Object.fromEntries(toolRegistry.map((tool) => [tool.id, tool])) as Record<string, ToolDefinition>;
