import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';
import icon from 'astro-icon';

const repoName = process.env.GITHUB_REPOSITORY?.split('/').at(-1) || 'LLM-Made-Sites';
const owner = process.env.GITHUB_REPOSITORY_OWNER || 'today20092';
const base = process.env.NODE_ENV === 'production' ? `/${repoName}/` : '/';
const site = process.env.PUBLIC_SITE_URL || `https://${owner}.github.io/${repoName}/`;

export default defineConfig({
  site,
  base,
  integrations: [tailwind(), icon(), sitemap()],
});
