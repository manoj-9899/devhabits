// src/pages/Landing.tsx — public home for the hosted site; local-first pitch
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { CopyButton } from '../components/ui/CopyButton';
import { demoConfigured, githubRepo, isHostedSite, signupEnabled } from '../lib/siteMode';
import { ROUTES } from '../lib/routes';
import { formatAuthError } from '../lib/authErrors';

const INSTALL_STEPS = [
  {
    title: '1. Clone',
    cmd: `git clone ${githubRepo}.git\ncd devhabits`,
  },
  {
    title: '2. Bootstrap',
    cmd: 'npm run bootstrap',
    hint: 'Installs deps, links the habit CLI, runs a health check.',
  },
  {
    title: '3. Run',
    cmd: 'npm run dev',
    hint: 'Dashboard at http://localhost:5173 · API at :4224',
  },
] as const;

const CLI_HIGHLIGHTS = [
  { cmd: 'habit list', desc: 'Today’s habits in the terminal' },
  { cmd: 'habit quick', desc: 'Interactive multi-select logger' },
  { cmd: 'habit ui', desc: 'Full-screen TUI' },
  { cmd: 'habit morning', desc: 'Compact daily brief' },
  { cmd: 'hl / hq / hm', desc: 'Shell aliases (after bootstrap)' },
] as const;

function CommandBlock({ cmd, hint }: { cmd: string; hint?: string }) {
  return (
    <div className="rounded-lg border border-[#30363d] bg-[#0d1117] overflow-hidden">
      <div className="flex items-start justify-between gap-2 px-3 py-2 border-b border-[#30363d]">
        <pre className="text-xs font-mono text-[#e6edf3] whitespace-pre-wrap break-all flex-1">{cmd}</pre>
        <CopyButton text={cmd.replace(/\\n/g, '\n')} />
      </div>
      {hint && <p className="px-3 py-2 text-[11px] text-[#6e7681]">{hint}</p>}
    </div>
  );
}

