// src/components/AddHabitModal.tsx
import { useState, useEffect, useRef } from 'react';
import { Button } from './ui/Button';
import { useCreateHabit } from '../hooks/index';
import { useUIStore } from '../store/uiStore';
import type { CreateHabitDto, FrequencyType } from '../types';

const CATEGORIES  = ['General', 'Coding', 'Health', 'Reading', 'Learning', 'Fitness', 'Writing', 'Other'];
const FREQUENCIES: FrequencyType[] = ['DAILY', 'WEEKLY', 'INTERVAL'];
const COLORS = ['#238636', '#388bfd', '#8957e5', '#db61a2', '#39c5cf', '#58a6ff', '#0ea5e9', '#64748b'];

const DEFAULT_FORM: CreateHabitDto = {
  name:           '',
  description:    '',
  category:       'General',
  color:          '#238636',
  frequency_type: 'DAILY',
  interval_days:  undefined,
};

export function AddHabitModal() {
  const { addHabitOpen, closeAddHabit } = useUIStore();
  const { mutate: createHabit, isPending } = useCreateHabit();
  const [form, setForm] = useState<CreateHabitDto>(DEFAULT_FORM);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (addHabitOpen) {
      setForm(DEFAULT_FORM);
      setTimeout(() => nameRef.current?.focus(), 50);
    }
  }, [addHabitOpen]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') closeAddHabit(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [closeAddHabit]);

  const set = (k: keyof CreateHabitDto, v: any) =>
    setForm(prev => ({ ...prev, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    createHabit(form, { onSuccess: closeAddHabit });
  };

  if (!addHabitOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={closeAddHabit}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-[#161b22] border border-[#30363d] rounded-xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#30363d]">
          <div>
            <h2 className="text-sm font-semibold text-[#e6edf3]">New Habit</h2>
            <p className="text-xs text-[#8b949e] mt-0.5">Track something consistently</p>
          </div>
          <button
            onClick={closeAddHabit}
            className="text-[#8b949e] hover:text-[#e6edf3] transition-colors p-1 rounded cursor-pointer"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-medium text-[#8b949e] mb-1.5 uppercase tracking-wider">
              Name <span className="text-[#f85149]">*</span>
            </label>
            <input
              ref={nameRef}
              type="text"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              placeholder="e.g. DSA Practice"
              className="w-full px-3 py-2 bg-[#0d1117] border border-[#30363d] rounded-md text-sm text-[#e6edf3] placeholder-[#484f58] focus:outline-none focus:border-[#388bfd] transition-colors"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-[#8b949e] mb-1.5 uppercase tracking-wider">
              Description
            </label>
            <input
              type="text"
              value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="Optional note"
              className="w-full px-3 py-2 bg-[#0d1117] border border-[#30363d] rounded-md text-sm text-[#e6edf3] placeholder-[#484f58] focus:outline-none focus:border-[#388bfd] transition-colors"
            />
          </div>

          {/* Category + Frequency */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#8b949e] mb-1.5 uppercase tracking-wider">
                Category
              </label>
              <select
                value={form.category}
                onChange={e => set('category', e.target.value)}
                className="w-full px-3 py-2 bg-[#0d1117] border border-[#30363d] rounded-md text-sm text-[#e6edf3] focus:outline-none focus:border-[#388bfd] transition-colors cursor-pointer"
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#8b949e] mb-1.5 uppercase tracking-wider">
                Frequency
              </label>
              <select
                value={form.frequency_type}
                onChange={e => set('frequency_type', e.target.value as FrequencyType)}
                className="w-full px-3 py-2 bg-[#0d1117] border border-[#30363d] rounded-md text-sm text-[#e6edf3] focus:outline-none focus:border-[#388bfd] transition-colors cursor-pointer"
              >
                {FREQUENCIES.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
          </div>

          {/* Interval days (conditional) */}
          {form.frequency_type === 'INTERVAL' && (
            <div>
              <label className="block text-xs font-medium text-[#8b949e] mb-1.5 uppercase tracking-wider">
                Every N Days
              </label>
              <input
                type="number"
                min={1}
                max={30}
                value={form.interval_days ?? ''}
                onChange={e => set('interval_days', Number(e.target.value))}
                placeholder="e.g. 3"
                className="w-full px-3 py-2 bg-[#0d1117] border border-[#30363d] rounded-md text-sm text-[#e6edf3] placeholder-[#484f58] focus:outline-none focus:border-[#388bfd] transition-colors"
                required
              />
            </div>
          )}

          {/* Color picker */}
          <div>
            <label className="block text-xs font-medium text-[#8b949e] mb-1.5 uppercase tracking-wider">
              Color
            </label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => set('color', c)}
                  className="w-6 h-6 rounded-full transition-all cursor-pointer"
                  style={{
                    backgroundColor: c,
                    outline: form.color === c ? `2px solid ${c}` : 'none',
                    outlineOffset: 2,
                    opacity: form.color === c ? 1 : 0.5,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-1 border-t border-[#21262d]">
            <Button variant="ghost" type="button" onClick={closeAddHabit}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={isPending}>
              Create Habit
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
