import chatgptSvg from '../icons/chatgpt.svg?raw';
import claudeSvg from '../icons/claude.svg?raw';
import geminiSvg from '../icons/gemini.svg?raw';
import perplexitySvg from '../icons/perplexity.svg?raw';
import grokSvg from '../icons/grok.svg?raw';
import mistralSvg from '../icons/mistral.svg?raw';
import poeSvg from '../icons/poe.svg?raw';
import deepseekSvg from '../icons/deepseek.svg?raw';
import copilotSvg from '../icons/copilot.svg?raw';
import t3ChatSvg from '../icons/t3-chat.svg?raw';

export const botIcons = {
  OpenAI: { iconName: 'chatgpt', iconMarkup: chatgptSvg },
  Claude: { iconName: 'claude', iconMarkup: claudeSvg },
  Gemini: { iconName: 'gemini', iconMarkup: geminiSvg },
  Perplexity: { iconName: 'perplexity', iconMarkup: perplexitySvg },
  Grok: { iconName: 'grok', iconMarkup: grokSvg },
  'Le Chat': { iconName: 'mistral', iconMarkup: mistralSvg },
  Poe: { iconName: 'poe', iconMarkup: poeSvg },
  DeepSeek: { iconName: 'deepseek', iconMarkup: deepseekSvg },
  Copilot: { iconName: 'copilot', iconMarkup: copilotSvg },
  'T3 Chat': { iconName: 't3-chat', iconMarkup: t3ChatSvg },
} as const;

export const botIconList: Array<{ name: keyof typeof botIcons; iconName: string }> = [
  { name: 'T3 Chat', iconName: botIcons['T3 Chat'].iconName },
  { name: 'Claude', iconName: botIcons.Claude.iconName },
  { name: 'OpenAI', iconName: botIcons.OpenAI.iconName },
  { name: 'Gemini', iconName: botIcons.Gemini.iconName },
  { name: 'Perplexity', iconName: botIcons.Perplexity.iconName },
  { name: 'Grok', iconName: botIcons.Grok.iconName },
  { name: 'Le Chat', iconName: botIcons['Le Chat'].iconName },
  { name: 'Poe', iconName: botIcons.Poe.iconName },
  { name: 'DeepSeek', iconName: botIcons.DeepSeek.iconName },
  { name: 'Copilot', iconName: botIcons.Copilot.iconName },
];
