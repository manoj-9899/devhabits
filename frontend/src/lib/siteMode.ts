// src/lib/siteMode.ts — hosted demo site vs local install

/** Set to `hosted` on Vercel. Omit or `local` when running on your machine. */
export const isHostedSite = import.meta.env.VITE_SITE_MODE === 'hosted';

export const signupEnabled = import.meta.env.VITE_ENABLE_SIGNUP === 'true';

export const demoConfigured = Boolean(
  import.meta.env.VITE_DEMO_EMAIL && import.meta.env.VITE_DEMO_PASSWORD
);

export const githubRepo =
  import.meta.env.VITE_GITHUB_REPO_URL ?? 'https://github.com/manoj-9899/devhabits';
