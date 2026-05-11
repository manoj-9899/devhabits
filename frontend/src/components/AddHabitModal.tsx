// src/components/AddHabitModal.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Composes the Modal primitive with our form primitives. Single source of
// rendered chrome — no chance of a duplicate dialog.
// ─────────────────────────────────────────────────────────────────────────────
import { useMemo, useRef, useState } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Textarea } from './ui/Textarea';
import { Modal } from './ui/Modal';
import { Select, type SelectOption } from './ui/Select';
import { CategoryBadge } from './ui/Badge';
import { WeekdayPicker, type Weekday } from './ui/WeekdayPicker';
import { useCreateHabit } from '../hooks/index';
import { useUIStore } from '../store/uiStore';
import { toast } from '../store/toastStore';
import type { CreateHabitDto, FrequencyType } from '../types';

const CATEGORY_OPTIONS: SelectOption[] = [
  { value: 'General', label: 'General' },
  { value: 'Coding', label: 'Coding' },
  { value: 'Health', label: 'Health' },
  { value: 'Reading', label: 'Reading' },
  { value: 'Learning', label: 'Learning' },
  { value: 'Fitness', label: 'Fitness' },
  { value: 'Writing', label: 'Writing' },
  { value: 'Other', label: 'Other' },
];

const FREQUENCY_OPTIONS: SelectOption<FrequencyType>[] = [
  { value: 'DAILY', label: 'Daily', hint: 'every day' },
  { value: 'WEEKLY', label: 'Weekly', hint: 'pick days' },
  { value: 'INTERVAL', label: 'Interval', hint: 'every N days' },
];

const COLORS = [
  '#238636', // green
  '#388bfd', // blue
  '#8957e5', // purple
  '#db61a2', // pink
  '#39c5cf', // teal
  '#58a6ff', // sky
  '#f0883e', // orange
  '#d29922', // amber
  '#64748b', // slate
];

const COLOR_NAMES: Record<string, string> = {
  '#238636': 'Green',
  '#388bfd': 'Blue',
  '#8957e5': 'Purple',
  '#db61a2': 'Pink',
  '#39c5cf': 'Teal',
  '#58a6ff': 'Sky',
  '#f0883e': 'Orange',
  '#d29922': 'Amber',
  '#64748b': 'Slate',
};

interface FormState {
  name: string;
  description: string;
  category: string;
  color: string;
  frequency_type: FrequencyType;
  interval_days: number | undefined;
  target_days: Weekday[];
}

const DEFAULT_FORM: FormState = {
  name: '',
  description: '',
  category: 'General',
  color: '#238636',
  frequency_type: 'DAILY',
  interval_days: undefined,
  target_days: [],
};