export function Landing() {
  const navigate = useNavigate();
  const { signInDemo } = useAuth();
  const [demoError, setDemoError] = useState<string | null>(null);
  const [demoLoading, setDemoLoading] = useState(false);

  async function handleTryDemo() {
    setDemoError(null);
    setDemoLoading(true);
    const { error } = await signInDemo();
    setDemoLoading(false);
    if (error) {
      setDemoError(formatAuthError(error));
      return;
    }
    navigate(ROUTES.app, { replace: true });
  }

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#e6edf3]">
      <header className="border-b border-[#30363d] px-4 sm:px-8 py-4 flex items-center justify-between gap-4 max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#238636] rounded-md flex items-center justify-center shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white" aria-hidden="true">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            </svg>
          </div>
          <span className="font-semibold">DevHabits</span>
        </div>
        <div className="flex items-center gap-2">
          {!isHostedSite && (
            <Link to={ROUTES.app}>
              <Button variant="primary" size="sm">
                Open dashboard
              </Button>
            </Link>
          )}
          <a href={githubRepo} target="_blank" rel="noreferrer">
            <Button variant="secondary" size="sm">
              GitHub
            </Button>
          </a>
        </div>
      </header>

      <main className="max-w-5xl mx-auto w-full px-4 sm:px-8 py-12 sm:py-16 space-y-16">
        <section className="space-y-6 text-center sm:text-left">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#3fb950]">
            Local-first · Terminal-native
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold leading-tight max-w-2xl">
            Track habits in your terminal.{' '}
            <span className="text-[#8b949e]">Optional dashboard on your machine.</span>
          </h1>
          <p className="text-[#8b949e] text-base max-w-xl leading-relaxed">
            DevHabits is built for developers: log with <code className="text-[#58a6ff]">habit done</code>,
            keep data in SQLite on your PC, and open a local web UI when you want charts — no cloud required.
          </p>
          <div className="flex flex-col sm:flex-row flex-wrap gap-3 justify-center sm:justify-start">
            <a href="#install">
              <Button variant="primary" size="lg">
                Install on your machine
              </Button>
            </a>
            {isHostedSite && demoConfigured && (
              <Button variant="secondary" size="lg" loading={demoLoading} onClick={handleTryDemo}>
                Try web demo
              </Button>
            )}
            {isHostedSite && !demoConfigured && (
              <Link to={ROUTES.login}>
                <Button variant="secondary" size="lg">
                  Log in
                </Button>
              </Link>
            )}
          </div>
          {demoError && (
            <p className="text-sm text-[#f85149] max-w-xl">{demoError}</p>
          )}
        </section>

        <section className="grid sm:grid-cols-3 gap-4">
          {[
            {
              title: 'Terminal first',
              body: 'CLI, aliases, and TUI — stay in flow without opening a browser.',
            },
            {
              title: 'Your data stays local',
              body: 'SQLite on disk. No account needed for the real app on your machine.',
            },
            {
              title: 'Dashboard optional',
              body: 'Heatmaps and streaks when you run npm run dev locally.',
            },
          ].map(({ title, body }) => (
            <Card key={title} padding="md" className="h-full">
              <h3 className="text-sm font-semibold text-[#e6edf3] mb-2">{title}</h3>
              <p className="text-sm text-[#8b949e] leading-relaxed">{body}</p>
            </Card>
          ))}
        </section>

        <section id="install" className="space-y-6 scroll-mt-8">
          <div>
            <h2 className="text-xl font-semibold">Install in about a minute</h2>
            <p className="text-sm text-[#8b949e] mt-1">
              Node.js 22.5+ required. Works on Windows, macOS, and Linux.
            </p>
          </div>
          <div className="space-y-4">
            {INSTALL_STEPS.map((step) => (
              <div key={step.title}>
                <h3 className="text-sm font-medium text-[#e6edf3] mb-2">{step.title}</h3>
                <CommandBlock cmd={step.cmd} hint={'hint' in step ? step.hint : undefined} />
              </div>
            ))}
          </div>
          <p className="text-sm text-[#6e7681]">
            Then use <code className="text-[#58a6ff]">habit list</code>,{' '}
            <code className="text-[#58a6ff]">habit quick</code>, or{' '}
            <code className="text-[#58a6ff]">habit ui</code> from any terminal. See{' '}
            <code className="text-[#58a6ff]">CHEATSHEET.md</code> in the repo.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">CLI highlights</h2>
          <Card padding="none" className="overflow-hidden">
            <ul className="divide-y divide-[#30363d]">
              {CLI_HIGHLIGHTS.map(({ cmd, desc }) => (
                <li
                  key={cmd}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 px-4 py-3"
                >
                  <code className="text-sm text-[#3fb950] font-mono">{cmd}</code>
                  <span className="text-sm text-[#8b949e]">{desc}</span>
                </li>
              ))}
            </ul>
          </Card>
        </section>

        {isHostedSite && (
          <section className="rounded-xl border border-[#30363d] bg-[#161b22]/80 p-6 space-y-3">
            <h2 className="text-lg font-semibold">About this website</h2>
            <p className="text-sm text-[#8b949e] leading-relaxed">
              This hosted page is a <strong className="text-[#e6edf3]">preview only</strong>. The real
              product runs on your computer: private SQLite, the{' '}
              <code className="text-[#58a6ff]">habit</code> command, and a local dashboard. Use{' '}
              <strong className="text-[#e6edf3]">Try web demo</strong> to click around a shared test
              account — then install locally for your own habits.
            </p>
            {signupEnabled && (
              <p className="text-sm text-[#8b949e]">
                <Link to={ROUTES.signup} className="text-[#58a6ff] hover:underline">
                  Sign up
                </Link>{' '}
                is optional and mainly for testing.
              </p>
            )}
          </section>
        )}
      </main>

      <footer className="border-t border-[#30363d] py-8 text-center text-xs text-[#6e7681]">
        <a href={githubRepo} className="text-[#58a6ff] hover:underline">
          {githubRepo.replace('https://', '')}
        </a>
      </footer>
    </div>
  );
}
