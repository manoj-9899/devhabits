// src/components/layout/HostedDemoBanner.tsx
import { Link } from 'react-router-dom';
import { isHostedSite } from '../../lib/siteMode';
import { ROUTES } from '../../lib/routes';

export function HostedDemoBanner() {
  if (!isHostedSite) return null;

  return (
    <div className="shrink-0 border-b border-[#388bfd]/30 bg-[#388bfd]/10 px-4 py-2.5 text-center text-sm text-[#8b949e]">
      <span>
        You’re on the <strong className="text-[#e6edf3] font-medium">web demo</strong>. Data is shared
        and may reset. For real habits on your machine,{' '}
        <Link to={ROUTES.landing} className="text-[#58a6ff] hover:underline font-medium">
          install DevHabits locally
        </Link>
        .
      </span>
    </div>
  );
}