export function AddHabitModal() {
  const { addHabitOpen, closeAddHabit } = useUIStore();
  const { mutateAsync: createHabit, isPending } = useCreateHabit();

  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [submitted, setSubmitted] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  const closeAndReset = () => {
    closeAddHabit();
    setForm(DEFAULT_FORM);
    setSubmitted(false);
  };

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  // Inline validation — only surfaces after the first submit attempt, so the
  // user isn't yelled at while typing.
  const errors = useMemo(() => {
    const out: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim()) out.name = 'Required.';
    if (form.frequency_type === 'INTERVAL') {
      if (!form.interval_days || form.interval_days < 1) out.interval_days = 'Must be at least 1.';
      if (form.interval_days && form.interval_days > 365) out.interval_days = 'Must be 365 or less.';
    }
    if (form.frequency_type === 'WEEKLY' && form.target_days.length === 0) {
      out.target_days = 'Pick at least one day.';
    }
    return out;
  }, [form]);

  const isValid = Object.keys(errors).length === 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (!isValid) return;

    const dto: CreateHabitDto = {
      name: form.name.trim(),
      description: form.description.trim(),
      category: form.category,
      color: form.color,
      frequency_type: form.frequency_type,
      interval_days: form.frequency_type === 'INTERVAL' ? form.interval_days : undefined,
      target_days: form.frequency_type === 'WEEKLY' ? form.target_days : [],
    };

    try {
      await createHabit(dto);
      toast.success('Habit created', `“${dto.name}” is ready to track.`);
      closeAndReset();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Please try again.';
      toast.error('Could not create habit', message);
    }
  };

  return (
    <Modal
      open={addHabitOpen}
      onClose={closeAndReset}
      title="New habit"
      subtitle="Track something consistently"
      size="lg"
      initialFocusRef={nameRef}
      ariaLabel="Create a new habit"
      footer={
        <>
          <Button variant="ghost" type="button" onClick={closeAndReset} disabled={isPending}>
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            form="new-habit-form"
            loading={isPending}
            disabled={isPending}
          >
            Create habit
          </Button>
        </>
      }
    >
      <form id="new-habit-form" onSubmit={handleSubmit} className="grid gap-5 sm:grid-cols-[1fr_220px]">
        {/* Left column — fields */}
        <div className="flex flex-col gap-4 min-w-0">
          <Input
            ref={nameRef}
            label="Name"
            required
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="e.g. DSA Practice"
            error={submitted ? errors.name : undefined}
            autoComplete="off"
            maxLength={80}
          />

          <Textarea
            label="Description"
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="Optional note — what counts as done?"
            rows={2}
            maxLength={200}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Category"
              value={form.category}
              options={CATEGORY_OPTIONS}
              onChange={(v) => set('category', v)}
            />
            <Select<FrequencyType>
              label="Frequency"
              value={form.frequency_type}
              options={FREQUENCY_OPTIONS}
              onChange={(v) => set('frequency_type', v)}
            />
          </div>

          {form.frequency_type === 'INTERVAL' && (
            <Input
              label="Every N days"
              type="number"
              min={1}
              max={365}
              value={form.interval_days ?? ''}
              onChange={(e) => {
                const v = e.target.value;
                set('interval_days', v === '' ? undefined : Number(v));
              }}
              placeholder="e.g. 3"
              hint="A repeat cadence in days, like a reminder ‘every 3 days’."
              error={submitted ? errors.interval_days : undefined}
              required
            />
          )}

          {form.frequency_type === 'WEEKLY' && (
            <div className="flex flex-col gap-1.5">
              <WeekdayPicker
                label="Days of the week"
                value={form.target_days}
                onChange={(d) => set('target_days', d)}
                hint="Pick the days this habit is scheduled for."
              />
              {submitted && errors.target_days && (
                <span className="text-[11px] text-[#f85149]">{errors.target_days}</span>
              )}
            </div>
          )}

          {/* Color */}
          <div className="flex flex-col gap-1.5">
            <span
              id="color-label"
              className="text-xs font-medium text-[#8b949e] uppercase tracking-wider"
            >
              Color
            </span>
            <div role="radiogroup" aria-labelledby="color-label" className="flex gap-2 flex-wrap">
              {COLORS.map((c) => {
                const active = form.color === c;
                return (
                  <button
                    key={c}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    aria-label={COLOR_NAMES[c] ?? c}
                    onClick={() => set('color', c)}
                    className="w-7 h-7 rounded-full transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#388bfd]/40"
                    style={{
                      backgroundColor: c,
                      outline: active ? `2px solid ${c}` : '2px solid transparent',
                      outlineOffset: 2,
                      opacity: active ? 1 : 0.6,
                    }}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* Right column — live preview */}
        <aside className="flex flex-col gap-2 min-w-0">
          <span className="text-xs font-medium text-[#8b949e] uppercase tracking-wider">
            Preview
          </span>
          <PreviewCard form={form} />
          <p className="text-[11px] text-[#6e7681] leading-relaxed">
            This is how the habit will appear on your <span className="text-[#8b949e]">Today</span>{' '}
            list and <span className="text-[#8b949e]">Habits</span> page.
          </p>
        </aside>
      </form>
    </Modal>
  );
}

// ── Preview ────────────────────────────────────────────────────────────────

function PreviewCard({ form }: { form: FormState }) {
  const cadence =
    form.frequency_type === 'DAILY'
      ? 'daily'
      : form.frequency_type === 'WEEKLY'
        ? form.target_days.length > 0
          ? form.target_days.join(' · ')
          : 'weekly'
        : form.interval_days
          ? `every ${form.interval_days}d`
          : 'every N days';

  const name = form.name.trim() || 'New habit';

  return (
    <div className="rounded-xl border border-[#30363d] bg-[#0d1117] p-3 flex flex-col gap-2">
      <div className="flex items-start gap-2.5">
        <div
          className="w-2.5 h-2.5 rounded-full shrink-0 mt-1.5"
          style={{ backgroundColor: form.color, boxShadow: `0 0 8px ${form.color}50` }}
          aria-hidden="true"
        />
        <div className="min-w-0">
          <div className="text-sm font-semibold text-[#e6edf3] truncate">{name}</div>
          {form.description.trim() && (
            <div className="text-[11px] text-[#8b949e] truncate">{form.description.trim()}</div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <CategoryBadge category={form.category} color={form.color} />
        <span className="text-[11px] text-[#6e7681] font-mono">{cadence}</span>
      </div>
    </div>
  );
}
