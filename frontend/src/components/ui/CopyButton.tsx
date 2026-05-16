// src/components/ui/CopyButton.tsx
import { useState } from 'react';
import clsx from 'clsx';
import { Button } from './Button';

interface CopyButtonProps {
  text: string;
  label?: string;
  className?: string;
}

export function CopyButton({ text, label = 'Copy', className }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={handleCopy}
      className={clsx('shrink-0 font-mono text-[11px]', className)}
    >
      {copied ? 'Copied' : label}
    </Button>
  );
}
